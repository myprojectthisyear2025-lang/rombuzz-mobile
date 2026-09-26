const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, act } = require("./harness.cjs");
const USER_KEY = "RBZ_SESSION_USER_V1";
const user = { id: "member-a", firstName: "Alex", avatar: "https://example.invalid/me.jpg" };
const legacy = (value = user) => new Map([["RBZ_TOKEN", "token-a"], ["RBZ_USER", JSON.stringify(value)]]);
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

test("one startup read migrates a large user losslessly and keeps legacy ID aliases small", async () => {
  const full = { ...user, media: [{ caption: "🙂".repeat(5000) }], settings: { visibility: "private" } };
  const h = createHarness({ secure: legacy(full) });
  const values = await Promise.all(Array.from({ length: 25 }, () => h.session.initializeSession()));
  assert.deepEqual(values[0].user, full);
  assert.equal(h.reads.filter(key => key === "RBZ_USER").length, 1);
  assert.deepEqual(JSON.parse(h.cache.get(USER_KEY)), full);
  const identity = JSON.parse(h.secure.get("RBZ_USER"));
  assert.deepEqual(identity, { id: user.id, _id: user.id, rbzSessionVersion: 1 });
  assert.ok(h.writes.every(([, value]) => Buffer.byteLength(value) <= 2048));
  const reads = h.reads.length;
  await h.session.getCurrentUser();
  assert.equal(h.reads.length, reads);
  const restarted = createHarness({ secure: h.secure, cache: h.cache });
  assert.deepEqual((await restarted.session.initializeSession()).user, full);
});

test("failed migration retains the full secure user and retries safely", async () => {
  const h = createHarness({ secure: legacy() });
  h.faults.cacheWrite = async () => { throw new Error("Disk full"); };
  assert.deepEqual((await h.session.initializeSession()).user, user);
  assert.deepEqual(JSON.parse(h.secure.get("RBZ_USER")), user);
  assert.equal(h.writes.length, 0);
  h.faults.cacheWrite = null;
  await h.session.refreshSession();
  assert.equal(JSON.parse(h.secure.get("RBZ_USER")).rbzSessionVersion, 1);
});

test("legacy token, corrupt user JSON and mismatched profile cache are handled locally", async () => {
  const secure = legacy(); secure.delete("RBZ_TOKEN"); secure.set("token", "old-key-token");
  const h = createHarness({ secure });
  assert.equal((await h.session.initializeSession()).token, "old-key-token");
  assert.equal(secure.get("RBZ_TOKEN"), "old-key-token");
  h.cache.set(USER_KEY, JSON.stringify({ id: "other-member", firstName: "Other" }));
  const refreshed = await h.session.refreshSession();
  assert.equal(refreshed.user.id, user.id);
  assert.equal(refreshed.user.firstName, undefined);
  secure.set("RBZ_USER", "{bad-json");
  assert.equal((await h.session.refreshSession()).user, null);
  assert.equal(secure.has("RBZ_USER"), false);
  await h.session.clearSession();
  assert.equal(secure.size, 0);
  assert.equal(h.cache.has(USER_KEY), false);
});

test("login cannot be overwritten by a delayed startup migration", async () => {
  const h = createHarness({ secure: legacy() });
  const gate = deferred();
  h.faults.read = key => key === "RBZ_USER" ? gate.promise : undefined;
  const cold = h.session.initializeSession();
  const login = h.session.setSession("token-b", { id: "member-b", firstName: "Sam" });
  gate.resolve(); await Promise.all([cold, login]);
  assert.equal(h.session.getSessionSnapshot().token, "token-b");
  assert.equal((await h.session.getCurrentUser()).id, "member-b");
});

test("profile updates notify immediately, logout clears both stores, late work cannot restore auth", async () => {
  const h = createHarness({ secure: legacy() });
  await h.session.initializeSession();
  const observed = [];
  const unsubscribe = h.session.subscribeSession(value => observed.push(value));
  await h.session.persistCurrentUser({ ...user, firstName: "Updated" });
  assert.equal(observed.at(-1).user.firstName, "Updated");
  await h.session.clearSession();
  await h.session.persistCurrentUser(user);
  assert.deepEqual(h.session.getSessionSnapshot(), { token: "", user: null });
  assert.equal(h.secure.has("RBZ_USER"), false);
  assert.equal(h.cache.has(USER_KEY), false);
  await h.session.setSession("token-b", { id: "member-b", firstName: "Sam" });
  await h.session.persistCurrentUser(user);
  assert.equal((await h.session.getCurrentUser()).id, "member-b");
  assert.equal(await h.session.clearSession("token-a"), false);
  assert.equal(h.session.getSessionSnapshot().token, "token-b");
  unsubscribe();
});

test("failed login persistence never pairs a new user with a previous token", async () => {
  const h = createHarness({ secure: legacy() });
  await h.session.initializeSession();
  h.faults.write = async key => { if (key === "RBZ_TOKEN") throw new Error("Keychain unavailable"); };
  await assert.rejects(h.session.setSession("token-b", { id: "member-b" }), /Keychain unavailable/);
  assert.equal(h.secure.has("RBZ_TOKEN"), false);
  assert.equal(h.cache.has(USER_KEY), false);
  assert.equal(h.session.getSessionSnapshot().token, "");
});

test("API 401 clears the current session once; a late prior-session 401 preserves a new login", async () => {
  const h = createHarness({ secure: legacy() });
  const api = h.load("src/performance/api/rbzApiClient.ts");
  const gate = deferred();
  h.setFetch(async () => { await gate.promise; return { ok: false, status: 401, text: async () => '{"error":"jwt expired"}' }; });
  const oldRequest = api.rbzApiJson("/profile/full");
  await h.session.initializeSession();
  await h.session.setSession("token-b", { id: "member-b" });
  gate.resolve();
  await assert.rejects(oldRequest, /jwt expired/);
  assert.equal(await api.rbzGetAuthToken(), "token-b");
  assert.equal(h.events.length, 0);
  await Promise.all([
    assert.rejects(api.rbzApiJson("/profile/full"), /jwt expired/),
    assert.rejects(api.rbzApiJson("/matches"), /jwt expired/),
  ]);
  assert.equal(await api.rbzGetAuthToken(), "");
  assert.equal(h.events.length, 1);
});

test("root auth has no polling, ignores profile-only changes, and checks once per foreground transition", async t => {
  const h = createHarness({ secure: legacy() });
  const probe = await h.mountAuth(); t.after(() => probe.unmount());
  assert.deepEqual(probe.value, { ready: true, authToken: "token-a", authUserId: user.id, loggedIn: true, onboardingPending: false });
  const reads = h.reads.length;
  await probe.rerender();
  assert.equal(h.reads.length, reads);
  await act(async () => { await h.session.persistCurrentUser({ ...user, firstName: "Changed" }); });
  const renders = probe.renders;
  await act(async () => { await h.session.persistCurrentUser({ ...user, firstName: "Changed again" }); });
  assert.equal(probe.renders, renders);
  await act(async () => { h.changeAppState("background"); });
  assert.equal(h.reads.length, reads);
  await act(async () => { h.changeAppState("active"); });
  assert.equal(h.spans.filter(name => name === "startup.auth-storage").length, 2);
  const resumedReads = h.reads.length;
  await act(async () => { h.changeAppState("active"); });
  assert.equal(h.reads.length, resumedReads);
  h.faults.read = async () => { throw new Error("Storage temporarily unavailable"); };
  await act(async () => { h.changeAppState("background"); h.changeAppState("active"); });
  assert.equal(probe.value.loggedIn, true);
});

test("onboarding events gate login until completion and survive a cold restart", async t => {
  const h = createHarness();
  const probe = await h.mountAuth(); t.after(() => probe.unmount());
  const draft = { email: "test@example.com", step: 3, form: { firstName: "Alex", password: "private-password" } };
  await act(async () => { await h.draft.saveOnboardingDraft(draft); });
  assert.equal(probe.value.onboardingPending, true);
  await act(async () => { await h.session.setSession("token-a", user); });
  assert.equal(probe.value.loggedIn, true);
  assert.equal(probe.value.onboardingPending, true);
  const restart = createHarness({ secure: h.secure, cache: h.cache });
  assert.equal(await restart.draft.hasOnboardingDraft(), true);
  const restored = await restart.draft.loadOnboardingDraft();
  assert.equal(restored.step, 3);
  assert.equal(restored.form.password, "private-password");
  assert.ok(!h.cache.get("RBZ_ONBOARDING_DRAFT_V1").includes("private-password"));
  await act(async () => { await h.draft.clearOnboardingDraft(); });
  assert.equal(probe.value.onboardingPending, false);
  await act(async () => { await h.session.clearSession(); });
  assert.equal(probe.value.loggedIn, false);
  assert.equal(probe.value.authUserId, "");
});

test("socket token changes retain listeners, logout disconnects, profile updates do not reconnect", async () => {
  const h = createHarness({ secure: legacy() });
  await h.session.initializeSession();
  const sockets = h.load("src/lib/socket.ts");
  const [socket, sameSocket] = await Promise.all([sockets.getSocket(), sockets.getSocket()]);
  assert.equal(sameSocket, socket);
  await h.session.persistCurrentUser({ ...user, firstName: "Updated" });
  assert.equal(socket.disconnects, 0);
  await h.session.setSession("token-b", user);
  assert.equal(socket.auth.token, "token-b");
  assert.equal(socket.connects, 1);
  assert.equal(await sockets.getSocket(), socket);
  await h.session.clearSession();
  assert.equal(socket.connected, false);
  assert.equal(await sockets.getSocket(), socket);
  await h.session.setSession("token-c", { id: "member-c" });
  assert.equal(socket.auth.token, "token-c");
  assert.equal(socket.connected, true);
  assert.equal(h.sockets.length, 1);
});

test("foreground storage failures keep the pending onboarding gate, and listeners are removed on unmount", async () => {
  const h = createHarness({ secure: legacy() });
  await h.draft.saveOnboardingDraft({ email: "test@example.com", step: 2, form: {} });
  const probe = await h.mountAuth();
  assert.equal(probe.value.onboardingPending, true);
  h.faults.read = async key => { if (key === "RBZ_ONBOARDING_SECRET_V1") throw new Error("Locked"); };
  await act(async () => { h.changeAppState("background"); h.changeAppState("active"); });
  assert.equal(probe.value.onboardingPending, true);
  await probe.unmount();
  assert.equal(h.appListeners.size, 0);
  const reads = h.reads.length;
  h.changeAppState("background"); h.changeAppState("active");
  assert.equal(h.reads.length, reads);
});

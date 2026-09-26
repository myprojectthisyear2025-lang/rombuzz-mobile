const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, React, act, deferred } = require("./harness.cjs");
const summary = byPeer => ({ byPeer, total: Object.values(byPeer).reduce((a, b) => a + b, 0) });
const reads = h => h.requests.filter(r => r.url.endsWith("/unread-summary"));

test("root startup, first socket connect, consumers and concurrent refreshes share one request", async () => {
  const h = createHarness(), pending = deferred();
  h.setFetch(() => pending.promise);
  const rendered = [];
  function Consumer() { rendered.push(h.useUnreadSummary()); return null; }
  function App() { return React.createElement(React.Fragment, null, React.createElement(h.Owner), ...[1,2,3].map(key => React.createElement(Consumer, { key }))); }
  await h.mount(App);
  await h.emit("connect");
  let first, second;
  await act(async () => { first = h.chatUnread.refresh(true); second = h.chatUnread.refresh(true); });
  assert.equal(first, second);
  assert.equal(reads(h).length, 1);
  await act(async () => { pending.resolve(summary({ peer: 2 })); await first; });
  assert.equal(h.chatUnread.getSnapshot().total, 2);
  assert.equal(rendered.at(-1).byPeer.peer, 2);
  await h.focus(false);
  await h.focus(true);
  assert.equal(reads(h).length, 1);
  await h.unmount();
});

test("incoming aliases dedupe; server push cancels fallback and beats a stale REST response", async () => {
  const h = createHarness(), old = deferred();
  h.setFetch(() => old.promise);
  await h.mount();
  await h.emit("chat:message", { id: "m1", from: "peer", to: "a" });
  await h.emit("direct:message", { id: "m1", from: "peer", to: "a" });
  assert.equal(h.chatUnread.getSnapshot().total, 1);
  await h.emit("chat:unread:update", summary({ peer: 3 }));
  await act(async () => old.resolve(summary({})));
  await h.advance(1000);
  assert.equal(h.chatUnread.getSnapshot().total, 3);
  assert.equal(reads(h).length, 1);
  await h.unmount();
});

test("a missing server push triggers one fallback, with no overlapping GETs", async () => {
  const h = createHarness();
  await h.mount();
  const pending = deferred();
  h.setFetch(() => pending.promise);
  await h.emit("chat:message", { id: "m1", from: "peer" });
  await h.advance(650);
  assert.equal(reads(h).length, 2);
  await h.emit("direct:message", { id: "m2", from: "peer" });
  await h.advance(650);
  assert.equal(reads(h).length, 2);
  await act(async () => pending.resolve(summary({ peer: 2 })));
  assert.equal(h.chatUnread.getSnapshot().total, 2);
  await h.unmount();
});

test("background cancels a read and prevents new reads; foreground/reconnect coalesce", async () => {
  const h = createHarness(), old = deferred();
  h.setFetch(() => old.promise);
  await h.mount();
  await h.appState("background");
  assert.equal(reads(h)[0].signal.aborted, true);
  await h.emit("connect");
  await h.emit("chat:message", { id: "background", from: "peer" });
  await h.advance(10000);
  assert.equal(reads(h).length, 1);
  await act(async () => old.resolve(summary({ peer: 99 })));
  assert.equal(h.chatUnread.getSnapshot().total, 1);
  const fresh = deferred();
  h.setFetch(() => fresh.promise);
  await h.appState("active");
  await h.emit("connect");
  assert.equal(reads(h).length, 2);
  await act(async () => fresh.resolve(summary({ peer: 2 })));
  assert.equal(h.chatUnread.getSnapshot().total, 2);
  assert.equal(reads(h).length, 2);
  await h.unmount();
});

test("mark-read and mark-all-read consume response summaries without follow-up GETs", async () => {
  const h = createHarness();
  h.setFetch(() => summary({ peer: 3, other: 2 }));
  await h.mount();
  const marked = deferred();
  h.setFetch(() => marked.promise);
  let first, second;
  await act(async () => { first = h.markChatRead("peer"); second = h.markChatRead("peer"); });
  assert.equal(first, second);
  assert.equal(h.chatUnread.getSnapshot().total, 2);
  await h.emit("chat:unread:update", summary({ other: 2 }));
  await act(async () => { marked.resolve({ ok: true, summary: summary({ other: 2 }) }); await first; });
  assert.equal(reads(h).length, 1);
  h.setFetch(async () => ({ ok: true, summary: summary({}) }));
  await act(async () => h.markAllChatsRead());
  assert.equal(h.chatUnread.getSnapshot().total, 0);
  assert.equal(reads(h).length, 1);
  await h.unmount();
});

test("late old-account cache, HTTP and mutation results cannot affect a new account", async () => {
  const h = createHarness(), cache = deferred(), old = deferred(), mutation = deferred();
  h.setCacheReader(() => cache.promise);
  h.setFetch(() => old.promise);
  await h.mount();
  h.setFetch(() => mutation.promise);
  let marked;
  await act(async () => { marked = h.markChatRead("peer"); });
  h.setCacheReader(() => null);
  h.setFetch(async () => summary({ newPeer: 4 }));
  await h.setSession({ token: "token-b", user: { id: "b" } });
  assert.equal(reads(h)[0].signal.aborted, true);
  await act(async () => {
    cache.resolve(JSON.stringify({ userId: "a", summary: summary({ oldPeer: 8 }) }));
    old.resolve(summary({ oldPeer: 9 }));
    mutation.resolve({ summary: summary({ oldPeer: 7 }) }); await marked;
  });
  assert.deepEqual(h.chatUnread.getSnapshot(), summary({ newPeer: 4 }));
  await act(async () => { h.chatUnread.setPeerUnread("oldPeer", true, "a"); h.chatUnread.clearPeer("newPeer", "a"); });
  assert.deepEqual(h.chatUnread.getSnapshot(), summary({ newPeer: 4 }));
  assert.equal(JSON.parse(h.storage.get("RBZ_CHAT_UNREAD_V1:b")).summary.total, 4);
  await h.setSession({ token: "", user: null });
  assert.equal(h.chatUnread.getSnapshot().total, 0);
  await h.unmount();
});

test("cache paints first, network failures retain it, profile-only session updates do not fetch", async () => {
  const h = createHarness(), pending = deferred();
  h.storage.set("RBZ_CHAT_UNREAD_V1:a", JSON.stringify({ userId: "a", summary: summary({ peer: 2 }) }));
  h.setFetch(() => pending.promise);
  await h.mount();
  assert.equal(h.chatUnread.getSnapshot().total, 2);
  await act(async () => pending.reject(new Error("offline")));
  await h.setSession({ token: "token-a", user: { id: "a", firstName: "Changed" } });
  await h.advance(60_000);
  assert.equal(h.chatUnread.getSnapshot().total, 2);
  assert.equal(reads(h).length, 1);
  h.setFetch(async () => ({ response: { ok: false, status: 503, json: async () => ({ error: "unavailable" }) } }));
  await act(async () => h.chatUnread.refresh(true));
  assert.equal(h.chatUnread.getSnapshot().total, 2);
  h.setFetch(async () => summary({ peer: 1 }));
  await act(async () => h.chatUnread.refresh(true));
  assert.equal(h.chatUnread.getSnapshot().total, 1);
  await h.unmount();
});

test("lifecycle cleanup removes only owned listeners and rejects late socket attachment", async () => {
  const h = createHarness(), pending = deferred();
  const unrelated = () => {};
  h.socket.on("connect", unrelated);
  await h.mount();
  await h.unmount();
  assert.deepEqual([...h.listeners.get("connect")], [unrelated]);
  assert.equal(h.sessionListeners.size, 0);
  assert.equal(h.appListeners.size, 0);
  const late = createHarness();
  late.socketGate.promise = pending.promise;
  await late.mount();
  await late.unmount();
  await act(async () => pending.resolve());
  assert.equal(late.listeners.size, 0);
});

test("a nested thread marks read on focus/foreground, never while covered or backgrounded", async () => {
  const h = createHarness();
  const { useChatUnread } = h.load("src/features/chat/window/hooks/useChatUnread.ts");
  const marks = () => h.requests.filter(r => r.url.endsWith("/mark-read"));
  h.setFetch(async url => url.endsWith("/unread-summary") ? summary({ peer: 3, other: 2 })
    : { ok: true, summary: summary({ other: 2 }) });
  function Thread() { useChatUnread("peer"); return null; }
  function App() { return React.createElement(h.Owner, null, React.createElement(Thread)); }
  await h.mount(App);
  assert.equal(marks().length, 1, "root initializes before the child's passive effect");
  assert.equal(reads(h).length, 1);
  assert.deepEqual(h.chatUnread.getSnapshot(), summary({ other: 2 }));
  await h.focus(false); // View Profile covers the mounted thread.
  await h.emit("chat:message", { id: "covered", from: "peer", to: "a" });
  await h.emit("chat:unread:update", summary({ peer: 1, other: 2 }));
  assert.equal(h.chatUnread.getSnapshot().byPeer.peer, 1);
  await h.appState("background");
  await h.appState("active");
  assert.equal(marks().length, 1);
  await h.focus(true);
  assert.equal(marks().length, 2);
  await h.appState("background");
  await h.focus(false);
  await h.focus(true);
  assert.equal(marks().length, 2);
  await h.appState("active");
  assert.equal(marks().length, 3);
  await h.setSession({ token: "token-b", user: { id: "b" } });
  assert.equal(marks().length, 4);
  assert.equal(marks().at(-1).headers.Authorization, "Bearer token-b");
  await h.unmount();
});

test("overlapping writes and missing summaries reconcile once after writes complete", async () => {
  const h = createHarness(), one = deferred(), two = deferred();
  h.setFetch(async () => summary({ peer: 1, other: 2 }));
  await h.mount();
  let first, second;
  await act(async () => {
    first = h.chatUnread.mutate("one", () => one.promise, () => h.chatUnread.clearPeer("peer"));
    second = h.chatUnread.mutate("two", () => two.promise, () => h.chatUnread.clearPeer("other"));
  });
  await act(async () => { one.resolve({ summary: summary({ other: 2 }) }); await first; });
  assert.equal(reads(h).length, 1);
  assert.equal(h.chatUnread.getSnapshot().total, 0);
  h.setFetch(async () => summary({}));
  await act(async () => { two.resolve({ ok: true }); await second; });
  assert.equal(reads(h).length, 2);
  assert.equal(h.chatUnread.getSnapshot().total, 0);
  await h.unmount();
});

test("unscoped/foreign cache and malformed responses never replace this account's state", async () => {
  const h = createHarness();
  h.storage.set("RBZ_unread_map", JSON.stringify({ oldPeer: 99 }));
  h.storage.set("RBZ_CHAT_UNREAD_V1:a", JSON.stringify({ userId: "b", summary: summary({ oldPeer: 99 }) }));
  h.setFetch(async () => summary({ peer: 2 }));
  await h.mount();
  h.setFetch(async () => ({ error: "not a summary" }));
  await act(async () => h.chatUnread.refresh(true));
  assert.deepEqual(h.chatUnread.getSnapshot(), summary({ peer: 2 }));
  h.setFetch(async () => ({ response: { ok: true, json: async () => { throw new Error("bad JSON"); } } }));
  await act(async () => h.chatUnread.refresh(true));
  assert.equal(h.chatUnread.getSnapshot().total, 2);
  await h.advance(60000);
  assert.equal(reads(h).length, 3, "errors do not start polling");
  await h.unmount();
});

test("an old 401 cannot sign out a new session; a current non-JSON 401 expires it", async () => {
  const h = createHarness(), old = deferred();
  const unauthorized = { response: { ok: false, status: 401, json: async () => { throw new Error("not JSON"); } } };
  h.setFetch(() => old.promise);
  await h.mount();
  h.setFetch(async () => summary({ newPeer: 4 }));
  await h.setSession({ token: "token-b", user: { id: "b" } });
  await act(async () => old.resolve(unauthorized));
  assert.equal(h.chatUnread.getSession().token, "token-b");
  assert.equal(h.events.filter(e => e.name === "rbz:auth:expired").length, 0);
  h.setFetch(async () => unauthorized);
  await act(async () => h.chatUnread.refresh(true));
  assert.equal(h.chatUnread.getSession().token, "");
  assert.equal(h.chatUnread.getSnapshot().total, 0);
  assert.equal(h.events.filter(e => e.name === "rbz:auth:expired").length, 1);
  await h.unmount();
});

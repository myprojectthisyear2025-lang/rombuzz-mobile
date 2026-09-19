// Path: scripts/settings-tests/account.test.cjs
// Purpose: Verify account and password requests through the redesigned form controls.
const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./harness.cjs");

test("name save and verified email change preserve payloads and cached user", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  h.replies.push({ user: { firstName: "Alex", lastName: "Lee", email: "old@example.com" } });
  await h.mount("account");
  await h.enter("First name", "Sam");
  const updated = { firstName: "Sam", lastName: "Lee", email: "old@example.com" };
  h.replies.push({ user: updated });
  await h.press("Save name");
  assert.deepEqual(h.requests.at(-1), { url: "/users/me", method: "PUT", body: { firstName: "Sam", lastName: "Lee" } });
  assert.deepEqual(JSON.parse(h.stored.get("RBZ_USER")), updated);
  await h.press("OK");
  await h.enter("New email", " new@example.com ");
  h.replies.push({ success: true });
  await h.press("Send code");
  assert.deepEqual(h.requests.at(-1).body, { newEmail: "new@example.com" });
  await h.press("OK");
  await h.enter("Verification code", " 123456 ");
  h.replies.push({ user: { ...updated, email: "new@example.com" } });
  await h.press("Confirm email");
  assert.deepEqual(h.requests.at(-1), {
    url: "/account/confirm-email-change", method: "POST",
    body: { newEmail: "new@example.com", code: "123456" },
  });
  assert.equal(JSON.parse(h.stored.get("RBZ_USER")).email, "new@example.com");
  assert.equal(h.input("New email").props.value, "");
  assert.equal(h.input("Verification code"), undefined);
});

test("account failures retain input, show themed feedback, and support reload", async t => {
  const h = createHarness({ mode: "dark" }); t.after(() => h.unmount());
  h.replies.push(new Error("Offline"));
  await h.mount("account");
  await h.press("OK");
  assert.ok(h.button("Try again"));
  h.replies.push({ email: "member@example.com", firstName: "Alex", lastName: "Lee" });
  await h.press("Try again");
  await h.enter("First name", "Sam");
  h.replies.push(new Error("Name cannot be changed yet"));
  await h.press("Save name");
  assert.equal(h.input("First name").props.value, "Sam");
  assert.match(h.text(h.tree.root), /Name cannot be changed yet/);
  assert.equal(h.storageWrites.length, 0);
});

test("password flow requires a valid code and matching passwords, preserves all endpoints", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  h.replies.push({ user: { email: "Member@Example.com" } });
  await h.mount("security");
  h.replies.push({ success: true });
  await h.press("Send 6-digit code");
  assert.equal(h.requests.at(-1).url, "https://example.invalid/api/auth/forgot-password");
  assert.deepEqual(JSON.parse(h.requests.at(-1).body), { email: "member@example.com" });
  await h.enter("Verification code", "12xx");
  await h.press("Verify code");
  assert.equal(h.requests.length, 2);
  assert.equal(h.input("New password"), undefined);
  await h.press("OK");
  await h.enter("Verification code", "123456");
  h.replies.push({ success: true });
  await h.press("Verify code");
  assert.equal(h.requests.at(-1).url, "https://example.invalid/api/auth/verify-reset-code");
  await h.enter("New password", "new-password");
  await h.enter("Confirm password", "different");
  await h.press("Update password");
  assert.equal(h.requests.length, 3);
  await h.press("OK");
  await h.press("Show new password");
  assert.equal(h.input("New password").props.secureTextEntry, false);
  await h.press("Hide new password");
  assert.equal(h.input("New password").props.secureTextEntry, true);
  await h.enter("Confirm password", "new-password");
  h.replies.push({ success: true });
  await h.press("Update password");
  assert.equal(h.requests.at(-1).url, "https://example.invalid/api/auth/reset-password");
  assert.deepEqual(JSON.parse(h.requests.at(-1).body), {
    email: "member@example.com", code: "123456", password: "new-password",
  });
  assert.equal(h.input("New password"), undefined);
  assert.match(h.text(h.tree.root), /Password updated/);
});

test("invalid server verification never reveals password fields", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  h.replies.push({ email: "member@example.com" });
  await h.mount("security");
  h.replies.push({ success: true });
  await h.press("Send 6-digit code");
  await h.enter("Verification code", "123456");
  h.replies.push({ ok: false, error: "Expired code" });
  await h.press("Verify code");
  assert.equal(h.input("New password"), undefined);
  assert.match(h.text(h.tree.root), /Expired code/);
});

// Path: scripts/settings-tests/safety.test.cjs
// Purpose: Exercise confirmation, blocking, logout, and support flows without contacting real services.
const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./harness.cjs");

test("blocked-user search, cancel, and unblock preserve the target and list", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  h.replies.push({ blocks: [{ user: { id: "a", firstName: "Alex", email: "a@example.com" } }] });
  await h.mount("blocking");
  await h.enter("Search blocked users", "missing");
  assert.match(h.text(h.tree.root), /No matching blocked users/);
  await h.press("Clear search");
  await h.press("Unblock Alex");
  await h.press("Cancel");
  assert.equal(h.requests.length, 1);
  await h.press("Unblock Alex");
  h.replies.push({ success: true });
  await h.press("Unblock");
  assert.deepEqual(h.requests.at(-1), { url: "/unblock", method: "POST", body: { targetId: "a" } });
  assert.match(h.text(h.tree.root), /No blocked users/);
});

test("block list failure is not presented as an empty list", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  h.replies.push(new Error("Offline"));
  await h.mount("blocking");
  assert.doesNotMatch(h.text(h.tree.root), /No blocked users/);
  await h.press("OK");
  assert.ok(h.button("Try again"));
});

test("deletion cannot run until preview and explicit confirmation; success clears the same keys", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  await h.mount("manage-account");
  h.replies.push({ wallet: { totalBC: 0 } });
  await h.press("Delete account");
  await h.press("Cancel");
  assert.deepEqual(h.requests.map(r => r.method), ["GET"]);
  h.replies.push({ wallet: { totalBC: 0 } });
  await h.press("Delete account");
  h.replies.push({ cleanup: { apple: { manualRevocationRequired: true } } });
  // There is also a page action with this label; select the visible modal action.
  const modal = h.all("Modal").find(node => node.props.visible);
  const confirm = modal.findAllByType("Pressable").find(node => node.props.accessibilityLabel === "Delete account");
  const { act } = require("./harness.cjs");
  await act(async () => { await confirm.props.onPress(); });
  assert.deepEqual(h.requests.at(-1), { url: "/account/delete", method: "DELETE", body: {} });
  assert.match(h.text(h.tree.root), /Sign in with Apple/);
  assert.equal(h.deletedKeys.length, 0);
  await h.press("OK");
  assert.deepEqual(h.deletedKeys.sort(), ["RBZ_TOKEN", "RBZ_USER", "token", "user"].sort());
  assert.deepEqual(h.routes, ["/start"]);
});

test("wallet forfeiture and backend fallback each require explicit acceptance", async t => {
  const h = createHarness({ mode: "dark" }); t.after(() => h.unmount());
  await h.mount("manage-account");
  h.replies.push({ requiresForfeitConfirmation: true, wallet: { balanceBC: 12, pendingBC: 3, earnedBC: 4, totalBC: 19 } });
  await h.press("Delete account");
  assert.match(h.text(h.tree.root), /Total: 19 BC/);
  await h.press("Cancel");
  assert.equal(h.requests.length, 1);
  h.replies.push({ wallet: {} });
  await h.press("Delete account");
  h.replies.push(Object.assign(new Error("Balance changed"), {
    code: "BUZZCOIN_FORFEIT_CONFIRMATION_REQUIRED", wallet: { totalBC: 5 },
  }));
  const { act } = require("./harness.cjs");
  const modal = h.all("Modal").find(node => node.props.visible);
  await act(async () => {
    await modal.findAllByType("Pressable").find(node => node.props.accessibilityLabel === "Delete account").props.onPress();
  });
  assert.match(h.text(h.tree.root), /Forfeit BuzzCoins/);
  assert.equal(h.requests.at(-1).body.confirmForfeit, undefined);
  h.replies.push({ success: true });
  await h.press("I understand, delete");
  assert.deepEqual(h.requests.at(-1).body, { confirmForfeit: true });
});

test("failed deletion preview never sends a delete request", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  await h.mount("manage-account");
  h.replies.push(new Error("Offline"));
  await h.press("Delete account");
  assert.deepEqual(h.requests.map(r => r.method), ["GET"]);
  assert.match(h.text(h.tree.root), /Deletion unavailable/);
});

test("logout cancel preserves auth and confirmation uses the existing destination", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  await h.mount("index");
  await h.press("Log out");
  await h.press("Cancel");
  assert.equal(h.deletedKeys.length, 0);
  await h.press("Log out");
  await h.press("Logout");
  assert.deepEqual(h.deletedKeys.sort(), ["RBZ_TOKEN", "RBZ_USER", "token", "user"].sort());
  assert.deepEqual(h.routes, ["/auth/login"]);
});

test("Cupid suggestions, support escalation and tickets preserve auth and payloads", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  await h.mount("help");
  h.replies.push({ reply: "Let us help.", showTicketButton: true, suggestions: [] });
  await h.press("I cannot upload my photo");
  assert.match(h.requests.at(-1).url, /\/cupid-support\/chat$/);
  assert.equal(h.requests.at(-1).headers.Authorization, "Bearer test-token");
  assert.deepEqual(JSON.parse(h.requests.at(-1).body), { message: "I cannot upload my photo", screen: "settings_help" });
  await h.press("Create Support Ticket");
  assert.equal(h.input("Subject").props.value, "I cannot upload my photo");
  h.replies.push({ ticket: { id: "ticket-1" }, message: "Ticket received" });
  await h.press("Send ticket to admin");
  assert.match(h.requests.at(-1).url, /\/cupid-support\/tickets$/);
  assert.deepEqual(JSON.parse(h.requests.at(-1).body), {
    subject: "I cannot upload my photo", message: "I cannot upload my photo", screen: "settings_help",
  });
  assert.equal(h.input("Subject"), undefined);
  assert.match(h.text(h.tree.root), /Last ticket sent: ticket-1/);
});

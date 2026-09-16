const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createHarness,
  createState,
  message,
  participants,
  response,
} = require("./hookHarness.cjs");

function setup(initial = []) {
  const harness = createHarness();
  const messages = createState(initial);
  const useComposer = harness.hook("useChatComposer");
  const createSender = harness.hook("useChatTextSender");
  const scrolls = [];
  const composer = () => harness.render(() => useComposer(() => {}));
  const send = () =>
    createSender({
      ...participants,
      messages: messages.value,
      setMessages: messages.set,
      settleToLatest: (...args) => scrolls.push(args),
      composer: composer(),
    }).send();
  return { harness, messages, composer, send, scrolls };
}

test("send retains a reply snapshot when the composer clears and socket/REST copies race", async () => {
  const original = message({
    id: "quoted",
    from: "bob",
    to: "alice",
    text: "Dinner?",
  });
  const fixture = setup([original]);
  fixture.composer().startReplying(original);
  fixture.composer().setText("  Yes please  ");
  const replySnapshot = fixture.composer().replyingTo;
  const server = message({ id: "sent", text: "Yes please", _temp: false });
  fixture.harness.responses.push(() => {
    fixture.messages.set((previous) => [...previous, server]);
    return response({ message: server });
  });

  const pending = fixture.send();
  assert.equal(fixture.messages.value.length, 2);
  assert.equal(fixture.messages.value[1]._temp, true);
  assert.deepEqual(fixture.messages.value[1].replyTo, replySnapshot);
  assert.equal(fixture.composer().text, "");
  assert.equal(fixture.composer().replyingTo, null);
  await pending;

  const [request] = fixture.harness.requests;
  assert.equal(request.url, "https://example.invalid/api/chat/rooms/alice_bob");
  assert.equal(request.method, "POST");
  assert.equal(request.headers.Authorization, "Bearer test-token");
  assert.deepEqual(JSON.parse(request.body), {
    text: "Yes please",
    replyTo: replySnapshot,
  });
  assert.deepEqual(
    fixture.messages.value.map((entry) => entry.id),
    ["quoted", "sent"],
  );
  assert.deepEqual(fixture.messages.value[1].replyTo, replySnapshot);
  assert.equal(fixture.messages.value[1]._temp, false);
  assert.equal(fixture.scrolls.length, 2);
});

test("ordinary text omits replyTo and blank input sends nothing", async () => {
  const fixture = setup();
  fixture.composer().setText(" \n ");
  await fixture.send();
  assert.equal(fixture.harness.requests.length, 0);
  assert.equal(fixture.messages.value.length, 0);
  fixture.composer().setText("Hello");
  fixture.harness.responses.push(
    response({ message: message({ id: "sent", text: "Hello" }) }),
  );
  await fixture.send();
  assert.deepEqual(JSON.parse(fixture.harness.requests[0].body), {
    text: "Hello",
  });
});

test("rejected send removes only its optimistic message and reports the server reason", async () => {
  const original = message();
  const fixture = setup([original]);
  fixture.composer().setText("Blocked message");
  fixture.harness.responses.push(
    response({ message: "Conversation unavailable" }, false),
  );
  await fixture.send();
  assert.deepEqual(fixture.messages.value, [original]);
  assert.deepEqual(fixture.harness.alerts, [
    ["Failed to send message", "Conversation unavailable"],
  ]);
});

test("network failure removes an optimistic send without dropping existing messages", async () => {
  const original = message();
  const fixture = setup([original]);
  fixture.composer().setText("No connection");
  fixture.harness.responses.push(new Error("offline"));
  await fixture.send();
  assert.deepEqual(fixture.messages.value, [original]);
});

for (const failure of ["server", "network"]) {
  test(`${failure} edit failure rolls back text and the original edited flag`, async () => {
    const original = message({ edited: true, pinned: true });
    const fixture = setup([original]);
    fixture.composer().startEdit(original);
    fixture.composer().setText("Changed");
    let observedOptimistic = false;
    fixture.harness.responses.push(() => {
      observedOptimistic = fixture.messages.value[0].text === "Changed";
      if (failure === "network") throw new Error("offline");
      return response({ error: "edit window expired" }, false);
    });
    await fixture.send();
    assert.equal(observedOptimistic, true);
    assert.deepEqual(fixture.messages.value, [original]);
    assert.equal(fixture.harness.requests[0].method, "PATCH");
    assert.deepEqual(JSON.parse(fixture.harness.requests[0].body), {
      text: "Changed",
    });
    assert.equal(fixture.harness.alerts[0][0], "Edit failed");
    assert.equal(fixture.composer().editId, original.id);
  });
}

test("successful edit merges the server message without losing unrelated metadata", async () => {
  const original = message({ pinned: true, reactions: { bob: "🔥" } });
  const fixture = setup([original]);
  fixture.composer().startEdit(original);
  fixture.composer().setText("Updated");
  fixture.harness.responses.push(
    response({
      ok: true,
      message: { id: original.id, text: "Updated", edited: true },
    }),
  );
  await fixture.send();
  assert.equal(fixture.messages.value.length, 1);
  assert.equal(fixture.messages.value[0].text, "Updated");
  assert.equal(fixture.messages.value[0].pinned, true);
  assert.deepEqual(fixture.messages.value[0].reactions, { bob: "🔥" });
  assert.equal(fixture.composer().editId, null);
});

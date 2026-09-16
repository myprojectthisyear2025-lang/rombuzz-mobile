const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createHarness,
  createState,
  message,
  participants,
  response,
} = require("./hookHarness.cjs");

function setup(initial) {
  const harness = createHarness();
  const messages = createState(initial);
  let closed = 0;
  const actions = harness.hook("useChatMessageActions")({
    ...participants,
    setMessages: messages.set,
    closeSheet: () => {
      closed++;
    },
  });
  return {
    harness,
    messages,
    actions,
    get closed() {
      return closed;
    },
  };
}

test("reactions toggle the current user's emoji while retaining other users", async () => {
  const original = message({ reactions: { bob: "🔥" } });
  const fixture = setup([original]);
  for (const emoji of ["❤️", "❤️", "😂"]) {
    fixture.harness.responses.push(response({ ok: true }));
    await fixture.actions.reactTo(fixture.messages.value[0], emoji);
    const expected =
      emoji === "😂"
        ? "😂"
        : fixture.harness.requests.length === 1
          ? "❤️"
          : undefined;
    assert.equal(fixture.messages.value[0].reactions.alice, expected);
    assert.equal(fixture.messages.value[0].reactions.bob, "🔥");
  }
  assert.equal(fixture.closed, 3);
  assert.ok(
    fixture.harness.requests.every(
      (entry) =>
        entry.method === "POST" && entry.url.endsWith("/message-1/react"),
    ),
  );
  assert.deepEqual(
    fixture.harness.requests.map((entry) => JSON.parse(entry.body)),
    [{ emoji: "❤️" }, { emoji: "❤️" }, { emoji: "😂" }],
  );
});

for (const failure of ["server", "network", "missing-message"]) {
  test(`${failure} pin failure restores all pin metadata`, async () => {
    const original = message({
      pinned: true,
      pinnedAt: "2026-01-01",
      pinnedBy: "bob",
    });
    const fixture = setup([original]);
    let observedOptimistic = false;
    fixture.harness.responses.push(() => {
      observedOptimistic = fixture.messages.value[0].pinned === false;
      if (failure === "network") throw new Error("offline");
      return failure === "server"
        ? response({ error: "not_matched" }, false)
        : response({ ok: true });
    });
    await fixture.actions.togglePinMessage(original);
    assert.equal(observedOptimistic, true);
    assert.deepEqual(fixture.messages.value, [original]);
    assert.deepEqual(JSON.parse(fixture.harness.requests[0].body), {
      pinned: false,
    });
    assert.equal(fixture.harness.alerts[0][0], "Pin failed");
  });
}

test("successful pin uses server metadata and keeps message content", async () => {
  const fixture = setup([message()]);
  fixture.harness.responses.push(
    response({
      message: {
        id: "message-1",
        pinned: true,
        pinnedAt: "server-time",
        pinnedBy: "alice",
      },
    }),
  );
  await fixture.actions.togglePinMessage(fixture.messages.value[0]);
  assert.deepEqual(
    fixture.messages.value[0],
    message({
      pinned: true,
      pinnedAt: "server-time",
      pinnedBy: "alice",
    }),
  );
  assert.equal(
    fixture.harness.requests[0].url.endsWith("/message-1/pin"),
    true,
  );
  assert.deepEqual(fixture.harness.alerts, []);
});

for (const [method, scope] of [
  ["unsendForMe", "me"],
  ["unsendForAll", "all"],
]) {
  test(`${method} uses scope=${scope} and removes only the acknowledged message`, async () => {
    const original = message();
    const retained = message({ id: "keep" });
    const fixture = setup([original, retained]);
    fixture.harness.responses.push(() => {
      assert.deepEqual(fixture.messages.value, [original, retained]);
      return response({ ok: true });
    });
    await fixture.actions[method](original);
    const [request] = fixture.harness.requests;
    assert.equal(request.method, "DELETE");
    assert.equal(
      request.url,
      `https://example.invalid/api/chat/rooms/alice_bob/message-1?scope=${scope}`,
    );
    assert.equal(request.headers.Authorization, "Bearer test-token");
    assert.deepEqual(fixture.messages.value, [retained]);
    assert.equal(fixture.closed, 1);
  });

  test(`${method} retains the message when deletion fails`, async () => {
    const original = message();
    const fixture = setup([original]);
    fixture.harness.responses.push(
      response({ ok: false, error: "forbidden" }, false),
    );
    await fixture.actions[method](original);
    assert.deepEqual(fixture.messages.value, [original]);
    if (scope === "all")
      assert.equal(fixture.harness.alerts[0][0], "Unsend failed");
  });
}

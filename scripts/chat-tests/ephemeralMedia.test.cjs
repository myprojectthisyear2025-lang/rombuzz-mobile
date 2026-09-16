const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createHarness,
  createState,
  message,
  response,
} = require("./hookHarness.cjs");

function setup(initial) {
  let viewerArgs;
  const harness = createHarness({
    "@/src/features/chat/thread/ChatMediaViewerController": {
      useChatMediaViewerController: (args) => {
        viewerArgs = args;
        return {
          openImageViewer() {},
          openVideoViewer() {},
          mediaViewerNode: null,
        };
      },
    },
  });
  const messages = createState(initial);
  const useMedia = harness.hook("useChatEphemeralMedia");
  const render = () =>
    harness.render(() =>
      useMedia({
        roomId: "alice_bob",
        messages: messages.value,
        setMessages: messages.set,
      }),
    );
  render();
  return {
    harness,
    messages,
    render,
    consume: (entry) => viewerArgs.consumeEphemeralView(entry),
  };
}

test("view-once disappears before the request completes and deduplicates the expiry notice", async () => {
  const media = message({
    id: "once",
    ephemeral: { mode: "once" },
    type: "media",
    url: "photo.jpg",
  });
  const retained = message({ id: "keep" });
  const systemMessage = message({
    id: "expired-notice",
    from: "system",
    to: "system",
    text: "Photo expired",
  });
  const fixture = setup([media, retained]);
  fixture.harness.responses.push(() => {
    // The socket can deliver the system message before the HTTP response.
    fixture.messages.set((previous) => [
      ...previous,
      { ...systemMessage, system: true },
    ]);
    return response({ viewsLeft: 0, systemMessage });
  });

  const pending = fixture.consume(media);
  assert.deepEqual(fixture.messages.value, [retained]);
  assert.equal(fixture.render().isExpired(media), true);
  await pending;

  assert.deepEqual(
    fixture.messages.value.map((entry) => entry.id),
    ["keep", "expired-notice"],
  );
  assert.equal(fixture.messages.value[1].system, true);
  assert.equal(fixture.render().mediaViews.once, 0);
  assert.equal(
    fixture.harness.requests[0].url,
    "https://example.invalid/api/chat/rooms/alice_bob/once/viewed",
  );
  assert.equal(fixture.harness.requests[0].method, "POST");
  assert.equal(
    fixture.harness.requests[0].headers.Authorization,
    "Bearer test-token",
  );
});

test("view-twice remains after the first view and disappears after the second", async () => {
  const media = message({
    id: "twice",
    ephemeral: { mode: "twice" },
    type: "media",
    url: "video.mp4",
  });
  const fixture = setup([media]);
  fixture.harness.responses.push(response({ viewsLeft: 1 }));
  await fixture.consume(media);
  assert.deepEqual(fixture.messages.value, [media]);
  assert.equal(fixture.render().mediaViews.twice, 1);
  assert.equal(fixture.render().isExpired(media), false);

  const notice = message({ id: "notice", text: "Video expired", system: true });
  fixture.harness.responses.push(
    response({ viewsLeft: 0, systemMessage: notice }),
  );
  await fixture.consume(media);
  assert.deepEqual(fixture.messages.value, [notice]);
  assert.equal(fixture.render().isExpired(media), true);
  assert.equal(fixture.render().mediaViews.twice, 0);
});

test("repeated expiry responses keep one system message", async () => {
  const media = message({ id: "protected", ephemeral: { maxViews: 1 } });
  const notice = message({ id: "notice", system: true });
  const fixture = setup([media]);
  for (let index = 0; index < 2; index++) {
    fixture.harness.responses.push(
      response({ viewsLeft: 0, systemMessage: notice }),
    );
    await fixture.consume(media);
    fixture.render();
  }
  assert.equal(fixture.messages.value.length, 1);
  assert.equal(fixture.messages.value[0].id, notice.id);
  assert.equal(fixture.messages.value[0].system, true);
  assert.equal(fixture.messages.value[0].text, notice.text);
});

test("ordinary media and unidentified items never consume an ephemeral view", async () => {
  const ordinary = message({ type: "media", url: "photo.jpg" });
  const fixture = setup([ordinary]);
  await fixture.consume(ordinary);
  await fixture.consume({ ephemeral: { mode: "once" } });
  assert.deepEqual(fixture.messages.value, [ordinary]);
  assert.equal(fixture.harness.requests.length, 0);
});

test("an expiry response without a notice still removes the protected item", async () => {
  const media = message({ id: "protected", ephemeral: { maxViews: 2 } });
  const retained = message({ id: "keep" });
  const fixture = setup([media, retained]);
  fixture.harness.responses.push(response({ viewsLeft: 0 }));
  await fixture.consume(media);
  assert.deepEqual(fixture.messages.value, [retained]);
  assert.equal(fixture.render().isExpired(media), true);
});

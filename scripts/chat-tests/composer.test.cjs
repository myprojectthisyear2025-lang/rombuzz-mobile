const assert = require("node:assert/strict");
const test = require("node:test");
const { createHarness, message } = require("./hookHarness.cjs");

function setup() {
  const harness = createHarness();
  const useComposer = harness.hook("useChatComposer");
  let closed = 0;
  const render = () =>
    harness.render(() =>
      useComposer(() => {
        closed++;
      }),
    );
  return {
    render,
    get closed() {
      return closed;
    },
  };
}

test("replying cancels edit mode, preserves a snapshot, and reveals the composer", () => {
  const fixture = setup();
  fixture.render().startEdit(message());
  fixture.render().setComposerActionsOpen(true);
  const quoted = message({
    id: "quoted",
    from: "bob",
    to: "alice",
    text: "Hello",
  });
  fixture.render().startReplying(quoted);
  quoted.text = "Later edit";

  const composer = fixture.render();
  assert.equal(composer.editId, null);
  assert.equal(composer.replyingTo.id, "quoted");
  assert.equal(composer.replyingTo.text, "Hello");
  assert.equal(composer.composerExpanded, true);
  assert.equal(composer.composerActionsOpen, false);
});

test("editing clears a reply, decodes the content, and closes the action sheet", () => {
  const fixture = setup();
  fixture.render().startReplying(message({ id: "quoted" }));
  fixture
    .render()
    .startEdit(
      message({ text: '::RBZ::{"type":"text","text":"Decoded content"}' }),
    );
  const composer = fixture.render();
  assert.equal(composer.replyingTo, null);
  assert.equal(composer.editId, "message-1");
  assert.equal(composer.text, "Decoded content");
  assert.equal(fixture.closed, 1);
});

test("replying to encoded shared media keeps its media identity and URL", () => {
  const fixture = setup();
  fixture.render().startReplying(
    message({
      text: '::RBZ::{"type":"share_profile_media","mediaType":"reel","mediaUrl":"https://example.invalid/reel.mp4"}',
    }),
  );
  assert.deepEqual(fixture.render().replyingTo, {
    id: "message-1",
    from: "alice",
    type: "share_profile_media",
    text: "",
    url: "https://example.invalid/reel.mp4",
    mediaType: "video",
    deleted: false,
  });
});

test("an invalid reply target leaves the current draft and edit mode alone", () => {
  const fixture = setup();
  fixture.render().startEdit(message());
  fixture.render().setText("Draft edit");
  fixture.render().startReplying({ text: "No message ID" });
  const composer = fixture.render();
  assert.equal(composer.editId, "message-1");
  assert.equal(composer.text, "Draft edit");
  assert.equal(composer.replyingTo, null);
});

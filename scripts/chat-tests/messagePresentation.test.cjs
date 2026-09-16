const assert = require("node:assert/strict");
const test = require("node:test");
const { createHarness, message } = require("./hookHarness.cjs");

function setup() {
  const harness = createHarness({
    "@/src/features/chat/thread/MeetMiddleChatBubble": {
      getMeetMiddleBubblePayload: (entry) => entry.meetup || null,
    },
    "@/src/features/videoCall/VideoCallHistoryBubble": {
      isVideoCallHistoryMessage: (entry) => !!entry.callLike,
    },
  });
  return harness.load(
    "src/features/chat/window/components/chatMessagePresentation.ts",
  ).getChatMessagePresentation;
}

test("paid media needs its existing price contract, without a new enabled flag", () => {
  const present = setup();
  for (const gift of [{ priceBC: 20 }, { amount: 20 }]) {
    const model = present(
      message({ type: "media", url: "photo.jpg", gift }),
      "alice",
    );
    assert.equal(model.isGiftedMedia, true);
  }
  assert.equal(
    present(
      message({ type: "media", url: "photo.jpg", gift: { priceBC: 0 } }),
      "alice",
    ).isGiftedMedia,
    false,
  );
});

test("stream media wins even when call-history fields are present", () => {
  const model = setup()(
    message({ type: "media", streamUid: "stream-1", callLike: true }),
    "alice",
  );
  assert.equal(model.isMedia, true);
  assert.equal(model.isVideoCallHistory, false);
});

test("shared profile reels remain shared video rather than generic chat media", () => {
  const model = setup()(
    message({
      type: "share_profile_media",
      mediaType: "reel",
      mediaUrl: "reel.mp4",
    }),
    "alice",
  );
  assert.equal(model.isShared, true);
  assert.equal(model.isSharedProfileReel, true);
  assert.equal(model.isMedia, false);
});

test("only confirmed meetup milestones render and system/temp/deleted messages cannot swipe-reply", () => {
  const present = setup();
  const pending = present(
    message({
      id: "pending",
      meetup: { kind: "milestone", status: "place_proposed" },
    }),
    "alice",
  );
  assert.equal(pending.shouldHideMeetMiddleMilestone, true);
  const confirmed = present(
    message({
      id: "confirmed",
      meetup: { kind: "milestone", status: "confirmed" },
    }),
    "alice",
  );
  assert.equal(confirmed.isMeetMiddleConfirmed, true);
  assert.equal(confirmed.canSwipeReply, false);
  for (const fields of [{ system: true }, { _temp: true }, { deleted: true }]) {
    assert.equal(
      present(message({ id: JSON.stringify(fields), ...fields }), "alice")
        .canSwipeReply,
      false,
    );
  }
  assert.equal(
    present(message({ id: "ordinary" }), "alice").canSwipeReply,
    true,
  );
});

test("encoded gift messages and reaction counts retain their presentation", () => {
  const model = setup()(
    message({
      text: '::RBZ::{"type":"chat_gift","gift":{"giftId":"rose"}}',
      reactions: { alice: "❤️", bob: "❤️", charlie: "😂" },
    }),
    "alice",
  );
  assert.equal(model.isChatGift, true);
  assert.equal(model.reactLine, "❤️2 😂");
});

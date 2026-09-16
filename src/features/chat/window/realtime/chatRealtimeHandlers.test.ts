import assert from "node:assert/strict";
import test from "node:test";
import { maybeDecode } from "../../thread/chatPayload";
import type { Msg } from "../../thread/chatTypes";
import { createChatMessageHandlers } from "./chatMessageHandlers";
import { createChatMetadataHandlers } from "./chatMetadataHandlers";
import {
  getLatestPeerMessageId,
  makeRoomId,
  type SetChatMessages,
} from "./chatRealtimeHelpers";

function message(id: string, patch: Partial<Msg> = {}): Msg {
  return { id, from: "me", to: "peer", text: "Hello", ...patch };
}

function thread(initial: Msg[]) {
  let messages = initial;
  const seenIds: string[] = [];
  let follows = 0;
  const setMessages: SetChatMessages = (update) => {
    messages = typeof update === "function" ? update(messages) : update;
  };
  const settleToLatest = () => {
    follows++;
  };
  return {
    get messages() {
      return messages;
    },
    get follows() {
      return follows;
    },
    seenIds,
    ...createChatMessageHandlers({
      peerId: "peer",
      roomId: makeRoomId("me", "peer"),
      setMessages,
      markSeen: (id) => {
        seenIds.push(id);
      },
      settleToLatest,
    }),
    ...createChatMetadataHandlers({ myId: "me", setMessages, settleToLatest }),
  };
}

test("delivery ignores list previews and other rooms", () => {
  const chat = thread([]);
  chat.onIncoming({ from: "peer", to: "me", text: "Preview only" });
  chat.onIncoming(message("other", { from: "stranger" }));
  chat.onIncoming({ roomId: "different-room", message: message("also-other") });
  assert.deepEqual(chat.messages, []);
  assert.equal(chat.follows, 0);
  assert.deepEqual(chat.seenIds, []);
});

test("duplicate delivery replaces optimistic sends and keeps reply snapshots", () => {
  const replyTo = { id: "source", from: "peer", text: "Original preview" };
  const chat = thread([message("temp", { _temp: true, replyTo })]);
  const delivered = message("real", { replyTo });
  chat.onIncoming({ message: delivered, roomId: "me_peer" });
  chat.onIncoming({ id: "real", from: "me", to: "peer" });
  assert.equal(chat.messages.length, 1);
  assert.equal(chat.messages[0].id, "real");
  assert.equal(chat.messages[0].text, "Hello");
  assert.deepEqual(chat.messages[0].replyTo, replyTo);
});

test("identical reply text targeting different messages stays separate", () => {
  const chat = thread([
    message("temp", {
      _temp: true,
      replyTo: { id: "first", from: "peer", text: "First" },
    }),
  ]);
  chat.onIncoming(
    message("real", {
      replyTo: { id: "second", from: "peer", text: "Second" },
    }),
  );
  assert.deepEqual(
    chat.messages.map((item) => item.id),
    ["temp", "real"],
  );
});

test("peer delivery marks the received message seen and follows it", () => {
  const chat = thread([]);
  chat.onIncoming(message("received", { from: "peer", to: "me" }));
  assert.deepEqual(chat.seenIds, ["received"]);
  assert.equal(chat.follows, 1);
});

test("edits decode rich payloads, preserve identity, and honor explicit edited state", () => {
  const chat = thread([message("edit")]);
  chat.onEdited({
    msgId: "edit",
    text: '::RBZ::{"type":"media","url":"https://example.test/photo.jpg"}',
  });
  assert.equal(chat.messages[0].url, "https://example.test/photo.jpg");
  assert.equal(chat.messages[0].from, "me");
  assert.equal(chat.messages[0].edited, true);
  chat.onEdited({ message: { id: "edit", text: "Restored", edited: false } });
  assert.equal(chat.messages[0].text, "Restored");
  assert.equal(chat.messages[0].edited, false);
});

test("deletion accepts supported IDs and removes only the target", () => {
  const chat = thread([message("one"), message("two"), message("three")]);
  chat.onDeleted({ messageId: "two" });
  chat.onDeleted("one");
  assert.deepEqual(
    chat.messages.map((item) => item.id),
    ["three"],
  );
});

test("full reaction messages replace the exact map without resurrecting removed reactions", () => {
  const chat = thread([
    message("react", { reactions: { me: "heart", peer: "laugh" } }),
  ]);
  chat.onReacted({ message: { id: "react", reactions: { peer: "laugh" } } });
  assert.deepEqual(chat.messages[0].reactions, { peer: "laugh" });
  chat.onReacted({ message: { id: "react" } });
  assert.deepEqual(chat.messages[0].reactions, {});
});

test("reaction deltas retain other users and support removing one user's emoji", () => {
  const chat = thread([
    message("react", { reactions: { me: "heart", peer: "laugh" } }),
  ]);
  chat.onReacted({ msgId: "react", reactorId: "me", emoji: null });
  assert.deepEqual(chat.messages[0].reactions, { peer: "laugh" });
  chat.onReacted({ id: "react", userId: "me", emoji: "fire" });
  assert.deepEqual(chat.messages[0].reactions, { peer: "laugh", me: "fire" });
});

test("read receipts mark own messages through the supplied ID only", () => {
  const chat = thread([
    message("one"),
    message("peer-one", { from: "peer", to: "me" }),
    message("two"),
    message("three"),
  ]);
  chat.onSeen({ lastSeenId: "two" });
  assert.deepEqual(
    chat.messages.map((item) => !!item.seen),
    [true, false, true, false],
  );
});

test("pin events dedupe their system message and preserve pin metadata", () => {
  const chat = thread([message("pin")]);
  const payload = {
    message: {
      id: "pin",
      pinned: true,
      pinnedBy: "peer",
      pinnedAt: "2026-09-14",
    },
    systemMessage: message("system", { system: true, text: "Message pinned" }),
  };
  chat.onPinned(payload);
  chat.onPinned(payload);
  assert.equal(chat.messages.length, 2);
  assert.equal(chat.messages[0].pinned, true);
  assert.equal(chat.messages[0].pinnedBy, "peer");
  chat.onPinned({ id: "pin", pinned: false });
  assert.equal(chat.messages[0].pinned, false);
  assert.equal(chat.messages[0].pinnedAt, null);
});

test("repeated expiration removes media and inserts its system message once", () => {
  const chat = thread([message("media"), message("keep")]);
  const payload = {
    msgId: "media",
    systemMessage: message("expired", { system: true }),
  };
  chat.onEphemeralExpired(payload);
  chat.onEphemeralExpired(payload);
  assert.deepEqual(
    chat.messages.map((item) => item.id),
    ["keep", "expired"],
  );
});

test("gift unlock merges users uniquely and fresh media wins over encoded gift state", () => {
  const original = {
    ...message("gift"),
    text: '::RBZ::{"type":"media","gift":{"priceBC":5,"unlockedBy":[]}}',
    gift: { priceBC: 5, unlockedBy: ["existing"] },
  };
  const chat = thread([original]);
  chat.onGiftMediaUnlocked({
    id: "gift",
    unlockedBy: "new-user",
    message: {
      id: "gift",
      url: "https://example.test/unlocked.jpg",
      gift: { unlockedBy: ["existing", "new-user"] },
    },
  });
  const decoded = maybeDecode(chat.messages[0]);
  assert.deepEqual(decoded.gift.unlockedBy, ["existing", "new-user"]);
  assert.equal(decoded.gift.priceBC, 5);
  assert.equal(decoded.url, "https://example.test/unlocked.jpg");
});

test("latest peer receipt skips outgoing and deleted messages", () => {
  assert.equal(
    getLatestPeerMessageId(
      [
        message("peer-one", { from: "peer" }),
        message("mine"),
        message("deleted", { from: "peer", deleted: true }),
      ],
      "peer",
    ),
    "peer-one",
  );
  assert.equal(getLatestPeerMessageId([message("mine")], "peer"), null);
});

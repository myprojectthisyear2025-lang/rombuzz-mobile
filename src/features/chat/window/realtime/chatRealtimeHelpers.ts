import type { Dispatch, SetStateAction } from "react";
import { maybeDecode } from "../../thread/chatPayload";
import type { Msg } from "../../thread/chatTypes";

export type SetChatMessages = Dispatch<SetStateAction<Msg[]>>;

export type ChatMessageHandlerArgs = {
  peerId: string;
  roomId: string;
  setMessages: SetChatMessages;
  markSeen: (msgId: string) => void;
  settleToLatest: (animated?: boolean) => void;
};

export type ChatMetadataHandlerArgs = {
  myId: string;
  setMessages: SetChatMessages;
  settleToLatest: (animated?: boolean) => void;
};

export function makeRoomId(a: string, b: string) {
  return [String(a), String(b)].sort().join("_");
}

export function getLatestPeerMessageId(messages: Msg[], peerId: string) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = maybeDecode(messages[i]);
    if (!message || message.deleted) continue;
    if (String(message.from) === String(peerId)) return String(message.id);
  }
  return null;
}

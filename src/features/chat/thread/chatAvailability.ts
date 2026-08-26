/**
 * ============================================================
 * 📁 File: src/features/chat/thread/chatAvailability.ts
 * 🎯 Purpose: Normalize backend chat-unavailable states into one mobile event.
 *
 * Used by:
 *   - Chat thread loading/pagination
 *   - Socket unmatch forwarding
 *
 * Owns:
 *   - Recognizing backend 403/404/409 conversation failures
 *   - Broadcasting one event for deleted/unmatched/blocked peers
 *
 * Must NOT touch:
 *   - Cache/storage cleanup
 *   - Navigation
 *   - Message layout, composer, keyboard, scrolling, or FlatList behavior
 * ============================================================
 */

import { DeviceEventEmitter } from "react-native";

export const CHAT_PEER_UNAVAILABLE_EVENT =
  "rbz:chat:peer-unavailable";

type UnavailableReason =
  | "user_not_found"
  | "not_matched"
  | "blocked"
  | "forbidden";

export type ChatUnavailableInfo = {
  unavailable: true;
  reason: UnavailableReason;
  title: string;
  message: string;
};

function safeId(value: any) {
  return String(value || "").trim();
}

function lower(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function getChatUnavailableInfo(
  status: number,
  payload: any,
): ChatUnavailableInfo | null {
  const code = lower(
    payload?.code ||
      payload?.error ||
      payload?.status,
  );

  const message = String(
    payload?.message ||
      payload?.error ||
      "",
  ).trim();

  const messageLower =
    lower(message);

  const userMissing =
    code === "user_not_found" ||
    messageLower.includes(
      "user is no longer available",
    ) ||
    messageLower.includes(
      "user not found",
    );

  if (
    status === 404 &&
    userMissing
  ) {
    return {
      unavailable: true,
      reason: "user_not_found",
      title:
        "Conversation unavailable",
      message:
        "This RomBuzz user is no longer available.",
    };
  }

  const unmatched =
    code === "not_matched" ||
    messageLower.includes(
      "conversation is no longer available",
    ) ||
    messageLower.includes(
      "not matched",
    ) ||
    messageLower.includes(
      "no longer matched",
    );

  if (
    status === 409 &&
    unmatched
  ) {
    return {
      unavailable: true,
      reason: "not_matched",
      title:
        "Conversation ended",
      message:
        "You are no longer matched with this user.",
    };
  }

  if (
    status === 403 &&
    (
      code === "blocked" ||
      messageLower.includes(
        "blocked",
      )
    )
  ) {
    return {
      unavailable: true,
      reason: "blocked",
      title:
        "Conversation unavailable",
      message:
        "Messaging is unavailable for this conversation.",
    };
  }

  if (
    status === 403 &&
    code === "forbidden" &&
    messageLower.includes(
      "conversation",
    )
  ) {
    return {
      unavailable: true,
      reason: "forbidden",
      title:
        "Conversation unavailable",
      message:
        message ||
        "You can no longer access this conversation.",
    };
  }

  return null;
}

export function emitChatPeerUnavailable(
  args: {
    peerId: string;
    roomId?: string;
    info: ChatUnavailableInfo;
    source?: string;
  },
) {
  const peerId =
    safeId(args.peerId);

  if (!peerId) return;

  DeviceEventEmitter.emit(
    CHAT_PEER_UNAVAILABLE_EVENT,
    {
      peerId,
      roomId:
        safeId(args.roomId),

      reason:
        args.info.reason,

      title:
        args.info.title,

      message:
        args.info.message,

      source:
        safeId(args.source),
    },
  );
}

export function emitChatUnavailableFromResponse(
  args: {
    status: number;
    payload: any;
    peerId: string;
    roomId?: string;
    source?: string;
  },
) {
  const info =
    getChatUnavailableInfo(
      args.status,
      args.payload,
    );

  if (!info) return false;

  emitChatPeerUnavailable({
    peerId: args.peerId,
    roomId: args.roomId,
    info,
    source: args.source,
  });

  return true;
}
import {
  dedupeById,
  maybeDecode,
  mergeReplySnapshot,
} from "../../thread/chatPayload";
import type { Msg } from "../../thread/chatTypes";
import { makeRoomId, type ChatMessageHandlerArgs } from "./chatRealtimeHelpers";

/** Message delivery and mutations keep the server's existing payload variants. */
export function createChatMessageHandlers({
  peerId,
  roomId,
  setMessages,
  markSeen,
  settleToLatest,
}: ChatMessageHandlerArgs) {
  const onIncoming = (raw: any) => {
    const msg = (raw?.message ? raw.message : raw) as Msg;

    // Preview-only events have no message ID and must never become blank rows.
    if (!msg?.id) return;
    const incomingRoomId =
      raw?.roomId || msg.roomId || makeRoomId(msg.from, msg.to);
    if (incomingRoomId !== roomId) return;

    setMessages((prev) => {
      const next = [...prev];
      const tempIndex = next.findIndex(
        (message) =>
          message._temp &&
          String(message.from) === String(msg.from) &&
          String(message.to) === String(msg.to) &&
          String(message.text) === String(msg.text) &&
          String(message.replyTo?.id || "") === String(msg.replyTo?.id || ""),
      );

      if (tempIndex !== -1) {
        next[tempIndex] = mergeReplySnapshot(next[tempIndex], msg);
      } else {
        next.push(msg);
      }
      return dedupeById(next);
    });

    if (String(msg.from) === String(peerId)) markSeen(String(msg.id));
    settleToLatest(true);
  };

  const onEdited = (payload: any) => {
    const rawMsg = payload?.message || payload;
    const messageId =
      payload?.id ||
      payload?.msgId ||
      payload?.messageId ||
      payload?.message?.id ||
      rawMsg?.id ||
      rawMsg?.msgId ||
      rawMsg?.messageId;
    if (!messageId) return;

    const normalizedPatch = maybeDecode(
      rawMsg && typeof rawMsg === "object"
        ? {
            ...rawMsg,
            id: String(messageId),
            text: rawMsg?.text ?? payload?.text ?? payload?.message?.text,
            edited:
              rawMsg?.edited ??
              payload?.edited ??
              payload?.message?.edited ??
              true,
          }
        : {
            id: String(messageId),
            text: payload?.text,
            edited: payload?.edited ?? true,
          },
    );

    setMessages((prev) =>
      prev.map((message) =>
        String(message.id) === String(messageId)
          ? { ...message, ...normalizedPatch }
          : message,
      ),
    );
  };

  const onDeleted = (payload: any) => {
    const id = payload?.id || payload?.msgId || payload?.messageId || payload;
    if (!id) return;
    setMessages((prev) =>
      prev.filter((message) => String(message.id) !== String(id)),
    );
  };

  const onReacted = (payload: any) => {
    const rawMsg = payload?.message || null;
    const decodedMsg = rawMsg ? maybeDecode(rawMsg) : null;
    const messageId =
      decodedMsg?.id || payload?.id || payload?.msgId || payload?.messageId;
    if (!messageId) return;

    const reactorId =
      payload?.reactorId ||
      payload?.userId ||
      payload?.from ||
      payload?.senderId;
    const emoji = payload?.emoji == null ? null : String(payload.emoji);
    const payloadReactions =
      payload?.reactions && typeof payload.reactions === "object"
        ? payload.reactions
        : null;

    setMessages((prev) =>
      prev.map((message) => {
        if (String(message.id) !== String(messageId)) return message;

        // A full server message replaces reactions exactly, including removals.
        if (decodedMsg?.id) {
          return {
            ...message,
            ...decodedMsg,
            reactions:
              decodedMsg?.reactions && typeof decodedMsg.reactions === "object"
                ? decodedMsg.reactions
                : {},
          };
        }

        const nextReactions: Record<string, string> = {
          ...(message.reactions || {}),
          ...(payloadReactions || {}),
        };
        if (reactorId) {
          if (emoji) nextReactions[String(reactorId)] = emoji;
          else delete nextReactions[String(reactorId)];
        }
        return { ...message, reactions: nextReactions };
      }),
    );
  };

  return { onIncoming, onEdited, onDeleted, onReacted };
}

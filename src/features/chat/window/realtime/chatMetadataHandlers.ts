import { dedupeById } from "../../thread/chatPayload";
import type { Msg } from "../../thread/chatTypes";
import type { ChatMetadataHandlerArgs } from "./chatRealtimeHelpers";

/** Read receipts, pins, expiring media and paid-media access updates. */
export function createChatMetadataHandlers({
  myId,
  setMessages,
  settleToLatest,
}: ChatMetadataHandlerArgs) {
  const onSeen = (payload: any) => {
    const seenUpTo =
      payload?.lastSeenId ||
      payload?.seenUpTo ||
      payload?.msgId ||
      payload?.messageId ||
      payload?.id ||
      payload;
    if (!seenUpTo || !myId) return;

    setMessages((prev) => {
      let hit = false;
      return prev.map((message) => {
        if (String(message.from) !== String(myId)) return message;
        if (!hit) {
          if (String(message.id) === String(seenUpTo)) hit = true;
          return { ...message, seen: true };
        }
        return message;
      });
    });
  };

  const onPinned = (payload: any) => {
    const rawMsg = payload?.message || payload;
    const systemMessage = payload?.systemMessage || null;
    const nextPinned = !!(rawMsg?.pinned ?? payload?.pinned);
    const messageId =
      payload?.id || payload?.msgId || payload?.messageId || rawMsg?.id;
    if (!messageId) return;

    setMessages((prev) =>
      dedupeById([
        ...prev.map((message) =>
          String(message.id) === String(messageId)
            ? {
                ...message,
                pinned: nextPinned,
                pinnedAt: rawMsg?.pinnedAt ?? null,
                pinnedBy: rawMsg?.pinnedBy ?? null,
              }
            : message,
        ),
        ...(systemMessage?.id ? [systemMessage] : []),
      ]),
    );
    if (systemMessage?.id) settleToLatest(true);
  };

  const onEphemeralExpired = (payload: any) => {
    const expiredId =
      payload?.msgId || payload?.messageId || payload?.id || payload;
    const systemMessage = payload?.systemMessage || null;
    if (!expiredId) return;

    setMessages((prev) => {
      const map = new Map<string, Msg>();
      prev.forEach((message) => {
        if (String(message.id) !== String(expiredId))
          map.set(String(message.id), message);
      });
      if (systemMessage?.id) map.set(String(systemMessage.id), systemMessage);
      return Array.from(map.values());
    });
  };

  const onGiftMediaUnlocked = (payload: any) => {
    const msgId =
      payload?.msgId ||
      payload?.messageId ||
      payload?.id ||
      payload?.message?.id;
    if (!msgId) return;

    const updated = payload?.message || null;
    const unlockedBy = String(payload?.unlockedBy || "");
    setMessages((prev) =>
      prev.map((message) => {
        if (String(message.id) !== String(msgId)) return message;
        return {
          ...message,
          ...(updated?.id ? updated : {}),
          gift: {
            ...((message as any)?.gift || {}),
            ...(updated?.gift || {}),
            unlockedBy: [
              ...new Set([
                ...((message as any)?.gift?.unlockedBy || []).map(
                  (value: any) => String(value),
                ),
                ...(updated?.gift?.unlockedBy || []).map((value: any) =>
                  String(value),
                ),
                ...(unlockedBy ? [unlockedBy] : []),
              ]),
            ],
          },
        } as Msg;
      }),
    );
  };

  return { onSeen, onPinned, onEphemeralExpired, onGiftMediaUnlocked };
}

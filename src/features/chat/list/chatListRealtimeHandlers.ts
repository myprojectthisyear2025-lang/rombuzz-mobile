/**
 * Path: src/features/chat/list/chatListRealtimeHandlers.ts
 * Purpose: Socket message deduplication, previews, persisted ordering, and optimistic unread updates.
 */

import type { RefObject } from "react";
import { safeId } from "./chatListPresentation";
import { UNREAD_MAP_KEY, persistUnreadTotal, reorderMatchesPersist, setJSONStore } from "./chatListPersistence";
import type { ChatListState } from "./useChatListState";

type RealtimeMessageState = Pick<ChatListState,
  "myId" | "activePeerRef" | "setMatches" | "setFiltered" | "setUnreadMap" | "setUnreadTotal">;

export function createChatListRealtimeHandlers(
  { myId, activePeerRef, setMatches, setFiltered, setUnreadMap, setUnreadTotal }: RealtimeMessageState,
  seenMsgIdsRef: RefObject<Record<string, number>>,
  reconcileTimerRef: RefObject<any>,
  reconcileFromServer: () => Promise<void>,
) {
  const TTL_MS = 8000; // keep msg ids for 8s, enough to kill duplicates

  // ✅ Robust peer id extraction (covers different payload shapes)
  const peerFromMsg = (msg: any) =>
    String(msg?.from || msg?.fromId || msg?.senderId || msg?.userId || "");

  const bumpUnread = (raw: any) => {
    // Some emitters wrap message payload (defensive)
    const msg = raw?.message ? raw.message : raw;

    // ✅ Must have stable id (dedupe relies on it)
    const msgId = String(msg?.id || "");
    if (!msgId) return;

    const peerId = peerFromMsg(msg);
    if (!peerId) return;

    const isOutgoing = String(msg?.from) === String(myId);

    // ✅ If user is actively inside this chat, do NOTHING
    // (prevents chat list from fighting the open chat screen)
    if (activePeerRef.current === peerId) return;

    // ✅ DEDUPE: same message often arrives via multiple events
    const now = Date.now();
    const last = seenMsgIdsRef.current[msgId] || 0;

    // cleanup occasionally
    if (now - last > TTL_MS) {
      Object.keys(seenMsgIdsRef.current).forEach((k) => {
        if (now - (seenMsgIdsRef.current[k] || 0) > TTL_MS) delete seenMsgIdsRef.current[k];
      });
    }

    // if we've already processed this message id recently, ignore
    if (now - last < TTL_MS) return;

    // mark processed
    seenMsgIdsRef.current[msgId] = now;

    // ✅ ALWAYS update preview + sort order (incoming OR outgoing)
    setMatches((prev) => {
      const msgTime =
        new Date(msg?.time || msg?.createdAt || Date.now()).getTime() || Date.now();

      const next = prev.map((m) => {
        if (safeId(m) !== peerId) return m;

        return {
          ...m,
          lastMessage: msg,
          lastMessageTime: msgTime,
          _sortTime: msgTime,
        };
      });

      // sort by latest message time (received/sent)
      const sorted = [...next].sort((a: any, b: any) => {
        const at =
          a.lastMessageTime ||
          a.lastMessage?.time ||
          a.lastMessage?.createdAt ||
          a._sortTime ||
          a.updatedAt ||
          a.createdAt ||
          0;

        const bt =
          b.lastMessageTime ||
          b.lastMessage?.time ||
          b.lastMessage?.createdAt ||
          b._sortTime ||
          b.updatedAt ||
          b.createdAt ||
          0;

        return (new Date(bt).getTime() || 0) - (new Date(at).getTime() || 0);
      });

      // ✅ Web parity: move the peer to top and persist that order
      const persisted = reorderMatchesPersist(myId, sorted, peerId);

      // Keep filtered list in sync if you rely on it elsewhere
      setFiltered(persisted);

      return persisted;
    });

    // ✅ ONLY count unread for incoming (not your own messages)
    if (isOutgoing) return;

    // ✅ per-thread count
    setUnreadMap((prev) => {
      const next = { ...prev, [peerId]: (prev[peerId] || 0) + 1 };
      setJSONStore(UNREAD_MAP_KEY, next);
      return next;
    });

    // ✅ global total badge (bottom tab) — optimistic
    setUnreadTotal((prev) => {
      const nextTotal = (prev || 0) + 1;
      persistUnreadTotal(nextTotal);
      return nextTotal;
    });

    // ✅ reconcile to server truth (debounced)
    if (reconcileTimerRef.current) clearTimeout(reconcileTimerRef.current);
    reconcileTimerRef.current = setTimeout(() => {
      reconcileFromServer();
    }, 700);
  };

  const bumpReactionPreview = (raw: any) => {
    const payload = raw?.message ? raw.message : raw;

    const peerId = String(
      payload?.peerId ||
      payload?.from ||
      payload?.reactorId ||
      payload?.userId ||
      ""
    );

    if (!peerId) return;

    // ✅ If user is already inside this chat, do not fight the open chat UI.
    if (activePeerRef.current === peerId) return;

    const preview =
      typeof payload?.preview === "string" && payload.preview.trim()
        ? payload.preview.trim()
        : payload?.emoji
          ? `Reacted ${payload.emoji} to your message`
          : "Reacted to your message";

    const now = payload?.time || new Date().toISOString();

    setMatches((prev) => {
      const next = prev.map((m) => {
        if (safeId(m) !== peerId) return m;

        return {
          ...m,
          lastMessage: {
            id: String(payload?.id || `reaction-${peerId}-${Date.now()}`),
            from: peerId,
            to: myId,
            type: "reaction",
            preview,
            text: preview,
            time: now,
            createdAt: now,
          },
          lastMessageTime: now,
          _sortTime: now,
        };
      });

      const sorted = [...next].sort((a: any, b: any) => {
        const at =
          a.lastMessageTime ||
          a.lastMessage?.time ||
          a.lastMessage?.createdAt ||
          a._sortTime ||
          a.updatedAt ||
          a.createdAt ||
          0;

        const bt =
          b.lastMessageTime ||
          b.lastMessage?.time ||
          b.lastMessage?.createdAt ||
          b._sortTime ||
          b.updatedAt ||
          b.createdAt ||
          0;

        return (new Date(bt).getTime() || 0) - (new Date(at).getTime() || 0);
      });

      const persisted = reorderMatchesPersist(myId, sorted, peerId);
      setFiltered(persisted);

      return persisted;
    });

    // ✅ Treat incoming reactions like a lightweight chat-list notification.
    // This makes Kylie see Tom's reaction from the chat list without opening chat.
    setUnreadMap((prev) => {
      const next = { ...prev, [peerId]: (Number(prev?.[peerId] || 0) || 0) + 1 };
      setJSONStore(UNREAD_MAP_KEY, next);
      return next;
    });

    setUnreadTotal((prev) => {
      const nextTotal = (Number(prev || 0) || 0) + 1;
      persistUnreadTotal(nextTotal);
      return nextTotal;
    });
  };
  return { bumpUnread, bumpReactionPreview };
}

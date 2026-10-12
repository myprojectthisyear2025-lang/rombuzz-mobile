/** Session-owned inbox previews: sent and received events share the same peer row. */
import { getSessionGeneration, isSessionCurrent } from "@/src/features/auth/rbzSession";
import type { RefObject } from "react";
import { safeId } from "./chatListPresentation";
import type { ChatListState } from "./useChatListState";

type RealtimeMessageState = Pick<ChatListState,
  "myId" | "activePeerRef" | "setMatches" | "setFiltered">;
const idOf = (value: any) => String(value?.id || value?._id || value || "");
const timeOf = (row: any) => +new Date(row.lastMessageTime || row.lastMessage?.time ||
  row.lastMessage?.createdAt || row._sortTime || row.updatedAt || row.createdAt || 0) || 0;

export function createChatListRealtimeHandlers(
  { myId, setMatches, setFiltered }: RealtimeMessageState,
  seenMsgIdsRef: RefObject<Record<string, number>>,
) {
  const owner = getSessionGeneration();
  const peerFrom = (msg: any) => {
    const from = idOf(msg?.from || msg?.fromId || msg?.senderId || msg?.reactorId || msg?.userId);
    const to = idOf(msg?.to || msg?.toId || msg?.recipientId || msg?.receiverId);
    return from === myId ? to : from || idOf(msg?.peerId);
  };
  const apply = (peerId: string, msg: any) => {
    if (!peerId || peerId === myId || !isSessionCurrent(owner)) return;
    const time = +new Date(msg.time || msg.createdAt || Date.now()) || Date.now();
    setMatches(prev => {
      if (!isSessionCurrent(owner)) return prev;
      const next = prev.map(row => safeId(row) !== peerId || timeOf(row) > time ? row : {
        ...row, lastMessage: msg, lastMessageTime: time, _sortTime: time,
      }).sort((a, b) => timeOf(b) - timeOf(a));
      setFiltered(next);
      return next;
    });
  };
  const updateMessagePreview = (raw: any) => {
    if (!isSessionCurrent(owner)) return;
    const msg = raw?.message && typeof raw.message === "object" ? raw.message : raw;
    const id = idOf(msg?.id || msg?._id);
    const peer = peerFrom(msg);
    if (!id || !peer || peer === myId) return;
    const now = Date.now();
    if (seenMsgIdsRef.current[id] && now - seenMsgIdsRef.current[id] < 8000) return;
    for (const key of Object.keys(seenMsgIdsRef.current)) {
      if (now - seenMsgIdsRef.current[key] >= 8000) delete seenMsgIdsRef.current[key];
    }
    seenMsgIdsRef.current[id] = now;
    apply(peer, msg);
  };
  const bumpReactionPreview = (raw: any) => {
    const payload = raw?.message && typeof raw.message === "object" ? raw.message : raw;
    const peer = peerFrom(payload);
    const preview = (typeof payload?.preview === "string" && payload.preview.trim()) || (payload?.emoji
      ? "Reacted " + payload.emoji + " to your message" : "Reacted to your message");
    apply(peer, { ...payload, from: peer, to: myId, type: "reaction", text: preview, preview });
  };
  return { updateMessagePreview, bumpReactionPreview };
}

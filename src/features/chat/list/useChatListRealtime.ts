/**
 * Path: src/features/chat/list/useChatListRealtime.ts
 * Purpose: Socket registration, presence batching, previews, and matched-room membership.
 */

import { useEffect, useRef } from "react";
import { unstable_batchedUpdates } from "react-native";
import { getSocket } from "@/src/lib/socket";
import { makeRoomId, safeId } from "./chatListPresentation";
import { createChatListRealtimeHandlers } from "./chatListRealtimeHandlers";
import type { ChatListState } from "./useChatListState";

type RealtimeState = Pick<ChatListState,
  "user" | "myId" | "matches" | "activePeerRef" | "setMatches" |
  "setFiltered" | "setOnlineMap">;

export function useChatListRealtime(state: RealtimeState) {
  const { user, myId, matches, setOnlineMap } = state;
  // Deduplicate previews delivered by both message events.
  const seenMsgIdsRef = useRef<Record<string, number>>({}); // msgId -> timestamp(ms)
  const socketRef = useRef<any>(null);

  // ✅ Presence batching refs MUST be top-level (hooks rule)
  const presenceQueueRef = useRef<Record<string, boolean>>({});
  const presenceFlushRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    let s: any;
    let alive = true;

    const onConnect = () => {
      try {
        s.emit("register", myId);
      } catch { }

    };

    // ✅ Batch presence changes (debounced)
    const flushPresence = () => {
      const queued = presenceQueueRef.current;
      presenceQueueRef.current = {};

      unstable_batchedUpdates(() => {
        setOnlineMap((prev) => {
          const next = { ...prev };
          Object.keys(queued).forEach((uid) => {
            if (queued[uid]) next[String(uid)] = true;
            else delete next[String(uid)];
          });
          return next;
        });
      });
    };

    const queuePresence = (userId: any, online: boolean) => {
      if (!userId) return;
      presenceQueueRef.current[String(userId)] = online;

      if (presenceFlushRef.current) clearTimeout(presenceFlushRef.current);
      presenceFlushRef.current = setTimeout(flushPresence, 350); // ✅ debounce presence
    };

    const onOnline = ({ userId }: any) => queuePresence(userId, true);

    const onOffline = ({ userId }: any) => queuePresence(userId, false);

    const { updateMessagePreview, bumpReactionPreview } = createChatListRealtimeHandlers(
      state, seenMsgIdsRef,
    );
    (async () => {
      s = await getSocket();
      if (!alive) return;
      socketRef.current = s;

      s.emit("register", myId);

      s.on("connect", onConnect);
      s.on("presence:online", onOnline);
      s.on("presence:offline", onOffline);

      s.on("chat:message", updateMessagePreview);
      s.on("direct:message", updateMessagePreview);

      // ✅ Reaction preview updates chat list instantly when someone reacts.
      // This updates the row preview/order without creating fake DB messages.
      s.on("chat:reaction-preview", bumpReactionPreview);


    })();

    return () => {
      alive = false;
      if (!s) return;
      s.off("connect", onConnect);
      s.off("presence:online", onOnline);
      s.off("presence:offline", onOffline);
      s.off("chat:message", updateMessagePreview);
      s.off("direct:message", updateMessagePreview);
      s.off("chat:reaction-preview", bumpReactionPreview);
    };
  }, [user, myId]);

  // Join all rooms so room broadcasts reach chat list (message:edit/delete/react)
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !myId || !matches?.length) return;

    const roomIds = matches.map((m) => makeRoomId(myId, safeId(m)));
    roomIds.forEach((rid) => s.emit("joinRoom", rid));

    return () => {
      roomIds.forEach((rid) => s.emit("leaveRoom", rid));
    };
  }, [matches, myId]);
}

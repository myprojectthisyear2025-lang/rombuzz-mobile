/** One session-owned socket subscription updates previews and reconciles missed/edited/deleted rows. */
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { getSessionGeneration, isSessionCurrent } from "@/src/features/auth/rbzSession";
import { getSocket } from "@/src/lib/socket";
import { makeRoomId, safeId } from "./chatListPresentation";
import { createChatListRealtimeHandlers } from "./chatListRealtimeHandlers";
import type { ChatListState } from "./useChatListState";

type RealtimeState = Pick<ChatListState,
  "myId" | "matches" | "activePeerRef" | "setMatches" | "setFiltered" | "setOnlineMap" | "inboxEventRevisionRef">;

export function useChatListRealtime(state: RealtimeState, refresh: () => Promise<void>) {
  const latest = useRef({ state, refresh });
  latest.current = { state, refresh };
  const joinRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!state.myId) return;
    const owner = getSessionGeneration();
    let alive = true;
    let socket: Awaited<ReturnType<typeof getSocket>> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const rooms = new Set<string>();
    const valid = () => alive && isSessionCurrent(owner);
    const reconcile = () => {
      if (!valid() || AppState.currentState !== "active") return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        if (valid()) void latest.current.refresh();
      }, 120);
    };
    const join = () => {
      if (!valid() || !socket) return;
      for (const match of latest.current.state.matches) {
        const id = safeId(match);
        if (!id) continue;
        const room = makeRoomId(state.myId, id);
        if (!rooms.has(room)) { rooms.add(room); socket.emit("joinRoom", room); }
      }
    };
    joinRef.current = join;
    const handlers = createChatListRealtimeHandlers(state, { current: {} });
    const changed = () => { if (valid()) { state.inboxEventRevisionRef.current++; reconcile(); } };
    const message = (payload: any) => { if (valid()) { handlers.updateMessagePreview(payload); changed(); } };
    const reaction = (payload: any) => { if (valid()) { handlers.bumpReactionPreview(payload); changed(); } };
    const connect = () => { rooms.clear(); join(); changed(); };
    const online = ({ userId }: any) => { if (valid()) state.setOnlineMap(prev => ({ ...prev, [userId]: true })); };
    const offline = ({ userId }: any) => { if (valid()) state.setOnlineMap(prev => { const next = { ...prev }; delete next[userId]; return next; }); };
    const changes = ["message:edit", "chat:edit", "message:delete", "message:removed", "chat:ephemeral:expired", "match", "match:unmatched", "chat:inbox:update"];
    const app = AppState.addEventListener("change", value => { if (value === "active") changed(); });
    void getSocket().then(value => {
      if (!valid()) return;
      socket = value;
      socket.on("connect", connect);
      socket.on("chat:message", message);
      socket.on("direct:message", message);
      socket.on("message", message);
      socket.on("chat:reaction-preview", reaction);
      socket.on("presence:online", online);
      socket.on("presence:offline", offline);
      changes.forEach(event => socket!.on(event, changed));
      join();
    }).catch(() => {});
    return () => {
      alive = false;
      joinRef.current = () => {};
      if (timer) clearTimeout(timer);
      app.remove();
      socket?.off("connect", connect);
      socket?.off("chat:message", message);
      socket?.off("direct:message", message);
      socket?.off("message", message);
      socket?.off("chat:reaction-preview", reaction);
      socket?.off("presence:online", online);
      socket?.off("presence:offline", offline);
      changes.forEach(event => socket?.off(event, changed));
      rooms.forEach(room => socket?.emit("leaveRoom", room));
    };
  }, [state.myId]);
  useEffect(() => { joinRef.current(); }, [state.matches]);
}

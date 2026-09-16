import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/src/lib/socket";
import type { Msg } from "../../thread/chatTypes";
import { createChatMessageHandlers } from "./chatMessageHandlers";
import { createChatMetadataHandlers } from "./chatMetadataHandlers";
import {
  getLatestPeerMessageId,
  type SetChatMessages,
} from "./chatRealtimeHelpers";

type UseChatRealtimeArgs = {
  myId: string;
  peerId: string;
  roomId: string;
  messages: Msg[];
  loading: boolean;
  setMessages: SetChatMessages;
  settleToLatest: (animated?: boolean) => void;
};

export function useChatRealtime({
  myId,
  peerId,
  roomId,
  messages,
  loading,
  setMessages,
  settleToLatest,
}: UseChatRealtimeArgs) {
  const socketRef = useRef<any>(null);
  const [typing, setTyping] = useState(false);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const lastSeenEmitRef = useRef<string | null>(null);
  const latestRef = useRef({ messages, loading, settleToLatest });
  latestRef.current = { messages, loading, settleToLatest };

  const emitTyping = useCallback(
    (next: boolean) => {
      const socket = socketRef.current;
      if (!socket || !myId || !peerId) return;
      try {
        socket.emit("typing", { roomId, from: myId, to: peerId, typing: next });
      } catch {}
    },
    [myId, peerId, roomId],
  );

  const markSeen = useCallback(
    (msgId: string) => {
      const socket = socketRef.current;
      if (!socket || !msgId || !myId || !peerId) return;
      if (lastSeenEmitRef.current === msgId) return;
      lastSeenEmitRef.current = msgId;
      try {
        socket.emit("message:seen", { roomId, msgId, from: myId, to: peerId });
      } catch {}
    },
    [myId, peerId, roomId],
  );

  useEffect(() => {
    if (!myId || !peerId || !roomId) return;
    let alive = true;
    let socket: any;
    lastSeenEmitRef.current = null;
    setTyping(false);

    const followLatest = (animated?: boolean) =>
      latestRef.current.settleToLatest(animated);
    const messageHandlers = createChatMessageHandlers({
      peerId,
      roomId,
      setMessages,
      markSeen,
      settleToLatest: followLatest,
    });
    const metadataHandlers = createChatMetadataHandlers({
      myId,
      setMessages,
      settleToLatest: followLatest,
    });
    const onTyping = (payload: any) => {
      if (String(payload?.from) === String(peerId))
        setTyping(!!payload?.typing);
    };
    const listeners: [string, (payload: any) => void][] = [
      ["chat:message", messageHandlers.onIncoming],
      ["message", messageHandlers.onIncoming],
      ["message:edit", messageHandlers.onEdited],
      ["chat:edit", messageHandlers.onEdited],
      ["message:delete", messageHandlers.onDeleted],
      ["chat:delete", messageHandlers.onDeleted],
      ["message:react", messageHandlers.onReacted],
      ["chat:react", messageHandlers.onReacted],
      ["message:pin", metadataHandlers.onPinned],
      ["chat:pin", metadataHandlers.onPinned],
      ["message:seen", metadataHandlers.onSeen],
      ["chat:seen", metadataHandlers.onSeen],
      ["typing", onTyping],
      ["chat:ephemeral:expired", metadataHandlers.onEphemeralExpired],
      ["chat:gift:unlocked", metadataHandlers.onGiftMediaUnlocked],
    ];

    void (async () => {
      socket = await getSocket();
      if (!alive) return;
      socketRef.current = socket;
      try {
        socket.emit("user:register", myId);
      } catch {}
      try {
        socket.emit("joinRoom", roomId);
      } catch {}
      listeners.forEach(([event, handler]) => socket.on(event, handler));

      // Loading can finish before the shared socket is ready.
      if (!latestRef.current.loading) {
        const latestId = getLatestPeerMessageId(
          latestRef.current.messages,
          peerId,
        );
        if (latestId) markSeen(latestId);
      }
    })().catch((error) => {
      if (alive) console.log("Chat socket setup failed", error);
    });

    return () => {
      alive = false;
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
      typingStopRef.current = null;
      if (socket && isTypingRef.current) {
        try {
          socket.emit("typing", {
            roomId,
            from: myId,
            to: peerId,
            typing: false,
          });
        } catch {}
      }
      isTypingRef.current = false;
      if (socketRef.current === socket) socketRef.current = null;
      if (!socket) return;
      try {
        socket.emit("leaveRoom", roomId);
      } catch {}
      listeners.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [myId, peerId, roomId, setMessages, markSeen]);

  useEffect(() => {
    if (!myId || !peerId || loading || !messages.length) return;
    const latestId = getLatestPeerMessageId(messages, peerId);
    if (latestId) markSeen(latestId);
  }, [loading, messages, myId, peerId, markSeen]);

  return {
    socketRef,
    typing,
    setTyping,
    emitTyping,
    markSeen,
    isTypingRef,
    typingStopRef,
  };
}

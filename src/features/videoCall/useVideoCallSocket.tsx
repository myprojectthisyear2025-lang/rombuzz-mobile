/**
 * ============================================================
 * 📁 File: src/features/videoCall/useVideoCallSocket.ts
 * 🎥 Purpose: Socket listener hook for RomBuzz video call events.
 *
 * Used by:
 *   - src/features/videoCall/IncomingCallOverlay.tsx
 *   - later: app/video-call/[callId].tsx if needed
 *
 * Socket events from backend:
 *   video-call:incoming
 *   video-call:ringing
 *   video-call:accepted
 *   video-call:declined
 *   video-call:canceled
 *   video-call:ended
 *   video-call:missed
 * ============================================================
 */

import { useEffect } from "react";

import { getSocket } from "@/src/lib/socket";
import type {
  IncomingVideoCallEvent,
  VideoCallSocketEvent,
} from "@/src/features/videoCall/videoCallTypes";

type VideoCallSocketHandlers = {
  onIncoming?: (payload: IncomingVideoCallEvent) => void;
  onRinging?: (payload: VideoCallSocketEvent) => void;
  onAccepted?: (payload: VideoCallSocketEvent) => void;
  onDeclined?: (payload: VideoCallSocketEvent) => void;
  onCanceled?: (payload: VideoCallSocketEvent) => void;
  onEnded?: (payload: VideoCallSocketEvent) => void;
  onMissed?: (payload: VideoCallSocketEvent) => void;
};

function safeCallPayload(payload: any) {
  if (!payload?.call?.id) return null;
  return payload;
}

export function useVideoCallSocket(handlers: VideoCallSocketHandlers) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) handlers.onIncoming?.(safe);
    };

    const onRinging = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) handlers.onRinging?.(safe);
    };

    const onAccepted = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) handlers.onAccepted?.(safe);
    };

    const onDeclined = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) handlers.onDeclined?.(safe);
    };

    const onCanceled = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) handlers.onCanceled?.(safe);
    };

    const onEnded = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) handlers.onEnded?.(safe);
    };

    const onMissed = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) handlers.onMissed?.(safe);
    };

    socket.on("video-call:incoming", onIncoming);
    socket.on("video-call:ringing", onRinging);
    socket.on("video-call:accepted", onAccepted);
    socket.on("video-call:declined", onDeclined);
    socket.on("video-call:canceled", onCanceled);
    socket.on("video-call:ended", onEnded);
    socket.on("video-call:missed", onMissed);

    return () => {
      socket.off("video-call:incoming", onIncoming);
      socket.off("video-call:ringing", onRinging);
      socket.off("video-call:accepted", onAccepted);
      socket.off("video-call:declined", onDeclined);
      socket.off("video-call:canceled", onCanceled);
      socket.off("video-call:ended", onEnded);
      socket.off("video-call:missed", onMissed);
    };
  }, [handlers]);
}
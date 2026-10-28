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

import { useEffect, useRef } from "react";
import { DeviceEventEmitter } from "react-native";

import type {
  IncomingVideoCallEvent,
  VideoCallSocketEvent,
} from "@/src/features/videoCall/videoCallTypes";
import { getSocket } from "@/src/lib/socket";

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
  const latest = useRef(handlers);
  latest.current = handlers;
  useEffect(() => {
    let mounted = true;
    let socketRef: any = null;

    const onIncoming = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) latest.current.onIncoming?.(safe);
    };

    const onRinging = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) latest.current.onRinging?.(safe);
    };

    const onAccepted = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) latest.current.onAccepted?.(safe);
    };

    const onDeclined = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) latest.current.onDeclined?.(safe);
    };

    const onCanceled = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) latest.current.onCanceled?.(safe);
    };

    const onEnded = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) latest.current.onEnded?.(safe);
    };

    const onMissed = (payload: any) => {
      const safe = safeCallPayload(payload);
      if (safe) latest.current.onMissed?.(safe);
    };

    const localExpiry = DeviceEventEmitter.addListener(
      "rbz:video-call:expired",
      onMissed,
    );

    (async () => {
      const socket = await getSocket();
      if (!mounted || !socket) return;

      socketRef = socket;

      socket.on("video-call:incoming", onIncoming);
      socket.on("video-call:ringing", onRinging);
      socket.on("video-call:accepted", onAccepted);
      socket.on("video-call:declined", onDeclined);
      socket.on("video-call:canceled", onCanceled);
      socket.on("video-call:ended", onEnded);
      socket.on("video-call:missed", onMissed);
    })().catch(() => {});

    return () => {
      mounted = false;
      localExpiry.remove();

      if (!socketRef) return;

      socketRef.off("video-call:incoming", onIncoming);
      socketRef.off("video-call:ringing", onRinging);
      socketRef.off("video-call:accepted", onAccepted);
      socketRef.off("video-call:declined", onDeclined);
      socketRef.off("video-call:canceled", onCanceled);
      socketRef.off("video-call:ended", onEnded);
      socketRef.off("video-call:missed", onMissed);
    };
  }, []);
}
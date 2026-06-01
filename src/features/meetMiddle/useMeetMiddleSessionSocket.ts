// src/features/meetMiddle/useMeetMiddleSessionSocket.ts
//
// RomBuzz Meet in the Middle session socket hook.
//
// Purpose:
// - Listens to new meetMiddle:* socket events for one session.
// - Keeps socket logic out of app/meet-middle/[peerId].tsx.
// - Does NOT use old meet:* legacy events.
// - Does NOT render UI.
// - Used by the Meet screen coordinator to move between stages.

import { useEffect } from "react";

import { getSocket } from "@/src/lib/socket";
import type { MeetMiddleSession } from "./meetMiddleTypes";

type MeetMiddleSessionSocketHandlers = {
  onAccepted?: (payload: any) => void;
  onLocationWaiting?: (payload: any) => void;
  onLocationPeerShared?: (payload: any) => void;
  onSuggestionsReady?: (payload: any) => void;
  onPlaceSelected?: (payload: any) => void;
  onPlaceConfirmationNeeded?: (payload: any) => void;
  onFinalConfirmed?: (payload: any) => void;
  onPlaceRejected?: (payload: any) => void;
  onError?: (payload: any) => void;
};

function getSessionFromPayload(payload: any): MeetMiddleSession | null {
  return payload?.session || payload?.data?.session || null;
}

function getSessionIdFromPayload(payload: any) {
  const session = getSessionFromPayload(payload);

  return String(
    payload?.sessionId ||
      payload?.data?.sessionId ||
      session?.sessionId ||
      session?.id ||
      session?._id ||
      ""
  ).trim();
}

export function useMeetMiddleSessionSocket(
  sessionId: string,
  handlers: MeetMiddleSessionSocketHandlers
) {
  useEffect(() => {
    const cleanSessionId = String(sessionId || "").trim();
    if (!cleanSessionId) return;

    let alive = true;
    let socket: any = null;

    const matchesSession = (payload: any) => {
      const eventSessionId = getSessionIdFromPayload(payload);
      return !!eventSessionId && eventSessionId === cleanSessionId;
    };

    const safelyRun = (
      payload: any,
      handler?: (payload: any) => void
    ) => {
      if (!alive || !matchesSession(payload) || !handler) return;

      try {
        handler(payload);
      } catch {}
    };

    const onAccepted = (payload: any) => safelyRun(payload, handlers.onAccepted);
    const onLocationWaiting = (payload: any) =>
      safelyRun(payload, handlers.onLocationWaiting);
     const onLocationPeerShared = (payload: any) =>
      safelyRun(payload, handlers.onLocationPeerShared);
    const onSuggestionsReady = (payload: any) =>
      safelyRun(payload, handlers.onSuggestionsReady);
    const onPlaceSelected = (payload: any) =>
      safelyRun(payload, handlers.onPlaceSelected);
    const onPlaceConfirmationNeeded = (payload: any) =>
      safelyRun(payload, handlers.onPlaceConfirmationNeeded);
    const onFinalConfirmed = (payload: any) =>
      safelyRun(payload, handlers.onFinalConfirmed);
    const onPlaceRejected = (payload: any) =>
      safelyRun(payload, handlers.onPlaceRejected);
    const onError = (payload: any) => safelyRun(payload, handlers.onError);

    (async () => {
      try {
        socket = await getSocket();
        if (!alive || !socket) return;

        socket.on("meetMiddle:accepted", onAccepted);
        socket.on("meetMiddle:location:waiting", onLocationWaiting);
        socket.on("meetMiddle:location:peer-shared", onLocationPeerShared);
        socket.on("meetMiddle:suggestions:ready", onSuggestionsReady);
        socket.on("meetMiddle:place:selected", onPlaceSelected);
        socket.on("meetMiddle:place:confirmation-needed", onPlaceConfirmationNeeded);
        socket.on("meetMiddle:final-confirmed", onFinalConfirmed);
        socket.on("meetMiddle:place:rejected", onPlaceRejected);
        socket.on("meetMiddle:error", onError);
      } catch {}
    })();

    return () => {
      alive = false;

      if (!socket) return;

          socket.off("meetMiddle:accepted", onAccepted);
      socket.off("meetMiddle:location:waiting", onLocationWaiting);
      socket.off("meetMiddle:location:peer-shared", onLocationPeerShared);
      socket.off("meetMiddle:suggestions:ready", onSuggestionsReady);
      socket.off("meetMiddle:place:selected", onPlaceSelected);
      socket.off("meetMiddle:place:confirmation-needed", onPlaceConfirmationNeeded);
      socket.off("meetMiddle:final-confirmed", onFinalConfirmed);
      socket.off("meetMiddle:place:rejected", onPlaceRejected);
      socket.off("meetMiddle:error", onError);
    };
  }, [
    sessionId,
    handlers.onAccepted,
    handlers.onLocationWaiting,
    handlers.onLocationPeerShared,
    handlers.onSuggestionsReady,
    handlers.onPlaceSelected,
    handlers.onPlaceConfirmationNeeded,
    handlers.onFinalConfirmed,
    handlers.onPlaceRejected,
    handlers.onError,
  ]);
}

export function extractMeetMiddleSocketSession(payload: any): MeetMiddleSession | null {
  return getSessionFromPayload(payload);
}
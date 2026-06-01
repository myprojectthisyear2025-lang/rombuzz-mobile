// src/features/meetMiddle/useMeetMiddleLocationShare.ts
//
// RomBuzz Meet in the Middle location sharing hook.
//
// Purpose:
// - Owns Expo location permission + GPS lookup.
// - Sends exact coordinates only to the backend.
// - Keeps app/meet-middle/[peerId].tsx as a coordinator.
// - Does NOT expose peer exact GPS.
// - Does NOT render map UI.
// - Uses backend privacy-safe response only.

import { useCallback, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";

import { shareMeetMiddleLocation } from "./meetMiddleApi";
import type {
  MeetMiddleSession,
  ShareLocationResponse,
} from "./meetMiddleTypes";

type LocationShareState =
  | "idle"
  | "requesting_permission"
  | "locating"
  | "sharing"
  | "peer_shared"
  | "waiting_peer"
  | "suggestions_ready"
  | "error";

function extractSession(response: ShareLocationResponse): MeetMiddleSession | null {
  return response?.session || response?.data?.session || null;
}

function normalizeSessionStatus(session: MeetMiddleSession | null) {
  return String(session?.status || "").trim().toLowerCase();
}

function isSuggestionsStatus(status: string) {
  return (
    status === "suggested" ||
    status === "suggestions_ready" ||
    status === "suggestions-ready" ||
    status === "ready"
  );
}

export function useMeetMiddleLocationShare(sessionId: string) {
  const [state, setState] = useState<LocationShareState>("idle");
  const [error, setError] = useState("");
  const [session, setSession] = useState<MeetMiddleSession | null>(null);
  const [rawResponse, setRawResponse] = useState<ShareLocationResponse | null>(null);
  const sharingInFlightRef = useRef(false);

  const cleanSessionId = String(sessionId || "").trim();

  const loading =
    state === "requesting_permission" ||
    state === "locating" ||
    state === "sharing";

   const hasShared =
    state === "waiting_peer" ||
    state === "suggestions_ready";

  const peerShared = state === "peer_shared";
  const waitingForPeer = state === "waiting_peer";
  const suggestionsReady = state === "suggestions_ready";

  const canShare = useMemo(() => {
    return !!cleanSessionId && !loading && !suggestionsReady;
  }, [cleanSessionId, loading, suggestionsReady]);

   const shareLocation = useCallback(async () => {
    if (!cleanSessionId || loading || sharingInFlightRef.current) return null;

    sharingInFlightRef.current = true;
    setError("");
    setState("requesting_permission");

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        throw new Error(
          "Location permission is required to find a private midpoint."
        );
      }

      setState("locating");

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = Number(position?.coords?.latitude);
      const lng = Number(position?.coords?.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Could not read your current location.");
      }

      setState("sharing");

      const response = await shareMeetMiddleLocation(cleanSessionId, {
        lat,
        lng,
      });

       const nextSession = extractSession(response);
      const nextStatus = normalizeSessionStatus(nextSession);

      if (nextSession) {
        setSession(nextSession);
      }

      setRawResponse(response);

      if (isSuggestionsStatus(nextStatus)) {
        setState("suggestions_ready");
      } else {
        setState("waiting_peer");
      }

      return {
        response,
        session: nextSession,
      };
    } catch (err: any) {
      const message =
        err?.message ||
        "Could not share your location. Please try again.";

      setError(message);
      setState("error");

      return null;
    } finally {
      sharingInFlightRef.current = false;
    }
  }, [cleanSessionId, loading]);

  const markWaitingForPeer = useCallback((nextSession?: MeetMiddleSession | null) => {
    if (nextSession) setSession(nextSession);
    setState("waiting_peer");
    setError("");
  }, []);

  const markPeerSharedLocation = useCallback((nextSession?: MeetMiddleSession | null) => {
    if (nextSession) setSession(nextSession);
    setState("peer_shared");
    setError("");
  }, []);

  const markSuggestionsReady = useCallback((
    nextSession?: MeetMiddleSession | null,
    nextRawResponse?: ShareLocationResponse | any
  ) => {
    const responseSession = nextRawResponse ? extractSession(nextRawResponse) : null;

    if (responseSession) {
      setSession(responseSession);
    } else if (nextSession) {
      setSession(nextSession);
    }

    if (nextRawResponse) {
      setRawResponse(nextRawResponse);
    }

    setState("suggestions_ready");
    setError("");
  }, []);

  const reset = useCallback(() => {
    sharingInFlightRef.current = false;
    setState("idle");
    setError("");
    setSession(null);
    setRawResponse(null);
  }, []);

   return {
    state,
    loading,
    error,
    session,
    rawResponse,
    hasShared,
    peerShared,
    waitingForPeer,
    suggestionsReady,
    canShare,
    shareLocation,
    markWaitingForPeer,
    markPeerSharedLocation,
    markSuggestionsReady,
    reset,
  };
}
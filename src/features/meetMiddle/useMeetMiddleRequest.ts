// src/features/meetMiddle/useMeetMiddleRequest.ts
//
// RomBuzz Meet in the Middle request hook.
//
// Purpose:
// - Owns request button loading/success/error state.
// - Calls POST /api/meet-middle/request through meetMiddleApi.ts.
// - Keeps app/meet-middle/[peerId].tsx clean.
// - Does NOT request location yet.
// - Does NOT connect sockets yet.
// - Does NOT open map yet.

import { useCallback, useMemo, useState } from "react";
import { requestMeetMiddle } from "./meetMiddleApi";
import type {
  MeetMiddleRequestState,
  MeetMiddleSession,
  RequestMeetMiddleResponse,
} from "./meetMiddleTypes";

function extractSession(response: RequestMeetMiddleResponse): MeetMiddleSession | null {
  const directSession = response?.session;
  const nestedSession = response?.data?.session;

  return directSession || nestedSession || null;
}

export function useMeetMiddleRequest(peerId: string) {
  const [state, setState] = useState<MeetMiddleRequestState>("idle");
  const [error, setError] = useState("");
  const [session, setSession] = useState<MeetMiddleSession | null>(null);

  const loading = state === "loading";
  const sent = state === "sent";

  const canStart = useMemo(() => {
    return !!String(peerId || "").trim() && !loading;
  }, [peerId, loading]);

  const startRequest = useCallback(async () => {
    const cleanPeerId = String(peerId || "").trim();

    if (!cleanPeerId || loading) return null;

    setState("loading");
    setError("");

    try {
      const response = await requestMeetMiddle(cleanPeerId);
      const nextSession = extractSession(response);

      setSession(nextSession);
      setState("sent");

      return {
        response,
        session: nextSession,
      };
    } catch (err: any) {
      const message =
        err?.message ||
        "Could not start Meet in the Middle. Please try again.";

      setError(message);
      setState("error");

      return null;
    }
  }, [peerId, loading]);

  const resetRequest = useCallback(() => {
    setState("idle");
    setError("");
    setSession(null);
  }, []);

  return {
    state,
    loading,
    sent,
    error,
    session,
    canStart,
    startRequest,
    resetRequest,
  };
}
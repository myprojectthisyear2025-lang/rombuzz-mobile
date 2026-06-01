// src/features/meetMiddle/useMeetMiddleSessionResume.ts
//
// RomBuzz Meet in the Middle session resume hook.
//
// Purpose:
// - Loads an existing Meet in the Middle session by sessionId.
// - Converts backend session status into the screen stage.
// - Keeps resume/loading/error logic out of app/meet-middle/[peerId].tsx.
// - Uses only privacy-safe serialized session data from backend.

import { useEffect, useMemo, useState } from "react";

import { getMeetMiddleSession } from "@/src/features/meetMiddle/meetMiddleApi";
import type {
  MeetMiddleApiResponse,
  MeetMiddlePlace,
  MeetMiddleSession,
} from "@/src/features/meetMiddle/meetMiddleTypes";

export type MeetMiddleResumeStage =
  | "intro"
  | "request-sent"
  | "location-consent"
  | "waiting-peer"
  | "suggestions-ready"
  | "map-stage"
  | "place-selected"
  | "place-confirmation"
  | "final-confirmed";

type ResumeSnapshot = {
  stage: MeetMiddleResumeStage;
  session: MeetMiddleSession | null;
  selectedPlace: MeetMiddlePlace | null;
  pendingConfirmPlace: MeetMiddlePlace | null;
  finalMeetPlace: MeetMiddlePlace | null;
  viewerId: string;
};

function getResponseSession(payload: any): MeetMiddleSession | null {
  return (
    payload?.session ||
    payload?.data?.session ||
    payload?.meetMiddleSession ||
    payload?.data?.meetMiddleSession ||
    null
  );
}

function getViewerId(payload: any) {
  return String(
    payload?.viewerId ||
      payload?.data?.viewerId ||
      payload?.meId ||
      payload?.data?.meId ||
      ""
  ).trim();
}

function getSelectedPlace(session?: MeetMiddleSession | null): MeetMiddlePlace | null {
  return ((session as any)?.selectedPlace || null) as MeetMiddlePlace | null;
}

function hasSuggestions(session?: MeetMiddleSession | null) {
  const places = Array.isArray(session?.places) ? session?.places : [];
  const suggestions = Array.isArray(session?.suggestions) ? session?.suggestions : [];

  return (
    places.length > 0 ||
    suggestions.length > 0 ||
    !!session?.midpoint ||
    !!session?.midpointPlace
  );
}

function deriveResumeSnapshot(
  payload: MeetMiddleApiResponse<any> | null
): ResumeSnapshot {
  const session = getResponseSession(payload);
  const viewerId = getViewerId(payload);
  const status = String(session?.status || "").trim().toLowerCase();
  const selectedPlace = getSelectedPlace(session);
  const selectedBy = String((session as any)?.selectedBy || "").trim();

  if (!session) {
    return {
      stage: "intro",
      session: null,
      selectedPlace: null,
      pendingConfirmPlace: null,
      finalMeetPlace: null,
      viewerId,
    };
  }

  if (status === "requested") {
    const requestedBy = String((session as any)?.requestedBy || "").trim();

    return {
      stage: requestedBy && viewerId && requestedBy === viewerId
        ? "request-sent"
        : "location-consent",
      session,
      selectedPlace: null,
      pendingConfirmPlace: null,
      finalMeetPlace: null,
      viewerId,
    };
  }

  if (status === "accepted") {
    return {
      stage: "location-consent",
      session,
      selectedPlace: null,
      pendingConfirmPlace: null,
      finalMeetPlace: null,
      viewerId,
    };
  }

  if (status === "locating") {
    return {
      stage: "waiting-peer",
      session,
      selectedPlace: null,
      pendingConfirmPlace: null,
      finalMeetPlace: null,
      viewerId,
    };
  }

  if (status === "suggested" || status === "place_rejected") {
    return {
      stage: hasSuggestions(session) ? "suggestions-ready" : "location-consent",
      session,
      selectedPlace: null,
      pendingConfirmPlace: null,
      finalMeetPlace: null,
      viewerId,
    };
  }

  if (status === "place_pending") {
    const viewerSelectedThisPlace =
      !!viewerId && !!selectedBy && selectedBy === viewerId;

    return {
      stage: viewerSelectedThisPlace ? "place-selected" : "place-confirmation",
      session,
      selectedPlace: viewerSelectedThisPlace ? selectedPlace : null,
      pendingConfirmPlace: viewerSelectedThisPlace ? null : selectedPlace,
      finalMeetPlace: null,
      viewerId,
    };
  }

  if (status === "confirmed" || status === "completed") {
    return {
      stage: "final-confirmed",
      session,
      selectedPlace: null,
      pendingConfirmPlace: null,
      finalMeetPlace: selectedPlace,
      viewerId,
    };
  }

  return {
    stage: "intro",
    session,
    selectedPlace: null,
    pendingConfirmPlace: null,
    finalMeetPlace: null,
    viewerId,
  };
}

export function useMeetMiddleSessionResume(sessionId: string) {
  const cleanSessionId = String(sessionId || "").trim();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<MeetMiddleApiResponse<any> | null>(null);

  useEffect(() => {
    let alive = true;

    if (!cleanSessionId) {
      setResponse(null);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    getMeetMiddleSession(cleanSessionId)
      .then((nextResponse) => {
        if (!alive) return;
        setResponse(nextResponse);
      })
      .catch((err: any) => {
        if (!alive) return;
        setError(
          err?.message ||
            "Could not resume this Meet in the Middle session."
        );
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cleanSessionId]);

  const snapshot = useMemo(() => {
    return deriveResumeSnapshot(response);
  }, [response]);

  return {
    loading,
    error,
    response,
    ...snapshot,
  };
}
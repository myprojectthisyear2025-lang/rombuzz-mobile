// src/features/meetMiddle/meetMiddleApi.ts
//
// RomBuzz Meet in the Middle API helper.
//
// Purpose:
// - Centralizes protected HTTP calls for the Meet in the Middle feature.
// - Keeps auth/token/fetch/error handling out of app/meet-middle/[peerId].tsx.
// - Never exposes Geoapify keys. Geoapify stays backend-only.
// - Uses the new backend route base: /api/meet-middle.
// - Does NOT use old legacy /meet or meet:* backend routes.

import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/src/config/api";
import type {
  MeetMiddleApiResponse,
  MeetMiddleCoords,
  MeetMiddlePlace,
  PlaceActionResponse,
  RequestMeetMiddleResponse,
  ShareLocationResponse,
} from "./meetMiddleTypes";

const MEET_MIDDLE_BASE = `${API_BASE}/meet-middle`;

async function getAuthToken() {
  const token = await SecureStore.getItemAsync("RBZ_TOKEN");

  if (!token) {
    throw new Error("Login required. Please sign in again.");
  }

  return token;
}

async function meetMiddleFetch<T = any>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: any;
  } = {}
): Promise<T> {
  const token = await getAuthToken();

  const res = await fetch(`${MEET_MIDDLE_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      json?.error ||
      json?.message ||
      `Meet in the Middle request failed (${res.status}).`;

    throw new Error(message);
  }

  return json as T;
}

export async function requestMeetMiddle(
  to: string
): Promise<RequestMeetMiddleResponse> {
  const peerId = String(to || "").trim();

  if (!peerId) {
    throw new Error("Missing matched user.");
  }

  return meetMiddleFetch<RequestMeetMiddleResponse>("/request", {
    method: "POST",
    body: {
      to: peerId,
    },
  });
}

export async function shareMeetMiddleLocation(
  sessionId: string,
  coords: MeetMiddleCoords
): Promise<ShareLocationResponse> {
  const cleanSessionId = String(sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing meet session.");
  }

  const lat = Number(coords?.lat);
  const lng = Number(coords?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid location coordinates.");
  }

  return meetMiddleFetch<ShareLocationResponse>(`/${cleanSessionId}/location`, {
    method: "POST",
    body: {
      coords: {
        lat,
        lng,
      },
    },
  });
}

export async function getMeetMiddleSession(
  sessionId: string
): Promise<MeetMiddleApiResponse<{ viewerId?: string }>> {
  const cleanSessionId = String(sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing meet session.");
  }

  return meetMiddleFetch<MeetMiddleApiResponse<{ viewerId?: string }>>(
    `/${cleanSessionId}`,
    {
      method: "GET",
    }
  );
}

export async function declineMeetMiddle(
  sessionId: string,
  reason = "declined"
): Promise<MeetMiddleApiResponse> {
  const cleanSessionId = String(sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing meet session.");
  }

  return meetMiddleFetch<MeetMiddleApiResponse>(`/${cleanSessionId}/decline`, {
    method: "POST",
    body: {
      reason,
    },
  });
}

export async function selectMeetMiddlePlace(
  sessionId: string,
  place: MeetMiddlePlace
): Promise<PlaceActionResponse> {
  const cleanSessionId = String(sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing meet session.");
  }

  if (!place || !String(place.name || "").trim()) {
    throw new Error("Missing selected place.");
  }

  return meetMiddleFetch<PlaceActionResponse>(`/${cleanSessionId}/place/select`, {
    method: "POST",
    body: {
      place,
    },
  });
}

export async function acceptMeetMiddlePlace(
  sessionId: string
): Promise<PlaceActionResponse> {
  const cleanSessionId = String(sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing meet session.");
  }

  return meetMiddleFetch<PlaceActionResponse>(`/${cleanSessionId}/place/accept`, {
    method: "POST",
  });
}

export async function rejectMeetMiddlePlace(
  sessionId: string
): Promise<PlaceActionResponse> {
  const cleanSessionId = String(sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing meet session.");
  }

  return meetMiddleFetch<PlaceActionResponse>(`/${cleanSessionId}/place/reject`, {
    method: "POST",
  });
}

export async function cancelMeetMiddle(
  sessionId: string
): Promise<MeetMiddleApiResponse> {
  const cleanSessionId = String(sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing meet session.");
  }

  return meetMiddleFetch<MeetMiddleApiResponse>(`/${cleanSessionId}/cancel`, {
    method: "POST",
  });
}

export async function completeMeetMiddle(
  sessionId: string
): Promise<MeetMiddleApiResponse> {
  const cleanSessionId = String(sessionId || "").trim();

  if (!cleanSessionId) {
    throw new Error("Missing meet session.");
  }

  return meetMiddleFetch<MeetMiddleApiResponse>(`/${cleanSessionId}/complete`, {
    method: "POST",
  });
}
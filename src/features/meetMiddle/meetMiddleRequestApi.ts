// src/features/meetMiddle/meetMiddleRequestApi.ts
//
// RomBuzz Meet in the Middle request API helper.
//
// Purpose:
// - Keep Meet in the Middle accept/reject/cancel HTTP calls out of app/_layout.tsx.
// - Used by global incoming Meet overlay.
// - Uses RBZ_TOKEN from SecureStore.
// - Does not request location.
// - Does not open map.
// - Does not touch chat thread rendering.

import * as SecureStore from "expo-secure-store";

import { API_BASE } from "@/src/config/api";

export type MeetMiddleAction = "accept" | "decline" | "cancel";

export async function postMeetMiddleRequestAction(
  sessionId: string,
  action: MeetMiddleAction
) {
  const safeSessionId = String(sessionId || "").trim();

  if (!safeSessionId) {
    throw new Error("Meet request is missing session id.");
  }

  const token = await SecureStore.getItemAsync("RBZ_TOKEN");

  if (!token) {
    throw new Error("Please log in again.");
  }

  const endpoint =
    action === "accept"
      ? `${API_BASE}/meet-middle/${safeSessionId}/accept`
      : action === "decline"
        ? `${API_BASE}/meet-middle/${safeSessionId}/decline`
        : `${API_BASE}/meet-middle/${safeSessionId}/cancel`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: action === "decline" ? JSON.stringify({ reason: "rejected" }) : "{}",
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || "Could not update this Meet in the Middle request.");
  }

  return json;
}
/**
 * ============================================================
 * 📁 File: src/features/videoCall/videoCallApi.ts
 * 🎥 Purpose: API helper for RomBuzz 1-to-1 video call routes.
 *
 * Used by:
 *   - src/features/videoCall/IncomingCallOverlay.tsx
 *   - app/video-call/[callId].tsx
 *   - later: app/chat/[peerId].tsx
 *
 * Backend endpoints:
 *   POST /api/video-calls/start
 *   GET  /api/video-calls/active
 *   GET  /api/video-calls/:callId
 *   POST /api/video-calls/:callId/token
 *   POST /api/video-calls/:callId/accept
 *   POST /api/video-calls/:callId/decline
 *   POST /api/video-calls/:callId/cancel
 *   POST /api/video-calls/:callId/end
 * ============================================================
 */

import * as SecureStore from "expo-secure-store";

import { API_BASE } from "@/src/config/api";
import type {
  VideoCallApiResponse,
  VideoCallPayload,
  VideoCallSession,
} from "@/src/features/videoCall/videoCallTypes";

async function getAuthToken() {
  const token = (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";
  if (!token) {
    throw new Error("Missing login token");
  }
  return token;
}

async function readJsonSafe(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function videoCallFetch<T = any>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: any;
  } = {}
): Promise<T> {
  const token = await getAuthToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await readJsonSafe(res);

  if (!res.ok) {
    const message =
      json?.message ||
      json?.error ||
      `Video call request failed with ${res.status}`;

    const err: any = new Error(message);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json as T;
}

export async function startVideoCall(peerId: string): Promise<VideoCallPayload> {
  const peer = String(peerId || "").trim();

  if (!peer) {
    throw new Error("Missing peer id");
  }

  const json = await videoCallFetch<VideoCallApiResponse>("/video-calls/start", {
    method: "POST",
    body: { peerId: peer },
  });

  if (!json?.call) {
    throw new Error("Call was not created");
  }

  return {
    call: json.call,
    token: json.token,
  };
}

export async function getActiveVideoCall(): Promise<VideoCallSession | null> {
  const json = await videoCallFetch<VideoCallApiResponse>("/video-calls/active");
  return json?.call || null;
}

export async function getVideoCall(callId: string): Promise<VideoCallSession> {
  const safeCallId = String(callId || "").trim();

  if (!safeCallId) {
    throw new Error("Missing call id");
  }

  const json = await videoCallFetch<VideoCallApiResponse>(
    `/video-calls/${encodeURIComponent(safeCallId)}`
  );

  if (!json?.call) {
    throw new Error("Call not found");
  }

  return json.call;
}

export async function getVideoCallToken(
  callId: string
): Promise<VideoCallPayload> {
  const safeCallId = String(callId || "").trim();

  if (!safeCallId) {
    throw new Error("Missing call id");
  }

  const json = await videoCallFetch<VideoCallApiResponse>(
    `/video-calls/${encodeURIComponent(safeCallId)}/token`,
    {
      method: "POST",
    }
  );

  if (!json?.call || !json?.token) {
    throw new Error("Call token not returned");
  }

  return {
    call: json.call,
    token: json.token,
  };
}

export async function acceptVideoCall(
  callId: string
): Promise<VideoCallPayload> {
  const safeCallId = String(callId || "").trim();

  if (!safeCallId) {
    throw new Error("Missing call id");
  }

  const json = await videoCallFetch<VideoCallApiResponse>(
    `/video-calls/${encodeURIComponent(safeCallId)}/accept`,
    {
      method: "POST",
    }
  );

  if (!json?.call || !json?.token) {
    throw new Error("Call accept token not returned");
  }

  return {
    call: json.call,
    token: json.token,
  };
}

export async function declineVideoCall(
  callId: string
): Promise<VideoCallSession> {
  const safeCallId = String(callId || "").trim();

  if (!safeCallId) {
    throw new Error("Missing call id");
  }

  const json = await videoCallFetch<VideoCallApiResponse>(
    `/video-calls/${encodeURIComponent(safeCallId)}/decline`,
    {
      method: "POST",
    }
  );

  if (!json?.call) {
    throw new Error("Call decline failed");
  }

  return json.call;
}

export async function cancelVideoCall(
  callId: string
): Promise<VideoCallSession> {
  const safeCallId = String(callId || "").trim();

  if (!safeCallId) {
    throw new Error("Missing call id");
  }

  const json = await videoCallFetch<VideoCallApiResponse>(
    `/video-calls/${encodeURIComponent(safeCallId)}/cancel`,
    {
      method: "POST",
    }
  );

  if (!json?.call) {
    throw new Error("Call cancel failed");
  }

  return json.call;
}

export async function endVideoCall(
  callId: string,
  reason = "ended"
): Promise<VideoCallSession> {
  const safeCallId = String(callId || "").trim();

  if (!safeCallId) {
    throw new Error("Missing call id");
  }

  const json = await videoCallFetch<VideoCallApiResponse>(
    `/video-calls/${encodeURIComponent(safeCallId)}/end`,
    {
      method: "POST",
      body: { reason },
    }
  );

  if (!json?.call) {
    throw new Error("Call end failed");
  }

  return json.call;
}
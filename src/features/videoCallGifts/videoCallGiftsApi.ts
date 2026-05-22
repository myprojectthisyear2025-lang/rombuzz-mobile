/**
 * ============================================================================
 * 📁 File: src/features/videoCallGifts/videoCallGiftsApi.ts
 * 🎥🎁 Purpose: API helper for BuzzCoin gifting inside RomBuzz video calls.
 *
 * Used by:
 *   - Video call gift floating button/menu
 *   - Video call direct send flow
 *   - Video call BuzzCoin request / accept / reject flow
 *
 * Backend endpoints:
 *   POST /api/video-call-gifts/send
 *   POST /api/video-call-gifts/request
 *   POST /api/video-call-gifts/requests/:requestId/accept
 *   POST /api/video-call-gifts/requests/:requestId/reject
 *
 * Notes:
 *   - This file does not render UI.
 *   - This file does not control Agora.
 *   - This only talks to the backend routes.
 * ============================================================================
 */

import * as SecureStore from "expo-secure-store";

import { API_BASE } from "@/src/config/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RbzApiOptions = {
  method?: HttpMethod;
  body?: any;
};

async function videoCallGiftFetch<T = any>(
  path: string,
  opts: RbzApiOptions = {}
): Promise<T> {
  const token = (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();

  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const message = json?.message || json?.error || "Request failed";

    const err: any = new Error(message);
    err.status = res.status;
    err.code = json?.error || "REQUEST_FAILED";
    err.balanceBC = json?.balanceBC;
    err.requiredBC = json?.requiredBC;
    err.payload = json;

    throw err;
  }

  return json as T;
}

export type VideoCallGiftUser = {
  id: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
};

export type VideoCallGiftRequest = {
  id: string;
  callId: string;
  roomId: string;
  requesterId: string;
  receiverId: string;
  amountBC: number;
  note: string;
  status: "pending" | "accepted" | "rejected" | "expired" | "cancelled";
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  respondedBy?: string;
  transactionId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type VideoCallGiftPayload = {
  ok: boolean;
  type: string;
  transactionId?: string;
  callId: string;
  roomId?: string;
  senderId?: string;
  receiverId?: string;
  requesterId?: string;
  amountBC: number;
  note?: string;
  sender?: VideoCallGiftUser | null;
  receiver?: VideoCallGiftUser | null;
  requester?: VideoCallGiftUser | null;
  request?: VideoCallGiftRequest | null;
  message?: string;
  createdAt?: string;
};

export type VideoCallBuzzCoinWalletPayload = {
  ok?: boolean;
  balanceBC?: number;
  availableBC?: number;
  buzzCoinBalance?: number;
  wallet?: {
    balanceBC?: number;
    availableBC?: number;
    buzzCoinBalance?: number;
  };
};

export async function getVideoCallBuzzCoinWallet() {
  return videoCallGiftFetch<VideoCallBuzzCoinWalletPayload>("/gifts/wallet");
}

export async function sendVideoCallBuzzCoinGift(args: {
  callId: string;
  amountBC: number;
}) {
  return videoCallGiftFetch<VideoCallGiftPayload>("/video-call-gifts/send", {
    method: "POST",
    body: {
      callId: args.callId,
      amountBC: args.amountBC,
    },
  });
}

export async function createVideoCallBuzzCoinRequest(args: {
  callId: string;
  amountBC: number;
  note?: string;
}) {
  return videoCallGiftFetch<VideoCallGiftPayload>("/video-call-gifts/request", {
    method: "POST",
    body: {
      callId: args.callId,
      amountBC: args.amountBC,
      note: args.note || "",
    },
  });
}

export async function acceptVideoCallBuzzCoinRequest(requestId: string) {
  return videoCallGiftFetch<VideoCallGiftPayload>(
    `/video-call-gifts/requests/${encodeURIComponent(requestId)}/accept`,
    {
      method: "POST",
    }
  );
}

export async function rejectVideoCallBuzzCoinRequest(requestId: string) {
  return videoCallGiftFetch<VideoCallGiftPayload>(
    `/video-call-gifts/requests/${encodeURIComponent(requestId)}/reject`,
    {
      method: "POST",
    }
  );
}
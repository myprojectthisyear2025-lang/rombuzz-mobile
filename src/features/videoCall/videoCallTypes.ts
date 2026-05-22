/**
 * ============================================================
 * 📁 File: src/features/videoCall/videoCallTypes.ts
 * 🎥 Purpose: Shared TypeScript types for RomBuzz 1-to-1 video calling.
 *
 * Used by:
 *   - src/features/videoCall/videoCallApi.ts
 *   - src/features/videoCall/useVideoCallSocket.ts
 *   - src/features/videoCall/IncomingCallOverlay.tsx
 *   - app/video-call/[callId].tsx
 *
 * Notes:
 *   - This file contains types only.
 *   - No API calls, sockets, or Agora engine logic live here.
 * ============================================================
 */

export type VideoCallStatus =
  | "ringing"
  | "accepted"
  | "declined"
  | "canceled"
  | "ended"
  | "missed"
  | "failed";

export type VideoCallParticipantSnapshot = {
  id?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
};

export type VideoCallSession = {
  id: string;
  provider: "agora";
  callType: "video";
  status: VideoCallStatus;

  callerId: string;
  receiverId: string;
  participants: string[];

  roomId: string;
  channelName: string;

  caller?: VideoCallParticipantSnapshot | null;
  receiver?: VideoCallParticipantSnapshot | null;

  startedAt?: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  canceledAt?: string | null;
  endedAt?: string | null;
  missedAt?: string | null;
  expiresAt?: string | null;

  endedBy?: string;
  lastReason?: string;

  createdAt?: string;
  updatedAt?: string;
};

export type AgoraJoinToken = {
  appId: string;
  token: string;
  channelName: string;
  uid: string;
  expiresAt?: string;
  expiresIn?: number;
};

export type VideoCallPayload = {
  call: VideoCallSession;
  token?: AgoraJoinToken;
};

export type VideoCallApiResponse = {
  ok: boolean;
  call: VideoCallSession | null;
  token?: AgoraJoinToken;
  error?: string;
  message?: string;
};

export type IncomingVideoCallEvent = {
  call: VideoCallSession;
};

export type VideoCallSocketEvent = {
  call: VideoCallSession;
};

export function getVideoCallPeerName(
  call: VideoCallSession | null | undefined,
  myId?: string
) {
  if (!call) return "RomBuzz User";

  const mine = String(myId || "");
  const isCaller = mine && String(call.callerId) === mine;

  const peer = isCaller ? call.receiver : call.caller;

  const fullName = [peer?.firstName, peer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || peer?.firstName || "RomBuzz User";
}

export function getVideoCallPeerAvatar(
  call: VideoCallSession | null | undefined,
  myId?: string
) {
  if (!call) return "";

  const mine = String(myId || "");
  const isCaller = mine && String(call.callerId) === mine;

  const peer = isCaller ? call.receiver : call.caller;

  return String(peer?.avatar || "").trim();
}
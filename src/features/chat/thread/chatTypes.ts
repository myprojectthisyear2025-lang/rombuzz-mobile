/**
 * ============================================================
 * 📁 File: src/features/chat/thread/chatTypes.ts
 * 🎯 Purpose: Central TypeScript types for the RomBuzz mobile chat thread.
 *
 * Used by:
 *   - app/chat/[peerId].tsx
 *   - future extracted chat thread components/hooks
 *
 * What this file owns:
 *   - Msg: the normalized message object used by the chat window.
 *   - ReplySnapshot: the lightweight reply preview stored on messages.
 *
 * Why this file exists:
 *   - Keeps the 4000+ line chat screen smaller.
 *   - Makes future component splitting safer because every extracted
 *     chat component can import the same shared message types.
 *
 * Runtime behavior:
 *   - This file contains types only.
 *   - It does not run code.
 *   - It does not change socket behavior, rendering, sending, editing,
 *     deleting, reactions, replies, media, pinned messages, or unread logic.
 * ============================================================
 */

export type MeetMiddleRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "declined"
  | "cancelled"
  | "canceled"
  | "expired";

export type MeetMiddleMilestoneStatus =
  | "place_proposed"
  | "place_rejected"
  | "confirmed"
  | "completed";

export type MeetMiddlePlacePayload = {
  id?: string;
  name?: string;
  category?: string;
  address?: string | null;
  coords?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
  provider?: string;
  isMidpoint?: boolean;
};

export type MeetMiddleRequestPayload = {
  type?: "meet_middle_request" | string;
  sessionId?: string;
  status?: MeetMiddleRequestStatus | string;
  fromUserId?: string;
  toUserId?: string;
  fromName?: string;
  toName?: string;
  fromAvatar?: string;
  toAvatar?: string;
  createdAt?: any;
  expiresAt?: any;
};

export type MeetMiddleMilestonePayload = {
  type?: "meet_middle_milestone" | string;
  sessionId?: string;
  status?: MeetMiddleMilestoneStatus | string;
  selectedBy?: string;
  acceptedBy?: string;
  rejectedBy?: string;
  place?: MeetMiddlePlacePayload | null;
  createdAt?: any;
  updatedAt?: any;
};

export type Msg = {
  id: string;
  from: string;
  to: string;
  text?: string;
  type?: string;
  action?: string;
  time?: any;
  createdAt?: any;

  edited?: boolean;
  seen?: boolean;

  deleted?: boolean;
  reactions?: Record<string, string>;
  ephemeral?: { mode?: string; viewsLeft?: number; maxViews?: number };
  replyTo?: ReplySnapshot | null;
  _temp?: boolean;
  roomId?: string;
  url?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  system?: boolean;
  meetMiddleRequest?: MeetMiddleRequestPayload | null;
  meetMiddle?: MeetMiddleMilestonePayload | null;
  pinned?: boolean;
  pinnedAt?: any;
  pinnedBy?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  pinnedTargetId?: string | null;
};

export type ReplySnapshot = {
  id: string;
  from: string;
  type?: string;
  text?: string;
  url?: string | null;
  mediaType?: string | null;
  deleted?: boolean;
};
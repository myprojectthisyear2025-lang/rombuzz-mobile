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
  ephemeral?: { mode?: string };
  replyTo?: ReplySnapshot | null;
  _temp?: boolean;
  roomId?: string;
  url?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  system?: boolean;
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
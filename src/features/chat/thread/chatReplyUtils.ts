/**
 * ============================================================
 * 📁 File: src/features/chat/thread/chatReplyUtils.ts
 * 🎯 Purpose: Shared reply-preview helpers for the RomBuzz mobile chat thread.
 *
 * Used by:
 *   - app/chat/[peerId].tsx
 *   - future extracted chat message bubble component
 *   - future extracted chat composer/reply preview component
 *
 * What this file owns:
 *   - getPreviewText(): shortens normal text for preview rows.
 *   - getReplyKind(): detects whether a reply points to text, photo,
 *     video, audio, attachment, or deleted content.
 *   - getReplyPreviewText(): returns the human-friendly preview label.
 *   - buildReplySnapshot(): creates the lightweight reply object stored
 *     on outgoing messages.
 *
 * Why this file exists:
 *   - Reply logic is reused by the composer, message bubbles, swipe reply,
 *     and long-press reply actions.
 *   - Keeping this logic outside app/chat/[peerId].tsx helps reduce the
 *     4000+ line chat screen without touching socket or send behavior.
 *
 * Runtime behavior:
 *   - This file preserves the exact existing reply-preview behavior.
 *   - It does not change sending, sockets, media rendering, reactions,
 *     pinning, editing, deleting, unread logic, or view-once behavior.
 * ============================================================
 */

import { maybeDecode } from "./chatPayload";
import type { ReplySnapshot } from "./chatTypes";

export const getPreviewText = (value: any, fallback = "Message") => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 90 ? `${text.slice(0, 87).trimEnd()}...` : text;
};

export const getReplyKind = (value: any) => {
  const decoded = maybeDecode(value);

  if (decoded?.deleted) return "deleted";
  if (decoded?.mediaType === "audio") return "audio";

  const isProfileShare = decoded?.type === "share_profile_media";
  const profileShareMediaType = String(decoded?.mediaType || "").toLowerCase();

  if (
    decoded?.mediaType === "video" ||
    decoded?.type === "share_reel" ||
    (isProfileShare && profileShareMediaType === "reel")
  ) {
    return "video";
  }

  if (
    decoded?.mediaType === "image" ||
    decoded?.type === "share_post" ||
    (isProfileShare && profileShareMediaType === "photo") ||
    (decoded?.type === "media" && decoded?.url)
  ) {
    return "image";
  }

  if (decoded?.type === "media" || decoded?.url || decoded?.mediaUrl) {
    return "attachment";
  }

  return "text";
};

export const getReplyPreviewText = (reply?: ReplySnapshot | null) => {
  if (!reply) return "";

  const decoded = maybeDecode({
    text: reply.text || "",
    type: reply.type || "text",
    url: reply.url || null,
    mediaType: reply.mediaType || null,
    deleted: !!reply.deleted,
  });

  const kind = getReplyKind(decoded);

  if (kind === "deleted") return "Original message unavailable";
  if (kind === "audio") return "Voice message";
  if (kind === "video") return "Video";
  if (kind === "image") return "Photo";
  if (kind === "attachment") return "Attachment";

  return getPreviewText(decoded?.text, "Message");
};

export const buildReplySnapshot = (message: any): ReplySnapshot | null => {
  if (!message?.id) return null;

  const decoded = maybeDecode(message);
  const kind = getReplyKind(decoded);
  const fallbackUrl = decoded?.url || decoded?.mediaUrl || null;

  return {
    id: String(decoded.id),
    from: String(decoded.from || ""),
    type:
      kind === "audio" || kind === "video" || kind === "image" || kind === "attachment"
        ? decoded?.type || "media"
        : decoded?.type || "text",
    text: kind === "text" ? String(decoded?.text || "") : "",
    url: fallbackUrl ? String(fallbackUrl) : null,
    mediaType:
      decoded?.mediaType === "image" ||
      decoded?.mediaType === "video" ||
      decoded?.mediaType === "audio"
        ? decoded.mediaType
        : kind === "video"
          ? "video"
          : kind === "image"
            ? "image"
            : kind === "audio"
              ? "audio"
              : null,
    deleted: !!decoded?.deleted,
  };
};
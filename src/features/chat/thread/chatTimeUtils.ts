/**
 * ============================================================
 * 📁 File: src/features/chat/thread/chatTimeUtils.ts
 * 🎯 Purpose: Shared timestamp formatting helpers for RomBuzz mobile chat.
 *
 * Used by:
 *   - app/chat/[peerId].tsx
 *   - future extracted chat message bubble component
 *
 * What this file owns:
 *   - toMs(): safely converts different timestamp formats into milliseconds.
 *   - formatExactMessageTime(): formats the exact message timestamp shown
 *     when the user taps a plain text message.
 *
 * Why this file exists:
 *   - The chat thread file is over 4000 lines.
 *   - Timestamp formatting is pure utility logic and does not need to live
 *     inside the main chat screen.
 *
 * Runtime behavior:
 *   - This file preserves the exact existing timestamp behavior.
 *   - It does not change sending, sockets, media rendering, replies,
 *     reactions, pinning, deleting, unread logic, or view-once behavior.
 * ============================================================
 */

const exactDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const exactTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export const toMs = (ts: any): number | null => {
  if (ts == null || ts === "") return null;

  if (ts instanceof Date) {
    const ms = ts.getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  if (typeof ts === "number") {
    if (!Number.isFinite(ts)) return null;
    return ts < 1e12 ? ts * 1000 : ts;
  }

  if (typeof ts === "string") {
    const trimmed = ts.trim();
    if (!trimmed) return null;

    const asNum = Number(trimmed);
    if (Number.isFinite(asNum)) {
      return asNum < 1e12 ? asNum * 1000 : asNum;
    }

    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const formatExactMessageTime = (ts: any) => {
  const ms = toMs(ts);
  if (!ms) return "";

  const d = new Date(ms);
  return `${exactDateFormatter.format(d)} • ${exactTimeFormatter.format(d)}`;
};
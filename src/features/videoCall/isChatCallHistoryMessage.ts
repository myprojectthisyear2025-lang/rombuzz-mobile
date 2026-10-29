/** Detect real chat call records without treating text, delivery status, or video metadata as calls. */
const CALL_MESSAGE_TYPES = new Set(["call", "video_call", "video-call", "call_history"]);
const LEGACY_CALL_STATUSES = new Set([
  "ringing", "accepted", "declined", "canceled", "cancelled", "ended", "missed", "failed",
  "ring_timeout", "no_answer", "complete", "completed",
]);

function lower(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isChatCallHistoryMessage(message: unknown): boolean {
  if (!message || typeof message !== "object" || Array.isArray(message)) return false;
  const record = message as Record<string, unknown>;
  const type = lower(record.type);
  const callId = typeof record.callId === "string" ? record.callId.trim() : "";
  if (!callId) return false;

  // The server's explicit message type takes priority over text and stray metadata.
  if (CALL_MESSAGE_TYPES.has(type)) return true;
  if (type) return false;

  // Untyped legacy calls also need call-specific metadata.
  return lower(record.callType) === "video" || LEGACY_CALL_STATUSES.has(lower(record.callStatus));
}
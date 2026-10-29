/** Reads call status, duration, and timestamps for chat call-history bubbles. */

function lower(value: any) {
  return String(value || "").trim().toLowerCase();
}

export function getRawText(message: any) {
  return String(message?.text || message?.preview || "").trim();
}

export function isVideoCallHistoryMessage(message: any) {
  const type = lower(message?.type);
  const callType = lower(message?.callType);
  const callId = String(message?.callId || "").trim();
  const callStatus = lower(message?.callStatus || message?.status || message?.lastReason);
  const text = lower(getRawText(message));

  if (type === "call" || type === "video_call" || type === "video-call" || type === "call_history") {
    return true;
  }

  if (callId || callType === "video" || callStatus) {
    return true;
  }

  return (
    text.includes("video call") ||
    text.includes("missed call") ||
    text.includes("missed video call") ||
    text.includes("declined call") ||
    text.includes("video call declined") ||
    text.includes("canceled call") ||
    text.includes("video call canceled")
  );
}

export function formatDuration(totalSeconds: number) {
  const secs = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  if (!secs) return "";

  const mins = Math.floor(secs / 60);
  const rem = secs % 60;

  if (mins <= 0) return `${rem}s`;
  return `${mins}m ${String(rem).padStart(2, "0")}s`;
}

export function formatCallExactDateTime(message: any) {
  const raw =
    message?.callEndedAt ||
    message?.createdAt ||
    message?.time ||
    message?.callStartedAt ||
    message?.updatedAt;

  if (!raw) return "";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function extractDurationFromText(text: string) {
  const raw = String(text || "").trim();
  if (!raw) return "";

  const minutesSeconds = raw.match(/(\d+)\s*m(?:in)?\s*(\d+)?\s*s?/i);
  if (minutesSeconds) {
    const mins = Number(minutesSeconds[1] || 0);
    const secs = Number(minutesSeconds[2] || 0);
    if (mins > 0) return `${mins}m ${String(secs).padStart(2, "0")}s`;
  }

  const secondsOnly = raw.match(/(\d+)\s*s\b/i);
  if (secondsOnly) {
    const secs = Number(secondsOnly[1] || 0);
    if (secs > 0) return `${secs}s`;
  }

  return "";
}

export function normalizeCallStatus(message: any) {
  const explicit = lower(message?.callStatus || message?.status || message?.lastReason);
  const text = lower(getRawText(message));

  if (explicit === "missed" || explicit === "ring_timeout" || explicit === "no_answer") {
    return "missed";
  }

  if (explicit === "declined") return "declined";
  if (explicit === "canceled" || explicit === "cancelled") return "canceled";
  if (explicit === "ended" || explicit === "accepted" || explicit === "complete" || explicit === "completed") {
    return "ended";
  }

  if (text.includes("missed")) return "missed";
  if (text.includes("declined")) return "declined";
  if (text.includes("canceled") || text.includes("cancelled")) return "canceled";
  if (text.includes("ended") || text.includes("video call")) return "ended";

  return "ended";
}
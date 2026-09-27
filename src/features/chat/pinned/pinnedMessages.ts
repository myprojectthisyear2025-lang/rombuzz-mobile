import { API_BASE } from "@/src/config/api";

const time = (value: any) => typeof value === "number" ? (value < 1e12 ? value * 1000 : value) : Date.parse(value || "") || 0;
export function pinnedMessages(messages: any[], userId: string) {
  const byId = new Map(messages.filter(m => m?.id).map(m => [String(m.id), m]));
  return [...byId.values()].filter(m => m.pinned && !m.deleted && !m._temp && !m.hiddenFor?.includes(userId))
    .sort((a, b) => time(b.pinnedAt || b.createdAt || b.time) - time(a.pinnedAt || a.createdAt || a.time));
}

export async function requestPinnedMessages(roomId: string, token: string, signal: AbortSignal) {
  const base = `${API_BASE}/chat/rooms/${encodeURIComponent(roomId)}`;
  const options = { headers: { Authorization: `Bearer ${token}` }, signal };
  let response = await fetch(`${base}/pinned`, options);
  let body = await response.json().catch(() => null);
  // Only an absent route on an older server permits the legacy full-room read.
  // Never turn an authorization/not-found JSON response into a second request.
  if (response.status === 404 && !body?.error && !signal.aborted) {
    response = await fetch(base, options);
    body = await response.json().catch(() => null);
  }
  if (!response.ok) throw Object.assign(new Error(body?.message || body?.error || "Unable to load pinned messages"), { status: response.status });
  const messages = Array.isArray(body) ? body : body?.messages;
  if (!Array.isArray(messages)) throw new Error("Invalid pinned messages response");
  return messages;
}

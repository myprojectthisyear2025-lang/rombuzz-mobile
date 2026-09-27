import { API_BASE } from "@/src/config/api";
import { ChatMediaKind, ChatMediaRow, chatMediaRows } from "./chatMediaRows";

export type MediaPage = { items: ChatMediaRow[]; counts?: { image: number; video: number }; hasMore: boolean; nextCursor: string | null };
type Flight = { controller: AbortController; users: Set<symbol>; promise: Promise<MediaPage> };
const flights = new Map<string, Flight>();
const abortError = () => Object.assign(new Error("Cancelled media read"), { name: "AbortError" });

export function requestMediaPage(token: string, roomId: string, kind: ChatMediaKind, mediaType: "image" | "video", before: string | null, signal: AbortSignal): Promise<MediaPage> {
  if (signal.aborted) return Promise.reject(abortError());
  const key = JSON.stringify([token, roomId, kind, mediaType, before]);
  let flight = flights.get(key);
  if (!flight) {
    const controller = new AbortController();
    const run = async (): Promise<MediaPage> => {
      const headers = { Authorization: `Bearer ${token}` };
      const legacy = before?.startsWith("room:");
      if (!legacy) {
        const response = await fetch(`${API_BASE}/chat/rooms/${encodeURIComponent(roomId)}/media?kind=${kind}&mediaType=${mediaType}&limit=30${before ? `&before=${encodeURIComponent(before)}` : ""}`, { headers, signal: controller.signal });
        const body = await response.json().catch(() => null);
        if (controller.signal.aborted) throw abortError();
        if (response.ok && Array.isArray(body?.items)) return body;
        // An old server has no media route. Access/account errors are never
        // treated as permission to use the compatibility route.
        if (response.status !== 404 || body?.error) throw new Error(body?.error || "Unable to load media");
      }
      const cursor = legacy ? before!.slice(5) : "";
      if (controller.signal.aborted) throw abortError();
      const response = await fetch(`${API_BASE}/chat/rooms/${encodeURIComponent(roomId)}?limit=40${cursor ? `&before=${encodeURIComponent(cursor)}` : ""}`, { headers, signal: controller.signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Unable to load media");
      return { items: chatMediaRows(Array.isArray(body) ? body : body.messages || [], kind).filter(row => row.mediaType === mediaType), hasMore: !!body.hasMore, nextCursor: body.hasMore && body.nextCursor ? `room:${body.nextCursor}` : null };
    };
    flight = { controller, users: new Set(), promise: run() };
    flights.set(key, flight);
    const owned = flight;
    void flight.promise.finally(() => { if (flights.get(key) === owned) flights.delete(key); }).catch(() => {});
  }
  const owned = flight, user = Symbol(); owned.users.add(user);
  return new Promise((resolve, reject) => {
    const release = () => {
      signal.removeEventListener("abort", cancel); owned.users.delete(user);
      if (!owned.users.size && flights.get(key) === owned) { flights.delete(key); owned.controller.abort(); }
    };
    const cancel = () => { release(); reject(abortError()); };
    signal.addEventListener("abort", cancel, { once: true });
    owned.promise.then(page => { release(); if (!signal.aborted) resolve(page); }, error => { release(); reject(error); });
  });
}

/**
 * ============================================================
 * 📁 File: src/features/chat/thread/rbzChatThreadWarmup.ts
 * 🎯 Purpose: Quietly prewarm RomBuzz chat thread caches.
 *
 * Used by:
 *   - app/(tabs)/chat.tsx
 *
 * What this file owns:
 *   - Fetches /chat/rooms/:roomId for likely-to-open conversations.
 *   - Writes the result into rbzChatThreadCache.
 *   - Prevents duplicate in-flight prewarm requests.
 *
 * What this file must NOT do:
 *   - No unread clearing.
 *   - No socket wiring.
 *   - No navigation.
 *   - No message mutation rules.
 *   - No gifts / paid media / view-once logic.
 *
 * Why:
 *   - The first chat thread open is slow when no room cache exists yet.
 *   - Chat list already knows the likely next conversations.
 *   - Warming the first few room caches after chat list paint makes the
 *     first thread open feel instant without blocking the chat list UI.
 * ============================================================
 */

import * as SecureStore from "expo-secure-store";

import { API_BASE } from "@/src/config/api";
import {
  readCachedChatThread,
  writeCachedChatThread,
} from "@/src/features/chat/thread/rbzChatThreadCache";

const inflightRoomIds = new Set<string>();
const WARM_CACHE_MAX_AGE_MS = 60_000;

function safeId(value: any) {
  return String(value || "").trim();
}

function makeRoomId(a: string, b: string) {
  return [String(a), String(b)].sort().join("_");
}

function peerIdFromMatch(match: any) {
  return safeId(match?.id || match?._id || match?.userId || match?.peerId);
}

export async function warmChatThreadCache(args: {
  myId: string;
  peerId: string;
  force?: boolean;
}) {
  const myId = safeId(args.myId);
  const peerId = safeId(args.peerId);
  if (!myId || !peerId) return false;

  const roomId = makeRoomId(myId, peerId);
  if (!roomId) return false;

  if (inflightRoomIds.has(roomId)) return false;
  inflightRoomIds.add(roomId);

  try {
    if (!args.force) {
      const cached = await readCachedChatThread(roomId);
      const age = Date.now() - Number(cached?.savedAt || 0);

      if (cached?.messages?.length && age >= 0 && age < WARM_CACHE_MAX_AGE_MS) {
        return true;
      }
    }

    const token = await SecureStore.getItemAsync("RBZ_TOKEN");
    if (!token) return false;

    const res = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json().catch(() => []);
    const list = Array.isArray(json) ? json : [];

    if (!list.length) return false;

    await writeCachedChatThread(roomId, list);
    return true;
  } catch {
    return false;
  } finally {
    inflightRoomIds.delete(roomId);
  }
}

export function warmChatThreadsForMatches(args: {
  myId: string;
  matches: any[];
  limit?: number;
}) {
  const myId = safeId(args.myId);
  if (!myId) return;

  const limit = Math.max(1, Math.min(Number(args.limit || 4), 6));
  const peers = (Array.isArray(args.matches) ? args.matches : [])
    .map(peerIdFromMatch)
    .filter(Boolean)
    .slice(0, limit);

  peers.forEach((peerId, index) => {
    const delay = 250 + index * 500;

    setTimeout(() => {
      warmChatThreadCache({ myId, peerId }).catch(() => {});
    }, delay);
  });
}
/**
 * ============================================================
 * 📁 File: src/features/chat/thread/rbzChatThreadCache.ts
 * 🎯 Purpose: Fast AsyncStorage cache for RomBuzz chat rooms.
 *
 * Used by:
 *   - app/chat/[peerId].tsx
 *   - app/chat/shared-media/[peerId].tsx
 *   - app/chat/purchased-media/[peerId].tsx
 *   - app/chat/pinned/[peerId].tsx
 *
 * What this file owns:
 *   - Stores the latest raw message list per chat room.
 *   - Reads cached thread messages instantly on navigation.
 *   - Keeps shared/purchased/pinned media screens from reloading blank.
 *
 * What this file must NOT do:
 *   - No socket wiring.
 *   - No message sending.
 *   - No unread clearing.
 *   - No mutation rules for gifts, paid media, view-once/twice, or deletes.
 *
 * Why:
 *   - The chat thread and chat sub-screens all depend on the same room data.
 *   - Without a room cache, every navigation waits for /chat/rooms/:roomId.
 * ============================================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const CHAT_THREAD_CACHE_PREFIX = "RBZ_CHAT_THREAD_CACHE_V1";
const MAX_CACHED_MESSAGES = 250;

export type CachedChatThread = {
  roomId: string;
  messages: any[];
  savedAt: number;
};

function safeRoomId(roomId: string) {
  return String(roomId || "").trim();
}

function cacheKey(roomId: string) {
  return `${CHAT_THREAD_CACHE_PREFIX}:${safeRoomId(roomId)}`;
}

function toMs(value: any) {
  if (value == null || value === "") return 0;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    return value < 1e12 ? value * 1000 : value;
  }

  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeMessages(messages: any[]) {
  const list = Array.isArray(messages) ? messages : [];

  return [...list]
    .filter((m) => !!m && !!String(m?.id || m?._id || "").trim())
    .map((m) => ({
      ...m,
      id: String(m?.id || m?._id || ""),
    }))
    .sort((a, b) => {
      return toMs(a?.createdAt || a?.time) - toMs(b?.createdAt || b?.time);
    })
    .slice(-MAX_CACHED_MESSAGES);
}

export async function readCachedChatThread(
  roomId: string
): Promise<CachedChatThread | null> {
  try {
    const safeId = safeRoomId(roomId);
    if (!safeId) return null;

    const raw = await AsyncStorage.getItem(cacheKey(safeId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const messages = normalizeMessages(parsed?.messages || []);

    if (!messages.length) return null;

    return {
      roomId: safeId,
      messages,
      savedAt: Number(parsed?.savedAt || 0),
    };
  } catch {
    return null;
  }
}

export async function writeCachedChatThread(roomId: string, messages: any[]) {
  try {
    const safeId = safeRoomId(roomId);
    if (!safeId) return;

    const normalized = normalizeMessages(messages);
    if (!normalized.length) return;

    const payload: CachedChatThread = {
      roomId: safeId,
      messages: normalized,
      savedAt: Date.now(),
    };

    await AsyncStorage.setItem(cacheKey(safeId), JSON.stringify(payload));
  } catch {
    // Cache must never break chat.
  }
}

export async function clearCachedChatThread(roomId: string) {
  try {
    const safeId = safeRoomId(roomId);
    if (!safeId) return;

    await AsyncStorage.removeItem(cacheKey(safeId));
  } catch {
    // Cache must never break chat.
  }
}
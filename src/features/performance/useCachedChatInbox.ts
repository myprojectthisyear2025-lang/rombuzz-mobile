/**
 * ============================================================
 * 📁 File: src/features/performance/useCachedChatInbox.ts
 * 🎯 Purpose: Cache helpers for Chat tab inbox perceived speed
 *
 * Important:
 *  - This does NOT own chat socket behavior.
 *  - This does NOT touch chat thread optimistic media.
 *  - This only helps chat list render cached/stale data first.
 * ============================================================
 */

import { rbzApiJson, rbzGetAuthToken } from "@/src/performance/api/rbzApiClient";
import {
  rbzCacheGet,
  rbzCacheKey,
  rbzCacheSet,
} from "@/src/performance/cache/rbzCache";
import { InteractionManager } from "react-native";

type CachedChatInbox = {
  matches: any[];
  onlineMap: Record<string, boolean>;
  savedAt?: number;
};

const emptyInbox: CachedChatInbox = {
  matches: [],
  onlineMap: {},
};

const CHAT_INBOX_TTL_MS = 5 * 60_000;
const CHAT_PRESENCE_TTL_MS = 2 * 60_000;

function safeId(u: any) {
  return String(u?.id || u?._id || "");
}

function sortMatchesByActivity(list: any[]) {
  return [...(Array.isArray(list) ? list : [])]
    .map((m: any) => {
      const ts =
        m?.lastMessageTime ||
        m?.lastMessage?.time ||
        m?.lastMessage?.createdAt ||
        m?.updatedAt ||
        m?.createdAt ||
        0;

      return {
        ...m,
        _sortTime: new Date(ts).getTime() || 0,
      };
    })
    .sort((a: any, b: any) => (b?._sortTime || 0) - (a?._sortTime || 0));
}

async function runAfterInteractions() {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
}

async function fetchPresenceLimited(ids: string[], limit = 4) {
  const token = await rbzGetAuthToken().catch(() => "");
  const out: Record<string, boolean> = {};
  const queue = [...ids];

  async function worker() {
    while (queue.length) {
      const id = queue.shift();
      if (!id) continue;

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const r = await fetch(
          `${require("@/src/config/api").API_BASE}/presence/${id}`,
          headers ? { headers } : undefined
        );

        const j = await r.json().catch(() => ({}));
        out[id] = !!j?.online;
      } catch {
        out[id] = false;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, ids.length) }, worker));
  return out;
}

export function useCachedChatInbox(meId: string) {
  const inboxKey = rbzCacheKey("RBZ_PERF_CHAT_INBOX", meId);
  const presenceKey = rbzCacheKey("RBZ_PERF_CHAT_PRESENCE", meId);

  const readCachedInbox = async () => {
    const cached = await rbzCacheGet<CachedChatInbox>(inboxKey, emptyInbox);
    return {
      ...cached.value,
      savedAt: cached.savedAt,
      hit: cached.hit,
    };
  };

  const writeCachedInbox = async (matches: any[], onlineMap?: Record<string, boolean>) => {
    if (!meId) return;

    await rbzCacheSet<CachedChatInbox>(inboxKey, {
      matches: Array.isArray(matches) ? matches : [],
      onlineMap: onlineMap && typeof onlineMap === "object" ? onlineMap : {},
      savedAt: Date.now(),
    });
  };

  const readCachedPresence = async () => {
    const cached = await rbzCacheGet<Record<string, boolean>>(presenceKey, {});
    return {
      onlineMap: cached.value || {},
      savedAt: cached.savedAt,
      hit: cached.hit,
    };
  };

  const writeCachedPresence = async (onlineMap: Record<string, boolean>) => {
    if (!meId) return;
    await rbzCacheSet(presenceKey, onlineMap || {});
  };

  const fetchMatchesFresh = async () => {
    const data = await rbzApiJson<any>("/matches");

    const raw = Array.isArray(data)
      ? data
      : Array.isArray(data?.matches)
      ? data.matches
      : Array.isArray(data?.users)
      ? data.users
      : [];

    return sortMatchesByActivity(raw);
  };

  const refreshPresenceAfterPaint = async (matches: any[]) => {
    await runAfterInteractions();

    const ids = Array.from(
      new Set(
        (Array.isArray(matches) ? matches : [])
          .map((m) => safeId(m))
          .filter(Boolean)
      )
    );

    if (!ids.length) return {};

    const onlineMap = await fetchPresenceLimited(ids, 4);
    await writeCachedPresence(onlineMap);

    return onlineMap;
  };

  return {
    CHAT_INBOX_TTL_MS,
    CHAT_PRESENCE_TTL_MS,
    readCachedInbox,
    writeCachedInbox,
    readCachedPresence,
    writeCachedPresence,
    fetchMatchesFresh,
    refreshPresenceAfterPaint,
  };
}
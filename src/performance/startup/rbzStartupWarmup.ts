/**
 * ============================================================
 * 📁 File: src/performance/startup/rbzStartupWarmup.ts
 * 🎯 Purpose: Warm important app data after cold start
 *
 * Rules:
 *  - Never blocks UI
 *  - Never throws into screens
 *  - Avoids repeated warmup in same JS session
 * ============================================================
 */

import {
  rbzApiJson,
  rbzGetAuthToken,
  rbzGetCurrentUser,
  rbzPrimeCurrentUser,
} from "@/src/performance/api/rbzApiClient";
import {
  writeCachedLetsBuzzFeed,
  writeCachedLetsBuzzMeId,
} from "@/src/features/performance/letsbuzz/rbzLetsBuzzFeedCache";
import { writeCachedViewProfileFromUser } from "@/src/features/performance/viewProfile/rbzViewProfileCache";
import { rbzCacheKey, rbzCacheSet } from "@/src/performance/cache/rbzCache";
import * as SecureStore from "expo-secure-store";
import { DeviceEventEmitter } from "react-native";
let warmupStarted = false;

const UNREAD_MAP_KEY = "RBZ_unread_map";
const UNREAD_TOTAL_KEY = "RBZ_unread_total";
const NOTIFICATIONS_CACHE_KEY = "RBZ_PERF_NOTIFICATIONS";
const NOTIF_UNREAD_TOTAL_KEY = "RBZ_notif_unread_total";

const CHAT_INBOX_CACHE_PREFIX = "RBZ_PERF_CHAT_INBOX";
const PROFILE_FULL_CACHE_KEY = "RBZ_PERF_PROFILE_FULL";

function normalizeNotifications(data: any) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.notifications)
    ? data.notifications
    : [];

  return [...list].sort(
    (a: any, b: any) =>
      new Date(b?.createdAt || 0).getTime() -
      new Date(a?.createdAt || 0).getTime()
  );
}

function unreadNotificationsTotal(list: any[]) {
  return (Array.isArray(list) ? list : []).reduce((acc, n) => {
    return !n?.read ? acc + 1 : acc;
  }, 0);
}

function normalizeChatMatches(data: any) {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.matches)
    ? data.matches
    : Array.isArray(data?.users)
    ? data.users
    : [];

  return [...raw]
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

function getWarmableMatchProfile(match: any, meId: string) {
  if (!match || typeof match !== "object") return null;

  const candidates = [
    match.user,
    match.profile,
    match.peer,
    match.otherUser,
    match.matchedUser,
    match.match,
    match.target,
    match,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    const id = String(candidate.id || candidate._id || candidate.userId || "").trim();
    if (!id || id === meId) continue;

    return {
      ...candidate,
      id,
    };
  }

  return null;
}

async function warmViewProfilesFromMatches(matches: any[], meId: string) {
  try {
    const warmable = (Array.isArray(matches) ? matches : [])
      .map((match) => getWarmableMatchProfile(match, meId))
      .filter(Boolean)
      .slice(0, 20);

    if (!warmable.length) return;

    await Promise.allSettled(
      warmable.map((user) =>
        writeCachedViewProfileFromUser(user, {
          matched: true,
        })
      )
    );

    DeviceEventEmitter.emit("rbz:view-profile:warmed", {
      count: warmable.length,
    });
  } catch {}
}

async function warmChatInbox(meId: string) {
  try {
    if (!meId) return;

    const data = await rbzApiJson<any>("/matches");
    const matches = normalizeChatMatches(data);

    await rbzCacheSet(rbzCacheKey(CHAT_INBOX_CACHE_PREFIX, meId), {
      matches,
      onlineMap: {},
      savedAt: Date.now(),
    });

    await warmViewProfilesFromMatches(matches, meId);

    DeviceEventEmitter.emit("rbz:chat:inbox-warmed", {
      meId,
      count: matches.length,
    });
  } catch {}
}

async function warmProfileFull() {
  try {
    const data = await rbzApiJson<any>("/profile/full");
    const user = data?.user || null;

    if (!user) return;

    await rbzCacheSet(PROFILE_FULL_CACHE_KEY, {
      user,
    });

    await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(user)).catch(() => {});

    try {
      rbzPrimeCurrentUser(user);
    } catch {}
  } catch {}
}

async function warmUnreadSummary() {
  try {
    const summary = await rbzApiJson<any>("/chat/unread-summary");

    const rawByPeer =
      summary?.byPeer && typeof summary.byPeer === "object"
        ? summary.byPeer
        : {};

    const safeByPeer: Record<string, number> = {};
    Object.keys(rawByPeer || {}).forEach((k) => {
      safeByPeer[String(k)] = Math.max(0, Number(rawByPeer[k] || 0) || 0);
    });

    const total = Object.values(safeByPeer).reduce((sum, n) => {
      return sum + Math.max(0, Number(n || 0) || 0);
    }, 0);

    await SecureStore.setItemAsync(UNREAD_MAP_KEY, JSON.stringify(safeByPeer)).catch(() => {});
    await SecureStore.setItemAsync(UNREAD_TOTAL_KEY, String(total)).catch(() => {});

    DeviceEventEmitter.emit("rbz:unread:summary", {
      total,
      byPeer: safeByPeer,
    });
  } catch {}
}

async function warmNotifications() {
  try {
    const data = await rbzApiJson<any>("/notifications");
    const list = normalizeNotifications(data);
    const unread = unreadNotificationsTotal(list);

    await rbzCacheSet(NOTIFICATIONS_CACHE_KEY, list);
    await SecureStore.setItemAsync(NOTIF_UNREAD_TOTAL_KEY, String(unread)).catch(() => {});

    DeviceEventEmitter.emit("rbz:notif:unread-total", {
      total: unread,
    });
  } catch {}
}

async function warmSocialStats() {
  try {
    let social: any = null;

    try {
      social = await rbzApiJson<any>("/users/social-stats");
    } catch {
      social = await rbzApiJson<any>("/social-stats");
    }

    DeviceEventEmitter.emit("rbz:social-stats:warmed", {
      social,
    });
  } catch {}
}

async function warmLetsBuzzFeed(meId: string) {
  try {
    if (meId) {
      await writeCachedLetsBuzzMeId(meId);
    }

    const data = await rbzApiJson<any>("/feed/letsbuzz");
    const items = Array.isArray(data?.items) ? data.items : [];

    if (!items.length) return;

    await writeCachedLetsBuzzFeed(items);

    DeviceEventEmitter.emit("rbz:letsbuzz:feed-warmed", {
      count: items.length,
    });
  } catch {}
}

export async function rbzStartupWarmup() {
  if (warmupStarted) return;
  warmupStarted = true;

  try {
    const token = await rbzGetAuthToken();
    if (!token) return;

    // Prime user memory too. This is cheap and helps layout/profile later.
    const user = await rbzGetCurrentUser().catch(() => null);
    const meId = String(user?.id || user?._id || "");

        // Run useful network warmups in parallel.
    await Promise.allSettled([
      warmUnreadSummary(),
      warmNotifications(),
      warmSocialStats(),
      warmChatInbox(meId),
      warmProfileFull(),
      warmLetsBuzzFeed(meId),
    ]);
  } catch {}
}
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
  writeCachedLetsBuzzFeed,
  writeCachedLetsBuzzMeId,
} from "@/src/features/performance/letsbuzz/rbzLetsBuzzFeedCache";
import { writeCachedViewProfileFromUser } from "@/src/features/performance/viewProfile/rbzViewProfileCache";
import {
  rbzApiJson,
  rbzGetAuthToken,
  rbzGetCurrentUser,
} from "@/src/performance/api/rbzApiClient";
import { persistCurrentUser, getSessionGeneration, isSessionCurrent } from "@/src/features/auth/rbzSession";
import { rbzCacheKey, rbzCacheSet } from "@/src/performance/cache/rbzCache";
import { DeviceEventEmitter } from "react-native";
let warmedGeneration = -1;


const CHAT_INBOX_CACHE_PREFIX = "RBZ_PERF_CHAT_INBOX";
const PROFILE_FULL_CACHE_KEY = "RBZ_PERF_PROFILE_FULL";

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

async function warmViewProfilesFromMatches(matches: any[], meId: string, owner: number) {
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

    if (!isSessionCurrent(owner)) return;
    DeviceEventEmitter.emit("rbz:view-profile:warmed", {
      count: warmable.length,
    });
  } catch {}
}

async function warmChatInbox(meId: string, owner: number) {
  try {
    if (!meId) return;

    const data = await rbzApiJson<any>("/matches");
    if (!isSessionCurrent(owner)) return;
    const matches = normalizeChatMatches(data);

    await rbzCacheSet(rbzCacheKey(CHAT_INBOX_CACHE_PREFIX, meId), {
      matches,
      onlineMap: {},
      savedAt: Date.now(),
    });

    if (!isSessionCurrent(owner)) return;
    await warmViewProfilesFromMatches(matches, meId, owner);

    if (!isSessionCurrent(owner)) return;
    DeviceEventEmitter.emit("rbz:chat:inbox-warmed", {
      meId,
      count: matches.length,
    });
  } catch {}
}

async function warmProfileFull(owner: number) {
  try {
    const data = await rbzApiJson<any>("/profile/full");
    const user = data?.user || null;

    if (!user || !isSessionCurrent(owner)) return;

    await rbzCacheSet(rbzCacheKey(PROFILE_FULL_CACHE_KEY, user.id || user._id), {
      user,
    });

    await persistCurrentUser(user, owner).catch(() => {});
  } catch {}
}

async function warmSocialStats(owner: number) {
  try {
    let social: any = null;

    try {
      social = await rbzApiJson<any>("/users/social-stats");
    } catch {
      if (!isSessionCurrent(owner)) return;
      social = await rbzApiJson<any>("/social-stats");
    }

    if (!isSessionCurrent(owner)) return;
    DeviceEventEmitter.emit("rbz:social-stats:warmed", {
      social,
    });
  } catch {}
}

async function warmLetsBuzzFeed(meId: string, owner: number) {
  try {
    if (meId) {
      await writeCachedLetsBuzzMeId(meId);
    }

    if (!isSessionCurrent(owner)) return;
    const data = await rbzApiJson<any>("/feed/letsbuzz");
    const items = Array.isArray(data?.items) ? data.items : [];

    if (!items.length) return;

    await writeCachedLetsBuzzFeed(items, owner);

    if (!isSessionCurrent(owner)) return;
    DeviceEventEmitter.emit("rbz:letsbuzz:feed-warmed", {
      count: items.length,
    });
  } catch {}
}

export async function rbzStartupWarmup() {
  const owner = getSessionGeneration();
  if (warmedGeneration === owner) return;
  warmedGeneration = owner;

  try {
    const token = await rbzGetAuthToken();
    if (!token) return;

    // Prime user memory too. This is cheap and helps layout/profile later.
    const user = await rbzGetCurrentUser().catch(() => null);
    if (!isSessionCurrent(owner)) return;
    const meId = String(user?.id || user?._id || "");

    // Run useful network warmups in parallel.
    await Promise.allSettled([
      warmSocialStats(owner),
      warmChatInbox(meId, owner),
      warmProfileFull(owner),
      warmLetsBuzzFeed(meId, owner),
    ]);
  } catch {}
}

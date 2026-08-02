/**
 * ============================================================
 * 📁 File: src/features/performance/useCachedSocialStats.ts
 * 🎯 Purpose: Cache helpers for Social Stats perceived speed
 *
 * Behavior:
 *  - Show stale cached Social Stats instantly
 *  - Refresh backend quietly
 *  - Cache stat cards and modal lists separately
 *  - Keep existing screen actions intact:
 *    Accept / reject / message / unmatch / report
 * ============================================================
 */

import { rbzApiJson } from "@/src/performance/api/rbzApiClient";
import {
  rbzCacheGet,
  rbzCacheKey,
  rbzCacheSet,
} from "@/src/performance/cache/rbzCache";

export type SocialStatsListType = "liked" | "likedYou" | "matches";

export type CachedSocialStats = {
  likedCount: number;
  likedYouCount: number;
  matchCount: number;
  viewsToday: number;
  viewsTotal: number;
};

const emptySocial: CachedSocialStats = {
  likedCount: 0,
  likedYouCount: 0,
  matchCount: 0,
  viewsToday: 0,
  viewsTotal: 0,
};

export const SOCIAL_STATS_TTL_MS = 2 * 60_000;
export const SOCIAL_LIST_TTL_MS = 2 * 60_000;

const SOCIAL_STATS_CACHE_KEY = rbzCacheKey("RBZ_PERF_SOCIAL_STATS");
const SOCIAL_LIST_CACHE_PREFIX = "RBZ_PERF_SOCIAL_LIST";

const safeNum = (n: any) => (Number.isFinite(Number(n)) ? Number(n) : 0);

function normalizeSocialStats(data: any): CachedSocialStats {
  const profileViews =
    data?.profileViews && typeof data.profileViews === "object"
      ? data.profileViews
      : {};

  return {
    likedCount: safeNum(data?.likedCount ?? data?.likesGiven),
    likedYouCount: safeNum(data?.likedYouCount ?? data?.likesReceived),
    matchCount: safeNum(data?.matchCount ?? data?.matchesCount),
    viewsToday: safeNum(data?.viewsToday ?? profileViews?.today),
    viewsTotal: safeNum(data?.viewsTotal ?? profileViews?.total),
  };
}

function normalizeSocialList(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.matches)) return data.matches;
  if (Array.isArray(data?.list)) return data.list;
  return [];
}

function socialListCacheKey(type: SocialStatsListType) {
  return rbzCacheKey(SOCIAL_LIST_CACHE_PREFIX, type);
}

export async function readCachedSocialStats() {
  const cached = await rbzCacheGet<CachedSocialStats>(
    SOCIAL_STATS_CACHE_KEY,
    emptySocial
  );

  return {
    social: cached.value || emptySocial,
    savedAt: cached.savedAt,
    hit: cached.hit,
  };
}

export async function writeCachedSocialStats(social: CachedSocialStats) {
  await rbzCacheSet<CachedSocialStats>(
    SOCIAL_STATS_CACHE_KEY,
    social || emptySocial
  );
}

export async function fetchSocialStatsFresh() {
  const data = await rbzApiJson<any>("/social-stats");
  const social = normalizeSocialStats(data);

  await writeCachedSocialStats(social);

  return social;
}

export async function readCachedSocialList(type: SocialStatsListType) {
  const cached = await rbzCacheGet<any[]>(socialListCacheKey(type), []);

  return {
    list: Array.isArray(cached.value) ? cached.value : [],
    savedAt: cached.savedAt,
    hit: cached.hit,
  };
}

export async function writeCachedSocialList(
  type: SocialStatsListType,
  list: any[]
) {
  await rbzCacheSet<any[]>(socialListCacheKey(type), Array.isArray(list) ? list : []);
}

export async function fetchSocialListFresh(type: SocialStatsListType) {
  const data = await rbzApiJson<any>(`/social/${type}`);
  const list = normalizeSocialList(data);

  await writeCachedSocialList(type, list);

  return list;
}

export function useCachedSocialStats() {
  return {
    SOCIAL_STATS_TTL_MS,
    SOCIAL_LIST_TTL_MS,
    readCachedSocialStats,
    writeCachedSocialStats,
    fetchSocialStatsFresh,
    readCachedSocialList,
    writeCachedSocialList,
    fetchSocialListFresh,
  };
}
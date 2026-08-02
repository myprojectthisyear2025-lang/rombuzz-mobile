/**
 * ============================================================================
 * 📁 File: src/features/performance/viewProfile/rbzViewProfileCache.ts
 * 🎯 Purpose: Stale-first View Profile cache + quiet refresh helpers
 *
 * Why:
 *  - View Profile should open instantly from cache when available.
 *  - Fresh backend data should refresh quietly in the background.
 *  - R2 signed URLs should not cause avatar/gallery blinking when only the
 *    query signature changed but the underlying media key stayed the same.
 * ============================================================================
 */

import { rbzApiJson } from "@/src/performance/api/rbzApiClient";
import {
  rbzCacheGet,
  rbzCacheKey,
  rbzCacheSet,
} from "@/src/performance/cache/rbzCache";

const VIEW_PROFILE_CACHE_PREFIX = "RBZ_PERF_VIEW_PROFILE";
const VIEW_PROFILE_CACHE_MAX_AGE_MS = 90 * 60 * 1000;

type CachedViewProfileBundle = {
  profile: any;
  stories: any[];
  savedAt?: number;
};

function viewProfileCacheKey(userId: string) {
  return rbzCacheKey(VIEW_PROFILE_CACHE_PREFIX, userId);
}

function stripSignedUrlQuery(value: any) {
  return String(value || "").split("?")[0].split("#")[0].trim();
}

function getStreamUid(entry: any) {
  if (!entry || typeof entry === "string") return "";

  return String(
    entry?.streamUid ||
      entry?.uid ||
      entry?.cloudflareStream?.uid ||
      ""
  ).trim();
}

function getMediaUrl(entry: any) {
  if (typeof entry === "string") return String(entry || "").trim();

  return String(
    entry?.url ||
      entry?.mediaUrl ||
      entry?.fileUrl ||
      entry?.secureUrl ||
      entry?.secure_url ||
      entry?.src ||
      entry?.imageUrl ||
      entry?.photoUrl ||
      entry?.videoUrl ||
      entry?.playback?.hls ||
      entry?.playback?.dash ||
      ""
  ).trim();
}

function getStableMediaKey(entry: any) {
  if (typeof entry === "string") return stripSignedUrlQuery(entry);

  const url = getMediaUrl(entry);

  return String(
    entry?.streamUid ||
      entry?.cloudflareStream?.uid ||
      entry?.r2Key ||
      entry?.key ||
      entry?.mediaId ||
      entry?.id ||
      entry?._id ||
      stripSignedUrlQuery(url)
  ).trim();
}

function preserveSignedUrl(oldValue: any, freshValue: any) {
  const oldUrl = String(oldValue || "").trim();
  const freshUrl = String(freshValue || "").trim();

  if (!oldUrl || !freshUrl) return freshUrl || oldUrl;

  const oldBase = stripSignedUrlQuery(oldUrl);
  const freshBase = stripSignedUrlQuery(freshUrl);

  if (oldBase && freshBase && oldBase === freshBase) {
    return oldUrl;
  }

  return freshUrl;
}

function mergeMediaArray(oldItems: any[], freshItems: any[]) {
  if (!Array.isArray(freshItems)) return [];

  const oldByKey = new Map<string, any>();

  if (Array.isArray(oldItems)) {
    oldItems.forEach((item) => {
      const key = getStableMediaKey(item);
      if (key) oldByKey.set(key, item);
    });
  }

  return freshItems.map((freshItem) => {
    if (!freshItem || typeof freshItem === "string") return freshItem;

    const key = getStableMediaKey(freshItem);
    const oldItem = key ? oldByKey.get(key) : null;

    if (!oldItem || typeof oldItem === "string") return freshItem;

    return {
      ...freshItem,
      url: preserveSignedUrl(oldItem.url, freshItem.url),
      mediaUrl: preserveSignedUrl(oldItem.mediaUrl, freshItem.mediaUrl),
      fileUrl: preserveSignedUrl(oldItem.fileUrl, freshItem.fileUrl),
      imageUrl: preserveSignedUrl(oldItem.imageUrl, freshItem.imageUrl),
      photoUrl: preserveSignedUrl(oldItem.photoUrl, freshItem.photoUrl),
      videoUrl: preserveSignedUrl(oldItem.videoUrl, freshItem.videoUrl),
      thumbnailUrl: preserveSignedUrl(oldItem.thumbnailUrl, freshItem.thumbnailUrl),
      thumbnail: preserveSignedUrl(oldItem.thumbnail, freshItem.thumbnail),
      poster: preserveSignedUrl(oldItem.poster, freshItem.poster),
      previewUrl: preserveSignedUrl(oldItem.previewUrl, freshItem.previewUrl),
    };
  });
}

function mergeUserWithoutMediaBlink(oldUser: any, freshUser: any) {
  if (!freshUser) return freshUser;
  if (!oldUser) return freshUser;

  return {
    ...freshUser,
    avatar: preserveSignedUrl(oldUser.avatar, freshUser.avatar),
    voiceUrl: preserveSignedUrl(oldUser.voiceUrl, freshUser.voiceUrl),
    voiceIntro: preserveSignedUrl(oldUser.voiceIntro, freshUser.voiceIntro),
    media: mergeMediaArray(oldUser.media, freshUser.media),
    photos: mergeMediaArray(oldUser.photos, freshUser.photos),
    reels: mergeMediaArray(oldUser.reels, freshUser.reels),
    gallery: mergeMediaArray(oldUser.gallery, freshUser.gallery),
    uploads: mergeMediaArray(oldUser.uploads, freshUser.uploads),
  };
}

export function mergeStableViewProfile(oldProfile: any, freshProfile: any) {
  if (!freshProfile) return freshProfile;
  if (!oldProfile) return freshProfile;

  return {
    ...freshProfile,
    user: mergeUserWithoutMediaBlink(oldProfile?.user, freshProfile?.user),
  };
}

export async function readCachedViewProfile(userId: string) {
  const key = viewProfileCacheKey(userId);

  const cached = await rbzCacheGet<CachedViewProfileBundle | null>(key, null);

  if (!cached.hit || !cached.value?.profile?.user) return null;

  const savedAt = Number(cached.savedAt || cached.value?.savedAt || 0) || 0;

  if (savedAt && Date.now() - savedAt > VIEW_PROFILE_CACHE_MAX_AGE_MS) {
    return null;
  }

  return cached.value;
}

function pickProfileUser(raw: any) {
  if (!raw || typeof raw !== "object") return null;

  const user =
    raw?.user ||
    raw?.profile ||
    raw?.matchedUser ||
    raw?.peer ||
    raw?.otherUser ||
    raw?.target ||
    raw;

  if (!user || typeof user !== "object") return null;

  const id = String(user?.id || user?._id || user?.userId || "").trim();
  if (!id) return null;

  return {
    ...user,
    id,
  };
}

function removeUndefinedFields(input: any) {
  const out: any = {};

  Object.keys(input || {}).forEach((key) => {
    if (input[key] !== undefined) {
      out[key] = input[key];
    }
  });

  return out;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function writeCachedViewProfileFromUser(
  rawUser: any,
  options: {
    matched?: boolean;
    stories?: any[];
  } = {}
) {
  const user = pickProfileUser(rawUser);
  if (!user?.id) return null;

  const existing = await readCachedViewProfile(user.id).catch(() => null);
  const existingUser = existing?.profile?.user || {};

  const nextUser = {
    ...existingUser,
    ...removeUndefinedFields(user),

    // Do not let lightweight match/discover rows erase richer cached media.
    media: Array.isArray(user.media) ? user.media : existingUser.media || [],
    photos: Array.isArray(user.photos) ? user.photos : existingUser.photos || [],
    reels: Array.isArray(user.reels) ? user.reels : existingUser.reels || [],
    gallery: Array.isArray(user.gallery) ? user.gallery : existingUser.gallery || [],
    uploads: Array.isArray(user.uploads) ? user.uploads : existingUser.uploads || [],
  };

  const bundle: CachedViewProfileBundle = {
    profile: {
      ...(existing?.profile || {}),
      user: nextUser,
      matched:
        typeof options.matched === "boolean"
          ? options.matched
          : !!existing?.profile?.matched,
    },
    stories: Array.isArray(options.stories)
      ? options.stories
      : Array.isArray(existing?.stories)
      ? existing.stories
      : [],
    savedAt: Date.now(),
  };

  await rbzCacheSet(viewProfileCacheKey(user.id), bundle);

  return bundle;
}

export async function fetchFreshViewProfile(userId: string) {
  const encodedUserId = encodeURIComponent(String(userId || ""));

  if (!encodedUserId) {
    throw new Error("Missing profile id");
  }

  // This is the only request that should be allowed to control first render.
  const profileData = await rbzApiJson<any>(`/users/${encodedUserId}`);

  if (!profileData?.user) {
    throw new Error("Profile unavailable");
  }

  const cached = await readCachedViewProfile(userId).catch(() => null);

  // Stories are nice-to-have. They must never hold View Profile hostage.
  const storiesData = await withTimeout<any>(
    rbzApiJson<any>(`/stories/${encodedUserId}`),
    650,
    null
  );

  const stories = Array.isArray(storiesData?.stories)
    ? storiesData.stories
    : Array.isArray(cached?.stories)
    ? cached.stories
    : [];

  const bundle: CachedViewProfileBundle = {
    profile: {
      ...profileData,
      matched: !!profileData?.matched,
    },
    stories,
    savedAt: Date.now(),
  };

  await rbzCacheSet(viewProfileCacheKey(userId), bundle);

  return bundle;
}

export function getDirectStreamThumbnailUrl(streamUid: string) {
  const uid = String(streamUid || "").replace(/[^a-zA-Z0-9_-]/g, "").trim();
  if (!uid) return "";

  return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;
}
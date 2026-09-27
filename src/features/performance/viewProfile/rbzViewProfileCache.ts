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
import { preserveMediaUrl as preserveSignedUrl } from "./preserveMediaUrl";
import { getSessionSnapshot } from "@/src/features/auth/rbzSession";
import {
  rbzCacheGet,
  rbzCacheKey,
  rbzCacheSet,
  rbzCacheRemove,
} from "@/src/performance/cache/rbzCache";

const VIEW_PROFILE_CACHE_PREFIX = "RBZ_PERF_VIEW_PROFILE_V2";
const VIEW_PROFILE_CACHE_MAX_AGE_MS = 90 * 60 * 1000;

type CachedViewProfileBundle = {
  profile: any;
  savedAt?: number;
  complete: boolean;
};

function viewProfileCacheKey(userId: string) {
  const account = getSessionSnapshot().user;
  return rbzCacheKey(VIEW_PROFILE_CACHE_PREFIX, String(account?.id || account?._id || "signed-out"), userId);
}

export function clearCachedViewProfile(userId: string) {
  return rbzCacheRemove(viewProfileCacheKey(userId));
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

export async function writeCachedViewProfileFromUser(
  rawUser: any,
  options: {
    matched?: boolean;
  } = {}
) {
  const user = pickProfileUser(rawUser);
  if (!user?.id) return null;

  const key = viewProfileCacheKey(user.id);
  const token = getSessionSnapshot().token;

  const existing = await readCachedViewProfile(user.id).catch(() => null);
  // A /matches row is a preview, even when it supplies empty media arrays.
  // It cannot downgrade or extend the lifetime of an authoritative profile.
  if (existing?.complete) return existing;
  const existingUser = existing?.profile?.user || {};

  const nextUser = {
    ...existingUser,
    ...removeUndefinedFields(user),

  };

  const bundle: CachedViewProfileBundle = {
    complete: false,
    profile: {
      ...(existing?.profile || {}),
      user: nextUser,
      matched:
        typeof options.matched === "boolean"
          ? options.matched
          : !!existing?.profile?.matched,
    },
    savedAt: Date.now(),
  };

  if (getSessionSnapshot().token === token) await rbzCacheSet(key, bundle);

  return bundle;
}

export async function fetchFreshViewProfile(userId: string, signal?: AbortSignal) {
  const key = viewProfileCacheKey(userId);
  const token = getSessionSnapshot().token;
  const encodedUserId = encodeURIComponent(String(userId || ""));

  if (!encodedUserId) {
    throw new Error("Missing profile id");
  }

  // This is the only request that should be allowed to control first render.
  const profileData = await rbzApiJson<any>(`/users/${encodedUserId}`, { signal });

  if (!profileData?.user || String(profileData.user.id || profileData.user._id || "") !== userId) {
    throw new Error("Invalid profile response");
  }

  const bundle: CachedViewProfileBundle = {
    complete: true,
    profile: {
      ...profileData,
      matched: !!profileData?.matched,
    },
    savedAt: Date.now(),
  };

  // Never block first render on AsyncStorage persistence.
  if (!signal?.aborted && getSessionSnapshot().token === token) rbzCacheSet(
    key,
    bundle
  ).catch(() => {});

  return bundle;
}

export function getDirectStreamThumbnailUrl(streamUid: string) {
  const uid = String(streamUid || "").replace(/[^a-zA-Z0-9_-]/g, "").trim();
  if (!uid) return "";

  return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;
}

/**
 * ============================================================
 * 📁 File: src/features/performance/useCachedDiscoverDeck.ts
 * 🎯 Purpose: Stale-first Discover deck cache + image prefetch
 *
 * Rules:
 *  - Keeps Discover cold-start fast after app kill/reopen
 *  - Uses AsyncStorage, NOT SecureStore, because deck payloads are not secrets
 *  - Does not own network fetching
 *  - Does not touch swipe/Buzz/Skip/Profile behavior
 * ============================================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { rbzCacheKey } from "@/src/performance/cache/rbzCache";
import { useCallback } from "react";
import { Image } from "react-native";

export type DiscoverDeckCacheInput = {
  filters: Record<string, any>;
  lookingFor: string;
  phase: "strict" | "fallback";
  expanded: boolean;
};

type CachedDiscoverDeck = {
  users: any[];
};

type DiscoverDeckEnvelope = {
  value: CachedDiscoverDeck;
  savedAt: number;
};

const DISCOVER_DECK_CACHE_PREFIX = "rbz:discover:deck:v4";
const DISCOVER_LAST_DECK_CACHE_KEY = "rbz:discover:deck:v4:last";

const MAX_CACHED_DISCOVER_USERS = 6;
const MAX_CACHED_IMAGES_PER_USER = 2;

function stableStringify(value: any): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function hashText(value: string) {
  let hash = 5381;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }

  return String(hash >>> 0);
}

export function getDiscoverDeckCacheKey(input: DiscoverDeckCacheInput) {
  return rbzCacheKey(
    DISCOVER_DECK_CACHE_PREFIX,
    input.phase,
    input.expanded ? "expanded" : "strict",
    input.lookingFor || "all",
    hashText(stableStringify(input.filters))
  );
}

function normalizeUrl(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function getUrlFromMediaEntry(entry: any) {
  if (typeof entry === "string") return normalizeUrl(entry);

  return normalizeUrl(
    entry?.url ||
      entry?.mediaUrl ||
      entry?.fileUrl ||
      entry?.secureUrl ||
      entry?.secure_url ||
      entry?.src ||
      entry?.imageUrl ||
      entry?.photoUrl ||
      entry?.videoUrl ||
      ""
  );
}

function isLikelyImageUrl(url: string) {
  const clean = String(url || "").split("?")[0].split("#")[0].toLowerCase();
  if (!clean) return false;

  return !/\.(mp4|mov|m4v|webm|m3u8)$/i.test(clean);
}

function collectDiscoverUserImages(user: any) {
  const seen = new Set<string>();
  const urls: string[] = [];

  const push = (value: any) => {
    const url = normalizeUrl(value);
    if (!url || seen.has(url) || !isLikelyImageUrl(url)) return;

    seen.add(url);
    urls.push(url);
  };

  push(user?.avatar);

  if (Array.isArray(user?.media)) {
    user.media.forEach((entry: any) => push(getUrlFromMediaEntry(entry)));
  }

  if (Array.isArray(user?.photos)) {
    user.photos.forEach((entry: any) => push(getUrlFromMediaEntry(entry)));
  }

  return urls;
}

function compactDiscoverUser(user: any) {
  if (!user) return null;

  const imageUrls = collectDiscoverUserImages(user).slice(
    0,
    MAX_CACHED_IMAGES_PER_USER
  );

  const avatar = normalizeUrl(user?.avatar) || imageUrls[0] || "";
  const id = String(user?.id || user?._id || "").trim();

  if (!id) return null;
  if (!avatar && imageUrls.length === 0) return null;

  return {
    id,
    _id: String(user?._id || id),
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    avatar,
    media: imageUrls.map((url) => ({ url, privacy: "public" })),
    photos: [],
    dob: user?.dob || null,
    city: user?.city || "",
    bio: user?.bio || "",
    height: user?.height || "",
    orientation: user?.orientation || "",
    interests: Array.isArray(user?.interests) ? user.interests.slice(0, 6) : [],
    hobbies: Array.isArray(user?.hobbies) ? user.hobbies.slice(0, 6) : [],
    favorites: Array.isArray(user?.favorites) ? user.favorites.slice(0, 20) : [],
    distanceMeters:
      typeof user?.distanceMeters === "number" ? user.distanceMeters : null,
    distanceText:
      typeof user?.distanceText === "string" ? user.distanceText : "",
    isOnline: !!user?.isOnline,
    status: user?.status || "inactive",
    fieldVisibility:
      user?.fieldVisibility && typeof user.fieldVisibility === "object"
        ? user.fieldVisibility
        : {},
    visibilityMode: user?.visibilityMode || "full",
  };
}

function compactDiscoverUsers(users: any[]) {
  return (Array.isArray(users) ? users : [])
    .map(compactDiscoverUser)
    .filter(Boolean)
    .slice(0, MAX_CACHED_DISCOVER_USERS);
}

async function readDiscoverDeckKey(key: string) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { hit: false, users: [], savedAt: 0 };

    const parsed = JSON.parse(raw) as DiscoverDeckEnvelope;
    const users = Array.isArray(parsed?.value?.users) ? parsed.value.users : [];

    return {
      hit: users.length > 0,
      users,
      savedAt: Number(parsed?.savedAt || 0) || 0,
    };
  } catch {
    return { hit: false, users: [], savedAt: 0 };
  }
}

export async function hydrateDiscoverDeckCache(input: DiscoverDeckCacheInput) {
  const exactKey = getDiscoverDeckCacheKey(input);
  const exact = await readDiscoverDeckKey(exactKey);

  if (exact.hit) return exact;

  return readDiscoverDeckKey(DISCOVER_LAST_DECK_CACHE_KEY);
}

export async function saveDiscoverDeckCache(
  input: DiscoverDeckCacheInput,
  users: any[]
) {
  try {
    const cleanUsers = compactDiscoverUsers(users);
    if (!cleanUsers.length) return;

    const envelope: DiscoverDeckEnvelope = {
      value: { users: cleanUsers },
      savedAt: Date.now(),
    };

    const raw = JSON.stringify(envelope);
    const exactKey = getDiscoverDeckCacheKey(input);

    await Promise.allSettled([
      AsyncStorage.setItem(exactKey, raw),
      AsyncStorage.setItem(DISCOVER_LAST_DECK_CACHE_KEY, raw),
    ]);
  } catch {}
}

export function preloadDiscoverDeckImages(users: any[]) {
  const seen = new Set<string>();

  const preloadUrls = (Array.isArray(users) ? users : [])
    .slice(0, 5)
    .flatMap((user) => collectDiscoverUserImages(user).slice(0, 3))
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });

  preloadUrls.forEach((url) => {
    Image.prefetch(url).catch(() => {});
  });
}

export function useCachedDiscoverDeck() {
  const hydrateCachedDiscoverDeck = useCallback(
    async (input: DiscoverDeckCacheInput) => {
      return hydrateDiscoverDeckCache(input);
    },
    []
  );

  const saveCachedDiscoverDeck = useCallback(
    async (input: DiscoverDeckCacheInput, users: any[]) => {
      await saveDiscoverDeckCache(input, users);
    },
    []
  );

  const preloadDiscoverImages = useCallback((users: any[]) => {
    preloadDiscoverDeckImages(users);
  }, []);

  return {
    hydrateCachedDiscoverDeck,
    saveCachedDiscoverDeck,
    preloadDiscoverImages,
  };
}
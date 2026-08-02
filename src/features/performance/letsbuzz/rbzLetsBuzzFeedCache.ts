import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "react-native";

const RBZ_LETSBUZZ_FEED_CACHE_KEY = "rbz:letsbuzz:feed:v1";
const RBZ_LETSBUZZ_ME_ID_CACHE_KEY = "rbz:letsbuzz:meId:v1";
const MAX_CACHE_ITEMS = 80;

export type CachedLetsBuzzFeed = {
  items: any[];
  savedAt: number;
};

function safeString(value: any) {
  return String(value || "").trim();
}

function getAvatarUrl(user: any) {
  const direct =
    user?.avatar ||
    user?.avatarUrl ||
    user?.photoUrl ||
    user?.profilePic ||
    user?.photos?.[0];

  if (typeof direct === "string") return direct;

  if (direct && typeof direct === "object") {
    return safeString(
      direct.url ||
        direct.mediaUrl ||
        direct.secureUrl ||
        direct.secure_url ||
        direct.thumbnailUrl
    );
  }

  return "";
}

function isHttpUrl(value: any) {
  const url = safeString(value);
  return url.startsWith("http://") || url.startsWith("https://");
}

export async function readCachedLetsBuzzFeed(): Promise<CachedLetsBuzzFeed | null> {
  try {
    const raw = await AsyncStorage.getItem(RBZ_LETSBUZZ_FEED_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];

    if (!items.length) return null;

    return {
      items,
      savedAt: Number(parsed?.savedAt || 0),
    };
  } catch {
    return null;
  }
}

export async function writeCachedLetsBuzzFeed(items: any[]) {
  try {
    if (!Array.isArray(items)) return;

    const payload: CachedLetsBuzzFeed = {
      items: items.slice(0, MAX_CACHE_ITEMS),
      savedAt: Date.now(),
    };

    await AsyncStorage.setItem(
      RBZ_LETSBUZZ_FEED_CACHE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // Cache must never break LetsBuzz.
  }
}

export function preloadLetsBuzzFeedImages(items: any[], limit = 8) {
  try {
    const urls = new Set<string>();

    items.slice(0, limit).forEach((item) => {
      const mediaUrl = safeString(item?.mediaUrl || item?.url);
      const thumbnailUrl = safeString(
        item?.thumbnailUrl ||
          item?.cloudflareStream?.thumbnailUrl ||
          item?.playback?.thumbnail
      );
      const avatarUrl = getAvatarUrl(item?.user);

      if (isHttpUrl(mediaUrl)) urls.add(mediaUrl);
      if (isHttpUrl(thumbnailUrl)) urls.add(thumbnailUrl);
      if (isHttpUrl(avatarUrl)) urls.add(avatarUrl);
    });

    urls.forEach((url) => {
      Image.prefetch(url).catch(() => {});
    });
  } catch {
    // Preload is best-effort only.
  }
}
export async function readCachedLetsBuzzMeId() {
  try {
    return safeString(await AsyncStorage.getItem(RBZ_LETSBUZZ_ME_ID_CACHE_KEY));
  } catch {
    return "";
  }
}

export async function writeCachedLetsBuzzMeId(meId: string) {
  try {
    const safeId = safeString(meId);
    if (!safeId) return;

    await AsyncStorage.setItem(RBZ_LETSBUZZ_ME_ID_CACHE_KEY, safeId);
  } catch {
    // Cache must never break LetsBuzz.
  }
}
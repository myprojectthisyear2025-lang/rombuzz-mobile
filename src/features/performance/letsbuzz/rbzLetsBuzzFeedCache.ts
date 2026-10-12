import { observeCacheReader } from "@/src/performance/diagnostics/cache";
import { rbzCacheGet, rbzCacheSet } from "@/src/performance/cache/rbzCache";
import { getSessionSnapshot, getSessionGeneration, isSessionCurrent } from "@/src/features/auth/rbzSession";
import { Image } from "react-native";

const RBZ_LETSBUZZ_FEED_CACHE_KEY = "rbz:letsbuzz:feed:v1";
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

async function readCachedLetsBuzzFeedUnobserved(): Promise<CachedLetsBuzzFeed | null> {
  try {
    const cached = await rbzCacheGet<CachedLetsBuzzFeed | null>(RBZ_LETSBUZZ_FEED_CACHE_KEY, null);
    const parsed = cached.value;
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

export async function writeCachedLetsBuzzFeed(items: any[], owner = getSessionGeneration()) {
  try {
    if (!isSessionCurrent(owner) || !Array.isArray(items)) return;

    const payload: CachedLetsBuzzFeed = {
      items: items.slice(0, MAX_CACHE_ITEMS),
      savedAt: Date.now(),
    };

    await rbzCacheSet(RBZ_LETSBUZZ_FEED_CACHE_KEY, payload);
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
  const session = getSessionSnapshot();
  return session.token ? safeString(session.user?.id || session.user?._id) : "";
}

export async function writeCachedLetsBuzzMeId(_meId: string) {
  // Identity comes only from the authenticated session, never a feed cache.
}
export const readCachedLetsBuzzFeed = observeCacheReader("letsbuzz-feed", readCachedLetsBuzzFeedUnobserved);

import { preserveMediaUrl } from "@/src/features/performance/viewProfile/preserveMediaUrl";

export const discoverUserId = (user: any) => String(user?.id || user?._id || "");
const urlFields = ["url", "mediaUrl", "fileUrl", "secureUrl", "secure_url", "src", "imageUrl", "photoUrl", "videoUrl"];
const mediaUrl = (entry: any) => typeof entry === "string" ? entry : urlFields.map(key => entry?.[key]).find(Boolean);
const identity = (url: any) => String(url || "").split("?")[0];

// Cached decks compact media (and omit its IDs). Match by asset as well as ID,
// keeping only URLs that are still valid; fresh visibility/metadata always wins.
function mergeUser(previous: any, fresh: any) {
  const oldMedia = [...(previous.media || []), ...(previous.photos || []), previous.avatar];
  const merge = (items: any[]) => items.map(item => {
    const old = oldMedia.find(entry => identity(mediaUrl(entry)) === identity(mediaUrl(item)));
    if (!old) return item;
    if (typeof item === "string") return preserveMediaUrl(mediaUrl(old), item);
    const next = { ...item };
    for (const field of urlFields) {
      if (item[field]) next[field] = preserveMediaUrl(mediaUrl(old), item[field]);
    }
    return next;
  });
  return { ...fresh, avatar: fresh.avatar ? preserveMediaUrl(previous.avatar, fresh.avatar) : fresh.avatar,
    ...(Array.isArray(fresh.media) ? { media: merge(fresh.media) } : {}),
    ...(Array.isArray(fresh.photos) ? { photos: merge(fresh.photos) } : {}) };
}

export function reconcileDiscoverDeck(previous: any[], fresh: any[]) {
  const byId = new Map(previous.map(user => [discoverUserId(user), user]));
  const merged = fresh.map(user => byId.has(discoverUserId(user)) ? mergeUser(byId.get(discoverUserId(user)), user) : user);
  const currentId = discoverUserId(previous[0]);
  const index = merged.findIndex(user => discoverUserId(user) === currentId);
  if (index > 0) merged.unshift(...merged.splice(index, 1));
  return merged;
}

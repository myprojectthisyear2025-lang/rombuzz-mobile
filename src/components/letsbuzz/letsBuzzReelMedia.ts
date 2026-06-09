/**
 * ============================================================================
 * 📁 File: src/components/letsbuzz/letsBuzzReelMedia.ts
 * 🎯 Purpose: Normalize LetsBuzz gallery-backed reels for Cloudinary + Stream
 *
 * Supports:
 *  - old Cloudinary reels via mediaUrl/url
 *  - new Cloudflare Stream profile_reel via streamUid/playback
 *
 * Rules:
 *  - No uploading here.
 *  - No chat_video support here.
 *  - Private reels are excluded from LetsBuzz.
 *  - Public and matched-only profile reels may appear if backend feed allows them.
 * ============================================================================
 */

export type LetsBuzzNormalizedReel = {
  id: string;
  mediaId: string;
  userId: string;
  mediaUrl: string;
  type: "video";
  caption: string;
  text: string;
  createdAt: any;
  privacy: "public" | "matches" | "private";
  user?: any;

  fromGallery: true;
  sourceType: "gallery";

  provider?: string;
  storage?: string;
  streamUid?: string;
  playback?: any;
  thumbnailUrl?: string;
  cloudflareStream?: any;
  status?: string;
  duration?: number;

  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
};

export function hasCaptionTag(caption: any, tag: string) {
  return String(caption || "")
    .toLowerCase()
    .includes(String(tag || "").toLowerCase());
}

export function stripCaptionTags(caption: any) {
  return String(caption || "")
    .replace(/\b(?:kind|scope|intent):[^\s]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function getStreamUid(item: any) {
  return String(
    item?.streamUid ||
      item?.uid ||
      item?.cloudflareStream?.uid ||
      ""
  ).trim();
}

export function isCloudflareStreamReel(item: any) {
  return (
    String(item?.provider || item?.storage || "").toLowerCase() ===
      "cloudflare_stream" ||
    !!getStreamUid(item)
  );
}

export function getReelPlayableUrl(item: any) {
  return String(
    item?.mediaUrl ||
      item?.url ||
      item?.videoUrl ||
      item?.secureUrl ||
      item?.secure_url ||
      item?.playback?.hls ||
      item?.playback?.dash ||
      ""
  ).trim();
}

export function inferReelPrivacy(item: any) {
  const caption = String(item?.caption || "");

  if (hasCaptionTag(caption, "scope:private")) return "private";
  if (hasCaptionTag(caption, "scope:matches")) return "matches";
  if (hasCaptionTag(caption, "scope:matched")) return "matches";
  if (hasCaptionTag(caption, "scope:public")) return "public";

  const privacy = String(item?.privacy || "").toLowerCase();
  if (privacy === "private") return "private";
  if (privacy === "matches" || privacy === "matched") return "matches";

  return "public";
}

export function normalizeLetsBuzzReel(item: any): LetsBuzzNormalizedReel | null {
  const mediaId = String(item?.id || item?._id || item?.mediaId || "").trim();
  const userId = String(item?.userId || item?.ownerId || "").trim();
  const caption = String(item?.caption || "");
  const streamUid = getStreamUid(item);
  const mediaUrl = getReelPlayableUrl(item);
  const isStream = isCloudflareStreamReel(item);
  const privacy = inferReelPrivacy(item);

  if (!mediaId && !streamUid) return null;
  if (!userId) return null;
  if (privacy === "private") return null;

  return {
    ...item,
    id: mediaId || streamUid,
    mediaId: mediaId || streamUid,
    userId,
    mediaUrl,
    type: "video",
    caption,
    text: stripCaptionTags(caption),
    createdAt: item?.createdAt,
    privacy,
    user: item?.user,

    fromGallery: true,
    sourceType: "gallery",

    provider: item?.provider,
    storage: item?.storage,
    streamUid,
    playback: item?.playback,
    thumbnailUrl: item?.thumbnailUrl,
    cloudflareStream: item?.cloudflareStream,
    status: item?.status || item?.cloudflareStream?.status,
    duration: Number(item?.duration || item?.cloudflareStream?.duration || 0),

    likesCount: Number(item?.likesCount || 0),
    commentsCount: Number(item?.commentsCount || 0),
    isLiked: !!item?.isLiked,
  };
}

export function shouldShowInLetsBuzzReels(item: LetsBuzzNormalizedReel, myId = "") {
  const caption = String(item?.caption || "").toLowerCase();
  const type = String(item?.type || "").toLowerCase();
  const hasMediaOrStream = !!getReelPlayableUrl(item) || !!getStreamUid(item);

  const isVideo = type === "video" || type === "reel" || isCloudflareStreamReel(item);
  const isReelTag = caption.includes("kind:reel");
  const isLetsBuzz = caption.includes("intent:letsbuzz");
  const isAllowedPrivacy = item.privacy === "public" || item.privacy === "matches";
  const notMine = !myId || String(item.userId) !== String(myId);

  return hasMediaOrStream && isVideo && isReelTag && isLetsBuzz && isAllowedPrivacy && notMine;
}
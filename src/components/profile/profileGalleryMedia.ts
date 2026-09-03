/**
 * ============================================================
 * 📁 File: src/components/profile/profileGalleryMedia.ts
 * 🎯 Purpose: Keep Profile gallery media normalization out of profile.tsx
 *
 * Handles:
 *  - legacy signup photos
 *  - R2 gallery photos
 *  - old Cloudinary reels/videos
 *  - new Cloudflare Stream profile_reel items
 *
 * Important:
 *  - Does not upload anything.
 *  - Does not touch chat videos.
 *  - Does not remove Cloudinary fallback.
 * ============================================================
 */
import { dedupeProfileGalleryMedia } from "./profileGalleryIdentity";
export type ProfileGalleryMediaItem = {
  id: string;
  url: string;
  mediaUrl?: string;
  fileUrl?: string;
  videoUrl?: string;
  type: "image" | "video";
  caption: string;
  privacy: any;
  createdAt: any;

  provider?: string;
  storage?: string;
  streamUid?: string;
  playback?: any;
  thumbnailUrl?: string;
  cloudflareStream?: any;
  status?: string;
  duration?: number;
};

export function normalizeImageUrl(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function getCaption(entry: any) {
  return String(entry?.caption || "").toLowerCase();
}

function getType(entry: any) {
  return String(entry?.type || entry?.mediaType || "").toLowerCase();
}

function getStreamUid(entry: any) {
  return String(
    entry?.streamUid ||
      entry?.uid ||
      entry?.cloudflareStream?.uid ||
      ""
  ).trim();
}

function isCloudflareStreamMedia(entry: any) {
  return (
    String(entry?.provider || entry?.storage || "").toLowerCase() ===
      "cloudflare_stream" ||
    !!getStreamUid(entry)
  );
}

function isVideoLike(entry: any) {
  if (!entry || typeof entry === "string") return false;

  const type = getType(entry);
  const caption = getCaption(entry);
  const url = extractMediaUrl(entry).toLowerCase();

  return (
    isCloudflareStreamMedia(entry) ||
    type === "video" ||
    type === "reel" ||
    type.includes("video") ||
    type.includes("reel") ||
    caption.includes("kind:reel") ||
    caption.includes("kind:video") ||
    /\.(mp4|mov|m4v|webm|m3u8)(\?|#|$)/i.test(url)
  );
}

export function extractImageUrl(entry: any) {
  if (typeof entry === "string") return normalizeImageUrl(entry);
  if (!entry || isVideoLike(entry)) return "";

  return String(
    entry?.url ||
      entry?.mediaUrl ||
      entry?.fileUrl ||
      entry?.photoUrl ||
      entry?.imageUrl ||
      entry?.secureUrl ||
      entry?.secure_url ||
      ""
  ).trim();
}

export function extractMediaUrl(entry: any) {
  if (typeof entry === "string") return normalizeImageUrl(entry);

  return String(
    entry?.url ||
      entry?.mediaUrl ||
      entry?.fileUrl ||
      entry?.videoUrl ||
      entry?.photoUrl ||
      entry?.imageUrl ||
      entry?.secureUrl ||
      entry?.secure_url ||
      entry?.playback?.hls ||
      entry?.playback?.dash ||
      ""
  ).trim();
}

export function uniqueImageUrls(...lists: any[][]) {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const list of lists) {
    for (const item of Array.isArray(list) ? list : []) {
      const url = extractImageUrl(item);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
  }

  return urls;
}

function normalizeProfileMediaItem(m: any): ProfileGalleryMediaItem | null {
  const url = extractMediaUrl(m);
  const streamUid = getStreamUid(m);
  const isStream = isCloudflareStreamMedia(m);

  if (!url && !streamUid) return null;

  const type =
    isStream || isVideoLike(m)
      ? "video"
      : "image";

  return {
    ...m,
    id: String(m?.id || m?._id || streamUid || url),
    url,
    mediaUrl: m?.mediaUrl || url,
    fileUrl: m?.fileUrl || url,
    videoUrl: m?.videoUrl || url,
    type,
    caption: m?.caption || "",
    privacy: m?.privacy,
    createdAt: m?.createdAt,

    provider: m?.provider,
    storage: m?.storage,
    streamUid,
    playback: m?.playback,
    thumbnailUrl: m?.thumbnailUrl,
    cloudflareStream: m?.cloudflareStream,
    status: m?.status || m?.cloudflareStream?.status,
    duration: Number(m?.duration || m?.cloudflareStream?.duration || 0),
  };
}

export function buildProfileGalleryMedia(user: any): ProfileGalleryMediaItem[] {
  const signupPhotos = uniqueImageUrls(user?.photos).map((url: string, index: number) => ({
    id: `signup-photo-${index}`,
    url,
    mediaUrl: url,
    fileUrl: url,
    type: "image" as const,
    caption: "kind:photo scope:public intent:viewprofile",
    privacy: "public" as const,
    createdAt: 0,
  }));

  const profileMedia = (Array.isArray(user?.media) ? user.media : [])
    .map(normalizeProfileMediaItem)
    .filter(
      (item: ProfileGalleryMediaItem | null): item is ProfileGalleryMediaItem =>
        item !== null
    );

  return dedupeProfileGalleryMedia([...profileMedia, ...signupPhotos]);
}
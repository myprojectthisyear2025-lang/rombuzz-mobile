import { preserveMediaUrl } from "@/src/features/performance/viewProfile/preserveMediaUrl";
import type { ChatMediaRow } from "../mediaHub/chatMediaRows";

export function chatVideoThumbnail(item: Pick<ChatMediaRow, "url" | "thumbnailUrl">) {
  const thumbnail = String(item.thumbnailUrl || "").trim();
  if (/^https?:\/\//i.test(thumbnail) && !/\.(?:mp4|mov|m4v|webm|m3u8|mpd)(?:[?#]|$)/i.test(thumbnail)) return thumbnail;
  try {
    // Same URL contract as the backend's Cloudflare Stream playback builder.
    // Preserve the existing playback token/host; no playback API or raw-UID
    // fallback that could discard access restrictions.
    const url = new URL(item.url);
    if (!/(^|\.)(videodelivery\.net|cloudflarestream\.com)$/.test(url.hostname)) return "";
    if (!/^\/[^/]+\/manifest\/video\.(m3u8|mpd)$/.test(url.pathname)) return "";
    url.pathname = url.pathname.replace(/\/manifest\/video\.(m3u8|mpd)$/, "/thumbnails/thumbnail.jpg");
    return url.toString();
  } catch { return ""; }
}

function reusableThumbnail(value: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (!url.searchParams.has("X-Amz-Signature")) return true;
    const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(url.searchParams.get("X-Amz-Date") || "");
    const lifetime = Number(url.searchParams.get("X-Amz-Expires"));
    return !!match && lifetime > 0 && Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]) + lifetime * 1000 > Date.now() + 60000;
  } catch { return false; }
}

export function preserveChatVideoPreview(previous: ChatMediaRow | undefined, fresh: ChatMediaRow): ChatMediaRow {
  if (!previous || previous.id !== fresh.id || fresh.mediaType !== "video") return fresh;
  const oldPreview = chatVideoThumbnail(previous), freshPreview = chatVideoThumbnail(fresh);
  const sameVideo = previous.url === preserveMediaUrl(previous.url, fresh.url);
  const thumbnailUrl = freshPreview ? preserveMediaUrl(oldPreview, freshPreview) : sameVideo && reusableThumbnail(oldPreview) ? oldPreview : "";
  return { ...fresh, thumbnailUrl };
}

/**
 * 📁 File: src/components/profile/profileGalleryIdentity.ts
 * 🎯 Purpose: Deduplicate profile gallery items by stable Stream/R2 identity,
 * even when the API returns different short-lived signed URLs for one photo.
 */

const clean = (value: any) => String(value || "").trim();

function streamUid(item: any) {
  return clean(item?.streamUid || item?.uid || item?.cloudflareStream?.uid);
}

function r2Key(item: any) {
  return clean(item?.r2Key || item?.key);
}

function mediaUrl(item: any) {
  return clean(
    item?.url || item?.mediaUrl || item?.fileUrl || item?.videoUrl || item?.id
  );
}

function normalizedUrl(value: string) {
  const raw = clean(value);
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    return `${parsed.origin}${decodeURIComponent(parsed.pathname)}`;
  } catch {
    return raw.split("?")[0].split("#")[0];
  }
}

function urlContainsR2Key(url: string, key: string) {
  if (!url || !key) return false;

  try {
    const path = decodeURIComponent(new URL(url).pathname || "");
    return path === `/${key}` || path.endsWith(`/${key}`);
  } catch {
    return false;
  }
}

function sameProfileGalleryMedia(a: any, b: any) {
  const aStream = streamUid(a);
  const bStream = streamUid(b);
  if (aStream && bStream) return aStream === bStream;

  const aKey = r2Key(a);
  const bKey = r2Key(b);
  if (aKey && bKey) return aKey === bKey;

  const aUrl = mediaUrl(a);
  const bUrl = mediaUrl(b);

  if (aKey && urlContainsR2Key(bUrl, aKey)) return true;
  if (bKey && urlContainsR2Key(aUrl, bKey)) return true;

  const aNormalized = normalizedUrl(aUrl);
  const bNormalized = normalizedUrl(bUrl);

  return !!aNormalized && aNormalized === bNormalized;
}

export function dedupeProfileGalleryMedia<T>(items: T[]): T[] {
  return items.filter(
    (item, index, arr) =>
      arr.findIndex((candidate) =>
        sameProfileGalleryMedia(candidate, item)
      ) === index
  );
}
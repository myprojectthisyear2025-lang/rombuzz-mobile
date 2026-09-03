/**
 * 📁 File: src/components/profile/Gallery/deleteProfileGalleryMedia.ts
 * 🎯 Purpose: Send a permanent gallery-delete request with enough stable media
 * identity for the backend to remove legacy photos, real media, and storage.
 */

type ApiJson = (
  path: string,
  method: string,
  body: any
) => Promise<any>;

export async function deleteProfileGalleryMedia(
  apiJson: ApiJson,
  item: any
) {
  const mediaId = String(item?.id || "").trim();

  if (!mediaId) {
    throw new Error("Missing media id");
  }

  return apiJson(
    `/media/${encodeURIComponent(mediaId)}`,
    "DELETE",
    {
      mediaUrl:
        item?.url ||
        item?.mediaUrl ||
        item?.fileUrl ||
        item?.videoUrl ||
        "",

      r2Key:
        item?.r2Key ||
        item?.key ||
        "",

      streamUid:
        item?.streamUid ||
        item?.uid ||
        item?.cloudflareStream?.uid ||
        "",
    }
  );
}
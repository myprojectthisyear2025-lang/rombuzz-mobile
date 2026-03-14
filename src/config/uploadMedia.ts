/**
 * ============================================================
 * 📁 File: src/config/uploadMedia.ts
 * 🎯 Purpose: Shared Cloudinary upload helper for mobile
 *
 * Used by:
 *  - Profile avatar upload
 *  - Gallery photo upload
 *  - Gallery reel upload
 *
 * NOTE:
 *  - Uses unsigned upload (same as your existing flow)
 *  - Returns secure_url
 * ============================================================
 */

export async function uploadToCloudinaryUnsigned(
  fileUri: string,
  resourceType: "image" | "video" | "audio"
): Promise<string> {
  const CLOUD_NAME = "drhx99m5f";
  const UPLOAD_PRESET = "rombuzz_unsigned";

  // Cloudinary uploads audio under the "video" resource type in most setups
  const endpointResource = resourceType === "audio" ? "video" : resourceType;

  const formData = new FormData();

  const name =
    resourceType === "video"
      ? "upload.mp4"
      : resourceType === "audio"
      ? "upload.m4a"
      : "upload.jpg";

  const type =
    resourceType === "video"
      ? "video/mp4"
      : resourceType === "audio"
      ? "audio/m4a"
      : "image/jpeg";

  formData.append("file", {
    uri: fileUri,
    name,
    type,
  } as any);

  formData.append("upload_preset", UPLOAD_PRESET);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpointResource}/upload`;

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const json = await res.json();

  if (!json.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  return json.secure_url;
}

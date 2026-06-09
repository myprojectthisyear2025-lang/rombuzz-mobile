/**
 * ============================================================
 * 📁 File: src/config/uploadMedia.ts
 * 🎯 Purpose: Shared RomBuzz mobile media upload helper.
 *
 * Launch storage plan:
 *  - images → backend → private Cloudflare R2
 *  - audio  → backend → private Cloudflare R2
 *  - video  → Cloudflare Stream direct creator upload
 *
 * Important:
 *  - uploadToCloudinaryUnsigned() stays for old screens.
 *  - uploadRomBuzzMedia() returns both signed URL and R2 key.
 *  - Chat must save the R2 key, not the temporary signed URL.
 *  - New videos/reels save Cloudflare Stream UID/provider metadata.
 * ============================================================
 */

import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/src/config/api";

export type UploadResourceType = "image" | "video" | "audio";
export type RomBuzzStorageProvider = "r2" | "cloudinary" | "cloudflare_stream";

export type RomBuzzUploadResult = {
  url: string;
  signedUrl: string;
  key: string;
  r2Key: string;
  storage: RomBuzzStorageProvider;
  provider?: RomBuzzStorageProvider;
  type: UploadResourceType;
  contentType?: string;
  size?: number;

  streamUid?: string;
  uid?: string;
  playback?: {
    hls?: string;
    dash?: string;
    iframe?: string;
  };
  thumbnailUrl?: string;
  duration?: number;
  status?: "processing" | "ready" | "failed" | string;
  requireSignedURLs?: boolean;
  purpose?: string;
  context?: string;
  cloudflareStream?: {
    uid?: string;
    provider?: string;
    purpose?: string;
    context?: string;
    status?: string;
    duration?: number;
    requireSignedURLs?: boolean;
  };
};

function getFilename(resourceType: UploadResourceType) {
  if (resourceType === "audio") return "upload.m4a";
  if (resourceType === "video") return "upload.mp4";
  return "upload.jpg";
}

function getMimeType(resourceType: UploadResourceType) {
  if (resourceType === "audio") return "audio/m4a";
  if (resourceType === "video") return "video/mp4";
  return "image/jpeg";
}

function getR2Purpose(resourceType: UploadResourceType) {
  if (resourceType === "audio") return "chat-audio";
  return "gallery-photo";
}

async function getTokenOrThrow() {
  const token = await SecureStore.getItemAsync("RBZ_TOKEN");
  if (!token) {
    throw new Error("Session expired. Please log in again.");
  }
  return token;
}

function normalizeUploadPrivacy(value?: string) {
  const text = String(value || "").trim().toLowerCase();

  if (
    text === "private" ||
    text === "hidden" ||
    text === "specific"
  ) {
    return "private";
  }

  if (
    text === "matches" ||
    text === "matched" ||
    text === "matched-only" ||
    text === "matched_only" ||
    text === "match-only" ||
    text === "match_only"
  ) {
    return "matches";
  }

  return "public";
}

function getStreamPlaybackUrl(json: any) {
  return String(
    json?.media?.playback?.hls ||
      json?.video?.playback?.hls ||
      json?.playback?.hls ||
      ""
  );
}

/**
 * Temporary legacy path for video/reels only.
 * Kept so old imports do not break while old Cloudinary videos still exist.
 */
async function uploadVideoToCloudinaryLegacy(fileUri: string): Promise<RomBuzzUploadResult> {
  const CLOUD_NAME = "drhx99m5f";
  const UPLOAD_PRESET = "rombuzz_unsigned";

  const formData = new FormData();

  formData.append("file", {
    uri: fileUri,
    name: "upload.mp4",
    type: "video/mp4",
  } as any);

  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.secure_url) {
    throw new Error(json?.error?.message || "Video upload failed");
  }

   return {
    url: String(json.secure_url),
    signedUrl: String(json.secure_url),
    key: "",
    r2Key: "",
    storage: "cloudinary",
    provider: "cloudinary",
    type: "video",
    contentType: "video/mp4",
    size: Number(json.bytes || 0),
  };
}

async function uploadVideoToCloudflareStream(
  fileUri: string,
  options: {
    purpose?: string;
    privacy?: string;
    caption?: string;
    context?: string;
    name?: string;
    filename?: string;
    requireSignedURLs?: boolean;
  } = {}
): Promise<RomBuzzUploadResult> {
  const token = await getTokenOrThrow();

  const privacy = normalizeUploadPrivacy(options.privacy || "matches");
  const filename = String(options.filename || options.name || "upload.mp4");

  const directRes = await fetch(`${API_BASE}/stream/direct-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      privacy,
      name: filename,
      context: options.context || "profile_reel",
      requireSignedURLs: options.requireSignedURLs,
    }),
  });

  const directJson = await directRes.json().catch(() => ({}));

  if (!directRes.ok || !directJson?.uploadURL || !directJson?.streamUid) {
    throw new Error(
      directJson?.error || "Failed to create Stream upload URL"
    );
  }

  const formData = new FormData();

  formData.append("file", {
    uri: fileUri,
    name: filename,
    type: "video/mp4",
  } as any);

  const uploadRes = await fetch(String(directJson.uploadURL), {
    method: "POST",
    body: formData,
  });

  const uploadJson = await uploadRes.json().catch(() => ({}));

  if (!uploadRes.ok) {
    throw new Error(
      uploadJson?.errors?.[0]?.message ||
        uploadJson?.error ||
        "Cloudflare Stream video upload failed"
    );
  }

  const streamUid = String(
    uploadJson?.result?.uid ||
      uploadJson?.uid ||
      directJson?.streamUid ||
      directJson?.uid ||
      ""
  );

  if (!streamUid) {
    throw new Error("Cloudflare Stream upload completed without a video UID");
  }

  const completeRes = await fetch(`${API_BASE}/stream/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      streamUid,
      uid: streamUid,
      privacy,
      caption: options.caption || "",
      context: options.context || "profile_reel",
    }),
  });

  const completeJson = await completeRes.json().catch(() => ({}));

  if (!completeRes.ok || !completeJson?.streamUid) {
    throw new Error(
      completeJson?.error || "Failed to save Stream video metadata"
    );
  }

  const playbackUrl = getStreamPlaybackUrl(completeJson);

  return {
    url: playbackUrl,
    signedUrl: playbackUrl,
    key: "",
    r2Key: "",
    storage: "cloudflare_stream",
    provider: "cloudflare_stream",
    type: "video",
    contentType: "video/mp4",
    size: 0,

    streamUid,
    uid: streamUid,
    playback: completeJson?.media?.playback || completeJson?.video?.playback || {},
    thumbnailUrl: String(
      completeJson?.media?.thumbnailUrl ||
        completeJson?.video?.thumbnailUrl ||
        ""
    ),
    duration: Number(
      completeJson?.media?.duration ||
        completeJson?.video?.duration ||
        0
    ),
    status: String(
      completeJson?.media?.status ||
        completeJson?.video?.status ||
        "processing"
    ),
    requireSignedURLs: Boolean(
      completeJson?.media?.cloudflareStream?.requireSignedURLs ??
        directJson?.requireSignedURLs ??
        true
    ),
  };
}

async function uploadChatVideoToCloudflareStream(
  fileUri: string,
  options: {
    roomId?: string;
    receiverId?: string;
    caption?: string;
    name?: string;
    filename?: string;
    duration?: number;
  } = {}
): Promise<RomBuzzUploadResult> {
  const token = await getTokenOrThrow();

  const roomId = String(options.roomId || "").trim();
  if (!roomId) {
    throw new Error("Missing chat room for video upload");
  }

  const filename = String(options.filename || options.name || "chat-video.mp4");

  const directRes = await fetch(`${API_BASE}/chat-stream/direct-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomId,
      receiverId: options.receiverId || undefined,
      filename,
      mimeType: "video/mp4",
      duration: options.duration || undefined,
    }),
  });

  const directJson = await directRes.json().catch(() => ({}));

  if (!directRes.ok || !directJson?.uploadURL || !directJson?.streamUid) {
    throw new Error(
      directJson?.error || "Failed to create chat video upload URL"
    );
  }

  const formData = new FormData();

  formData.append("file", {
    uri: fileUri,
    name: filename,
    type: "video/mp4",
  } as any);

  const uploadRes = await fetch(String(directJson.uploadURL), {
    method: "POST",
    body: formData,
  });

  const uploadJson = await uploadRes.json().catch(() => ({}));

  if (!uploadRes.ok) {
    throw new Error(
      uploadJson?.errors?.[0]?.message ||
        uploadJson?.error ||
        "Cloudflare Stream chat video upload failed"
    );
  }

  const streamUid = String(
    uploadJson?.result?.uid ||
      uploadJson?.uid ||
      directJson?.streamUid ||
      directJson?.uid ||
      ""
  );

  if (!streamUid) {
    throw new Error("Cloudflare Stream upload completed without a video UID");
  }

  const completeRes = await fetch(`${API_BASE}/chat-stream/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomId,
      receiverId: options.receiverId || undefined,
      streamUid,
      uid: streamUid,
      caption: options.caption || "",
    }),
  });

  const completeJson = await completeRes.json().catch(() => ({}));

  if (!completeRes.ok || !completeJson?.streamUid) {
    throw new Error(
      completeJson?.error || "Failed to save chat video metadata"
    );
  }

  const playbackUrl = getStreamPlaybackUrl(completeJson);

  return {
    url: playbackUrl,
    signedUrl: playbackUrl,
    key: "",
    r2Key: "",
    storage: "cloudflare_stream",
    provider: "cloudflare_stream",
    type: "video",
    contentType: "video/mp4",
    size: 0,

    purpose: "chat_video",
    context: "chat_video",
    streamUid,
    uid: streamUid,
    playback: completeJson?.playback || {},
    thumbnailUrl: String(completeJson?.thumbnailUrl || ""),
    duration: Number(completeJson?.duration || 0),
    status: String(completeJson?.status || "processing"),
    requireSignedURLs: true,
    cloudflareStream: completeJson?.cloudflareStream || {
      uid: streamUid,
      provider: "cloudflare_stream",
      purpose: "chat_video",
      context: "chat_video",
      status: String(completeJson?.status || "processing"),
      duration: Number(completeJson?.duration || 0),
      requireSignedURLs: true,
    },
  };
}

/**
 * New launch-safe uploader.
 *
 * image/audio:
 *   uploads to private Cloudflare R2 through backend
 *
 * profile_reel video:
 *   uploads directly to Cloudflare Stream through backend-created upload URL
 *
 * other video:
 *   stays on legacy Cloudinary until chat_video is designed separately
 */
export async function uploadRomBuzzMedia(
  fileUri: string,
  resourceType: UploadResourceType,
  options: {
    roomId?: string;
    purpose?: string;
    privacy?: string;
    caption?: string;
    context?: string;
    name?: string;
    filename?: string;
    requireSignedURLs?: boolean;
    receiverId?: string;
    duration?: number;
  } = {}
): Promise<RomBuzzUploadResult> {
  if (!fileUri) {
    throw new Error("Missing file to upload");
  }

  if (resourceType === "video") {
    const purpose = String(options.purpose || "").trim().toLowerCase();
    const context = String(options.context || "").trim().toLowerCase();

    const isProfileReel =
      purpose === "profile_reel" ||
      context === "profile_reel";

    if (isProfileReel) {
      return uploadVideoToCloudflareStream(fileUri, {
        ...options,
        purpose: "profile_reel",
        context: "profile_reel",
      });
    }

    const isChatVideo =
      purpose === "chat_video" ||
      purpose === "chat-video" ||
      context === "chat_video" ||
      context === "chat-video";

    if (isChatVideo) {
      return uploadChatVideoToCloudflareStream(fileUri, {
        roomId: options.roomId,
        receiverId: options.receiverId,
        caption: options.caption,
        name: options.name,
        filename: options.filename,
        duration: options.duration,
      });
    }

    // Legacy fallback stays for older screens/imports. Do not remove Cloudinary yet.
    return uploadVideoToCloudinaryLegacy(fileUri);
  }

  const token = await getTokenOrThrow();
  const formData = new FormData();

  formData.append("file", {
    uri: fileUri,
    name: getFilename(resourceType),
    type: getMimeType(resourceType),
  } as any);

  formData.append("purpose", options.purpose || getR2Purpose(resourceType));
  formData.append("type", resourceType);

  if (options.roomId) {
    formData.append("roomId", options.roomId);
  }

  const res = await fetch(`${API_BASE}/upload-r2-file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.url) {
    throw new Error(json?.error || "Media upload failed");
  }

  const key = String(json.r2Key || json.key || "");

  return {
    url: String(json.url || ""),
    signedUrl: String(json.signedUrl || json.url || ""),
    key,
    r2Key: key,
    storage: "r2",
    type: resourceType,
    contentType: String(json.contentType || getMimeType(resourceType)),
    size: Number(json.size || 0),
  };
}

/**
 * Existing app import name kept for compatibility.
 *
 * Returns URL only, so old code keeps working.
 * New chat code should use uploadRomBuzzMedia() instead.
 */
export async function uploadToCloudinaryUnsigned(
  fileUri: string,
  resourceType: UploadResourceType
): Promise<string> {
  const uploaded = await uploadRomBuzzMedia(fileUri, resourceType);
  return uploaded.url;
}
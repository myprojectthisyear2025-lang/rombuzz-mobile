/**
 * ============================================================
 * 📁 File: src/features/auth/onboarding/uploadSignupProfilePhotos.ts
 * 🎯 Purpose: Move locally selected signup photos into the same
 *    Cloudflare R2/profile media flow used by RomBuzz Profile.
 *
 * First photo:
 *   - R2 avatars/
 *   - becomes user.avatar
 *
 * Remaining photos:
 *   - R2 gallery-photos/
 *   - become normal profile gallery images
 * ============================================================
 */

import axios from "axios";

import { API_BASE } from "../../config/api";
import { uploadRomBuzzMedia } from "../../config/uploadMedia";

export async function uploadSignupProfilePhotos(
  token: string,
  selectedPhotos: string[],
  selectedAvatar: string
) {
  const photos = Array.from(
    new Set(
      (selectedPhotos || [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );

  if (!photos.length) {
    throw new Error("No signup photos were selected.");
  }

  const avatarSource =
    String(selectedAvatar || "").trim() || photos[0];

  const orderedPhotos = [
    avatarSource,
    ...photos.filter((photo) => photo !== avatarSource),
  ];

  const storedPhotos: string[] = [];
  let avatarKey = "";

  for (let index = 0; index < orderedPhotos.length; index += 1) {
    const localUri = orderedPhotos[index];
    const isAvatar = index === 0;

    const uploaded = await uploadRomBuzzMedia(localUri, "image", {
      purpose: isAvatar ? "avatar" : "gallery-photo",
    });

    const storedValue = uploaded.r2Key || uploaded.url;

    if (!storedValue) {
      throw new Error("Photo upload did not return a media key.");
    }

    storedPhotos.push(storedValue);

    if (isAvatar) {
      avatarKey = storedValue;
    }

    await axios.post(
      `${API_BASE}/upload-media`,
      {
        fileKey: uploaded.r2Key || "",
        r2Key: uploaded.r2Key || "",
        fileUrl: uploaded.r2Key ? "" : uploaded.url,
        type: "image",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  const updated = await axios.put(
    `${API_BASE}/users/me`,
    {
      avatar: avatarKey,
      photos: storedPhotos,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return {
    avatar: avatarKey,
    photos: storedPhotos,
    user: updated.data?.user,
  };
}
/**
 * 📁 File: src/components/profile/Gallery/MediaUploader.tsx
 * 🎯 Purpose: Pick Profile photos or a single reel using the system picker.
 * Used by: GallerySection.tsx.
 * Photos: Return an ordered queue without duplicate URIs.
 * Reels: Preserve single-video selection and duration settings.
 */

import * as ImagePicker from "expo-image-picker";

export type PickedProfileAsset = {
  uri: string;
  isVideo: boolean;
};

export async function pickMedia(kind: "photo" | "reel") {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === "reel" ? ["videos"] : ["images"],
    quality: 1,
    allowsEditing: false,
    allowsMultipleSelection: kind === "photo",
    orderedSelection: true,
    videoMaxDuration: kind === "reel" ? 60 : undefined,
  });

  if (res.canceled) return null;

  const seen = new Set<string>();
  const assets: PickedProfileAsset[] = [];

  for (const asset of res.assets || []) {
    if (!asset.uri || seen.has(asset.uri)) continue;
    seen.add(asset.uri);
    assets.push({
      uri: asset.uri,
      isVideo: asset.type === "video",
    });
  }

  if (!assets.length) return null;

  return {
    ...assets[0],
    remaining: kind === "photo" ? assets.slice(1) : [],
  };
}
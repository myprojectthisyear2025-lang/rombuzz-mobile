import * as ImagePicker from "expo-image-picker";

export async function pickMedia(kind: "photo" | "reel") {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:
      kind === "reel"
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    videoMaxDuration: kind === "reel" ? 60 : undefined,
  });

  if (res.canceled) return null;

  const asset = res.assets?.[0];
  if (!asset?.uri) return null;

  return {
    uri: asset.uri,
    isVideo: asset.type === "video",
  };
}

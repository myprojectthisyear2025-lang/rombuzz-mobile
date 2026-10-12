/**
 * Saves a local photo/video without requesting broad gallery read access.
 * Modern Android uses scoped storage; older Android and iOS request save access.
 */
import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";

export async function saveMediaToPhone(localUri: string): Promise<void> {
  const usesScopedStorage =
    Platform.OS === "android" && Number(Platform.Version) >= 29;

  if (!usesScopedStorage) {
    const permission = await MediaLibrary.requestPermissionsAsync(true);

    if (!permission.granted) {
      throw new Error("Please allow permission to save media to your phone.");
    }
  }

  await MediaLibrary.saveToLibraryAsync(localUri);
}
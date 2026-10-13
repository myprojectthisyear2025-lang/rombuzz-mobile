/**
 * 📁 File: src/features/auth/onboarding/pickSignupPhotos.ts
 * 🎯 Purpose: Select signup photos through the system photo picker.
 * Used by: app/auth/register-full/steps/Step4Photos.tsx.
 * Preserves: Six-photo limit, existing photos, and main-photo selection.
 * Behavior: Empty slots accept batches; filled slots replace one photo.
 */

import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

let pickerBusy = false;

export async function pickSignupPhotos(
  photos: string[],
  index: number,
  avatar: string,
  maxPhotos: number,
): Promise<{ photos: string[]; avatar: string } | null> {
  if (pickerBusy || index < 0 || index >= maxPhotos) return null;

  const next = photos.slice(0, maxPhotos);
  const previousPhoto = next[index] || "";
  const replacing = !!previousPhoto.trim();
  const filledCount = next.filter((value) => value.trim()).length;
  const available = replacing ? 1 : maxPhotos - filledCount;

  if (available <= 0) {
    Alert.alert("Max photos reached", `You can add up to ${maxPhotos} photos.`);
    return null;
  }

  pickerBusy = true;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
      allowsMultipleSelection: !replacing,
      selectionLimit: available,
      orderedSelection: true,
    });

    if (result.canceled) return null;

    const selected = Array.from(
      new Set(
        result.assets
          .map((asset) => asset.uri)
          .filter((uri) => !!uri),
      ),
    );

    const existing = new Set(
      next.filter((value, slot) => slot !== index && value.trim()),
    );
    const accepted = selected.filter((uri) => !existing.has(uri));

    if (!accepted.length) {
      Alert.alert("Photos", "These photos are already selected.");
      return null;
    }

    if (accepted.length > available) {
      Alert.alert(
        "Photo limit",
        `Only ${available} selected photo(s) can be added.`,
      );
    }

    const batch = accepted.slice(0, available);
    next[index] = batch[0];

    if (!replacing) {
      for (const uri of batch.slice(1)) {
        const emptySlot = next.findIndex((value) => !value.trim());
        if (emptySlot >= 0) next[emptySlot] = uri;
        else if (next.length < maxPhotos) next.push(uri);
      }
    }

    const validPhotos = next.filter((value) => value.trim());
    const nextAvatar =
      replacing && avatar === previousPhoto
        ? batch[0]
        : validPhotos.includes(avatar)
          ? avatar
          : validPhotos[0] || "";

    return { photos: next, avatar: nextAvatar };
  } finally {
    pickerBusy = false;
  }
}
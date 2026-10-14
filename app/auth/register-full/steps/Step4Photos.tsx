/**
 * File: app/auth/register-full/steps/Step4Photos.tsx
 * Purpose: Displays the signup photo-upload screen.
 * Supports selecting multiple photos, replacing and removing photos,
 * and continuing signup after at least two photos are selected.
 * Keeps the first photo in the ordered list as the profile avatar.
 * Uses SignupPhotoGrid for photo display and drag-to-reorder.
 */
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import SignupPhotoGrid from "@/src/features/auth/onboarding/photos/SignupPhotoGrid";
import { pickSignupPhotos } from "@/src/features/auth/onboarding/pickSignupPhotos";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import type { RegisterForm } from "../index";
import { useStep4PhotosStyles } from "../styles/useStep4PhotosStyles";

export type Step4Props = {
  form: RegisterForm;
  setField: <K extends keyof RegisterForm>(
    key: K,
    value: RegisterForm[K]
  ) => void;
  canNext: boolean;
  onNext: () => void;
  onBack: () => void;
};

export default function Step4Photos({
  form, setField, onNext, onBack,
}: Step4Props) {
  const s = useStep4PhotosStyles();
  const { colors } = useRomBuzzTheme();
  const photos = form.photos.filter(Boolean).slice(0, 6);
  const [picking, setPicking] = useState(false);

  const commit = (next: string[]) => {
    const clean = Array.from(new Set(next.filter(Boolean))).slice(0, 6);
    setField("photos", clean);
    setField("avatar", clean[0] || "");
  };

  const pick = async (index: number) => {
    if (picking) return;
    setPicking(true);
    try {
      const result = await pickSignupPhotos(
        photos, index, photos[0] || "", 6,
      );
      if (result) commit(result.photos);
    } catch (error: unknown) {
      Alert.alert(
        "Photos",
        error instanceof Error
          ? error.message
          : "Could not open your gallery.",
      );
    } finally {
      setPicking(false);
    }
  };

  const move = (from: number, to: number) => {
    const next = [...photos];
    const [photo] = next.splice(from, 1);
    next.splice(to, 0, photo);
    commit(next);
  };

  const ready = photos.length >= 2 && !picking;

  return (
    <View style={s.content}>
      <Text style={s.title}>Show your best side</Text>
      <Text style={s.subtitle}>
        Add 2–6 photos. Your first photo is your avatar.
      </Text>

      <View style={s.section}>
        <Text style={s.label}>Your photos</Text>
        <Text style={s.muted}>{photos.length} / 6</Text>
      </View>

      <SignupPhotoGrid
        photos={photos}
        disabled={picking}
        onPick={pick}
        onMove={move}
        onRemove={(index) =>
          commit(photos.filter((_, i) => i !== index))
        }
      />

      <Text style={s.hint}>
        Hold the ⋮⋮ handle and drag to reorder
      </Text>
      <Text style={s.muted}>
        Move any photo to #1 to make it your avatar.
      </Text>

      <Pressable
        style={[
          s.select,
          (picking || photos.length === 6) && s.disabled,
        ]}
        disabled={picking || photos.length === 6}
        onPress={() => pick(photos.length)}
        accessibilityRole="button"
      >
        <Ionicons
          name="images-outline"
          size={20}
          color={colors.text}
        />
        <Text style={s.selectText}>
          {picking ? "Opening gallery…" : "Select multiple photos"}
        </Text>
      </Pressable>

      <View style={s.footer}>
        <Pressable
          style={s.back}
          disabled={picking}
          onPress={onBack}
          accessibilityRole="button"
        >
          <Text style={s.backText}>Back</Text>
        </Pressable>

        <Pressable
          style={[s.next, !ready && s.disabled]}
          disabled={!ready}
          accessibilityRole="button"
          onPress={() => {
            commit(photos);
            onNext();
          }}
        >
          <Text style={s.nextText}>Continue →</Text>
        </Pressable>
      </View>

      {photos.length < 2 && (
        <Text style={[s.muted, { marginTop: 8 }]}>
          At least 2 photos to continue
        </Text>
      )}
    </View>
  );
}
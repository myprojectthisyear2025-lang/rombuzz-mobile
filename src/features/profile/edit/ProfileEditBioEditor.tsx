/**
 * Path: src/features/profile/edit/ProfileEditBioEditor.tsx
 * Purpose: Focused Bio editor using the existing profile form state.
 * Used by: ProfileEditScreen.
 */

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import React from "react";

import {
    Text,
    TextInput,
    View,
} from "react-native";

import {
    createProfileEditStyles,
} from "./profileEdit.styles";

import type {
    ProfileEditForm,
} from "./profileEditTypes";

export default function ProfileEditBioEditor({
  form,
  setForm,
}: {
  form: ProfileEditForm;

  setForm: React.Dispatch<
    React.SetStateAction<
      ProfileEditForm
    >
  >;
}) {
  const { colors } =
    useRomBuzzTheme();

  const styles =
    createProfileEditStyles(
      colors
    );

  return (
    <View>
      <Text
        style={styles.editorLabel}
      >
        Bio
      </Text>

      <TextInput
        value={form.bio}
        onChangeText={(bio) =>
          setForm((prev) => ({
            ...prev,
            bio,
          }))
        }
        placeholder="Tell people a little about you"
        placeholderTextColor={
          colors.textMuted
        }
        multiline
        textAlignVertical="top"
        style={[
          styles.input,
          {
            minHeight: 140,
          },
        ]}
      />
    </View>
  );
}
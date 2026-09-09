/**
 * Path: src/features/profile/edit/ProfileEditDetailsEditor.tsx
 * Purpose: Preserve the legacy Info/full-edit fields while the larger refactor proceeds safely.
 * Used by: ProfileEditScreen for the existing "info" and full General profile info flows.
 */

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

import React from "react";

import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    createProfileEditStyles,
} from "./profileEdit.styles";

import type {
    ProfileEditForm,
    ProfileVisibility,
} from "./profileEditTypes";

const VISIBILITY_OPTIONS: {
  label: string;
  value: ProfileVisibility;
}[] = [
  {
    label: "Public",
    value: "public",
  },
  {
    label: "Matches only",
    value: "matches",
  },
  {
    label: "Hidden",
    value: "hidden",
  },
];

function csv(value: any) {
  return Array.isArray(value)
    ? value.join(", ")
    : String(value || "");
}

function arrayFromCsv(
  value: string
) {
  return value
    .split(",")
    .map((item) =>
      item.trim()
    )
    .filter(Boolean);
}

export default function ProfileEditDetailsEditor({
  form,
  setForm,
  fullEdit,
}: {
  form: ProfileEditForm;

  setForm: React.Dispatch<
    React.SetStateAction<
      ProfileEditForm
    >
  >;

  fullEdit: boolean;
}) {
  const { colors } =
    useRomBuzzTheme();

  const styles =
    createProfileEditStyles(
      colors
    );

  const input = (
    label: string,
    value: string,
    key: keyof ProfileEditForm,
    editable = true,
    placeholder = ""
  ) => (
    <>
      <Text
        style={styles.editorLabel}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        editable={editable}
        onChangeText={(next) =>
          setForm((prev) => ({
            ...prev,
            [key]: next,
          }))
        }
        placeholder={placeholder}
        placeholderTextColor={
          colors.textMuted
        }
        style={[
          styles.input,
          !editable &&
            styles.inputDisabled,
        ]}
      />
    </>
  );

  return (
    <View>
      {input(
        "First name",
        form.firstName,
        "firstName",
        fullEdit,
        "First name"
      )}

      {input(
        "Last name",
        form.lastName,
        "lastName",
        fullEdit,
        "Last name"
      )}

      {input(
        "City",
        form.city,
        "city",
        true,
        "City"
      )}

      {input(
        "Orientation",
        form.orientation,
        "orientation",
        true,
        "Straight / Gay / Bi / ..."
      )}

      {input(
        "Looking for",
        form.lookingFor,
        "lookingFor",
        true,
        "Serious / Casual / Friends / ..."
      )}

      <Text
        style={styles.editorLabel}
      >
        Likes
      </Text>

      <TextInput
        value={csv(form.likes)}
        editable={fullEdit}
        onChangeText={(value) =>
          setForm((prev) => ({
            ...prev,
            likes:
              arrayFromCsv(
                value
              ).slice(0, 10),
          }))
        }
        placeholder="What you like"
        placeholderTextColor={
          colors.textMuted
        }
        style={[
          styles.input,
          !fullEdit &&
            styles.inputDisabled,
        ]}
      />

      <Text
        style={styles.editorLabel}
      >
        Dislikes
      </Text>

      <TextInput
        value={csv(form.dislikes)}
        editable={fullEdit}
        onChangeText={(value) =>
          setForm((prev) => ({
            ...prev,
            dislikes:
              arrayFromCsv(
                value
              ).slice(0, 10),
          }))
        }
        placeholder="What you dislike"
        placeholderTextColor={
          colors.textMuted
        }
        style={[
          styles.input,
          !fullEdit &&
            styles.inputDisabled,
        ]}
      />

      {fullEdit && (
        <>
          <Text
            style={
              styles.editorLabel
            }
          >
            Profile visibility
          </Text>

          <View
            style={
              local.visibilityRow
            }
          >
            {VISIBILITY_OPTIONS.map(
              (option) => {
                const active =
                  form.visibilityMode ===
                  option.value;

                return (
                  <Pressable
                    key={
                      option.value
                    }
                    onPress={() =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          visibilityMode:
                            option.value,
                        })
                      )
                    }
                    style={[
                      local.visibilityOption,
                      {
                        borderColor:
                          active
                            ? colors.brand
                            : colors.borderStrong,

                        backgroundColor:
                          active
                            ? colors.brandSoft
                            : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        local.visibilityText,
                        {
                          color:
                            active
                              ? colors.brand
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        </>
      )}
    </View>
  );
}

const local =
  StyleSheet.create({
    visibilityRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    visibilityOption: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth:
        StyleSheet.hairlineWidth,
      borderRadius: 10,
    },

    visibilityText: {
      fontFamily:
        RBZFont.semiBold,
      fontSize: 12.5,
    },
  });
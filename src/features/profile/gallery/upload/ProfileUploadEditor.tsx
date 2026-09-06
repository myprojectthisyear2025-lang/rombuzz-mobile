/**
 * Path: src/features/profile/gallery/upload/ProfileUploadEditor.tsx
 * Purpose: Compact caption + tappable visibility control for Gallery uploads.
 * Used by: ProfileUploadPreview.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Scope =
  | "public"
  | "matches"
  | "private";

type Props = {
  isReel: boolean;
  scope: Scope;
  captionText: string;

  onScopeChange: (
    scope: Scope
  ) => void;

  onCaptionChange: (
    text: string
  ) => void;
};

const OPTIONS = [
  {
    value: "public" as const,
    label: "Public",
    description: "Anyone can see this",
    icon: "globe-outline" as const,
  },
  {
    value: "matches" as const,
    label: "Matched-only",
    description: "Only your matches",
    icon: "people-outline" as const,
  },
  {
    value: "private" as const,
    label: "Only me",
    description: "Keep this private",
    icon: "lock-closed-outline" as const,
  },
];

function getScopeMeta(scope: Scope) {
  if (scope === "matches") {
    return {
      label: "Matches",
      icon: "people-outline" as const,
      hint: "Only matched users can see this",
    };
  }

  if (scope === "private") {
    return {
      label: "Only me",
      icon: "lock-closed-outline" as const,
      hint: "Only you can see this",
    };
  }

  return {
    label: "Public",
    icon: "globe-outline" as const,
    hint: "Anyone can see this",
  };
}

export default function ProfileUploadEditor({
  isReel,
  scope,
  captionText,
  onScopeChange,
  onCaptionChange,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const insets =
    useSafeAreaInsets();

  const [
    visibilityOpen,
    setVisibilityOpen,
  ] = useState(false);

  const current =
    getScopeMeta(scope);

  return (
    <>
      <View style={styles.editor}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.text },
            ]}
          >
            Caption
          </Text>

          <Pressable
            onPress={() =>
              setVisibilityOpen(true)
            }
            hitSlop={8}
            style={({ pressed }) => [
              styles.visibilityButton,
              pressed && {
                opacity: 0.6,
              },
            ]}
          >
            <Ionicons
              name={current.icon}
              size={14}
              color={colors.brand}
            />

            <Text
              style={[
                styles.visibilityButtonText,
                {
                  color: colors.text,
                },
              ]}
            >
              {current.label}
            </Text>

            <Ionicons
              name="chevron-down"
              size={13}
              color={
                colors.textSecondary
              }
            />
          </Pressable>
        </View>

        <View
          style={[
            styles.captionBox,
            {
              backgroundColor:
                colors.surfaceMuted,

              borderColor:
                colors.border,
            },
          ]}
        >
          <TextInput
            value={captionText}
            onChangeText={
              onCaptionChange
            }
            placeholder={
              isReel
                ? "Say something about this reel…"
                : "Say something about this photo…"
            }
            placeholderTextColor={
              colors.textMuted
            }
            style={[
              styles.captionInput,
              {
                color: colors.text,
              },
            ]}
            multiline
            maxLength={140}
            textAlignVertical="top"
          />

          <Text
            style={[
              styles.counter,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            {captionText.length}/140
          </Text>
        </View>

        <View style={styles.hintRow}>
          <Ionicons
            name={current.icon}
            size={12}
            color={colors.textMuted}
          />

          <Text
            style={[
              styles.hintText,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            {current.hint}
          </Text>
        </View>
      </View>

      <Modal
        visible={visibilityOpen}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setVisibilityOpen(false)
        }
      >
        <Pressable
          style={styles.backdrop}
          onPress={() =>
            setVisibilityOpen(false)
          }
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor:
                colors.surface,

              paddingBottom:
                insets.bottom + 14,
            },
          ]}
        >
          <View
            style={[
              styles.handle,
              {
                backgroundColor:
                  colors.border,
              },
            ]}
          />

          <Text
            style={[
              styles.sheetTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Visibility
          </Text>

          <Text
            style={[
              styles.sheetSubtitle,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Choose who can see this{" "}
            {isReel ? "reel" : "photo"}.
          </Text>

          <View style={styles.options}>
            {OPTIONS.map((option) => {
              const selected =
                option.value === scope;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onScopeChange(
                      option.value
                    );

                    setVisibilityOpen(
                      false
                    );
                  }}
                  style={[
                    styles.option,
                    {
                      borderColor:
                        selected
                          ? colors.brand
                          : colors.border,

                      backgroundColor:
                        selected
                          ? "rgba(245,46,100,0.07)"
                          : colors.surface,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      {
                        backgroundColor:
                          selected
                            ? "rgba(245,46,100,0.10)"
                            : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={
                        selected
                          ? colors.brand
                          : colors.icon
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.optionTextWrap
                    }
                  >
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>

                    <Text
                      style={[
                        styles.optionDescription,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      {
                        option.description
                      }
                    </Text>
                  </View>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color={colors.brand}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  editor: {
    width: "100%",
    maxWidth: 520,
  },

  headerRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionLabel: {
    fontFamily: RBZFont.semiBold,
    fontSize: 13.5,
    letterSpacing: -0.2,
  },

  visibilityButton: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 4,
  },

  visibilityButtonText: {
    fontFamily: RBZFont.semiBold,
    fontSize: 11.5,
  },

  captionBox: {
    minHeight: 92,
    borderWidth:
      StyleSheet.hairlineWidth,
    borderRadius: 15,
    position: "relative",
  },

  captionInput: {
    minHeight: 90,
    maxHeight: 130,
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 28,
    fontFamily: RBZFont.medium,
    fontSize: 13.5,
    lineHeight: 19,
  },

  counter: {
    position: "absolute",
    right: 11,
    bottom: 8,
    fontFamily: RBZFont.medium,
    fontSize: 10,
  },

  hintRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 6,
  },

  hintText: {
    fontFamily: RBZFont.medium,
    fontSize: 10.5,
  },

  backdrop: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.42)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    paddingHorizontal: 16,
    paddingTop: 9,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },

  sheetTitle: {
    fontFamily: RBZFont.bold,
    fontSize: 18,
    letterSpacing: -0.4,
  },

  sheetSubtitle: {
    marginTop: 3,
    fontFamily: RBZFont.medium,
    fontSize: 12,
  },

  options: {
    marginTop: 16,
    gap: 8,
  },

  option: {
    minHeight: 66,
    borderWidth:
      StyleSheet.hairlineWidth,
    borderRadius: 16,

    paddingHorizontal: 12,

    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,

    alignItems: "center",
    justifyContent: "center",
  },

  optionTextWrap: {
    flex: 1,
  },

  optionTitle: {
    fontFamily: RBZFont.semiBold,
    fontSize: 13.5,
  },

  optionDescription: {
    marginTop: 2,
    fontFamily: RBZFont.medium,
    fontSize: 11,
  },
});
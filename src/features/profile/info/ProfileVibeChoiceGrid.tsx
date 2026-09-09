/**
 * Path: src/features/profile/info/ProfileVibeChoiceGrid.tsx
 * Purpose: Theme-aware responsive chip selector for Likes and Dislikes.
 * Used by: ProfileVibeSection.
 */

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  RBZFont,
} from "@/src/design/rombuzzTypography";

import { Ionicons } from "@expo/vector-icons";
import React from "react";

import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Tone =
  | "positive"
  | "negative";

type Props = {
  title: string;
  options: string[];
  selected: string[];
  tone: Tone;
  onToggle: (value: string) => void;
  onSave: () => void;
};

const POSITIVE_ACCENT = "#5F8F7B";
const NEGATIVE_ACCENT = "#B9786A";

export default function ProfileVibeChoiceGrid({
  title,
  options,
  selected,
  tone,
  onToggle,
  onSave,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const accent =
    tone === "positive"
      ? POSITIVE_ACCENT
      : NEGATIVE_ACCENT;

  return (
    <View
      style={{
        paddingBottom: 18,
      }}
    >
      <Text
        style={{
          color: colors.text,

          fontFamily:
            RBZFont.semiBold,

          fontSize: 15,
          lineHeight: 21,

          marginBottom: 12,
        }}
      >
        {title}
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        {options.map((option) => {
          const isSelected =
            selected.includes(option);

          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.72}
              onPress={() =>
                onToggle(option)
              }
              style={{
                maxWidth: "100%",

                flexDirection: "row",
                alignItems: "center",
                gap: 5,

                paddingHorizontal: 12,
                paddingVertical: 8,

                borderRadius: 999,
                borderWidth: 1,

                borderColor:
                  isSelected
                    ? `${accent}85`
                    : colors.border,

                backgroundColor:
                  isSelected
                    ? `${accent}18`
                    : colors.surfaceMuted,
              }}
            >
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={13}
                  color={accent}
                />
              )}

              <Text
                style={{
                  flexShrink: 1,

                  color: colors.text,

                  fontFamily:
                    isSelected
                      ? RBZFont.semiBold
                      : RBZFont.medium,

                  fontSize: 12.5,
                  lineHeight: 17,
                }}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.78}
        onPress={onSave}
        style={{
          minHeight: 48,

          marginTop: 18,
          paddingHorizontal: 16,

          borderRadius: 10,

          backgroundColor:
            colors.brand,

          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: colors.white,

            fontFamily:
              RBZFont.semiBold,

            fontSize: 15,
          }}
        >
          Save
        </Text>
      </TouchableOpacity>
    </View>
  );
}
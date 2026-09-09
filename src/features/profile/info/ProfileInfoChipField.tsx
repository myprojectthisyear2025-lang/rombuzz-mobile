/**
 * Path: src/features/profile/info/ProfileInfoChipField.tsx
 * Purpose: Shared responsive multi-value field with premium theme-aware wrapped chips.
 * Used by: Profile Info sections containing multi-select/profile-list values.
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type ProfileChipTone =
  | "neutral"
  | "positive"
  | "negative";

type Props = {
  label: string;
  values?: unknown;
  onPress: () => void;
  placeholder?: string;
  tone?: ProfileChipTone;
};

const POSITIVE_ACCENT = "#5F8F7B";
const NEGATIVE_ACCENT = "#B9786A";

function normalizeValues(
  values: unknown
): string[] {
  if (Array.isArray(values)) {
    return values
      .map((item) =>
        String(item ?? "").trim()
      )
      .filter(Boolean);
  }

  if (
    typeof values === "string" &&
    values.trim()
  ) {
    return [values.trim()];
  }

  return [];
}

export default function ProfileInfoChipField({
  label,
  values,
  onPress,
  placeholder = "Add",
  tone = "neutral",
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const items =
    normalizeValues(values);

  const accent =
    tone === "positive"
      ? POSITIVE_ACCENT
      : tone === "negative"
      ? NEGATIVE_ACCENT
      : null;

  const chipBackground =
    accent
      ? `${accent}16`
      : colors.surfaceMuted;

  const chipBorder =
    accent
      ? `${accent}45`
      : colors.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      accessibilityRole="button"
      style={{
        minHeight: 58,
        paddingVertical: 11,

        borderBottomWidth:
          StyleSheet.hairlineWidth,

        borderBottomColor:
          colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 12,
        }}
      >
        <Text
          style={{
            flex: 1,
            color: colors.text,
            fontFamily:
              RBZFont.semiBold,
            fontSize: 15,
          }}
        >
          {label}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.iconMuted}
        />
      </View>

      {items.length > 0 ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: 7,
            marginTop: 10,
          }}
        >
          {items.map(
            (item, index) => (
              <View
                key={`${item}-${index}`}
                style={{
                  maxWidth: "100%",

                  paddingHorizontal: 11,
                  paddingVertical: 6,

                  borderRadius: 999,

                  backgroundColor:
                    chipBackground,

                  borderWidth:
                    StyleSheet.hairlineWidth,

                  borderColor:
                    chipBorder,
                }}
              >
                <Text
                  style={{
                    flexShrink: 1,

                    color:
                      colors.textSecondary,

                    fontFamily:
                      RBZFont.medium,

                    fontSize: 12.5,
                    lineHeight: 17,
                  }}
                >
                  {item}
                </Text>
              </View>
            )
          )}
        </View>
      ) : (
        <Text
          style={{
            marginTop: 6,

            color:
              colors.textMuted,

            fontFamily:
              RBZFont.regular,

            fontSize: 13,
          }}
        >
          {placeholder}
        </Text>
      )}
    </TouchableOpacity>
  );
}
/**
 * Path: src/features/viewProfile/info/ViewProfileChipField.tsx
 * Purpose: Read-only wrapped chip field that always shows every supplied View Profile value.
 * Used by: View Profile information components only.
 */

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

import React from "react";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    viewProfileValues,
} from "./viewProfileInfoFormat";

export type ViewProfileChipTone =
  | "neutral"
  | "positive"
  | "negative";

type Props = {
  label: string;
  values: unknown;

  tone?:
    ViewProfileChipTone;

  titleCase?: boolean;
};

const POSITIVE_ACCENT =
  "#5F8F7B";

const NEGATIVE_ACCENT =
  "#B9786A";

export default function ViewProfileChipField({
  label,
  values,
  tone = "neutral",
  titleCase = false,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const items =
    viewProfileValues(
      values
    );

  if (!items.length) {
    return null;
  }

  const accent =
    tone === "positive"
      ? POSITIVE_ACCENT
      : tone === "negative"
        ? NEGATIVE_ACCENT
        : null;

  const backgroundColor =
    accent
      ? `${accent}16`
      : colors.surfaceMuted;

  const borderColor =
    accent
      ? `${accent}45`
      : colors.border;

  return (
    <View
      style={[
        styles.field,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
          },
        ]}
      >
        {label}
      </Text>

      <View style={styles.wrap}>
        {items.map(
          (item, index) => (
            <View
              key={`${item}-${index}`}
              style={[
                styles.chip,
                {
                  backgroundColor,
                  borderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {titleCase
                  ? item
                      .charAt(0)
                      .toUpperCase() +
                    item.slice(1)
                  : item}
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    field: {
      minHeight: 58,

      paddingVertical: 11,

      borderBottomWidth:
        StyleSheet.hairlineWidth,
    },

    label: {
      fontFamily:
        RBZFont.semiBold,

      fontSize: 15,
    },

    wrap: {
      marginTop: 9,

      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-start",

      gap: 7,
    },

    chip: {
      maxWidth: "100%",

      paddingHorizontal: 11,
      paddingVertical: 6,

      borderRadius: 999,

      borderWidth:
        StyleSheet.hairlineWidth,
    },

    chipText: {
      flexShrink: 1,

      fontFamily:
        RBZFont.medium,

      fontSize: 12.5,
      lineHeight: 17,
    },
  });
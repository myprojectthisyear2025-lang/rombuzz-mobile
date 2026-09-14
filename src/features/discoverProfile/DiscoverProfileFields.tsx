/**
 * Path: src/features/discoverProfile/DiscoverProfileFields.tsx
 * Purpose: Flat section, label/value row, and wrapped chip primitives for Discover Profile.
 * Used by: DiscoverProfileOverview.tsx and DiscoverProfileDetails.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  discoverChipItems,
} from "./discoverProfilePrivacy";

export function DiscoverProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useRomBuzzTheme();

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {title}
      </Text>

      <View
        style={[
          styles.sectionBody,
          {
            borderTopColor: colors.border,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export function DiscoverProfileInfoRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  const { colors } = useRomBuzzTheme();

  if (!value) return null;

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colors.border,
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

      <Text
        style={[
          styles.value,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function DiscoverProfileChipField({
  label,
  values,
  tone = "neutral",
}: {
  label: string;
  values: any;
  tone?: "neutral" | "positive" | "negative";
}) {
  const { colors } = useRomBuzzTheme();
  const items = discoverChipItems(values);

  if (!items.length) return null;

  const accent =
    tone === "positive"
      ? "#5F8F7B"
      : tone === "negative"
        ? "#B9786A"
        : null;

  return (
    <View
      style={[
        styles.chipField,
        {
          borderBottomColor: colors.border,
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
        {items.map((item, index) => (
          <View
            key={`${label}-${item}-${index}`}
            style={[
              styles.chip,
              {
                backgroundColor: accent
                  ? `${accent}16`
                  : colors.surfaceMuted,

                borderColor: accent
                  ? `${accent}45`
                  : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 4,
  },

  sectionTitle: {
    marginTop: 7,
    marginBottom: 6,
    fontFamily: RBZFont.bold,
    fontSize: 11,
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },

  sectionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  row: {
    minHeight: 48,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  label: {
    flexShrink: 0,
    fontFamily: RBZFont.semiBold,
    fontSize: 14,
  },

  value: {
    flex: 1,
    textAlign: "right",
    fontFamily: RBZFont.medium,
    fontSize: 13.5,
    lineHeight: 19,
  },

  chipField: {
    minHeight: 58,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    borderWidth: StyleSheet.hairlineWidth,
  },

  chipText: {
    flexShrink: 1,
    fontFamily: RBZFont.medium,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
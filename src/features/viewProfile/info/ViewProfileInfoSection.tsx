/**
 * Path: src/features/viewProfile/info/ViewProfileInfoSection.tsx
 * Purpose: Flat theme-aware section shell for matched-user View Profile information.
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

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function ViewProfileInfoSection({
  title,
  children,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.title,
          {
            color:
              colors.textMuted,
          },
        ]}
      >
        {title}
      </Text>

      <View
        style={[
          styles.body,
          {
            borderTopColor:
              colors.border,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    section: {
      marginHorizontal: 16,
      marginBottom: 4,
    },

    title: {
      marginTop: 7,
      marginBottom: 6,

      fontFamily:
        RBZFont.bold,

      fontSize: 11,
      letterSpacing: 0.65,

      textTransform:
        "uppercase",
    },

    body: {
      borderTopWidth:
        StyleSheet.hairlineWidth,
    },
  });
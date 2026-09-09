/**
 * Path: src/features/profile/info/ProfileInfoSection.tsx
 * Purpose: Flat premium section shell for editable Profile information.
 * Used by: ProfileInfoTab and extracted Profile Info category sections.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
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

export default function ProfileInfoSection({
  title,
  children,
}: Props) {
  const { colors } = useRomBuzzTheme();

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.label,
          {
            color: colors.textMuted,
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

const styles = StyleSheet.create({
  section: {
    marginBottom: 26,
  },

  label: {
    marginBottom: 7,
    paddingHorizontal: 2,
    fontFamily: RBZFont.bold,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  body: {
    borderTopWidth:
      StyleSheet.hairlineWidth,
  },
});
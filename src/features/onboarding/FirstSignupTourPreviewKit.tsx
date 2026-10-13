/**
 * Path: src/features/onboarding/FirstSignupTourPreviewKit.tsx
 * Purpose: Shared theme-aware layout, typography, and artwork for tour previews.
 * All content is illustrative; preview controls perform no actions.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export const TOUR_ART = {
  portrait: require("../../../assets/images/rombuzz-tour-discover.png"),
  cafe: require("../../../assets/images/rombuzz-home-microbuzz.png"),
  sunset: require("../../../assets/images/rombuzz-home-discover.png"),
};

export function TourAvatar({
  size = 42,
  initials,
}: {
  size?: number;
  initials?: string;
}) {
  const { colors } = useRomBuzzTheme();
  const shape = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (initials) {
    return (
      <View
        style={[
          shape,
          {
            backgroundColor: colors.surfaceMuted,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text
          style={{
            fontFamily: RBZFont.bold,
            fontSize: size / 3,
            color: colors.textSecondary,
          }}
        >
          {initials}
        </Text>
      </View>
    );
  }

  return <Image source={TOUR_ART.portrait} style={shape} />;
}

export function TourFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { s } = useTourPreviewStyles();

  return (
    <View pointerEvents="none" style={s.frame}>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      <View style={s.content}>{children}</View>
      <Text style={s.example}>Example preview · Fictional activity</Text>
    </View>
  );
}

export function useTourPreviewStyles() {
  const { colors } = useRomBuzzTheme();

  const s = StyleSheet.create({
    frame: { backgroundColor: colors.background, padding: 16 },
    title: {
      fontFamily: RBZFont.extraBold,
      fontSize: 21,
      color: colors.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontFamily: RBZFont.regular,
      fontSize: 11,
      lineHeight: 17,
      color: colors.textSecondary,
      marginTop: 4,
    },
    content: { gap: 12, marginTop: 16 },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    between: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    grow: { flex: 1 },
    card: {
      padding: 13,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    label: {
      fontFamily: RBZFont.bold,
      fontSize: 12,
      lineHeight: 18,
      color: colors.text,
    },
    copy: {
      fontFamily: RBZFont.regular,
      fontSize: 11,
      lineHeight: 17,
      color: colors.textSecondary,
    },
    tiny: {
      fontFamily: RBZFont.medium,
      fontSize: 9,
      lineHeight: 14,
      color: colors.textMuted,
    },
    accent: {
      fontFamily: RBZFont.bold,
      fontSize: 11,
      color: colors.brand,
    },
    tabs: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
    tab: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
    },
    activeTab: { backgroundColor: colors.brandSoft },
    button: {
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: colors.brand,
    },
    buttonText: {
      fontFamily: RBZFont.bold,
      fontSize: 11,
      color: colors.white,
    },
    divider: { height: 1, backgroundColor: colors.border },
    example: {
      fontFamily: RBZFont.regular,
      fontSize: 9,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 14,
    },
  });

  return { colors, s };
}
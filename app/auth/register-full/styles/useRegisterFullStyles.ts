/**
 * Path: app/auth/register-full/styles/useRegisterFullStyles.ts
 * Purpose: Theme-aware shell styles for the RomBuzz full registration wizard.
 */

import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";

export function useRegisterFullStyles() {
  const {
    colors,
    statusBarStyle,
  } = useRomBuzzTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },

        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: 12,
          paddingVertical: 8,
          justifyContent: "center",
          alignItems: "center",
        },

        card: {
          backgroundColor: colors.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 14,
          paddingHorizontal: 18,
          width: "100%",
          maxWidth: 500,
          flex: 1,
          alignSelf: "center",
          overflow: "hidden",
        },

        cardSmall: {
          paddingVertical: 10,
          paddingHorizontal: 12,
        },

        header: {
          alignItems: "center",
          marginBottom: 10,
        },

        headerSmall: {
          marginBottom: 7,
        },

        logo: {
          width: 56,
          height: 56,
          marginBottom: 5,
        },

        logoSmall: {
          width: 46,
          height: 46,
          marginBottom: 3,
        },

        title: {
          fontSize: 22,
          lineHeight: 28,
          fontFamily: RBZFont.extraBold,
          color: colors.text,
          letterSpacing: -0.7,
          textAlign: "center",
          marginBottom: 2,
        },

        titleSmall: {
          fontSize: 19,
          lineHeight: 24,
          marginBottom: 1,
        },

        subtitle: {
          fontSize: 12.5,
          lineHeight: 18,
          fontFamily: RBZFont.medium,
          color: colors.textSecondary,
          textAlign: "center",
        },

        subtitleSmall: {
          fontSize: 11.5,
          lineHeight: 16,
        },

        progressTrack: {
          height: 6,
          backgroundColor: colors.surfaceMuted,
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 12,
        },

        progressFill: {
          height: "100%",
          backgroundColor: colors.brand,
        },

        scrollView: {
          flex: 1,
        },

        scrollContent: {
          flexGrow: 1,
          paddingBottom: 30,
        },

        scrollContentSmall: {
          paddingBottom: 20,
        },

        busyRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 12,
          paddingVertical: 8,
        },

        busyText: {
          fontSize: 12.5,
          lineHeight: 18,
          fontFamily: RBZFont.medium,
          color: colors.textSecondary,
        },
      }),
    [colors]
  );

  return {
    styles,
    colors,
    statusBarStyle,
  };
}
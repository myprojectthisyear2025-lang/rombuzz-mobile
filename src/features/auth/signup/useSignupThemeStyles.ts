/**
 * Path: src/features/auth/signup/useSignupThemeStyles.ts
 * Purpose: Semantic light/dark colors for the redesigned RomBuzz signup screen.
 */

import {
    useMemo,
} from "react";

import {
    StyleSheet,
} from "react-native";

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

export function useSignupThemeStyles() {
  const {
    colors,
  } = useRomBuzzTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          backgroundColor:
            colors.background,
        },

        scrollContent: {
          backgroundColor:
            colors.background,
        },

        logoTile: {
          backgroundColor:
            colors.surface,

          borderColor:
            colors.border,
        },

        wordmark: {
          color:
            colors.text,
        },

        wordmarkAccent: {
          color:
            colors.brand,
        },

        subtitle: {
          color:
            colors.textSecondary,
        },

        card: {
          backgroundColor:
            colors.surface,

          borderColor:
            colors.border,
        },

        stepBadge: {
          backgroundColor:
            colors.brandSoft,
        },

        stepBadgeText: {
          color:
            colors.brand,
        },

        title: {
          color:
            colors.text,
        },

        caption: {
          color:
            colors.textSecondary,
        },

        errorBox: {
          backgroundColor:
            `${colors.danger}12`,

          borderColor:
            `${colors.danger}38`,
        },

        errorText: {
          color:
            colors.danger,
        },

        successBox: {
          backgroundColor:
            colors.surfaceMuted,

          borderColor:
            colors.border,
        },

        successText: {
          color:
            colors.textSecondary,
        },

        inputShell: {
          backgroundColor:
            colors.surfaceMuted,

          borderColor:
            colors.border,
        },

        inputIcon: {
          color:
            colors.iconMuted,
        },

        input: {
          color:
            colors.text,
        },

        primaryButton: {
          backgroundColor:
            colors.brand,
        },

        primaryButtonText: {
          color:
            colors.white,
        },

        dividerLine: {
          backgroundColor:
            colors.border,
        },

        dividerText: {
          color:
            colors.textMuted,
        },

        socialButton: {
          backgroundColor:
            colors.background,

          borderColor:
            colors.border,
        },

        googleIconCircle: {
          backgroundColor:
            colors.surface,
        },

        socialText: {
          color:
            colors.text,
        },

        loginMuted: {
          color:
            colors.textSecondary,
        },

        loginStrong: {
          color:
            colors.brand,
        },

        secondaryButton: {
          backgroundColor:
            colors.brandSoft,

          borderColor:
            colors.brandSoft,
        },

        secondaryButtonText: {
          color:
            colors.brand,
        },

        backText: {
          color:
            colors.textSecondary,
        },

        footerText: {
          color:
            colors.textMuted,
        },
      }),

    [colors]
  );
}
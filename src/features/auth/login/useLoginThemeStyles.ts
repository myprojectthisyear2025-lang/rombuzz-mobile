/**
 * Path: src/features/auth/login/useLoginThemeStyles.ts
 * Purpose: Light/dark semantic color overrides for the redesigned RomBuzz login screen.
 * Used by: LoginScreenView.tsx and LoginForm.tsx.
 */

import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

export function useLoginThemeStyles() {
  const { colors } = useRomBuzzTheme();

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
          color: colors.text,
        },

        wordmarkAccent: {
          color: colors.brand,
        },

        subtitle: {
          color:
            colors.textSecondary,
        },

        formCard: {
          backgroundColor:
            colors.surface,
          borderColor:
            colors.border,
        },

        errorBox: {
          backgroundColor:
            `${colors.danger}12`,
          borderColor:
            `${colors.danger}38`,
        },

        errorIcon: {
          color: colors.white,
          backgroundColor:
            colors.danger,
        },

        errorText: {
          color: colors.danger,
        },

        inputShell: {
          backgroundColor:
            colors.surfaceMuted,
          borderColor:
            colors.border,
        },

        inputIcon: {
          color: colors.iconMuted,
        },

        input: {
          color: colors.text,
        },

        showButton: {
          backgroundColor:
            colors.background,
        },

        showButtonIcon: {
          color: colors.iconMuted,
        },

        primaryButton: {
          backgroundColor:
            colors.brand,
        },

        primaryButtonText: {
          color: colors.white,
        },

        inlineLinkText: {
          color:
            colors.textSecondary,
        },

        dividerLine: {
          backgroundColor:
            colors.border,
        },

        dividerText: {
          color: colors.textMuted,
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

        socialButtonText: {
          color: colors.text,
        },

        secondaryButton: {
          backgroundColor:
            colors.brandSoft,
          borderColor:
            colors.brandSoft,
        },

        secondaryButtonText: {
          color: colors.brand,
        },

        footerText: {
          color: colors.textMuted,
        },
      }),
    [colors]
  );
}
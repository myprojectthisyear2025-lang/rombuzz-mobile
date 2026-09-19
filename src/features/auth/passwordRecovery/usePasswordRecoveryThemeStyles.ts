/**
 * Path: src/features/auth/passwordRecovery/usePasswordRecoveryThemeStyles.ts
 * Purpose: Semantic light/dark colors for RomBuzz password recovery screens.
 * Used by: forgot-password.tsx and ResetPasswordView.tsx.
 */

import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

export function usePasswordRecoveryThemeStyles() {
  const { colors } =
    useRomBuzzTheme();

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

        brand: {
          color: colors.text,
        },

        brandAccent: {
          color: colors.brand,
        },

        card: {
          backgroundColor:
            colors.surface,
          borderColor:
            colors.border,
        },

        title: {
          color: colors.text,
        },

        subtitle: {
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
          color: colors.danger,
        },

        infoBox: {
          backgroundColor:
            colors.surfaceMuted,
          borderColor:
            colors.border,
        },

        infoText: {
          color:
            colors.textSecondary,
        },

        inputShell: {
          backgroundColor:
            colors.surfaceMuted,
          borderColor:
            colors.border,
        },

        input: {
          color: colors.text,
        },

        inputIcon: {
          color:
            colors.iconMuted,
        },

        eyeButton: {
          backgroundColor:
            colors.background,
        },

        eyeIcon: {
          color:
            colors.iconMuted,
        },

        primaryButton: {
          backgroundColor:
            colors.brand,
        },

        primaryButtonText: {
          color: colors.white,
        },

        link: {
          color:
            colors.textSecondary,
        },

        strengthBar: {
          backgroundColor:
            colors.border,
        },
      }),
    [colors]
  );
}
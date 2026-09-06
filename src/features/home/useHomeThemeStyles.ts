/**
 * Path: src/features/home/useHomeThemeStyles.ts
 * Purpose: Dark/light color overrides for the redesigned RomBuzz Home screen.
 * Used by: homepage.tsx, HomeDashboard.tsx, and HomePulseTile.tsx.
 */

import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

export function useHomeThemeStyles() {
  const { colors } = useRomBuzzTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        screen: {
          backgroundColor: colors.background,
        },

        header: {
          backgroundColor: colors.background,
        },

        letsBuzzIconWrap: {
          backgroundColor: colors.brandSoft,
          borderColor: colors.brandSoft,
        },

        letsBuzzTitle: {
          color: colors.text,
        },

        brand: {
          color: colors.text,
        },

        brandAccent: {
          color: colors.brand,
        },

        brandTagline: {
          color: colors.textSecondary,
        },

        greetingTitle: {
          color: colors.text,
        },

        greetingSubtitle: {
          color: colors.textSecondary,
        },

        sideNoteText: {
          color: colors.brand,
        },

        sectionTitle: {
          color: colors.text,
        },

        safety: {
          borderTopColor: colors.border,
        },

        safetyIcon: {
          backgroundColor: colors.brandSoft,
        },

        safetyTitle: {
          color: colors.text,
        },

        safetyText: {
          color: colors.textSecondary,
        },

        pulseTile: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },

        pulseTilePressed: {
          backgroundColor: colors.surfaceMuted,
        },

        pulseIconWrap: {
          backgroundColor: colors.surfaceMuted,
        },

        pulseTitle: {
          color: colors.text,
        },

        pulseSubtitle: {
          color: colors.textSecondary,
        },
      }),
    [colors]
  );
}
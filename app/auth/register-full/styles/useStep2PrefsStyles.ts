/**
 * Path: app/auth/register-full/steps/styles/useStep2PrefsStyles.ts
 * Purpose: Theme-aware Manrope styles for preferences, interests, and voice intro.
 */

import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";

export function useStep2PrefsStyles() {
  const { colors } = useRomBuzzTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: 8,
          gap: 8,
          flex: 1,
        },

        sectionTitle: {
          fontSize: 20,
          lineHeight: 26,
          fontFamily: RBZFont.extraBold,
          color: colors.text,
          letterSpacing: -0.5,
          marginBottom: 8,
        },

        card: {
          backgroundColor: colors.surfaceMuted,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 12,
          marginVertical: 4,
        },

        rowBetween: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        },

        row: {
          flexDirection: "row",
          gap: 8,
        },

        half: {
          flex: 1,
        },

        label: {
          fontSize: 13.5,
          fontFamily: RBZFont.bold,
          color: colors.text,
        },

        subtitle: {
          fontSize: 11.5,
          lineHeight: 17,
          fontFamily: RBZFont.medium,
          color: colors.textSecondary,
          marginTop: 4,
          marginBottom: 6,
        },

        emphasis: {
          fontFamily: RBZFont.bold,
        },

        value: {
          fontSize: 12.5,
          fontFamily: RBZFont.semiBold,
          color: colors.textSecondary,
        },

        chipsScroll: {
          marginTop: 4,
        },

        chipsContainer: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 7,
        },

        chip: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
        },

        chipActive: {
          backgroundColor: colors.brandSoft,
          borderColor: colors.brand,
        },

        chipText: {
          fontSize: 11.5,
          fontFamily: RBZFont.semiBold,
          color: colors.textSecondary,
        },

        chipTextActive: {
          color: colors.brand,
          fontFamily: RBZFont.bold,
        },

        footer: {
          marginTop: 12,
          flexDirection: "row",
          justifyContent: "space-between",
        },

        backBtn: {
          paddingHorizontal: 13,
          paddingVertical: 9,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
        },

        backText: {
          fontSize: 13,
          fontFamily: RBZFont.semiBold,
          color: colors.textSecondary,
        },

        nextBtn: {
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderRadius: 13,
          backgroundColor: colors.brand,
        },

        nextBtnDisabled: {
          opacity: 0.45,
        },

        nextText: {
          color: colors.white,
          fontSize: 13,
          fontFamily: RBZFont.bold,
        },

        addChip: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: colors.surface,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          marginTop: 6,
        },

        addChipText: {
          color: colors.brand,
          fontFamily: RBZFont.bold,
          fontSize: 11.5,
        },

        addBox: {
          marginTop: 10,
        },

        addLabel: {
          fontSize: 11.5,
          fontFamily: RBZFont.semiBold,
          color: colors.textSecondary,
          marginBottom: 5,
        },

        addInput: {
          backgroundColor: colors.surface,
          color: colors.text,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 10,
          paddingVertical: 9,
          marginBottom: 6,
          fontFamily: RBZFont.medium,
        },

        suggestBox: {
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          maxHeight: 140,
          overflow: "hidden",
        },

        suggestItem: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },

        suggestItemSelected: {
          backgroundColor: colors.brandSoft,
        },

        suggestText: {
          fontSize: 12.5,
          fontFamily: RBZFont.medium,
          color: colors.textSecondary,
        },

        suggestTextSelected: {
          color: colors.brand,
          fontFamily: RBZFont.bold,
        },

        cancelAddBtn: {
          paddingVertical: 6,
          alignSelf: "flex-end",
        },

        cancelAddText: {
          color: colors.textMuted,
          fontSize: 11.5,
          fontFamily: RBZFont.semiBold,
        },

        voiceHeaderRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        },

        voiceBadge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: colors.brandSoft,
        },

        voiceBadgeText: {
          fontSize: 10,
          fontFamily: RBZFont.bold,
          color: colors.brand,
        },

        voiceSubtitle: {
          fontSize: 11.5,
          lineHeight: 17,
          fontFamily: RBZFont.medium,
          color: colors.textSecondary,
          marginBottom: 8,
        },

        voiceErrorText: {
          fontSize: 11.5,
          fontFamily: RBZFont.semiBold,
          color: colors.danger,
          marginBottom: 8,
        },

        voiceCenter: {
          alignItems: "center",
          marginVertical: 8,
        },

        voiceMicOuter: {
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 2,
          borderColor: colors.borderStrong,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
          backgroundColor: colors.surface,
        },

        voiceMicOuterActive: {
          borderColor: colors.brand,
          backgroundColor: colors.brandSoft,
        },

        voiceMicInner: {
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.brand,
        },

        voiceMicIcon: {
          fontSize: 24,
          color: colors.white,
        },

        voiceStateText: {
          fontSize: 12.5,
          fontFamily: RBZFont.semiBold,
          color: colors.text,
          marginBottom: 2,
        },

        voiceTimer: {
          fontSize: 11.5,
          fontFamily: RBZFont.medium,
          color: colors.textMuted,
        },

        voiceActionsRow: {
          marginTop: 8,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        },

        voicePrimaryBtn: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: colors.brand,
        },

        voicePrimaryText: {
          color: colors.white,
          fontFamily: RBZFont.bold,
          fontSize: 11.5,
        },

        voiceSecondaryBtn: {
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
        },

        voiceSecondaryText: {
          fontSize: 11.5,
          fontFamily: RBZFont.semiBold,
          color: colors.textSecondary,
        },

        voiceSavedPill: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: colors.brandSoft,
        },

        voiceSavedText: {
          fontSize: 11.5,
          fontFamily: RBZFont.bold,
          color: colors.brand,
        },
      }),
    [colors]
  );

  return {
    styles,
    colors,
  };
}
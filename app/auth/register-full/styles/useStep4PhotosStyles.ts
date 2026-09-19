/**
 * Path: app/auth/register-full/steps/styles/useStep4PhotosStyles.ts
 * Purpose: Theme-aware Manrope styles for registration photo selection.
 */

import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";

export function useStep4PhotosStyles() {
  const { colors } = useRomBuzzTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flex: 1,
        },

        content: {
          paddingHorizontal: 4,
          paddingVertical: 8,
        },

        contentSmall: {
          paddingHorizontal: 2,
          paddingVertical: 6,
        },

        title: {
          fontSize: 20,
          lineHeight: 26,
          fontFamily: RBZFont.extraBold,
          color: colors.text,
          letterSpacing: -0.5,
          marginBottom: 6,
        },

        subtitle: {
          fontSize: 12.5,
          lineHeight: 18,
          fontFamily: RBZFont.medium,
          color: colors.textSecondary,
          marginBottom: 16,
        },

        photoCard: {
          borderRadius: 16,
          padding: 10,
          marginBottom: 12,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
        },

        photoHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 7,
        },

        photoIndex: {
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colors.brandSoft,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 8,
        },

        photoIndexText: {
          fontFamily: RBZFont.bold,
          color: colors.brand,
        },

        avatarTag: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: colors.brandSoft,
          color: colors.brand,
          fontSize: 10.5,
          fontFamily: RBZFont.bold,
        },

        imageBox: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.surface,
          minHeight: 90,
          justifyContent: "center",
        },

        imageBoxAvatar: {
          borderColor: colors.brand,
          backgroundColor: colors.brandSoft,
        },

        imagePlaceholder: {
          fontSize: 12.5,
          fontFamily: RBZFont.medium,
          color: colors.textMuted,
          textAlign: "center",
        },

        imagePreview: {
          width: "100%",
          height: 140,
          borderRadius: 12,
          resizeMode: "cover",
        },

        photoActions: {
          flexDirection: "row",
          marginTop: 8,
          gap: 8,
        },

        avatarButton: {
          flex: 1,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.brand,
          alignItems: "center",
        },

        avatarButtonActive: {
          backgroundColor: colors.brand,
        },

        avatarButtonText: {
          fontSize: 11.5,
          color: colors.brand,
          fontFamily: RBZFont.bold,
        },

        avatarButtonTextActive: {
          color: colors.white,
        },

        removeButton: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },

        removeButtonText: {
          fontSize: 11.5,
          fontFamily: RBZFont.semiBold,
          color: colors.textSecondary,
        },

        addSlotButton: {
          alignSelf: "flex-start",
          paddingVertical: 7,
          marginTop: 2,
          marginBottom: 12,
        },

        addSlotText: {
          fontSize: 12.5,
          color: colors.brand,
          fontFamily: RBZFont.bold,
        },

        footer: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 18,
        },

        backButton: {
          paddingHorizontal: 16,
          paddingVertical: 10,
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

        nextButton: {
          paddingHorizontal: 22,
          paddingVertical: 10,
          borderRadius: 13,
          backgroundColor: colors.brand,
        },

        nextButtonDisabled: {
          opacity: 0.45,
        },

        nextText: {
          fontSize: 13,
          color: colors.white,
          fontFamily: RBZFont.bold,
        },
      }),
    [colors]
  );
}
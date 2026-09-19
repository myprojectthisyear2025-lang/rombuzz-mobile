/** Path: src/features/onboarding/FirstSignupTour.styles.ts — theme-aware Tour shell styles. */

import type { RomBuzzColors } from "@/src/design/rombuzzTheme";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export function createFirstSignupTourStyles(
  colors: RomBuzzColors
) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    screen: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    topBar: {
      minHeight: 56,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    brandWrap: {
      flexDirection: "row",
      alignItems: "baseline",
    },

    brand: {
      color: colors.text,
      fontFamily:
        RBZFont.extraBold,
      fontSize: 20,
      letterSpacing: -0.7,
    },

    brandAccent: {
      color: colors.brand,
    },

    closeButton: {
      minHeight: 36,
      paddingHorizontal: 10,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },

    closeText: {
      color:
        colors.textSecondary,
      fontFamily:
        RBZFont.semiBold,
      fontSize: 12.5,
    },

    progressWrap: {
      paddingHorizontal: 18,
      paddingBottom: 5,
    },

    progressRow: {
      flexDirection: "row",
      gap: 5,
    },

    progressSegment: {
      flex: 1,
      height: 3,
      borderRadius: 999,
    },

    bodyScroll: {
      flex: 1,
    },

    bodyContent: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingTop: 15,
      paddingBottom: 16,
      justifyContent: "center",
    },

    stepMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 8,
    },

    kickerWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      flex: 1,
    },

    kickerIcon: {
      width: 27,
      height: 27,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.brandSoft,
    },

    kicker: {
      flex: 1,
      color: colors.brand,
      fontFamily: RBZFont.bold,
      fontSize: 10,
      letterSpacing: 1.05,
    },

    counter: {
      color: colors.textMuted,
      fontFamily:
        RBZFont.semiBold,
      fontSize: 11.5,
    },

    title: {
      color: colors.text,
      fontFamily:
        RBZFont.extraBold,
      fontSize: 25,
      lineHeight: 30,
      letterSpacing: -0.8,
    },

    description: {
      marginTop: 6,
      maxWidth: 520,
      color:
        colors.textSecondary,
      fontFamily:
        RBZFont.regular,
      fontSize: 13.5,
      lineHeight: 19.5,
    },

    previewWrap: {
      marginTop: 16,
    },

    hint: {
      marginTop: 12,
      minHeight: 40,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 14,
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surfaceMuted,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    hintIcon: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.brandSoft,
    },

    hintText: {
      flex: 1,
      color:
        colors.textSecondary,
      fontFamily:
        RBZFont.medium,
      fontSize: 11.5,
      lineHeight: 15.5,
    },

    bottomBar: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 10,
      flexDirection: "row",
      gap: 10,
      borderTopWidth:
        StyleSheet.hairlineWidth,
      borderTopColor:
        colors.border,
      backgroundColor:
        colors.background,
    },

    backButton: {
      minWidth: 96,
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        colors.borderStrong,
      backgroundColor:
        colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },

    backDisabled: {
      opacity: 0.34,
    },

    backText: {
      color: colors.text,
      fontFamily: RBZFont.bold,
      fontSize: 13.5,
    },

    nextButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 16,
      backgroundColor:
        colors.brand,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    nextText: {
      color: colors.white,
      fontFamily: RBZFont.bold,
      fontSize: 14,
    },

    pressed: {
      opacity: 0.72,
      transform: [
        {
          scale: 0.992,
        },
      ],
    },
  });
}
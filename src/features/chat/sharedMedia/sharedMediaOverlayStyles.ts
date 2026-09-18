/**
 * Path: src/features/chat/sharedMedia/sharedMediaOverlayStyles.ts
 * Purpose: Theme-aware media badges and action-sheet styles for Shared Media.
 */

import type { RomBuzzColors } from "@/src/design/rombuzzTheme";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export function createSharedMediaOverlayStyles(colors: RomBuzzColors) {
  return StyleSheet.create({
    dotsBtn: {
      position: "absolute",
      right: 6,
      top: 6,
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor: "rgba(0,0,0,0.50)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
    },
    videoBadge: {
      position: "absolute",
      left: 6,
      bottom: 6,
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor: "rgba(0,0,0,0.58)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
    },
    giftBadge: {
      position: "absolute",
      left: 6,
      top: 6,
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor: colors.brand,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
    },
    menuOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 28,
    },

    menuCard: {
      width: "100%",
      maxWidth: 390,
      backgroundColor: colors.surfaceRaised,
      borderRadius: 28,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 14,
      },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 16,
    },

    menuTitle: {
      paddingHorizontal: 6,
      paddingTop: 3,
      fontSize: 17,
      lineHeight: 22,
      fontFamily: RBZFont.extraBold,
      letterSpacing: -0.3,
      color: colors.text,
    },

    menuHr: {
      height: 1,
      backgroundColor: colors.border,
      marginTop: 12,
      marginBottom: 10,
    },

    menuSectionGap: {
      height: 8,
    },

    menuRow: {
      minHeight: 62,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingHorizontal: 11,
      paddingVertical: 9,
      marginBottom: 6,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    menuIconBox: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandSoft,
    },

    menuTextWrap: {
      flex: 1,
      justifyContent: "center",
    },

    menuText: {
      fontSize: 13.5,
      lineHeight: 18,
      fontFamily: RBZFont.bold,
      color: colors.text,
    },

    menuHint: {
      marginTop: 2,
      fontSize: 10.5,
      lineHeight: 14,
      fontFamily: RBZFont.medium,
      color: colors.textMuted,
    },

    menuDangerRow: {
      backgroundColor: colors.surface,
    },

    menuDangerIconBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.danger,
    },

    menuDangerText: {
      color: colors.danger,
    },

    menuDangerHint: {
      color: colors.danger,
      opacity: 0.72,
    },

    menuCloseBtn: {
      minHeight: 46,
      marginTop: 6,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand,
    },

    menuCloseText: {
      color: colors.white,
      fontSize: 13.5,
      fontFamily: RBZFont.extraBold,
      letterSpacing: 0.1,
    },
  });
}
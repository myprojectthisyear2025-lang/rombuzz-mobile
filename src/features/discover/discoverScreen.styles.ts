/**
 * Path: src/features/discover/discoverScreen.styles.ts
 * Purpose: Theme-aware screen, header, filter, loading, toast, and empty-state styles for Discover.
 * Used by: app/(tabs)/discover.tsx via useDiscoverVisuals.
 */

import type { RomBuzzColors } from "@/src/design/rombuzzTheme";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export function createDiscoverScreenStyles(
  colors: RomBuzzColors
) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      paddingTop: 10,
      paddingBottom: 10,
      paddingHorizontal: 14,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      backgroundColor: colors.background,
    },

    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingBottom: 8,
    },

    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },

    hTitle: {
      color: colors.text,
      fontSize: 22,
      fontFamily: RBZFont.extraBold,
    },

    hSub: {
      color: colors.textSecondary,
      fontSize: 12,
      fontFamily: RBZFont.medium,
      marginTop: 2,
    },

    vibesRow: {
      paddingTop: 2,
      paddingBottom: 1,
      gap: 8,
      paddingHorizontal: 2,
    },

    vibeChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    vibeChipLocked: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
    },

    vibeChipActive: {
      backgroundColor: colors.brandSoft,
      borderColor: colors.brand,
    },

    vibeText: {
      color: colors.textSecondary,
      fontFamily: RBZFont.semiBold,
      fontSize: 12,
    },

    vibeTextActive: {
      color: colors.brand,
      fontFamily: RBZFont.bold,
    },

     body: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 10,
    },

    toastOverlay: {
      position: "absolute",
      top: 150,
      left: 16,
      right: 16,
      zIndex: 9999,
      elevation: 9999,
      alignItems: "center",
    },

    toast: {
      maxWidth: "92%",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.overlay,
      shadowOpacity: 0.14,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 12,
    },

    toastText: {
      color: colors.text,
      fontFamily: RBZFont.bold,
      fontSize: 14,
      textAlign: "center",
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 10,
    },

    centerText: {
      color: colors.textSecondary,
      fontFamily: RBZFont.semiBold,
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 20,
      fontFamily: RBZFont.extraBold,
      marginTop: 6,
    },

    emptySub: {
      color: colors.textSecondary,
      fontFamily: RBZFont.medium,
      textAlign: "center",
    },

    primaryBtn: {
      marginTop: 10,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.brand,
    },

    primaryBtnText: {
      color: colors.white,
      fontFamily: RBZFont.extraBold,
    },

    secondaryBtn: {
      marginTop: 4,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: colors.brandSoft,
      borderWidth: 1,
      borderColor: colors.brandSoft,
    },

    secondaryBtnText: {
      color: colors.brand,
      fontFamily: RBZFont.bold,
    },

    deck: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },

    refreshPill: {
      position: "absolute",
      top: 4,
      zIndex: 20,
      elevation: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.overlay,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4,
      },
    },

    refreshPillText: {
      color: colors.text,
      fontSize: 12,
      fontFamily: RBZFont.bold,
    },
  });
}
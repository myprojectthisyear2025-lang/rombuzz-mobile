/**
 * Path: src/features/chat/purchasedMedia/purchasedMediaShellStyles.ts
 * Purpose: Theme-aware shell, header, tabs, loading, empty-state, and tile styles for Purchased Media.
 */

import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export function createPurchasedMediaShellStyles(colors: any) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      minHeight: 60,
      paddingHorizontal: 16,
      paddingVertical: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 17,
      lineHeight: 22,
      fontFamily: RBZFont.extraBold,
      letterSpacing: -0.25,
    },
    headerSub: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: RBZFont.medium,
      marginTop: 1,
    },
    tabsWrap: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 12,
      paddingTop: 12,
    },
    tabBtn: {
      flex: 1,
      height: 44,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    tabBtnActive: {
      borderColor: colors.brand,
      backgroundColor: colors.brandSoft,
    },
    tabText: {
      color: colors.text,
      fontSize: 13,
      fontFamily: RBZFont.bold,
    },
    tabTextActive: {
      color: colors.brand,
    },
    tabCount: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: RBZFont.bold,
    },
    tabCountActive: {
      color: colors.brand,
    },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      marginTop: 10,
      color: colors.textSecondary,
      fontSize: 12.5,
      fontFamily: RBZFont.medium,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    emptyTitle: {
      marginTop: 11,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: RBZFont.bold,
      color: colors.text,
      textAlign: "center",
    },
    emptySub: {
      marginTop: 6,
      fontSize: 12.5,
      lineHeight: 18,
      fontFamily: RBZFont.regular,
      color: colors.textSecondary,
      textAlign: "center",
    },
    tile: {
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    thumb: {
      width: "100%",
      height: "100%",
    },
    lockedThumb: {
      opacity: 0.16,
    },
  });
}
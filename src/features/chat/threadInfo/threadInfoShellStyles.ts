/**
 * Path: src/features/chat/threadInfo/threadInfoShellStyles.ts
 * Purpose: Theme-aware shell, header, profile, and quick-action styles for Chat Thread Info.
 */

import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export function createThreadInfoShellStyles(colors: any) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      minHeight: 58,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },

    headerTitle: {
      flex: 1,
      textAlign: "center",
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
      fontFamily: RBZFont.extraBold,
      letterSpacing: -0.2,
    },

    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    backBtnPressed: {
      backgroundColor: colors.surfaceMuted,
      transform: [{ scale: 0.96 }],
    },

    scrollContent: {
      paddingTop: 14,
      paddingHorizontal: 14,
    },

    cardPremium: {
      borderRadius: 24,
      padding: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    identity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },

    identityPressed: {
      opacity: 0.82,
    },

    avatarContainer: {
      position: "relative",
    },

    avatarRing: {
      width: 76,
      height: 76,
      borderRadius: 25,
      padding: 3,
      backgroundColor: colors.brandSoft,
      borderWidth: 1,
      borderColor: colors.brand,
    },

    bigAvatar: {
      width: "100%",
      height: "100%",
      borderRadius: 21,
      backgroundColor: colors.surfaceMuted,
    },

    onlineBadge: {
      position: "absolute",
      bottom: -1,
      right: -1,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "#22C55E",
      borderWidth: 3,
      borderColor: colors.surface,
    },

    name: {
      color: colors.text,
      fontSize: 21,
      lineHeight: 27,
      fontFamily: RBZFont.extraBold,
      letterSpacing: -0.45,
    },

    matchBadge: {
      alignSelf: "flex-start",
      marginTop: 6,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.brandSoft,
    },

    matchText: {
      color: colors.brand,
      fontSize: 11.5,
      lineHeight: 15,
      fontFamily: RBZFont.bold,
    },

    profileArrow: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand,
    },

    actionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
    },

    actionBtn: {
      flex: 1,
      minHeight: 84,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },

    actionBtnPressed: {
      transform: [{ scale: 0.97 }],
      backgroundColor: colors.brandSoft,
    },

    actionIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandSoft,
      marginBottom: 7,
    },

    actionLabel: {
      color: colors.text,
      fontSize: 12.5,
      lineHeight: 17,
      fontFamily: RBZFont.bold,
    },
  });
}
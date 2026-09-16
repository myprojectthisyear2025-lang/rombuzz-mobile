/**
 * Path: src/features/chat/list/useChatListStyles.ts
 * Purpose: Theme-aware Manrope styling for the RomBuzz chat inbox.
 */

import { useMemo } from "react";
import { StyleSheet } from "react-native";

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  RBZFont,
} from "@/src/design/rombuzzTypography";

export function useChatListStyles() {
  const {
    colors,
  } = useRomBuzzTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor:
            colors.background,
        },

        header: {
          paddingHorizontal: 18,
          paddingBottom: 14,
          backgroundColor:
            colors.background,
        },

        headerTop: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent:
            "space-between",
        },

        headerTitle: {
          color: colors.text,
          fontSize: 28,
          lineHeight: 34,
          fontFamily:
            RBZFont.extraBold,
          letterSpacing: -0.8,
        },

        headerSubtitle: {
          marginTop: 2,
          color:
            colors.textSecondary,
          fontSize: 13,
          lineHeight: 18,
          fontFamily:
            RBZFont.medium,
        },

        searchWrap: {
          marginTop: 14,
          height: 46,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 14,
          borderRadius: 16,
          backgroundColor:
            colors.surface,
          borderWidth: 1,
          borderColor:
            colors.border,
        },

        search: {
          flex: 1,
          color: colors.text,
          fontSize: 14.5,
          fontFamily:
            RBZFont.medium,
        },

        list: {
          flex: 1,
          backgroundColor:
            colors.background,
        },

        listContent: {
          paddingHorizontal: 14,
          paddingTop: 2,
        },

        row: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 11,
          paddingHorizontal: 12,
          borderRadius: 18,
          backgroundColor:
            colors.surface,
          marginBottom: 9,
          borderWidth: 1,
          borderColor:
            colors.border,
        },

        rowPressed: {
          backgroundColor:
            colors.surfaceMuted,
        },

        rowPinned: {
          borderColor:
            colors.brand,
          backgroundColor:
            colors.brandSoft,
        },

        rowFlags: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginLeft: 8,
        },

        avatarWrap: {
          width: 58,
          height: 58,
          borderRadius: 19,
        },

        avatar: {
          width: 58,
          height: 58,
          borderRadius: 19,
        },

        onlineDot: {
          position: "absolute",
          right: -1,
          bottom: -1,
          width: 15,
          height: 15,
          borderRadius: 8,
          backgroundColor:
            "#22C55E",
          borderWidth: 2.5,
          borderColor:
            colors.surface,
        },

        mid: {
          flex: 1,
          minWidth: 0,
          marginLeft: 12,
        },

        topLine: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent:
            "space-between",
        },

        name: {
          maxWidth: "78%",
          color: colors.text,
          fontSize: 15.5,
          lineHeight: 20,
          fontFamily:
            RBZFont.bold,
        },

        nameUnread: {
          fontFamily:
            RBZFont.extraBold,
        },

        bottomLine: {
          marginTop: 4,
          flexDirection: "row",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 10,
        },

        preview: {
          flex: 1,
          color:
            colors.textSecondary,
          fontSize: 13,
          lineHeight: 18,
          fontFamily:
            RBZFont.regular,
        },

        previewUnread: {
          color: colors.text,
          fontFamily:
            RBZFont.semiBold,
        },

        badge: {
          minWidth: 24,
          height: 24,
          paddingHorizontal: 7,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            colors.brand,
        },

        badgeText: {
          color: colors.white,
          fontSize: 11.5,
          fontFamily:
            RBZFont.extraBold,
        },

        empty: {
          alignItems: "center",
          paddingTop: 90,
          paddingHorizontal: 24,
        },

        emptyTitle: {
          marginTop: 12,
          color: colors.text,
          fontSize: 18,
          fontFamily:
            RBZFont.extraBold,
        },

        emptySub: {
          marginTop: 6,
          color:
            colors.textSecondary,
          fontSize: 13,
          lineHeight: 19,
          fontFamily:
            RBZFont.regular,
          textAlign: "center",
        },

        sheetBackdrop: {
          flex: 1,
          justifyContent:
            "flex-end",
          backgroundColor:
            colors.overlay,
        },

        actionSheet: {
          paddingTop: 10,
          paddingHorizontal: 18,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          backgroundColor:
            colors.surfaceRaised,
          borderTopWidth: 1,
          borderColor:
            colors.border,
        },

        sheetHandle: {
          alignSelf: "center",
          width: 42,
          height: 5,
          borderRadius: 999,
          backgroundColor:
            colors.borderStrong,
          marginBottom: 14,
        },

        sheetTitle: {
          color: colors.text,
          fontSize: 18,
          fontFamily:
            RBZFont.extraBold,
          marginBottom: 8,
        },

        sheetAction: {
          minHeight: 50,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth:
            StyleSheet.hairlineWidth,
          borderBottomColor:
            colors.border,
        },

        sheetActionText: {
          color: colors.text,
          fontSize: 14.5,
          fontFamily:
            RBZFont.semiBold,
        },

        sheetActionDanger: {
          minHeight: 50,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth:
            StyleSheet.hairlineWidth,
          borderBottomColor:
            colors.border,
        },

        sheetActionDangerText: {
          color: colors.danger,
          fontSize: 14.5,
          fontFamily:
            RBZFont.bold,
        },
      }),
    [
      colors,
    ]
  );
}
/**
 * Path: src/features/profile/edit/profileEdit.styles.ts
 * Purpose: Semantic light/dark styling for the modern Edit Profile experience.
 * Used by: Edit Profile shell, rows, sections, and focused editors.
 */

import type {
    RomBuzzColors,
} from "@/src/design/rombuzzTheme";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

import {
    StyleSheet,
} from "react-native";

export function createProfileEditStyles(
  colors: RomBuzzColors
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    header: {
      minHeight: 56,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        colors.border,
      backgroundColor:
        colors.background,
    },

    headerSide: {
      width: 74,
      justifyContent: "center",
    },

    headerSideRight: {
      alignItems: "flex-end",
    },

    headerIcon: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
    },

    headerTitle: {
      flex: 1,
      color: colors.text,
      fontFamily: RBZFont.bold,
      fontSize: 17,
      textAlign: "center",
      letterSpacing: -0.3,
    },

    headerAction: {
      color: colors.brand,
      fontFamily:
        RBZFont.semiBold,
      fontSize: 15,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 40,
    },

    section: {
      marginBottom: 24,
    },

    sectionLabel: {
      marginBottom: 7,
      color: colors.textMuted,
      fontFamily: RBZFont.bold,
      fontSize: 11,
      letterSpacing: 0.7,
      textTransform: "uppercase",
    },

    sectionBody: {
      borderTopWidth:
        StyleSheet.hairlineWidth,
      borderTopColor:
        colors.border,
    },

    row: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        colors.border,
    },

    rowIcon: {
      width: 28,
      marginRight: 8,
    },

    rowMain: {
      flex: 1,
      paddingVertical: 11,
    },

    rowTitle: {
      color: colors.text,
      fontFamily:
        RBZFont.semiBold,
      fontSize: 15,
    },

    rowSubtitle: {
      marginTop: 2,
      color: colors.textMuted,
      fontFamily:
        RBZFont.regular,
      fontSize: 12.5,
    },

    rowValue: {
      maxWidth: "42%",
      marginLeft: 12,
      color: colors.textSecondary,
      fontFamily: RBZFont.medium,
      fontSize: 13,
      textAlign: "right",
    },

    editorLabel: {
      marginTop: 16,
      marginBottom: 6,
      color:
        colors.textSecondary,
      fontFamily:
        RBZFont.semiBold,
      fontSize: 12,
    },

    input: {
      minHeight: 48,
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor:
        colors.borderStrong,
      borderRadius: 10,
      backgroundColor:
        colors.surface,
      color: colors.text,
      fontFamily: RBZFont.medium,
      fontSize: 15,
    },

    inputDisabled: {
      opacity: 0.48,
    },

    helper: {
      marginTop: 7,
      color: colors.textMuted,
      fontFamily:
        RBZFont.regular,
      fontSize: 12,
    },
  });
}
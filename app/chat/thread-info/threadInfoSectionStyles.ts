/**
 * Path: src/features/chat/threadInfo/threadInfoSectionStyles.ts
 * Purpose: Theme-aware cards, rows, nickname, tone, and safety styles for Chat Thread Info.
 */

import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export function createThreadInfoSectionStyles(colors: any) {
  return StyleSheet.create({
    card: {
      marginTop: 12,
      borderRadius: 20,
      padding: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardPressed: {
      transform: [{ scale: 0.99 }],
      backgroundColor: colors.surfaceMuted,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginBottom: 7,
    },
    sectionIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandSoft,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: RBZFont.extraBold,
    },
    sectionHint: {
      marginBottom: 12,
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
      fontFamily: RBZFont.regular,
    },
    nickRow: {
      minHeight: 50,
      paddingHorizontal: 12,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    nickInputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    nickInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      lineHeight: 19,
      fontFamily: RBZFont.medium,
      paddingVertical: 12,
    },
    clearBtn: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    okBtn: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#22C55E",
    },
    cancelBtn: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tonesRow: {
      flexDirection: "row",
      gap: 9,
      marginTop: 5,
    },
    toneChip: {
      flex: 1,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      position: "relative",
    },
    toneChipActive: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    toneChipPressed: {
      transform: [{ scale: 0.97 }],
    },
    toneText: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 17,
      fontFamily: RBZFont.bold,
    },
    toneTextActive: {
      color: colors.white,
    },
    toneActiveDot: {
      position: "absolute",
      bottom: 4,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.white,
    },
    hr: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 3,
    },
    row: {
      minHeight: 60,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 9,
    },
    rowPressed: {
      opacity: 0.72,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandSoft,
    },
    rowIconDanger: {
      backgroundColor: colors.surfaceMuted,
    },
    rowTitle: {
      color: colors.text,
      fontSize: 14.5,
      lineHeight: 19,
      fontFamily: RBZFont.bold,
    },
    rowTitleDanger: {
      color: colors.danger,
    },
    rowSub: {
      marginTop: 3,
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: RBZFont.regular,
    },
  });
}
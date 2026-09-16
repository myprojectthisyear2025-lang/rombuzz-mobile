/** Theme-aware sheets styles for the mobile chat window. */
import { StyleSheet } from "react-native";
import { RBZFont } from "@/src/design/rombuzzTypography";
import type { RomBuzzColors } from "@/src/design/rombuzzTheme";

export function createSheetsStyles(
  colors: RomBuzzColors,
  BUBBLE_MAX_W: number,
) {
  return StyleSheet.create({
    sheetOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      padding: 12,
    },
    sheet: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: "100%",
    },
    sheetTitle: {
      fontSize: 14,
      fontFamily: RBZFont.extraBold,
      color: colors.text,
      marginBottom: 8,
    },
    emojiRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingBottom: 8,
    },
    emojiBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emojiPickerOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    emojiPickerSheet: {
      backgroundColor: colors.surfaceRaised,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 18,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    emojiPickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    emojiPickerTitle: {
      fontSize: 18,
      fontFamily: RBZFont.extraBold,
      color: colors.text,
    },
    emojiPickerClose: {
      width: 44,
      height: 44,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emojiPickerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    emojiPickerBtn: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emojiPickerBtnText: {
      fontSize: 24,
    },
    replyIdeasOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    replyIdeasSheet: {
      backgroundColor: colors.surfaceRaised,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 18,
      borderTopWidth: 1,
      borderColor: colors.border,
      maxHeight: "78%",
    },
    replyIdeasHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    replyIdeasTitle: {
      fontSize: 18,
      fontFamily: RBZFont.extraBold,
      color: colors.text,
    },
    replyModeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    replyModeChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 44,
      justifyContent: "center",
    },
    replyModeChipText: {
      fontSize: 12,
      fontFamily: RBZFont.extraBold,
      color: colors.text,
    },
    replyIdeasLoadingWrap: {
      paddingVertical: 10,
    },
    replyIdeasLoadingText: {
      fontSize: 13,
      fontFamily: RBZFont.bold,
      color: colors.textSecondary,
    },
    replyIdeasErrorText: {
      fontSize: 12,
      fontFamily: RBZFont.bold,
      color: colors.brand,
      marginBottom: 10,
    },
    replyIdeasList: {
      gap: 10,
    },
    replyIdeaCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    replyIdeaTone: {
      fontSize: 11,
      fontFamily: RBZFont.extraBold,
      color: colors.brand,
      marginBottom: 6,
    },
    replyIdeaText: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: RBZFont.bold,
      color: colors.text,
    },
    sheetDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 10,
    },
    sheetItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      minHeight: 48,
    },
    sheetItemText: {
      fontSize: 14,
      fontFamily: RBZFont.extraBold,
      color: colors.text,
    },
  });
}

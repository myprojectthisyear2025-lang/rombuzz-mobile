/** Theme-aware shell styles for the mobile chat window. */
import { StyleSheet } from "react-native";
import { RBZFont } from "@/src/design/rombuzzTypography";
import type { RomBuzzColors } from "@/src/design/rombuzzTheme";

export function createShellStyles(colors: RomBuzzColors, BUBBLE_MAX_W: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      paddingTop: 8,
      paddingBottom: 12,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    topBtn: {
      width: 40,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
    },
    peerInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
    },
    peerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 15,
      backgroundColor: colors.surfaceMuted,
    },
    peerName: {
      color: colors.text,
      fontSize: 15,
      fontFamily: RBZFont.extraBold,
    },
    peerSub: {
      color: colors.textSecondary,
      fontSize: 10.5,
      marginTop: 1,
      fontFamily: RBZFont.medium,
    },
    topActions: {
      flexDirection: "row",
      gap: 5,
    },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    typingBarWrap: {
      paddingHorizontal: 12,
      paddingTop: 2,
      paddingBottom: 1,
      backgroundColor: colors.background,
    },
    typingBar: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.brand,
    },
    typingBarText: {
      fontSize: 12,
      fontFamily: RBZFont.extraBold,
      color: colors.textSecondary,
    },
    scrollBtnsWrap: {
      position: "absolute",
      right: 14,
      gap: 10,
      alignItems: "center",
    },
    timestampPillWrap: {
      position: "absolute",
      left: 16,
      right: 16,
      alignItems: "center",
      zIndex: 40,
    },
    timestampPill: {
      maxWidth: "92%",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "rgba(17,24,39,0.88)",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    timestampPillText: {
      color: colors.white,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: RBZFont.extraBold,
    },
    scrollBtn: {
      width: 44,
      height: 44,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 3,
    },
  });
}

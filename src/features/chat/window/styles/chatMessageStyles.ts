/** Theme-aware message styles for the mobile chat window. */
import { StyleSheet } from "react-native";
import { RBZFont } from "@/src/design/rombuzzTypography";
import type { RomBuzzColors } from "@/src/design/rombuzzTheme";

export function createMessageStyles(
  colors: RomBuzzColors,
  BUBBLE_MAX_W: number,
) {
  return StyleSheet.create({
    bubbleRow: {
      marginBottom: 6,
      flexDirection: "row",
      alignItems: "flex-start",
      overflow: "visible",
    },
    rowMine: {
      justifyContent: "flex-end",
    },
    rowPeer: {
      justifyContent: "flex-start",
    },
    bubble: {
      maxWidth: BUBBLE_MAX_W,
      minWidth: 44,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      position: "relative",
      overflow: "visible",
      flexShrink: 0,
    },
    mine: {
      backgroundColor: colors.brand,
      borderTopRightRadius: 6,
      borderColor: colors.brand,
    },
    peer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 6,
      borderColor: colors.border,
    },
    msgText: {
      fontSize: 14,
      lineHeight: 21,
      fontFamily: RBZFont.medium,
    },
    mineText: {
      color: colors.white,
      fontFamily: RBZFont.medium,
    },
    peerText: {
      color: colors.text,
      fontFamily: RBZFont.medium,
    },

    tinyAvatarBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      marginRight: 8,
      marginTop: 2,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    tinyAvatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
    },
    messageColumn: {
      maxWidth: BUBBLE_MAX_W + 24,
      flexShrink: 1,
    },
    messageColumnMine: {
      alignItems: "flex-end",
    },
    messageColumnPeer: {
      alignItems: "flex-start",
    },
    editedRow: {
      marginBottom: 4,
      paddingHorizontal: 6,
    },
    editedRowMine: {
      alignSelf: "flex-end",
    },
    editedRowPeer: {
      alignSelf: "flex-start",
    },
    editedRowText: {
      fontSize: 11,
      lineHeight: 13,
      fontFamily: RBZFont.extraBold,
      color: colors.textSecondary,
    },
    pinnedMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "stretch",
      gap: 6,
      marginBottom: 6,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: colors.brandSoft,
      borderWidth: 1,
      borderColor: colors.brandSoft,
    },
    pinnedMetaRowMine: {
      alignSelf: "flex-end",
    },
    pinnedMetaRowPeer: {
      alignSelf: "flex-start",
    },
    pinnedMetaIcon: {
      marginLeft: 0,
    },
    pinnedMetaText: {
      fontSize: 11,
      lineHeight: 13,
      fontFamily: RBZFont.extraBold,
      color: colors.brand,
    },

    statusRow: {
      marginTop: 4,
      paddingHorizontal: 4,
    },
    statusRowMine: {
      alignSelf: "flex-end",
    },
    statusLabel: {
      fontSize: 11,
      lineHeight: 13,
      color: colors.textSecondary,
      fontFamily: RBZFont.bold,
    },
    msgWrap: {
      position: "relative",
      alignSelf: "flex-start",
      overflow: "visible",
    },
    msgWrapMine: {
      alignSelf: "flex-end",
    },
    msgWrapPeer: {
      alignSelf: "flex-start",
    },
    msgWrapHighlight: {
      borderWidth: 1.5,
      borderColor: colors.brandSoft,
      backgroundColor: colors.brandSoft,
      borderRadius: 18,
      padding: 4,
    },
    msgWrapWithReact: {
      marginBottom: 16,
    },
    replyQuote: {
      width: "100%",
      minWidth: Math.min(BUBBLE_MAX_W - 24, 176),
      flexDirection: "row",
      alignItems: "stretch",
      gap: 10,
      borderRadius: 14,
      overflow: "hidden",
    },
    replyQuoteStandalone: {
      alignSelf: "stretch",
      marginBottom: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderWidth: 1,
    },
    replyQuoteInside: {
      alignSelf: "stretch",
      width: "100%",
      marginBottom: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
      backgroundColor: "rgba(255,255,255,0.15)",
    },
    replyQuoteMine: {
      backgroundColor: colors.brandSoft,
      borderColor: colors.border,
    },
    replyQuotePeer: {
      backgroundColor: colors.brandSoft,
      borderColor: colors.brandSoft,
    },
    replyQuoteAccent: {
      width: 4,
      borderRadius: 999,
      backgroundColor: colors.brand,
    },
    replyQuoteContent: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
      paddingRight: 2,
    },
    replyQuoteSender: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: RBZFont.extraBold,
    },
    replyQuoteSenderMine: {
      color: colors.brand,
    },
    replyQuoteSenderPeer: {
      color: colors.brand,
    },
    replyQuoteText: {
      marginTop: 3,
      fontSize: 13,
      lineHeight: 17,
      fontFamily: RBZFont.bold,
    },
    replyQuoteTextMine: {
      color: colors.text,
    },
    replyQuoteTextPeer: {
      color: colors.text,
    },
    reactionPill: {
      position: "absolute",
      bottom: -10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      zIndex: 50,
      elevation: 6,
    },
    reactionPillMine: {
      right: -6,
    },
    reactionPillPeer: {
      right: -6,
    },
    reactText: {
      fontSize: 12,
      fontFamily: RBZFont.extraBold,
      color: colors.text,
    },
    systemRow: {
      alignItems: "center",
      marginBottom: 8,
    },
    systemBubble: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    systemBubbleAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      justifyContent: "center",
    },
    systemText: {
      fontSize: 12,
      fontFamily: RBZFont.extraBold,
      color: colors.textSecondary,
    },
    systemActionBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.brandSoft,
      borderWidth: 1,
      borderColor: colors.brandSoft,
    },
    systemActionText: {
      fontSize: 11,
      fontFamily: RBZFont.extraBold,
      color: colors.brand,
    },
  });
}

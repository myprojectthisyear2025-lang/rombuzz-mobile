/**
 * Path: src/features/profile/gallery/upload/profileUploadPreview.styles.ts
 * Purpose: Shared layout for modern Profile Gallery upload/preview UI.
 * Used by: ProfileUploadPreview, ProfileUploadMediaPreview, ProfileUploadEditor.
 */

import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    safe: {
      flex: 1,
    },

    header: {
      minHeight: 58,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
    },

    headerSide: {
      width: 76,
    },

    headerRight: {
      alignItems: "flex-end",
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },

    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontFamily: RBZFont.bold,
      fontSize: 15.5,
      letterSpacing: -0.3,
    },

    shareButton: {
      minWidth: 62,
      height: 36,
      paddingHorizontal: 13,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    shareText: {
      color: "#FFFFFF",
      fontFamily: RBZFont.bold,
      fontSize: 12.5,
    },

    disabled: {
      opacity: 0.48,
    },

    scroll: {
      flex: 1,
      width: "100%",
    },

    scrollContent: {
      width: "100%",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 10,
    },

    previewFrame: {
      overflow: "hidden",
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    previewMedia: {
      width: "100%",
      height: "100%",
    },

    emptyPreview: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    expandButton: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "rgba(8,9,11,0.55)",
    },

    mediaTypeBadge: {
      position: "absolute",
      left: 10,
      bottom: 10,
      minHeight: 26,
      paddingHorizontal: 9,
      borderRadius: 13,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor:
        "rgba(8,9,11,0.55)",
    },

    mediaTypeText: {
      color: "#FFFFFF",
      fontFamily: RBZFont.bold,
      fontSize: 9.5,
      letterSpacing: 0.6,
    },

    editor: {
      width: "100%",
      maxWidth: 520,
      marginTop: 18,
      gap: 22,
      paddingHorizontal: 2,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 8,
    },

    sectionLabel: {
      fontFamily:
        RBZFont.semiBold,
      fontSize: 13.5,
      letterSpacing: -0.2,
    },

    counter: {
      fontFamily: RBZFont.medium,
      fontSize: 10.5,
    },

    captionInput: {
      minHeight: 82,
      maxHeight: 130,
      borderWidth:
        StyleSheet.hairlineWidth,
      borderRadius: 15,
      paddingHorizontal: 13,
      paddingTop: 11,
      paddingBottom: 11,
      fontFamily: RBZFont.medium,
      fontSize: 13.5,
      lineHeight: 19,
    },

    visibilitySection: {
      width: "100%",
    },

    visibilityRow: {
      marginTop: 9,
      flexDirection: "row",
      gap: 7,
    },

    visibilityChoice: {
      flex: 1,
      minHeight: 48,
      borderWidth:
        StyleSheet.hairlineWidth,
      borderRadius: 14,
      paddingHorizontal: 7,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },

    visibilityLabel: {
      fontFamily:
        RBZFont.semiBold,
      fontSize: 10.5,
    },

    scopeHint: {
      minHeight: 30,
      marginTop: 5,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 3,
    },

    scopeHintText: {
      flex: 1,
      fontFamily: RBZFont.medium,
      fontSize: 10.5,
      lineHeight: 14,
    },

    fullscreen: {
      flex: 1,
      backgroundColor: "#000000",
      alignItems: "center",
      justifyContent: "center",
    },

    fullClose: {
      position: "absolute",
      right: 14,
      zIndex: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        "rgba(15,16,18,0.58)",
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor:
        "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
    },

    fullMedia: {
      width: "100%",
      height: "100%",
    },
  });
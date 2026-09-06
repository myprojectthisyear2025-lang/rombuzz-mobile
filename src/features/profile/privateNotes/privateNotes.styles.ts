/**
 * Path: src/features/profile/privateNotes/privateNotes.styles.ts
 * Purpose: Layout styles for the redesigned Profile Private Notes experience.
 * Used by: src/components/profile/PrivateNotesTab.tsx.
 */

import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export const privateNotesStyles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    header: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 10,
    },

    headingWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },

    privateIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },

    headingText: {
      flex: 1,
    },

    title: {
      fontFamily: RBZFont.bold,
      fontSize: 16,
      letterSpacing: -0.3,
    },

    subtitle: {
      marginTop: 1,
      fontFamily: RBZFont.medium,
      fontSize: 10.5,
    },

    addButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },

    content: {
      paddingHorizontal: 12,
      paddingBottom: 30,
      gap: 8,
    },

    emptyContent: {
      flexGrow: 1,
      justifyContent: "center",
    },

    empty: {
      alignItems: "center",
      paddingHorizontal: 30,
      paddingBottom: 60,
    },

    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyTitle: {
      marginTop: 14,
      fontFamily: RBZFont.bold,
      fontSize: 16,
      letterSpacing: -0.25,
    },

    emptySubtitle: {
      marginTop: 5,
      maxWidth: 280,
      textAlign: "center",
      fontFamily: RBZFont.medium,
      fontSize: 12,
      lineHeight: 17,
    },

    emptyAction: {
      minHeight: 40,
      marginTop: 17,
      paddingHorizontal: 16,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    emptyActionText: {
      color: "#FFFFFF",
      fontFamily: RBZFont.semiBold,
      fontSize: 12,
    },

    noteRow: {
      minHeight: 92,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 15,
      paddingLeft: 14,
      paddingRight: 10,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
    },

    noteMain: {
      flex: 1,
      paddingRight: 10,
    },

    noteText: {
      fontFamily: RBZFont.medium,
      fontSize: 13.5,
      lineHeight: 19,
    },

    noteDate: {
      marginTop: 8,
      fontFamily: RBZFont.medium,
      fontSize: 9.5,
    },

    noteActions: {
      alignItems: "center",
      gap: 10,
    },

    deleteButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },

    editorScreen: {
      flex: 1,
    },

    editorSafe: {
      flex: 1,
    },

    editorHeader: {
      height: 56,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: StyleSheet.hairlineWidth,
    },

    editorSide: {
      width: 74,
      minHeight: 40,
      justifyContent: "center",
    },

    editorRight: {
      alignItems: "flex-end",
    },

    editorTitle: {
      flex: 1,
      textAlign: "center",
      fontFamily: RBZFont.bold,
      fontSize: 14.5,
    },

    cancelText: {
      fontFamily: RBZFont.medium,
      fontSize: 12.5,
    },

    saveText: {
      fontFamily: RBZFont.bold,
      fontSize: 12.5,
    },

    editorBody: {
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 14,
    },

    editorPrivacy: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 12,
    },

    editorPrivacyText: {
      fontFamily: RBZFont.medium,
      fontSize: 10,
    },

    input: {
      flex: 1,
      padding: 0,
      fontFamily: RBZFont.medium,
      fontSize: 16,
      lineHeight: 24,
    },
  });
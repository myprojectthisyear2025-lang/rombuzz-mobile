/**
 * Path: src/features/profile/gallery/profileGalleryContent.styles.ts
 * Purpose: Layout and typography for the redesigned Profile Gallery shell.
 * Used by: ProfileGalleryContent.tsx.
 */

import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export const styles =
  StyleSheet.create({
    section: {
      width: "100%",
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 18,
    },

    toolbar: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    tabs: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 20,
    },

    tab: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      position: "relative",
      paddingHorizontal: 1,
    },

    tabText: {
      fontFamily:
        RBZFont.semiBold,
      fontSize: 13.5,
      letterSpacing: -0.2,
    },

    count: {
      fontFamily: RBZFont.bold,
      fontSize: 10.5,
    },

    indicator: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      borderRadius: 2,
    },

    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    mediaAction: {
      width: 36,
      height: 36,
      borderRadius: 18,

      borderWidth:
        StyleSheet.hairlineWidth,

      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },

    plusBadge: {
      position: "absolute",
      right: -1,
      bottom: -1,

      width: 14,
      height: 14,
      borderRadius: 7,

      alignItems: "center",
      justifyContent: "center",
    },

    gridArea: {
      width: "100%",
      marginTop: 8,
    },

    emptyState: {
      minHeight: 112,
      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 18,
      paddingVertical: 18,
    },

    emptyTitle: {
      marginTop: 7,

      fontFamily:
        RBZFont.semiBold,

      fontSize: 13.5,
    },

    emptyText: {
      marginTop: 3,

      fontFamily:
        RBZFont.medium,

      fontSize: 11.5,
      lineHeight: 16,
      textAlign: "center",
    },
  });
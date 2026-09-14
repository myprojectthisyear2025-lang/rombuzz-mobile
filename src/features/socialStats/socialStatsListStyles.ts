/**
 * Path: src/features/socialStats/socialStatsListStyles.ts
 * Purpose: Compact card styling for Social Stats list modals in light and dark themes.
 */

import {
    StyleSheet,
} from "react-native";

import {
    RBZDesign,
} from "@/src/design/rombuzzDesign";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

export const socialListStyles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    header: {
      paddingHorizontal: 18,
      paddingBottom: 12,

      flexDirection: "row",

      alignItems: "center",
    },

    headerButton: {
      width: 42,
      height: 42,

      borderRadius: 21,

      borderWidth: 1,

      alignItems: "center",

      justifyContent:
        "center",
    },

    titleWrap: {
      flex: 1,

      alignItems: "center",

      paddingHorizontal: 8,
    },

    title: {
      fontSize: 20,

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -0.6,
    },

    subtitle: {
      fontSize: 11.5,

      fontFamily:
        RBZFont.medium,

      marginTop: 2,

      textAlign: "center",
    },

    body: {
      flex: 1,
    },

    listContent: {
      paddingHorizontal: 14,

      paddingTop: 4,

      paddingBottom: 26,
    },

    loading: {
      flex: 1,

      alignItems: "center",

      justifyContent:
        "center",

      padding: 40,
    },

    loadingText: {
      fontSize: 13,

      fontFamily:
        RBZFont.medium,

      marginTop: 12,
    },

    empty: {
      flex: 1,

      alignItems: "center",

      justifyContent:
        "center",

      paddingHorizontal: 38,
    },

    emptyIcon: {
      width: 76,
      height: 76,

      borderRadius: 38,

      alignItems: "center",

      justifyContent:
        "center",
    },

    emptyTitle: {
      fontSize: 18,

      fontFamily:
        RBZFont.bold,

      marginTop: 18,

      textAlign: "center",
    },

    emptyText: {
      fontSize: 13,

      lineHeight: 19,

      fontFamily:
        RBZFont.medium,

      marginTop: 7,

      textAlign: "center",
    },

    card: {
      borderRadius:
        RBZDesign.radius.md,

      borderWidth: 1,

      padding: 13,

      marginBottom: 10,
    },

    profileRow: {
      flexDirection: "row",

      alignItems:
        "flex-start",
    },

    avatarWrap: {
      width: 72,
      height: 72,

      borderRadius: 24,

      overflow: "hidden",

      marginRight: 12,
    },

    avatar: {
      width: "100%",
      height: "100%",
    },

    avatarFallback: {
      flex: 1,

      alignItems: "center",

      justifyContent:
        "center",
    },

    avatarLetter: {
      fontSize: 24,

      fontFamily:
        RBZFont.extraBold,
    },

    info: {
      flex: 1,
      minWidth: 0,
    },

    nameRow: {
      flexDirection: "row",

      alignItems: "center",

      flexWrap: "wrap",
    },

    name: {
      fontSize: 16.5,

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -0.4,
    },

    metaRow: {
      flexDirection: "row",

      flexWrap: "wrap",

      alignItems: "center",

      marginTop: 3,
    },

    meta: {
      fontSize: 11.5,

      fontFamily:
        RBZFont.medium,

      marginRight: 6,
    },

    bio: {
      fontSize: 12,

      lineHeight: 17,

      fontFamily:
        RBZFont.medium,

      marginTop: 7,
    },

    actions: {
      flexDirection: "row",

      flexWrap: "wrap",

      gap: 8,

      marginTop: 12,
    },

    action: {
      minHeight: 38,

      borderRadius: 12,

      borderWidth: 1,

      paddingHorizontal: 12,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      gap: 6,
    },

    primaryAction: {
      flexGrow: 1,
    },

    secondaryAction: {
      flexGrow: 1,
    },

    actionText: {
      fontSize: 11.5,

      fontFamily:
        RBZFont.bold,
    },

    reportButton: {
      minHeight: 34,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      gap: 6,

      marginTop: 2,
    },

    reportText: {
      fontSize: 11.5,

      fontFamily:
        RBZFont.semiBold,
    },
  });
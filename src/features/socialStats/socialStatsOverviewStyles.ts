/**
 * Path: src/features/socialStats/socialStatsOverviewStyles.ts
 * Purpose: Static layout and typography for the Social Stats overview UI.
 */

import {
    Platform,
    StyleSheet,
} from "react-native";

import {
    RBZDesign,
} from "@/src/design/rombuzzDesign";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

export const socialOverviewStyles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    header: {
      paddingHorizontal: 18,
      paddingBottom: 10,
    },

    topBar: {
      minHeight: 58,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    topAction: {
      width: 42,
      height: 42,

      borderRadius: 21,

      alignItems: "center",

      justifyContent:
        "center",

      borderWidth: 1,
    },

    brandWrap: {
      flex: 1,

      alignItems: "center",

      justifyContent:
        "center",
    },

    brand: {
      fontSize: 26,

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -0.9,
    },

    brandTagline: {
      fontSize: 8.5,

      fontFamily:
        RBZFont.semiBold,

      letterSpacing: 1.4,

      marginTop: 1,

      textTransform:
        "uppercase",
    },

    titleWrap: {
      paddingTop: 5,
      paddingBottom: 4,
    },

    title: {
      fontSize: 27,

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -1,
    },

    subtitle: {
      fontSize: 14.5,

      fontFamily:
        RBZFont.medium,

      marginTop: 3,
    },

    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 18,
      paddingBottom: 22,
    },

    hero: {
      minHeight: 158,

      borderRadius:
        RBZDesign.radius.lg,

      borderWidth: 1,

      padding: 18,

      overflow: "hidden",
    },

    heroGlow: {
      position: "absolute",

      width: 180,
      height: 180,

      borderRadius: 90,

      right: -70,
      top: -60,
    },

    heroTop: {
      flexDirection: "row",

      alignItems: "center",
    },

    heroIcon: {
      width: 48,
      height: 48,

      borderRadius: 24,

      alignItems: "center",

      justifyContent:
        "center",

      marginRight: 13,
    },

    heroCopy: {
      flex: 1,
    },

    heroLabel: {
      fontSize: 14,

      fontFamily:
        RBZFont.bold,
    },

    heroCountRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 1,
    },

    heroCount: {
      fontSize: 34,

      lineHeight: 40,

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -1.2,
    },

    heroPill: {
      borderWidth: 1,

      borderRadius: 999,

      paddingHorizontal: 10,

      paddingVertical: 5,

      marginLeft: 12,
    },

    heroPillText: {
      fontSize: 11,

      fontFamily:
        RBZFont.bold,
    },

    previewRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 13,

      paddingLeft: 61,
    },

    previewAvatar: {
      width: 34,
      height: 34,

      borderRadius: 17,

      borderWidth: 2,
    },

    previewAvatarOffset: {
      marginLeft: -8,
    },

    previewFallback: {
      alignItems: "center",

      justifyContent:
        "center",
    },

    previewMore: {
      width: 34,
      height: 34,

      borderRadius: 17,

      marginLeft: -8,

      alignItems: "center",

      justifyContent:
        "center",
    },

    previewMoreText: {
      fontSize: 10.5,

      fontFamily:
        RBZFont.bold,
    },

    metricsRow: {
      flexDirection: "row",

      gap: 9,

      marginTop: 12,
    },

    metricCard: {
      flex: 1,

      minHeight: 118,

      borderRadius:
        RBZDesign.radius.md,

      borderWidth: 1,

      paddingHorizontal: 10,

      paddingVertical: 14,

      alignItems: "center",

      justifyContent:
        "center",
    },

    metricIcon: {
      width: 34,
      height: 34,

      borderRadius: 17,

      alignItems: "center",

      justifyContent:
        "center",
    },

    metricLabel: {
      fontSize: 11.5,

      fontFamily:
        RBZFont.semiBold,

      marginTop: 8,

      textAlign: "center",
    },

    metricValue: {
      fontSize: 24,

      fontFamily:
        RBZFont.extraBold,

      marginTop: 3,

      letterSpacing: -0.6,
    },

    metricMeta: {
      fontSize: 9.5,

      fontFamily:
        RBZFont.medium,

      marginTop: 1,

      textAlign: "center",
    },

    recent: {
      borderRadius:
        RBZDesign.radius.md,

      borderWidth: 1,

      padding: 14,

      marginTop: 12,
    },

    recentHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    recentTitle: {
      fontSize: 16,

      fontFamily:
        RBZFont.bold,

      letterSpacing: -0.3,
    },

    recentBody: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 13,
    },

    recentAvatars: {
      flexDirection: "row",

      alignItems: "center",

      paddingLeft: 2,
    },

    recentText: {
      flex: 1,

      marginLeft: 12,

      fontSize: 12,

      lineHeight: 17,

      fontFamily:
        RBZFont.medium,
    },

    sideNote: {
      alignItems: "flex-end",

      paddingTop: 12,

      paddingRight: 5,

      transform: [
        {
          rotate: "-7deg",
        },
      ],
    },

    sideNoteText: {
      fontSize: 14,

      lineHeight: 15,

      fontFamily:
        Platform.OS ===
        "ios"
          ? "Snell Roundhand"
          : "cursive",

      fontWeight: "400",

      textAlign: "right",
    },
  });
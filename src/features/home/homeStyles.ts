/**
 * Path: src/features/home/homeStyles.ts
 * Purpose: Responsive styles for the redesigned RomBuzz homepage.
 * Used by: homepage.tsx and HomeDashboard.tsx.
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

export const homeStyles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        RBZDesign.color.canvas,
    },

    content: {
      flex: 1,
    },

    contentContainer: {
      paddingBottom: 8,
    },

    header: {
      paddingHorizontal: 18,
      backgroundColor:
        RBZDesign.color.canvas,
    },

    topBar: {
      minHeight: 58,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    letsBuzzButton: {
      width: 64,
      minHeight: 54,

      alignItems: "center",

      justifyContent: "center",

      gap: 2,
    },

    letsBuzzIconWrap: {
      width: 36,
      height: 36,

      borderRadius: 12,

      alignItems: "center",

      justifyContent: "center",

      backgroundColor:
        "rgba(245,46,100,0.10)",

      borderWidth: 1,

      borderColor:
        "rgba(245,46,100,0.12)",
    },

    letsBuzzCopy: {
      alignItems: "center",

      justifyContent: "center",
    },

    letsBuzzTitle: {
      color:
        RBZDesign.color.ink,

      fontSize: 9.5,

      fontFamily:
        RBZFont.bold,

      textAlign: "center",

      lineHeight: 11,
    },

    letsBuzzMeta: {
      display: "none",
    },

    topBarSpacer: {
      width: 64,
      minHeight: 54,
    },

    topActionPressed: {
      opacity: 0.55,
    },

    brandWrap: {
      flex: 1,

      alignItems: "center",

      justifyContent: "center",
    },

    brand: {
      color:
        RBZDesign.color.ink,

      fontSize: 26,

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -0.9,
    },

    brandAccent: {
      color:
        RBZDesign.color.brand,
    },

    brandTagline: {
      color:
        RBZDesign.color.inkMuted,

      fontSize: 8.5,

      fontFamily:
        RBZFont.semiBold,

      letterSpacing: 1.4,

      marginTop: 1,

      textTransform: "uppercase",
    },

    greeting: {
      paddingTop: 6,
      paddingBottom: 6,
    },

    greetingWrap: {
      flexDirection: "row",

      alignItems: "flex-start",

      justifyContent:
        "space-between",

      gap: 8,
    },

    greetingCopy: {
      flex: 1,
      minWidth: 0,
    },

    greetingRow: {
      flexDirection: "row",

      alignItems: "center",
    },

    greetingTitle: {
      color:
        RBZDesign.color.ink,

      fontSize: 27,

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -1,
    },

    greetingEmoji: {
      fontSize: 20,
      marginLeft: 6,
    },

    greetingSubtitle: {
      color:
        RBZDesign.color.inkMuted,

      fontSize: 14.5,

      fontFamily:
        RBZFont.medium,

      marginTop: 3,
    },

    sideNote: {
      width: 102,

      alignItems: "flex-end",

      paddingTop: 0,

      transform: [
        {
          rotate: "-8deg",
        },
      ],
    },

    sideNoteText: {
      color:
        RBZDesign.color.brand,

      fontSize: 15,

      lineHeight: 16,

      fontFamily:
        Platform.OS === "ios"
          ? "Snell Roundhand"
          : "cursive",

      fontWeight: "400",

      textAlign: "right",

      opacity: 0.84,
    },

    sideNoteHeart: {
      marginTop: 1,
      marginRight: 2,
      opacity: 0.82,
    },

    featureSection: {
      paddingHorizontal: 18,
      paddingTop: 3,
    },

    featureRow: {
      flexDirection: "row",
      gap: 9,
    },

    section: {
      paddingHorizontal: 18,
      paddingTop: 13,
    },

    sectionHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginBottom: 7,
    },

    sectionTitle: {
      color:
        RBZDesign.color.ink,

      fontSize: 16.5,

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -0.25,
    },

    pulseGrid: {
      flexDirection: "row",

      flexWrap: "wrap",

      gap: 7,
    },

    safety: {
      marginHorizontal: 18,

      marginTop: 9,

      paddingTop: 9,

      paddingBottom: 2,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderTopColor:
        RBZDesign.color.line,

      flexDirection: "row",

      alignItems: "center",

      gap: 9,
    },

    safetyIcon: {
      width: 33,
      height: 33,

      borderRadius: 11,

      alignItems: "center",

      justifyContent: "center",

      backgroundColor:
        "rgba(245,46,100,0.10)",
    },

    safetyCopy: {
      flex: 1,
    },

    safetyTitle: {
      color:
        RBZDesign.color.ink,

      fontSize: 12.75,

      fontFamily:
        RBZFont.bold,
    },

    safetyText: {
      color:
        RBZDesign.color.inkMuted,

      fontSize: 10.75,

      fontFamily:
        RBZFont.regular,

      lineHeight: 13.5,

      marginTop: 1,
    },
  });
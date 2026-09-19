/**
 * Path: src/features/onboarding/FirstSignupTourPreview.styles.ts
 * Purpose: Theme-aware miniature screen styles used inside the RomBuzz Tour.
 */

import type {
    RomBuzzColors,
} from "@/src/design/rombuzzTheme";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

import {
    StyleSheet,
} from "react-native";

export function createFirstSignupTourPreviewStyles(
  colors: RomBuzzColors,
  isDark: boolean
) {
  return StyleSheet.create({
    frame: {
      minHeight: 218,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
      overflow: "hidden",
    },

    topLine: {
      minHeight: 40,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        colors.border,
    },

    miniBrand: {
      color: colors.text,
      fontFamily:
        RBZFont.extraBold,
      fontSize: 13,
      letterSpacing: -0.35,
    },

    brandAccent: {
      color: colors.brand,
    },

    muted: {
      color: colors.textMuted,
      fontFamily:
        RBZFont.medium,
      fontSize: 9.5,
    },

    content: {
      flex: 1,
      padding: 12,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    cards: {
      flexDirection: "row",
      gap: 8,
    },

    featureCard: {
      flex: 1,
      minHeight: 78,
      padding: 10,
      borderRadius: 16,
      backgroundColor:
        isDark
          ? "#24252A"
          : "#303238",
      justifyContent:
        "space-between",
    },

    featureTitle: {
      color: "#FFFFFF",
      fontFamily:
        RBZFont.bold,
      fontSize: 11.5,
    },

    featureCopy: {
      color:
        "rgba(255,255,255,0.78)",
      fontFamily:
        RBZFont.medium,
      fontSize: 9.5,
    },

    featureIcon: {
      width: 27,
      height: 27,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.brandSoft,
    },

    miniTitle: {
      color: colors.text,
      fontFamily:
        RBZFont.bold,
      fontSize: 11.5,
    },

    miniCopy: {
      color:
        colors.textSecondary,
      fontFamily:
        RBZFont.medium,
      fontSize: 9.5,
      lineHeight: 12.5,
    },

    pulseGrid: {
      marginTop: 8,
      flexDirection: "row",
      gap: 6,
    },

    pulse: {
      flex: 1,
      minHeight: 40,
      borderRadius: 12,
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor:
        colors.border,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },

    discoverCard: {
      flex: 1,
      borderRadius: 18,
      padding: 13,
      justifyContent:
        "flex-end",
      backgroundColor:
        isDark
          ? "#24252A"
          : "#3A3C42",
    },

    personBubble: {
      position: "absolute",
      top: 20,
      alignSelf: "center",
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.surface,
    },

    discoverName: {
      color: "#FFFFFF",
      fontFamily:
        RBZFont.extraBold,
      fontSize: 16,
    },

    chips: {
      flexDirection: "row",
      gap: 5,
      marginTop: 5,
    },

    chip: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        colors.surface,
    },

    chipText: {
      color:
        colors.textSecondary,
      fontFamily:
        RBZFont.semiBold,
      fontSize: 8.5,
    },

    actions: {
      marginTop: 10,
      flexDirection: "row",
      justifyContent: "center",
      gap: 14,
    },

    action: {
      width: 39,
      height: 39,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },

    radar: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    radarRing: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        colors.brandSoft,
    },

    radarCenter: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.surface,
      borderWidth: 2,
      borderColor:
        colors.brand,
    },

    radarDot: {
      position: "absolute",
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.surfaceRaised,
      borderWidth: 1,
      borderColor:
        colors.border,
    },

    tabs: {
      height: 38,
      flexDirection: "row",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        colors.border,
    },

    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },

    tabText: {
      fontFamily:
        RBZFont.semiBold,
      fontSize: 10.5,
    },

    tabIndicator: {
      position: "absolute",
      bottom: 0,
      width: 46,
      height: 2,
      borderRadius: 2,
      backgroundColor:
        colors.brand,
    },

    post: {
      margin: 11,
      padding: 11,
      borderRadius: 15,
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
    },

    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.surfaceMuted,
    },

    postMedia: {
      marginTop: 9,
      height: 58,
      borderRadius: 12,
      backgroundColor:
        colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },

    listRow: {
      minHeight: 49,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        colors.border,
    },

    grow: {
      flex: 1,
    },

    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        colors.brand,
    },

    hero: {
      padding: 12,
      borderRadius: 16,
      backgroundColor:
        colors.brandSoft,
      borderWidth: 1,
      borderColor:
        colors.brandSoft,
    },

    metrics: {
      flexDirection: "row",
      gap: 6,
      marginTop: 8,
    },

    metric: {
      flex: 1,
      minHeight: 53,
      padding: 8,
      borderRadius: 13,
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
    },

    notice: {
      minHeight: 49,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 4,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        colors.border,
    },

    iconBubble: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.brandSoft,
    },

    profileHero: {
      height: 101,
      backgroundColor:
        isDark
          ? "#2A2C32"
          : "#34363B",
      alignItems: "center",
      justifyContent: "center",
    },

    profileActions: {
      position: "absolute",
      right: 9,
      top: 9,
      flexDirection: "row",
      gap: 5,
    },

    profileAction: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor:
        "rgba(8,8,11,0.46)",
      alignItems: "center",
      justifyContent: "center",
    },

    profileName: {
      position: "absolute",
      left: 12,
      bottom: 8,
      color: "#FFFFFF",
      fontFamily:
        RBZFont.extraBold,
      fontSize: 15,
    },

    profileTabs: {
      height: 43,
      flexDirection: "row",
      alignItems: "center",
    },

    profileTab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
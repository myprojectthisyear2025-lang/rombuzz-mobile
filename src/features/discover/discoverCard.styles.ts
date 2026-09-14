/**
 * Path: src/features/discover/discoverCard.styles.ts
 * Purpose: Theme-aware Discover swipe card, profile info, badges, chips, and action button styles.
 * Used by: app/(tabs)/discover.tsx via useDiscoverVisuals.
 */

import type { RomBuzzColors } from "@/src/design/rombuzzTheme";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

const CARD_TEXT_OUTLINE = {
  textShadowColor: "rgba(0,0,0,0.98)",
  textShadowOffset: {
    width: 0,
    height: 0,
  },
  textShadowRadius: 2.8,
};

export function createDiscoverCardStyles(
  colors: RomBuzzColors,
  cardWidth: number,
  cardHeight: number
) {
  return StyleSheet.create({
    card: {
      width: cardWidth,
      height: cardHeight,
      borderRadius: 26,
      overflow: "hidden",
      backgroundColor: colors.surface,
      shadowColor: colors.overlay,
      shadowOpacity: 0.12,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      elevation: 6,
    },

    cardBehind: {
      position: "absolute",
      top: 10,
    },

    cardImg: {
      width: "100%",
      height: "100%",
    },

    cardShade: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 170,
    },

    badgeLike: {
      position: "absolute",
      top: 18,
      left: 18,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: colors.brand,
      borderWidth: 1,
      borderColor: colors.white,
    },

    badgeNope: {
      position: "absolute",
      top: 18,
      right: 18,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: colors.overlay,
      borderWidth: 1,
      borderColor: colors.white,
    },

    badgeText: {
      color: colors.white,
      fontFamily: RBZFont.extraBold,
      letterSpacing: 1,
    },

    info: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 86,
    },

    name: {
      ...CARD_TEXT_OUTLINE,
      color: colors.white,
      fontSize: 26,
      fontFamily: RBZFont.extraBold,
      textShadowRadius: 3.6,
    },

    distance: {
      ...CARD_TEXT_OUTLINE,
      color: colors.white,
      fontFamily: RBZFont.bold,
      fontSize: 12,
      marginBottom: 2,
    },

    city: {
      ...CARD_TEXT_OUTLINE,
      color: colors.white,
      fontFamily: RBZFont.semiBold,
      marginTop: 4,
    },

    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 10,
    },

    chip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.20)",
    },

    chipText: {
      ...CARD_TEXT_OUTLINE,
      color: colors.white,
      fontFamily: RBZFont.bold,
      fontSize: 12,
      textShadowRadius: 2.2,
    },

    tapHint: {
      ...CARD_TEXT_OUTLINE,
      color: colors.white,
      marginTop: 10,
      fontFamily: RBZFont.semiBold,
      fontSize: 12,
    },

    actions: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },

    actBtn: {
      flex: 1,
      height: 54,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.overlay,
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      elevation: 4,
    },

    actSkip: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },

    actView: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },

    bio: {
      ...CARD_TEXT_OUTLINE,
      marginTop: 8,
      color: colors.white,
      fontSize: 13,
      fontFamily: RBZFont.medium,
      lineHeight: 18,
    },
  });
}
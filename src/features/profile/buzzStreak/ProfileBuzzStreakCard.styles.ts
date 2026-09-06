/**
 * Path: src/features/profile/buzzStreak/ProfileBuzzStreakCard.styles.ts
 * Purpose: Compact low-emphasis layout for Profile BuzzStreak.
 * Used by: ProfileBuzzStreakCard.tsx.
 */

import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export const styles =
  StyleSheet.create({
    section: {
      width: "100%",
      minHeight: 78,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      justifyContent: "center",
    },

    mainRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
    },

    infoArea: {
      flex: 1,
      minWidth: 0,
    },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    title: {
      fontFamily: RBZFont.bold,
      fontSize: 13.5,
      letterSpacing: -0.2,
    },

    dayCount: {
      fontFamily: RBZFont.medium,
      fontSize: 11,
    },

    progressRow: {
      marginTop: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    dot: {
      width: 18,
      height: 4,
      borderRadius: 999,
    },

    rightArea: {
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 7,
    },

    rewardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    rewardText: {
      fontFamily: RBZFont.semiBold,
      fontSize: 10.5,
    },

    action: {
      minHeight: 29,
      paddingHorizontal: 10,
      borderRadius: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },

    actionText: {
      fontFamily: RBZFont.semiBold,
      fontSize: 10.5,
    },

    rewardFlash: {
      marginTop: 7,
      fontFamily: RBZFont.semiBold,
      fontSize: 10.5,
    },
  });
/**
 * Path: src/features/discoverFilters/discoverFilterStyles.ts
 * Purpose: Compact layout metrics for the RomBuzz 2026 Discover Filters redesign.
 */

import {
    StyleSheet,
} from "react-native";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

export const filterStyles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    header: {
      paddingHorizontal: 18,
      paddingBottom: 10,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    headerSide: {
      width: 62,
      minHeight: 38,

      justifyContent: "center",
    },

    headerSideRight: {
      alignItems: "flex-end",
    },

    backButton: {
      width: 38,
      height: 38,

      borderRadius: 19,

      alignItems: "center",
      justifyContent: "center",
    },

    headerCenter: {
      flex: 1,

      alignItems: "center",

      paddingHorizontal: 6,
    },

    headerTitle: {
      fontSize: 20,

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -0.5,
    },

    headerSubtitle: {
      fontSize: 11.5,

      fontFamily:
        RBZFont.medium,

      marginTop: 1,
    },

    resetText: {
      fontSize: 14,

      fontFamily:
        RBZFont.semiBold,
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },

    card: {
      borderWidth: 1,
      borderRadius: 18,

      padding: 14,
    },

    cardGap: {
      marginTop: 10,
    },

    cardHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginBottom: 10,
    },

    titleRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 8,
    },

    cardTitle: {
      fontSize: 15,

      fontFamily:
        RBZFont.bold,
    },

    cardValue: {
      fontSize: 13.5,

      fontFamily:
        RBZFont.semiBold,
    },

    sliderLabels: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      marginTop: -2,
    },

    sliderLabel: {
      fontSize: 10.5,

      fontFamily:
        RBZFont.medium,
    },

    primaryChoiceRow: {
      flexDirection: "row",

      gap: 10,

      marginTop: 10,
    },

    primaryChoice: {
      flex: 1,

      minHeight: 78,

      borderRadius: 18,
      borderWidth: 1,

      padding: 13,

      justifyContent: "center",
    },

    primaryChoiceTop: {
      flexDirection: "row",

      alignItems: "center",

      gap: 8,
    },

    primaryChoiceLabel: {
      flex: 1,

      fontSize: 14.5,

      fontFamily:
        RBZFont.bold,
    },

    primaryChoiceValue: {
      fontSize: 12,

      fontFamily:
        RBZFont.medium,

      marginTop: 6,
      marginLeft: 28,
    },

    expandedPanel: {
      borderWidth: 1,
      borderRadius: 16,

      padding: 10,

      marginTop: 8,
    },

    chipsWrap: {
      flexDirection: "row",

      flexWrap: "wrap",

      gap: 7,
    },

    chip: {
      borderRadius: 999,

      borderWidth: 1,

      paddingHorizontal: 11,
      paddingVertical: 7,
    },

    chipText: {
      fontSize: 11.5,

      fontFamily:
        RBZFont.semiBold,
    },

    sectionHeader: {
      marginTop: 18,
      marginBottom: 8,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    sectionTitle: {
      fontSize: 16,

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -0.25,
    },

    sectionMeta: {
      fontSize: 11.5,

      fontFamily:
        RBZFont.medium,
    },

    lifestyleCard: {
      borderWidth: 1,
      borderRadius: 18,

      overflow: "hidden",
    },

    preferenceRow: {
      paddingVertical: 10,
      paddingLeft: 12,
    },

    preferenceHeader: {
      flexDirection: "row",

      alignItems: "center",

      paddingRight: 12,
      marginBottom: 8,
    },

    preferenceLabel: {
      fontSize: 12.5,

      fontFamily:
        RBZFont.semiBold,

      marginLeft: 8,
    },

    horizontalChips: {
      paddingRight: 12,
    },

    divider: {
      height: 1,
      marginLeft: 42,
    },

    profileCard: {
      borderWidth: 1,
      borderRadius: 18,

      overflow: "hidden",
    },

    toggleRow: {
      minHeight: 58,

      paddingHorizontal: 13,

      flexDirection: "row",

      alignItems: "center",

      gap: 10,
    },

    toggleCopy: {
      flex: 1,
    },

    toggleLabel: {
      fontSize: 13.5,

      fontFamily:
        RBZFont.bold,
    },

    toggleHint: {
      fontSize: 10.5,

      fontFamily:
        RBZFont.medium,

      marginTop: 2,
    },

    footer: {
      position: "absolute",

      left: 0,
      right: 0,
      bottom: 0,

      borderTopWidth: 1,

      paddingHorizontal: 16,
      paddingTop: 10,
    },

    footerRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 12,
    },

    countWrap: {
      width: 76,
    },

    countText: {
      fontSize: 13.5,

      fontFamily:
        RBZFont.extraBold,
    },

    countSubtext: {
      fontSize: 10.5,

      fontFamily:
        RBZFont.medium,

      marginTop: -1,
    },

    applyButton: {
      flex: 1,

      minHeight: 52,

      borderRadius: 18,

      alignItems: "center",
      justifyContent: "center",
    },

    applyPressed: {
      opacity: 0.82,
    },

    applyText: {
      fontSize: 15.5,

      fontFamily:
        RBZFont.extraBold,
    },
  });
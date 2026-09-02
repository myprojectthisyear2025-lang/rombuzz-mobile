/**
 * ============================================================
 * 📁 File: src/features/onboarding/FirstSignupTour.styles.ts
 * 🎯 Purpose: Premium styling for the first-signup RomBuzz tour.
 *
 * Usage:
 *   Imported only by FirstSignupTour.tsx.
 * ============================================================
 */

import {
    StyleSheet,
} from "react-native";

export const firstSignupTourStyles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFF7FA",
    },

    screen: {
      flex: 1,
      paddingHorizontal: 24,
      paddingBottom: 18,
    },

    topRow: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    brand: {
      color: "#B1123C",
      fontSize: 16,
      fontWeight: "900",
    },

    skipButton: {
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    skipText: {
      color: "#746970",
      fontSize: 14,
      fontWeight: "700",
    },

    body: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    eyebrow: {
      color: "#B1123C",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 1.25,
      marginBottom: 18,
    },

    iconHalo: {
      width: 118,
      height: 118,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#8E1033",
      shadowOpacity: 0.22,
      shadowRadius: 24,
      shadowOffset: {
        width: 0,
        height: 12,
      },
      elevation: 10,
    },

    iconInner: {
      width: 88,
      height: 88,
      borderRadius: 29,
      backgroundColor:
        "rgba(255,255,255,0.14)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.30)",
      alignItems: "center",
      justifyContent: "center",
    },

    logo: {
      width: 58,
      height: 58,
      resizeMode: "contain",
    },

    title: {
      color: "#21171E",
      fontSize: 31,
      lineHeight: 37,
      fontWeight: "900",
      textAlign: "center",
      marginTop: 30,
    },

    description: {
      maxWidth: 380,
      color: "#655A62",
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      marginTop: 12,
    },

    progressRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 7,
      marginTop: 30,
    },

    dot: {
      width: 7,
      height: 7,
      borderRadius: 99,
      backgroundColor: "#E7CED6",
    },

    dotActive: {
      width: 22,
      backgroundColor: "#B1123C",
    },

    counter: {
      color: "#988C94",
      fontSize: 12,
      fontWeight: "700",
      marginTop: 14,
    },

    bottomRow: {
      flexDirection: "row",
      gap: 12,
      paddingTop: 12,
    },

    backButton: {
      width: 58,
      minHeight: 56,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#E8D7DD",
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },

    backDisabled: {
      opacity: 0.35,
    },

    nextButton: {
      flex: 1,
      minHeight: 56,
      borderRadius: 18,
      backgroundColor: "#B1123C",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#8D0E31",
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      elevation: 5,
    },

    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },

    nextText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },
  });
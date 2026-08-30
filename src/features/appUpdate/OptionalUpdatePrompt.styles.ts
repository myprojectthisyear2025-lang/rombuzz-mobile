/**
 * ============================================================
 * 📁 File: src/features/appUpdate/OptionalUpdatePrompt.styles.ts
 * 🎯 Purpose: Styles for the dismissible RomBuzz update prompt.
 *
 * Usage:
 *   Imported only by OptionalUpdatePrompt.tsx.
 * ============================================================
 */

import { StyleSheet } from "react-native";

export const optionalUpdateStyles =
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      backgroundColor:
        "rgba(26, 16, 22, 0.52)",
      paddingHorizontal: 22,
    },

    card: {
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
      alignItems: "center",
      borderRadius: 28,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 18,
      shadowColor: "#000000",
      shadowOpacity: 0.2,
      shadowRadius: 28,
      shadowOffset: {
        width: 0,
        height: 14,
      },
      elevation: 12,
    },

    logoShell: {
      width: 66,
      height: 66,
      borderRadius: 21,
      overflow: "hidden",
      marginBottom: 20,
    },

    logo: {
      width: "100%",
      height: "100%",
    },

    eyebrow: {
      color: "#B1123C",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.15,
    },

    title: {
      color: "#211820",
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "800",
      textAlign: "center",
      marginTop: 9,
    },

    message: {
      color: "#665A64",
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      marginTop: 10,
    },

    version: {
      color: "#A0959E",
      fontSize: 12,
      marginTop: 10,
    },

    error: {
      color: "#A00F39",
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 14,
    },

    updateButton: {
      width: "100%",
      minHeight: 54,
      borderRadius: 17,
      backgroundColor: "#B1123C",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 24,
    },

    buttonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },

    updateText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },

    laterButton: {
      minHeight: 46,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
      marginTop: 4,
    },

    laterPressed: {
      opacity: 0.55,
    },

    laterText: {
      color: "#756A73",
      fontSize: 15,
      fontWeight: "700",
    },
  });
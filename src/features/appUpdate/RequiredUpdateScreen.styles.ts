/**
 * ============================================================
 * 📁 File: src/features/appUpdate/RequiredUpdateScreen.styles.ts
 * 🎯 Purpose: Styles for the blocking RomBuzz update screen.
 *
 * Usage:
 *   Imported only by RequiredUpdateScreen.tsx.
 * ============================================================
 */

import { StyleSheet } from "react-native";

export const requiredUpdateStyles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFF9FB",
    },

    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 28,
      paddingBottom: 24,
    },

    logoShell: {
      width: 92,
      height: 92,
      borderRadius: 28,
      overflow: "hidden",
      marginBottom: 28,
      shadowColor: "#7A0C2B",
      shadowOpacity: 0.16,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 6,
    },

    logo: {
      width: "100%",
      height: "100%",
    },

    badge: {
      backgroundColor: "#FCE8EE",
      borderRadius: 999,
      paddingHorizontal: 13,
      paddingVertical: 7,
      marginBottom: 16,
    },

    badgeText: {
      color: "#A00F39",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.1,
    },

    title: {
      color: "#1F1720",
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "800",
      textAlign: "center",
    },

    message: {
      maxWidth: 360,
      color: "#625762",
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      marginTop: 12,
    },

    version: {
      color: "#948892",
      fontSize: 13,
      marginTop: 12,
    },

    error: {
      maxWidth: 340,
      color: "#A00F39",
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
      marginTop: 18,
    },

    button: {
      width: "100%",
      maxWidth: 390,
      minHeight: 56,
      borderRadius: 18,
      backgroundColor: "#B1123C",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 30,
      shadowColor: "#8D0E31",
      shadowOpacity: 0.2,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 7,
      },
      elevation: 5,
    },

    buttonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },

    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },

    footer: {
      maxWidth: 340,
      color: "#9A8F98",
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 18,
    },
  });
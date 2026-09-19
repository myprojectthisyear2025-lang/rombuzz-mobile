/**
 * Path: src/features/auth/passwordRecovery/passwordRecoveryStyles.ts
 * Purpose: Shared layout and Manrope typography for forgot/reset password screens.
 * Used by: app/auth/forgot-password.tsx and ResetPasswordView.tsx.
 */

import {
    Platform,
    StyleSheet,
} from "react-native";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

export const recoveryStyles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },

    keyboardView: {
      flex: 1,
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 32,
    },

    content: {
      width: "100%",
      maxWidth: 430,
      alignSelf: "center",
    },

    brand: {
      alignSelf: "center",
      marginBottom: 24,
      fontSize: 25,
      lineHeight: 30,
      fontFamily:
        RBZFont.extraBold,
      letterSpacing: -0.8,
    },

    card: {
      borderWidth: 1,
      borderRadius: 22,
      padding: 16,
    },

    title: {
      fontSize: 25,
      lineHeight: 31,
      fontFamily:
        RBZFont.extraBold,
      letterSpacing: -0.7,
    },

    subtitle: {
      marginTop: 6,
      marginBottom: 18,
      fontSize: 13.5,
      lineHeight: 20,
      fontFamily:
        RBZFont.medium,
    },

    statusBox: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },

    statusText: {
      fontSize: 12.5,
      lineHeight: 18,
      fontFamily:
        RBZFont.semiBold,
    },

    inputShell: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      marginBottom: 12,
    },

    inputIcon: {
      width: 22,
      marginRight: 9,
      textAlign: "center",
    },

    input: {
      flex: 1,
      fontSize: 15,
      fontFamily:
        RBZFont.medium,
      paddingVertical:
        Platform.OS === "ios"
          ? 15
          : 11,
    },

    codeInput: {
      textAlign: "center",
      fontSize: 19,
      fontFamily:
        RBZFont.bold,
      letterSpacing: 5,
    },

    eyeButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 6,
    },

    primaryButton: {
      minHeight: 54,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },

    disabledButton: {
      opacity: 0.6,
    },

    primaryButtonText: {
      fontSize: 15,
      fontFamily:
        RBZFont.bold,
    },

    linkButton: {
      alignSelf: "center",
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginTop: 8,
    },

    link: {
      fontSize: 13,
      fontFamily:
        RBZFont.semiBold,
    },

    strengthBar: {
      width: "100%",
      height: 6,
      borderRadius: 999,
      overflow: "hidden",
      marginTop: -2,
      marginBottom: 6,
    },

    strengthFill: {
      height: "100%",
      borderRadius: 999,
    },

    strengthText: {
      alignSelf: "flex-end",
      fontSize: 11.5,
      fontFamily:
        RBZFont.semiBold,
      marginBottom: 10,
    },
  });
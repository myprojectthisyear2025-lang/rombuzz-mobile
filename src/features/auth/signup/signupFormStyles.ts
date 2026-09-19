/**
 * Path: src/features/auth/signup/signupFormStyles.ts
 * Purpose: Static controls and Manrope typography for the RomBuzz signup form.
 */

import {
    Platform,
    StyleSheet,
} from "react-native";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

export const signupFormStyles =
  StyleSheet.create({
    stepHeader: {
      alignItems: "center",
      marginBottom: 16,
    },

    stepBadge: {
      minWidth: 54,
      height: 28,

      paddingHorizontal: 10,
      borderRadius: 999,

      alignItems: "center",
      justifyContent:
        "center",

      marginBottom: 10,
    },

    stepBadgeText: {
      fontSize: 11.5,

      fontFamily:
        RBZFont.bold,
    },

    title: {
      fontSize: 21,
      lineHeight: 27,

      textAlign:
        "center",

      fontFamily:
        RBZFont.extraBold,

      letterSpacing: -0.5,
    },

    caption: {
      marginTop: 5,

      textAlign:
        "center",

      fontSize: 12.5,
      lineHeight: 18,

      fontFamily:
        RBZFont.medium,
    },

    messageBox: {
      borderWidth: 1,
      borderRadius: 14,

      paddingHorizontal: 12,
      paddingVertical: 10,

      marginBottom: 12,
    },

    messageText: {
      textAlign: "center",

      fontSize: 12.5,
      lineHeight: 18,

      fontFamily:
        RBZFont.semiBold,
    },

    inputShell: {
      minHeight: 54,

      flexDirection:
        "row",

      alignItems:
        "center",

      borderWidth: 1,
      borderRadius: 16,

      paddingHorizontal: 14,

      marginBottom: 10,
    },

    input: {
      flex: 1,
      marginLeft: 8,

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
      letterSpacing: 4,

      fontSize: 18,

      fontFamily:
        RBZFont.bold,
    },

    primaryButton: {
      minHeight: 54,
      borderRadius: 16,

      alignItems: "center",
      justifyContent:
        "center",
    },

    primaryButtonText: {
      fontSize: 15,

      fontFamily:
        RBZFont.bold,
    },

    disabled: {
      opacity: 0.6,
    },

    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 16,
    },

    dividerLine: {
      flex: 1,
      height: 1,
    },

    dividerText: {
      marginHorizontal: 10,
      fontSize: 12,

      fontFamily:
        RBZFont.medium,
    },

    socialButton: {
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,

      alignItems: "center",
      justifyContent:
        "center",

      marginBottom: 10,
    },

    socialContent: {
      width: "100%",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal: 16,
    },

    googleIconCircle: {
      position: "absolute",
      left: 15,

      width: 30,
      height: 30,
      borderRadius: 15,

      alignItems: "center",
      justifyContent:
        "center",
    },

    googleLogo: {
      width: 19,
      height: 19,
    },

    socialText: {
      fontSize: 14.5,

      fontFamily:
        RBZFont.semiBold,
    },

    loginLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",

      paddingVertical: 8,
      marginTop: 2,
    },

    loginMuted: {
      fontSize: 13,

      fontFamily:
        RBZFont.medium,
    },

    loginStrong: {
      fontSize: 13,

      fontFamily:
        RBZFont.bold,
    },

    secondaryButton: {
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1,

      alignItems: "center",
      justifyContent:
        "center",

      marginTop: 10,
    },

    secondaryButtonText: {
      fontSize: 13.5,

      fontFamily:
        RBZFont.bold,
    },

    backButton: {
      alignSelf: "center",

      paddingHorizontal: 18,
      paddingVertical: 9,

      marginTop: 6,
    },

    backText: {
      fontSize: 13,

      fontFamily:
        RBZFont.semiBold,
    },
  });
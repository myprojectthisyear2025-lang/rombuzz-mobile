/**
 * Path: src/features/auth/login/loginFormStyles.ts
 * Purpose: Static control layout and Manrope typography for the RomBuzz login form.
 * Used by: LoginForm.tsx and AppleLoginButton.ios.tsx.
 */

import {
    Platform,
    StyleSheet,
} from "react-native";

import { RBZFont } from "@/src/design/rombuzzTypography";

export const loginFormStyles =
  StyleSheet.create({
    errorBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 9,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 14,
    },

    errorIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      overflow: "hidden",
      textAlign: "center",
      fontSize: 12,
      lineHeight: 20,
      fontFamily: RBZFont.extraBold,
    },

    errorText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: RBZFont.semiBold,
    },

    form: {
      width: "100%",
    },

    inputGroup: {
      marginBottom: 10,
    },

    inputShell: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
    },

    inputIcon: {
      width: 22,
      marginRight: 9,
      textAlign: "center",
    },

    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: RBZFont.medium,
      paddingVertical:
        Platform.OS === "ios"
          ? 15
          : 11,
    },

    passwordInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: RBZFont.medium,
      paddingVertical:
        Platform.OS === "ios"
          ? 15
          : 11,
    },

    showButton: {
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
      fontFamily: RBZFont.bold,
    },

    inlineLinkWrapper: {
      alignSelf: "flex-end",
      paddingVertical: 5,
      marginTop: 8,
    },

    inlineLinkText: {
      fontSize: 12.5,
      fontFamily: RBZFont.semiBold,
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
      fontFamily: RBZFont.medium,
    },

    socialButton: {
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },

    socialButtonContent: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
    },

    googleIconCircle: {
      position: "absolute",
      left: 15,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },

    googleLogoImage: {
      width: 19,
      height: 19,
    },

    socialButtonText: {
      fontSize: 14.5,
      fontFamily: RBZFont.semiBold,
    },

    appleButtonWrap: {
      width: "100%",
      height: 52,
      marginBottom: 10,
    },

    appleButton: {
      width: "100%",
      height: 52,
    },

    secondaryButton: {
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    secondaryButtonText: {
      fontSize: 14,
      fontFamily: RBZFont.bold,
    },
  });
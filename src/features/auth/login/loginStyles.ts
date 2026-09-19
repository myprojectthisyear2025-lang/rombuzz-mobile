/**
 * Path: src/features/auth/login/loginStyles.ts
 * Purpose: Static layout and typography for the redesigned RomBuzz login screen.
 * Used by: LoginScreenView.tsx.
 */

import { StyleSheet } from "react-native";

import { RBZFont } from "@/src/design/rombuzzTypography";

export const loginStyles = StyleSheet.create({
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
    paddingTop: 24,
    paddingBottom: 32,
  },

  content: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
  },

  brandBlock: {
    alignItems: "center",
    marginBottom: 24,
  },

  logoTile: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 14,
  },

  logo: {
    width: 62,
    height: 62,
  },

  wordmark: {
    fontSize: 29,
    lineHeight: 34,
    fontFamily: RBZFont.extraBold,
    letterSpacing: -1,
  },

  subtitle: {
    marginTop: 5,
    maxWidth: 280,
    textAlign: "center",
    fontSize: 13.5,
    lineHeight: 19,
    fontFamily: RBZFont.medium,
  },

  formCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
  },

  footerText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: RBZFont.medium,
  },
});
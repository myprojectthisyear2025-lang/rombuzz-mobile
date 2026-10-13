/**
 * 📁 File: src/features/onboarding/FirstSignupTour.styles.ts
 * 🎯 Purpose: Style the approved RomBuzz tour layout.
 * Used by: FirstSignupTour.tsx.
 * Supports: Manrope and Light/Dark/System through shared theme colors.
 */

import type { RomBuzzColors } from "@/src/design/rombuzzTheme";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export function createFirstSignupTourStyles(colors: RomBuzzColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    screen: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 22, paddingTop: 4, paddingBottom: 12,
    },
    brand: {
      fontFamily: RBZFont.extraBold, fontSize: 24,
      color: colors.text, letterSpacing: -0.8,
    },
    brandAccent: { color: colors.brand },
    closeButton: {
      minHeight: 44, minWidth: 48,
      alignItems: "center", justifyContent: "center",
    },
    closeText: {
      fontFamily: RBZFont.semiBold, fontSize: 14,
      color: colors.textSecondary,
    },
    body: { flex: 1 },
    bodyContent: {
      flexGrow: 1, paddingHorizontal: 22,
      paddingTop: 4, paddingBottom: 18,
    },
    title: {
      fontFamily: RBZFont.extraBold, fontSize: 28, lineHeight: 35,
      letterSpacing: -0.8, color: colors.text, textAlign: "center",
    },
    kicker: {
      fontFamily: RBZFont.bold, fontSize: 11, lineHeight: 17,
      letterSpacing: 2.2, color: colors.textSecondary,
      textAlign: "center", marginTop: 10, marginBottom: 20,
    },
    previewWrap: {
      marginBottom: 18, borderRadius: 24,
      borderWidth: 1, borderColor: colors.borderStrong,
      backgroundColor: colors.surface, overflow: "hidden",
    },
    description: {
      fontFamily: RBZFont.bold, fontSize: 15, lineHeight: 23,
      color: colors.text, textAlign: "center",
    },
    hintText: {
      fontFamily: RBZFont.regular, fontSize: 12, lineHeight: 19,
      color: colors.textSecondary, textAlign: "center", marginTop: 8,
    },
    footer: {
      paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12,
      backgroundColor: colors.background,
    },
    progressRow: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", marginBottom: 12,
    },
    counter: {
      fontFamily: RBZFont.medium, fontSize: 12,
      color: colors.textSecondary,
    },
    dots: { flexDirection: "row", alignItems: "center", gap: 7 },
    dot: {
      width: 7, height: 7, borderRadius: 4,
      backgroundColor: colors.borderStrong,
    },
    activeDot: { backgroundColor: colors.brand },
    bottomBar: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", gap: 16,
    },
    backButton: {
      minHeight: 48, minWidth: 88, paddingHorizontal: 18,
      borderRadius: 16, borderWidth: 1, borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
      alignItems: "center", justifyContent: "center",
    },
    backText: {
      fontFamily: RBZFont.bold, fontSize: 14, color: colors.text,
    },
    backDisabled: { opacity: 0 },
    nextButton: {
      minHeight: 48, minWidth: 124, paddingHorizontal: 24,
      borderRadius: 16, backgroundColor: colors.brand,
      alignItems: "center", justifyContent: "center",
    },
    nextText: {
      fontFamily: RBZFont.bold, fontSize: 14, color: colors.white,
    },
    pressed: { opacity: 0.75 },
  });
}
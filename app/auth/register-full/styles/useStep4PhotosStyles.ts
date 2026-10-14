/**
 * File: app/auth/register-full/styles/useStep4PhotosStyles.ts
 * Purpose: Defines the signup photo screen's visual styles.
 * Styles the photo grid, avatar badge, drag handles, upload button,
 * helper text, and navigation controls.
 * Uses RomBuzz theme colors and Manrope fonts for light and dark modes.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

export function useStep4PhotosStyles() {
  const { colors: c } = useRomBuzzTheme();

  return useMemo(() => StyleSheet.create({
    content: { paddingVertical: 8 },
    title: {
      fontSize: 25, lineHeight: 31,
      fontFamily: RBZFont.extraBold, color: c.text,
      letterSpacing: -0.7, marginBottom: 8,
    },
    subtitle: {
      fontSize: 13, lineHeight: 20,
      fontFamily: RBZFont.medium,
      color: c.textSecondary, marginBottom: 20,
    },
    section: {
      flexDirection: "row",
      justifyContent: "space-between", marginBottom: 12,
    },
    label: {
      fontSize: 14, fontFamily: RBZFont.bold, color: c.text,
    },
    muted: {
      fontSize: 12, fontFamily: RBZFont.medium, color: c.textMuted,
    },
    tile: {
      borderRadius: 16, overflow: "hidden",
      backgroundColor: c.surfaceMuted,
      borderWidth: 1, borderColor: c.border,
    },
    avatarTile: { borderWidth: 2, borderColor: c.brand },
    emptyTile: {
      borderStyle: "dashed", borderColor: c.borderStrong,
    },
    dragTile: {
      borderWidth: 2, borderColor: c.brand, elevation: 8,
    },
    fill: { width: "100%", height: "100%" },
    emptyContent: {
      flex: 1, alignItems: "center",
      justifyContent: "center", gap: 8,
    },
    plus: { fontSize: 30, color: c.textMuted },
    number: {
      position: "absolute", top: 8, left: 8,
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: "rgba(0,0,0,0.65)",
      alignItems: "center", justifyContent: "center",
    },
    overlayText: {
      color: "white", fontSize: 12, fontFamily: RBZFont.bold,
    },
    remove: {
      position: "absolute", top: 6, right: 6,
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: "white",
      alignItems: "center", justifyContent: "center",
    },
    badge: {
      position: "absolute", bottom: 8, left: 6,
      borderRadius: 10, backgroundColor: c.brandSoft,
      paddingHorizontal: 7, paddingVertical: 5,
    },
    badgeText: {
      fontSize: 10, fontFamily: RBZFont.bold,
      color: c.text, backgroundColor: c.surface,
      paddingHorizontal: 3, borderRadius: 4,
    },
    grip: {
      position: "absolute", right: 0, bottom: 0,
      width: 44, height: 44,
      backgroundColor: "rgba(0,0,0,0.28)",
      borderTopLeftRadius: 12,
      alignItems: "center", justifyContent: "center",
    },
    hint: {
      marginTop: 16, marginBottom: 4, fontSize: 12,
      fontFamily: RBZFont.semiBold, color: c.text,
    },
    select: {
      flexDirection: "row", gap: 8,
      alignItems: "center", justifyContent: "center",
      borderWidth: 1, borderColor: c.borderStrong,
      borderRadius: 14, paddingVertical: 13, marginTop: 18,
    },
    selectText: {
      fontSize: 13, fontFamily: RBZFont.bold, color: c.text,
    },
    footer: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1, borderTopColor: c.border,
      paddingTop: 16, marginTop: 20,
    },
    back: { paddingVertical: 12, paddingRight: 16 },
    backText: {
      fontSize: 13, fontFamily: RBZFont.semiBold,
      color: c.textSecondary,
    },
    next: {
      backgroundColor: c.text, borderRadius: 14,
      paddingVertical: 13, paddingHorizontal: 24,
    },
    nextText: {
      fontSize: 13, fontFamily: RBZFont.bold, color: c.surface,
    },
    disabled: { opacity: 0.4 },
  }), [c]);
}
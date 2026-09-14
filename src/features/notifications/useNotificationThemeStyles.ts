/**
 * Path: src/features/notifications/useNotificationThemeStyles.ts
 * Purpose: Apply RomBuzz 2026 theme colors and Manrope typography to Notifications without changing layout or behavior.
 * Used by: app/(tabs)/notifications.tsx.
 */

import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";

export function useNotificationThemeStyles(fontsLoaded: boolean) {
  const { colors, isDark } = useRomBuzzTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: { backgroundColor: colors.background },
        loadingContainer: { backgroundColor: colors.background },
        loadingText: {
          color: colors.textSecondary,
          fontFamily: fontsLoaded ? RBZFont.medium : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        header: {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
        title: {
          color: colors.text,
          fontSize: 24,
          fontFamily: fontsLoaded ? RBZFont.extraBold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: 12.5,
          fontFamily: fontsLoaded ? RBZFont.medium : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        markAllButton: {
          backgroundColor: colors.brandSoft,
        },
        markAllButtonText: {
          color: colors.brand,
          fontSize: 11.5,
          fontFamily: fontsLoaded ? RBZFont.bold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        filtersContainer: {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
        filterChip: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowOpacity: 0,
          elevation: 0,
        },
        filterChipActive: {
          backgroundColor: colors.brandSoft,
        },
        filterChipText: {
          color: colors.textSecondary,
          fontSize: 11.5,
          fontFamily: fontsLoaded ? RBZFont.semiBold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        filterChipTextActive: {
          color: colors.brand,
          fontSize: 11.5,
          fontFamily: fontsLoaded ? RBZFont.bold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        filterBadgeText: {
          fontSize: 9.5,
          fontFamily: fontsLoaded ? RBZFont.extraBold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        listContainer: {
          backgroundColor: colors.background,
        },
        notificationCard: {
          backgroundColor: colors.surface,
          shadowOpacity: 0,
          elevation: 0,
        },
        notificationUnread: {
          backgroundColor: colors.brandSoft,
        },
        notificationType: {
          color: colors.textSecondary,
          fontSize: 10.5,
          fontFamily: fontsLoaded ? RBZFont.bold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        notificationTime: {
          color: colors.textMuted,
          fontSize: 10.5,
          fontFamily: fontsLoaded ? RBZFont.medium : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        notificationMessage: {
          color: colors.text,
          fontSize: 13.5,
          fontFamily: fontsLoaded ? RBZFont.semiBold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        unreadText: {
          color: colors.brand,
          fontSize: 9.5,
          fontFamily: fontsLoaded ? RBZFont.bold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        menuBackdrop: {
          backgroundColor: isDark
            ? "rgba(0,0,0,0.42)"
            : "rgba(8,8,11,0.20)",
        },
        menuCard: {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 10,
          elevation: 4,
        },
        menuItemText: {
          color: colors.text,
          fontSize: 12.5,
          fontFamily: fontsLoaded ? RBZFont.semiBold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        emptyIcon: {
          backgroundColor: colors.surfaceMuted,
        },
        emptyTitle: {
          color: colors.text,
          fontSize: 17.5,
          fontFamily: fontsLoaded ? RBZFont.extraBold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        emptyText: {
          color: colors.textSecondary,
          fontSize: 13.5,
          fontFamily: fontsLoaded ? RBZFont.regular : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        emptyButton: {
          backgroundColor: colors.brandSoft,
        },
        emptyButtonText: {
          color: colors.brand,
          fontSize: 12.5,
          fontFamily: fontsLoaded ? RBZFont.bold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        expandBackdrop: {
          backgroundColor: isDark
            ? "rgba(0,0,0,0.48)"
            : "rgba(8,8,11,0.26)",
        },
        expandCard: {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.10,
          shadowRadius: 14,
          elevation: 6,
        },
        expandType: {
          color: colors.brand,
          fontSize: 12,
          fontFamily: fontsLoaded ? RBZFont.extraBold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        expandHint: {
          color: colors.textMuted,
          fontSize: 11.5,
          fontFamily: fontsLoaded ? RBZFont.semiBold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
        expandMessage: {
          color: colors.text,
          fontSize: 15.5,
          lineHeight: 22,
          fontFamily: fontsLoaded ? RBZFont.semiBold : undefined,
          fontWeight: fontsLoaded ? "normal" : undefined,
        },
      }),
    [colors, fontsLoaded, isDark]
  );
}
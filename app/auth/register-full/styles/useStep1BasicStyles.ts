/**
 * Path: app/auth/register-full/steps/styles/useStep1BasicStyles.ts
 * Purpose: Theme-aware Manrope styles for registration Step 1 basic information.
 */

import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";

export function useStep1BasicStyles() {
  const { colors } = useRomBuzzTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: 8,
          position: "relative",
        },

        sectionTitle: {
          fontSize: 20,
          lineHeight: 26,
          fontFamily: RBZFont.extraBold,
          color: colors.text,
          letterSpacing: -0.5,
          marginBottom: 12,
        },

        row: {
          flexDirection: "row",
          gap: 8,
          marginBottom: 8,
        },

        col: {
          flexDirection: "column",
        },

        half: {
          flex: 1,
        },

        input: {
          backgroundColor: colors.surfaceMuted,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          paddingVertical: 11,
          borderRadius: 14,
          fontSize: 14,
          fontFamily: RBZFont.medium,
          marginBottom: 8,
        },

        inputSmall: {
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 14,
          fontSize: 14,
          marginTop: 4,
        },

        inputInvalid: {
          borderColor: colors.danger,
        },

        label: {
          fontSize: 12.5,
          lineHeight: 17,
          fontFamily: RBZFont.semiBold,
          color: colors.textSecondary,
        },

        block: {
          marginTop: 7,
          marginBottom: 5,
        },

        chipRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 7,
          marginTop: 7,
        },

        chip: {
          paddingHorizontal: 11,
          paddingVertical: 7,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
        },

        chipActive: {
          backgroundColor: colors.brandSoft,
          borderColor: colors.brand,
        },

        chipText: {
          fontSize: 12,
          fontFamily: RBZFont.semiBold,
          color: colors.textSecondary,
        },

        chipTextActive: {
          color: colors.brand,
          fontFamily: RBZFont.bold,
        },

        error: {
          fontSize: 11,
          fontFamily: RBZFont.semiBold,
          color: colors.danger,
          marginTop: 3,
        },

        dobValue: {
          fontSize: 13.5,
          fontFamily: RBZFont.medium,
        },

        dobNote: {
          fontSize: 11,
          fontFamily: RBZFont.medium,
          color: colors.textMuted,
          marginTop: 3,
        },

        footerRow: {
          marginTop: 14,
          alignItems: "flex-end",
        },

        nextButton: {
          backgroundColor: colors.brand,
          paddingHorizontal: 20,
          paddingVertical: 11,
          borderRadius: 14,
        },

        nextButtonDisabled: {
          opacity: 0.45,
        },

        nextText: {
          color: colors.white,
          fontSize: 13.5,
          fontFamily: RBZFont.bold,
        },

        dropdownButton: {
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          paddingVertical: 11,
          borderRadius: 14,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
        },

        dropdownText: {
          color: colors.text,
          fontSize: 13.5,
          fontFamily: RBZFont.medium,
        },

        dropdownChevron: {
          color: colors.iconMuted,
          fontSize: 14,
          fontFamily: RBZFont.bold,
        },

        dropdownList: {
          backgroundColor: colors.surfaceRaised,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginTop: 6,
          overflow: "hidden",
        },

        dropdownItem: {
          paddingVertical: 10,
          paddingHorizontal: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },

        dropdownItemText: {
          color: colors.text,
          fontSize: 13.5,
          fontFamily: RBZFont.medium,
        },

        inputWithIcon: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 14,
          marginBottom: 8,
        },

        inputWithIconError: {
          borderColor: colors.danger,
        },

        passwordMismatchText: {
          color: colors.danger,
          fontSize: 11.5,
          fontFamily: RBZFont.semiBold,
          marginTop: -4,
          marginBottom: 8,
        },

        inputFlex: {
          flex: 1,
          color: colors.text,
          fontSize: 14,
          fontFamily: RBZFont.medium,
        },

        eye: {
          fontSize: 18,
          marginLeft: 8,
        },

        calendarOverlay: {
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 50,
        },

        calendarBackdrop: {
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: colors.overlay,
        },

        calendarCard: {
          width: "90%",
          maxWidth: 360,
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          padding: 16,
          elevation: 6,
        },

        calendarHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        },

        calendarMonthLabel: {
          fontSize: 15,
          fontFamily: RBZFont.bold,
          color: colors.text,
        },

        calendarNavArrow: {
          fontSize: 22,
          fontFamily: RBZFont.bold,
          paddingHorizontal: 6,
          color: colors.brand,
        },

        calendarWeekRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 4,
        },

        calendarDayCell: {
          width: 32,
          height: 32,
          borderRadius: 999,
          justifyContent: "center",
          alignItems: "center",
        },

        calendarDayEmpty: {
          backgroundColor: "transparent",
        },

        calendarDaySelected: {
          backgroundColor: colors.brand,
        },

        calendarDayText: {
          fontSize: 12.5,
          fontFamily: RBZFont.medium,
          color: colors.text,
        },

        calendarDayTextSelected: {
          color: colors.white,
          fontFamily: RBZFont.bold,
        },

        calendarWeekday: {
          fontFamily: RBZFont.semiBold,
          fontSize: 11,
          color: colors.textMuted,
        },

        yearWheelBox: {
          width: "100%",
          maxHeight: 160,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          marginBottom: 10,
          overflow: "hidden",
        },

        yearWheel: {
          maxHeight: 160,
        },

        yearItem: {
          paddingVertical: 8,
          alignItems: "center",
        },

        yearItemSelected: {
          backgroundColor: colors.brandSoft,
        },

        yearText: {
          fontSize: 14,
          fontFamily: RBZFont.medium,
          color: colors.textSecondary,
        },

        yearTextSelected: {
          fontSize: 14,
          fontFamily: RBZFont.bold,
          color: colors.brand,
        },
      }),
    [colors]
  );

  return {
    styles,
    colors,
  };
}
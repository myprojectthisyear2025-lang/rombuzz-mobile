/**
 * Path: app/auth/register-full/steps/styles/createStep6SummaryStyles.ts
 * Purpose: Visual styling for the RomBuzz final signup review screen.
 */

import type {
    RomBuzzColors,
} from "@/src/design/rombuzzTheme";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

import {
    StyleSheet,
} from "react-native";

export function createStep6SummaryStyles(
  colors: RomBuzzColors
) {
  return StyleSheet.create({
    container: {
      paddingTop: 4,
      paddingBottom: 8,
    },

    sectionTitle: {
      color: colors.text,
      fontFamily: RBZFont.extraBold,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.7,
    },

    sectionSubtitle: {
      marginTop: 3,
      color: colors.textSecondary,
      fontFamily: RBZFont.medium,
      fontSize: 12.5,
      lineHeight: 18,
    },

    progressContainer: {
      position: "relative",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 18,
      marginBottom: 17,
      paddingHorizontal: 3,
    },

    progressLine: {
      position: "absolute",
      top: 13,
      left: 30,
      right: 30,
      height: 1,
      backgroundColor: colors.brand,
      opacity: 0.5,
    },

    progressItem: {
      width: "24%",
      alignItems: "center",
      zIndex: 2,
    },

    progressCircle: {
      width: 27,
      height: 27,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand,
    },

    progressCircleActive: {
      borderWidth: 2,
      borderColor: colors.brand,
      backgroundColor: colors.surface,
    },

    progressNumber: {
      color: colors.brand,
      fontFamily: RBZFont.extraBold,
      fontSize: 12,
    },

    progressLabel: {
      marginTop: 5,
      color: colors.textSecondary,
      fontFamily: RBZFont.medium,
      fontSize: 10.5,
    },

    progressLabelActive: {
      color: colors.text,
      fontFamily: RBZFont.bold,
    },

    reviewScroll: {
      maxHeight: 510,
    },

    reviewContent: {
      gap: 9,
      paddingBottom: 14,
    },

    reviewCard: {
      padding: 12,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },

    cardTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    cardTitle: {
      color: colors.text,
      fontFamily: RBZFont.bold,
      fontSize: 13.5,
      lineHeight: 19,
    },

    informationList: {
      marginTop: 6,
    },

    infoRow: {
      minHeight: 30,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    infoRowLast: {
      borderBottomWidth: 0,
    },

    infoIcon: {
      width: 24,
    },

    infoLabel: {
      width: 100,
      color: colors.textSecondary,
      fontFamily: RBZFont.medium,
      fontSize: 11.5,
    },

    infoValue: {
      flex: 1,
      color: colors.text,
      fontFamily: RBZFont.semiBold,
      fontSize: 11.5,
      lineHeight: 16,
    },

    interestsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
      marginTop: 10,
    },

    interestChip: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.brandSoft,
    },

    interestText: {
      color: colors.brand,
      fontFamily: RBZFont.semiBold,
      fontSize: 11,
    },

    photoHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    photoCount: {
      color: colors.textMuted,
      fontFamily: RBZFont.medium,
      fontSize: 10.5,
    },

    photosRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 10,
      overflow: "hidden",
    },

    photoThumb: {
      width: 47,
      height: 54,
      borderRadius: 8,
      backgroundColor:
        colors.surfaceMuted,
    },

    photoMore: {
      width: 47,
      height: 54,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor:
        colors.surfaceMuted,
    },

    photoMoreText: {
      color: colors.text,
      fontFamily: RBZFont.bold,
      fontSize: 12,
    },

    emptyText: {
      marginTop: 9,
      color: colors.textMuted,
      fontFamily: RBZFont.medium,
      fontSize: 11.5,
      lineHeight: 17,
    },

    voiceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 10,
    },

    voicePlayBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand,
    },

    waveform: {
      flex: 1,
      height: 30,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      overflow: "hidden",
    },

    waveBar: {
      width: 2,
      borderRadius: 2,
      backgroundColor: colors.brand,
    },

    voiceDuration: {
      minWidth: 38,
      color: colors.textSecondary,
      fontFamily: RBZFont.semiBold,
      fontSize: 10.5,
      textAlign: "right",
    },

    readyCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 9,
      padding: 11,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor:
        colors.surfaceMuted,
    },

    readyTextWrap: {
      flex: 1,
    },

    readyTitle: {
      color: colors.text,
      fontFamily: RBZFont.bold,
      fontSize: 11.5,
    },

    readySubtitle: {
      marginTop: 1,
      color: colors.textSecondary,
      fontFamily: RBZFont.medium,
      fontSize: 10,
      lineHeight: 14,
    },

    errorCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 7,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger,
    },

    error: {
      flex: 1,
      color: colors.danger,
      fontFamily: RBZFont.semiBold,
      fontSize: 11,
      lineHeight: 16,
    },

    footer: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },

    backBtn: {
      width: 96,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
    },

    backText: {
      color: colors.text,
      fontFamily: RBZFont.bold,
      fontSize: 12.5,
    },

    finishBtn: {
      flex: 1,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 13,
      paddingHorizontal: 12,
      backgroundColor: colors.brand,
    },

    finishBtnDisabled: {
      opacity: 0.5,
    },

    finishText: {
      color: colors.white,
      fontFamily: RBZFont.bold,
      fontSize: 12,
      textAlign: "center",
    },
  });
}
/** Theme-aware media styles for the mobile chat window. */
import { StyleSheet } from "react-native";
import { RBZFont } from "@/src/design/rombuzzTypography";
import type { RomBuzzColors } from "@/src/design/rombuzzTheme";

export function createMediaStyles(colors: RomBuzzColors, BUBBLE_MAX_W: number) {
  return StyleSheet.create({
    mediaWrap: {
      marginVertical: 6,
      borderRadius: 22,
      overflow: "hidden",
      backgroundColor: "#000",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
      maxWidth: BUBBLE_MAX_W,
      width: BUBBLE_MAX_W,
    },
    mediaMine: {
      alignSelf: "flex-end",
    },
    mediaPeer: {
      alignSelf: "flex-start",
    },
    mediaThumb: {
      width: "100%",
      aspectRatio: 3 / 4,
    },
    mediaBlur: {
      opacity: 0.15,
    },
    mediaProtectedThumb: {
      opacity: 0.18,
      transform: [{ scale: 1.12 }],
    },
    mediaOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
    mediaOverlayText: {
      color: colors.white,
      fontSize: 14,
      fontFamily: RBZFont.extraBold,
    },
    protectedMediaOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(10,6,14,0.86)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    protectedPrivacyVeil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(245,46,100,0.22)",
    },
    protectedSparkleLayer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
    },
    protectedSparkleStar: {
      position: "absolute",
      backgroundColor: "rgba(255,255,255,0.92)",
      shadowColor: "#fff",
      shadowOpacity: 0.9,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 4,
    },
    protectedIcon: {
      zIndex: 3,
      width: 56,
      height: 56,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      marginBottom: 10,
    },
    protectedTitle: {
      zIndex: 3,
      color: colors.white,
      fontSize: 17,
      fontFamily: RBZFont.extraBold,
      textAlign: "center",
    },
    protectedSub: {
      zIndex: 3,
      color: "rgba(255,255,255,0.80)",
      fontSize: 12,
      fontFamily: RBZFont.extraBold,
      textAlign: "center",
      marginTop: 5,
    },
    videoPlayOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    videoPlayBadge: {
      width: 54,
      height: 54,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.45)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
    },
    viewBadge: {
      position: "absolute",
      left: 10,
      bottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      height: 30,
      borderRadius: 15,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
    },
    viewBadgeText: {
      color: colors.white,
      fontSize: 12,
      fontFamily: RBZFont.extraBold,
    },
    heartBurst: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

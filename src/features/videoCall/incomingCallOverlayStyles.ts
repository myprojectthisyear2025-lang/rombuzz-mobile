/**
 * 📁 File: src/features/videoCall/incomingCallOverlayStyles.ts
 * 🎯 Purpose: Responsive full-screen incoming video-call prompt styles.
 * Used by: IncomingCallOverlay.tsx and IncomingCallActions.tsx.
 */

import { RBZFont } from "@/src/design/rombuzzTypography";
import { StyleSheet } from "react-native";

export const incomingCallStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#111019",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13, 11, 22, 0.42)",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 22,
  },
  topBar: {
    alignItems: "center",
  },
  incomingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F04A83",
  },
  pillText: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: RBZFont.extraBold,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  profileArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 18,
  },
  avatarGlow: {
    width: 152,
    height: 152,
    borderRadius: 76,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
    backgroundColor: "rgba(237,55,123,0.18)",
    shadowColor: "#ed377b",
    shadowOpacity: 0.42,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.92)",
    backgroundColor: "#39253a",
  },
  videoLabel: {
    marginTop: 30,
    color: "#F59ABC",
    fontFamily: RBZFont.extraBold,
    fontSize: 11,
    letterSpacing: 2,
  },
  title: {
    marginTop: 9,
    color: "#FFFFFF",
    fontFamily: RBZFont.extraBold,
    fontSize: 32,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    color: "rgba(255,255,255,0.74)",
    fontFamily: RBZFont.medium,
    fontSize: 16,
    textAlign: "center",
  },
  loadingRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#FFFFFF",
    fontFamily: RBZFont.bold,
    fontSize: 14,
  },
  actions: {
    width: "100%",
    maxWidth: 330,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 28,
  },
  actionColumn: {
    alignItems: "center",
    gap: 12,
  },
  roundButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  declineButton: {
    backgroundColor: "#E8455D",
  },
   acceptButton: {
    backgroundColor: "#20B96B",
  },
  pulseWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
  labelText: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: RBZFont.bold,
    fontSize: 13,
  },
  flipIcon: {
    transform: [{ rotate: "135deg" }],
  },
});
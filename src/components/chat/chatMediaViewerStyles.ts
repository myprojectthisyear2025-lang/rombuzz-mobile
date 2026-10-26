/**
 * 📁 File: src/components/chat/chatMediaViewerStyles.ts
 * 🎯 Purpose: Styles for the safe-area-aware chat photo and video viewer.
 * Used by: MediaViewer.tsx.
 * Design: Minimal dark canvas with compact glass controls and clear playback.
 */

import { StyleSheet } from "react-native";

export const chatMediaViewerStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050507",
    overflow: "hidden",
  },
  media: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  tapSurface: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    paddingHorizontal: 18,
    paddingBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(25,25,30,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  viewBadge: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 20,
    gap: 7,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(25,25,30,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  viewBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  videoControls: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  centerControls: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
    backgroundColor: "rgba(216,52,95,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 52,
    paddingHorizontal: 22,
    backgroundColor: "rgba(5,5,7,0.68)",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  timeText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  progressHitArea: {
    height: 26,
    justifyContent: "center",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ef5578",
  },
  progressThumb: {
    position: "absolute",
    top: -4,
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ef5578",
  },
  actionsRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionButton: {
    minWidth: 78,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
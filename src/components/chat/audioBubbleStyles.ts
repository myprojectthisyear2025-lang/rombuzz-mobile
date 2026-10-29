/** Responsive voice-message contents; the shared chat surface supplies 3D depth. */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  surface: {
    width: 260,
  },

  row: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  left: {
    width: 34,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  right: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 8,
  },

  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  progressTrack: {
    height: 4,
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 10,
    rowGap: 3,
  },

  metaText: {
    fontWeight: "800",
    fontSize: 12,
    flexShrink: 1,
  },
});
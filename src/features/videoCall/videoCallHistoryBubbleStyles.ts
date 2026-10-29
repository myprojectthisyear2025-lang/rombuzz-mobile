/** Call-history contents; the shared chat surface supplies themed 3D depth. */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  wrap: {
    width: "50%",
    maxWidth: 330,
    minWidth: 240,
    marginVertical: 4,
  },
  wrapMine: {
    alignSelf: "flex-end",
  },
  wrapPeer: {
    alignSelf: "flex-start",
  },

  historyRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  peerAvatarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    flexShrink: 0,
  },
  peerAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },

  card: {
    flex: 1,
    marginVertical: 0,
  },
  cardContent: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 2,
    opacity: 0.78,
    fontSize: 12,
    fontWeight: "800",
  },
  exactTimeText: {
    marginTop: 3,
    opacity: 0.78,
    fontSize: 11,
    fontWeight: "700",
  },

  callBackBtn: {
    alignSelf: "flex-start",
    marginTop: 8,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    flexShrink: 0,
  },
  callBackText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});
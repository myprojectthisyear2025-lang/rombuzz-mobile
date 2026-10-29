/** Shared iOS and Android layout for call-history cards and their inline action. */

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
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 58,
  },
  cardMine: {
    borderTopRightRadius: 8,
  },
  cardPeer: {
    borderTopLeftRadius: 8,
  },

  cardPositive: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(0,0,0,0.08)",
  },
  cardNegative: {
    backgroundColor: "#fff5f5",
    borderColor: "rgba(198,40,40,0.16)",
  },

  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconWrapPositive: {
    backgroundColor: "#b1123c",
  },
  iconWrapNegative: {
    backgroundColor: "rgba(198,40,40,0.10)",
  },

  textCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "900",
  },
  titleNegative: {
    color: "#c62828",
  },
  subtitle: {
    marginTop: 2,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "800",
  },
  exactTimeText: {
    marginTop: 3,
    color: "#6b7280",
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
    backgroundColor: "#b1123c",
    flexShrink: 0,
  },
  callBackText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});
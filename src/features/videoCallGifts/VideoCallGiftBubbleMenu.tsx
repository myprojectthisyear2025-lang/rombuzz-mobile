/**
 * ============================================================================
 * 📁 File: src/features/videoCallGifts/VideoCallGiftBubbleMenu.tsx
 * 🎥🎁 Purpose: Small non-blocking send/request bubble menu for video calls.
 *
 * Used by:
 *   - app/video-call/[callId].tsx
 *
 * Notes:
 *   - This is intentionally not a full-screen modal.
 *   - It floats above the active video call.
 *   - It keeps the call visible and interactive in the background.
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  visible: boolean;
  onSendPress: () => void;
  onRequestPress: () => void;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function VideoCallGiftBubbleMenu({
  visible,
  onSendPress,
  onRequestPress,
  onClose,
  style,
}: Props) {
  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, style]}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>BuzzCoin</Text>

        <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={17} color="#7f1d3a" />
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={onSendPress} style={styles.actionButton}>
            <LinearGradient
              colors={["#ff4d7d", "#b5179e"]}
              style={styles.actionGradient}
            >
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={styles.actionText}>Send</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={onRequestPress} style={styles.actionButton}>
            <LinearGradient
              colors={["#6d28d9", "#2563eb"]}
              style={styles.actionGradient}
            >
              <Ionicons name="hand-left" size={18} color="#fff" />
              <Text style={styles.actionText}>Request</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <Text style={styles.hint}>Keep the call going while you gift.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 18,
    zIndex: 21,
  },
  card: {
    width: 218,
    borderRadius: 24,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
  },
  headerRow: {
    marginBottom: 10,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#1f1020",
    fontSize: 15,
    fontWeight: "900",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(177,18,60,0.10)",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 9,
  },
  actionButton: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  actionGradient: {
    minHeight: 66,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
   hint: {
    marginTop: 10,
    color: "rgba(31,16,32,0.58)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
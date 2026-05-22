/**
 * ============================================================================
 * 📁 File: src/features/videoCallGifts/VideoCallGiftLiveBubble.tsx
 * 🎥🎁 Purpose: Small live in-call bubble for received gifts, BC requests,
 *               accept/reject states, and quick feedback.
 *
 * Used by:
 *   - VideoCallGiftOverlay.tsx
 *
 * Notes:
 *   - This does not cover the full video call.
 *   - Incoming BC requests can be accepted or rejected directly here.
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type VideoCallLiveBubbleKind =
  | "gift"
  | "request"
  | "accepted"
  | "rejected"
  | "success"
  | "error";

type Props = {
  visible: boolean;
  kind: VideoCallLiveBubbleKind;
  title: string;
  message?: string;
  note?: string;
  loading?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function VideoCallGiftLiveBubble({
  visible,
  kind,
  title,
  message = "",
  note = "",
  loading = false,
  onAccept,
  onReject,
  onClose,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0.94);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 90,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scale, opacity]);

  if (!visible) return null;

  const iconName =
    kind === "request"
      ? "hand-left"
      : kind === "accepted"
        ? "checkmark-circle"
        : kind === "rejected"
          ? "close-circle"
          : kind === "error"
            ? "warning"
            : "gift";

  const colors: readonly [string, string] =
    kind === "request"
      ? ["#6d28d9", "#2563eb"]
      : kind === "rejected" || kind === "error"
        ? ["#ef4444", "#b91c1c"]
        : ["#ff4d7d", "#b5179e"];

  return (
    <View pointerEvents="box-none" style={[styles.wrap, style]}>
      <Animated.View
        style={[
          styles.card,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <LinearGradient colors={colors} style={styles.iconBubble}>
          <Ionicons name={iconName as any} size={21} color="#fff" />
        </LinearGradient>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          {note ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ) : null}

          {kind === "request" && onAccept && onReject ? (
            <View style={styles.actions}>
              <Pressable
                disabled={loading}
                onPress={onReject}
                style={[styles.actionBtn, styles.rejectBtn, loading ? styles.disabled : null]}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </Pressable>

              <Pressable
                disabled={loading}
                onPress={onAccept}
                style={[styles.actionBtn, styles.acceptBtn, loading ? styles.disabled : null]}
              >
                <Text style={styles.acceptText}>{loading ? "..." : "Accept"}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

              {onClose ? (
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={15} color="#7f1d3a" />
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 24,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 370,
    borderRadius: 24,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.74)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingRight: 24,
  },
   title: {
    color: "#1f1020",
    fontSize: 14,
    fontWeight: "900",
  },
  message: {
    marginTop: 3,
    color: "rgba(31,16,32,0.66)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  noteBox: {
    marginTop: 8,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(177,18,60,0.07)",
  },
  noteText: {
    color: "rgba(31,16,32,0.82)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  actions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    backgroundColor: "rgba(31,16,32,0.08)",
  },
  acceptBtn: {
    backgroundColor: "#ff4d7d",
  },
  rejectText: {
    color: "#1f1020",
    fontSize: 12,
    fontWeight: "900",
  },
  acceptText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.55,
  },
  closeBtn: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(177,18,60,0.10)",
  },
});
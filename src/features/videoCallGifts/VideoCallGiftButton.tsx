/**
 * ============================================================================
 * 📁 File: src/features/videoCallGifts/VideoCallGiftButton.tsx
 * 🎥🎁 Purpose: Floating gift button for RomBuzz video-call BuzzCoin gifting.
 *
 * Used by:
 *   - app/video-call/[callId].tsx
 *
 * Notes:
 *   - This component does not open a full-screen modal.
 *   - This component does not control Agora.
 *   - This component only renders a compact floating button.
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
  onPress: () => void;
  visible?: boolean;
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function VideoCallGiftButton({
  onPress,
  visible = true,
  inline = false,
  style,
}: Props) {
  if (!visible) return null;

  if (inline) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          styles.inlineButton,
          pressed ? styles.buttonPressed : null,
          style,
        ]}
      >
        <LinearGradient
          colors={["#de5454ff", "#d85571ff", "#d2879aff"]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inlineGradient}
        >
          <View style={styles.giftGlow}>
            <Ionicons name="gift" size={30} color="#fff" />
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrap, style]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <LinearGradient
          colors={["#ffe08a", "#ff4d7d", "#b5179e"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.giftGlow}>
            <Ionicons name="gift" size={23} color="#fff" />
          </View>

          <Text style={styles.label}>Gift</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 18,
    zIndex: 20,
  },
  button: {
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  inlineButton: {
    shadowColor: "#f59e0b",
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  buttonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.92,
  },
  gradient: {
    minWidth: 92,
    height: 46,
    borderRadius: 999,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  inlineGradient: {
    minWidth: 70,
    width: 70,
    height: 70,
    borderRadius: 35,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.34)",
  },
  giftGlow: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});
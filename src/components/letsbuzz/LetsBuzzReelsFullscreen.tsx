/**
 * ============================================================================
 * 📁 File: src/components/letsbuzz/LetsBuzzReelsFullscreen.tsx
 * 🎯 Purpose: Fullscreen wrapper for LetsBuzz reels
 *
 * What it does:
 *  - Opens LetsBuzz reels in fullscreen mode
 *  - Shows a simple expand button at top-right to close fullscreen
 *  - Removes dark shadow / dark circular button styling
 *  - Keeps the existing LetsBuzzReels logic untouched
 * ============================================================================
 */

import LetsBuzzReels from "@/src/components/letsbuzz/LetsBuzzReels";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  targetPostId?: string;
  onClose: () => void;
};

const COLORS = {
  black: "#000000",
  primary: "#FF385C",
};

export default function LetsBuzzReelsFullscreen({
  targetPostId,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LetsBuzzReels targetPostId={targetPostId} />

      <View
        pointerEvents="box-none"
        style={[
          styles.topRightWrap,
          {
            top: Math.max(insets.top, Platform.OS === "android" ? 10 : 6) + 8,
            right: 14,
          },
        ]}
      >
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={({ pressed }) => [
            styles.toggleButton,
            pressed && styles.toggleButtonPressed,
          ]}
        >
          <Ionicons name="contract-outline" size={20} color={COLORS.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  topRightWrap: {
    position: "absolute",
    zIndex: 9999,
    elevation: 9999,
  },

  toggleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  toggleButtonPressed: {
    opacity: 0.7,
  },
});
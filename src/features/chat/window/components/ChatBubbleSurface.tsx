/** Theme-colored 3D chat surface with native iOS shadows, Android elevation, and touch feedback. */
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

const RECEIVED_TONES = {
  light: { gradient: ["#FFFFFF", "#F9FAFD", "#E9ECF3"] as const,
    base: "#E9ECF3", shadow: "#35425F", edge: "#FFFFFF", bottom: "rgba(83,98,129,0.22)" },
  dark: { gradient: ["#323640", "#272A33", "#1E2028"] as const,
    base: "#1E2028", shadow: "#000000", edge: "rgba(255,255,255,0.15)", bottom: "rgba(0,0,0,0.40)" },
};

function shadeBrand(color: string, amount: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  return "#" + color.slice(1).match(/../g)!.map(channel =>
    Math.round(parseInt(channel, 16) * (1 - amount)).toString(16).padStart(2, "0")
  ).join("");
}

type Props = Omit<PressableProps, "children" | "style"> & {
  children: React.ReactNode;
  isMine: boolean;
  maxWidth: number;
  variant?: "text" | "media";
  style?: StyleProp<ViewStyle>;
};

export default function ChatBubbleSurface({ children, isMine, maxWidth,
  variant = "text", style, ...pressableProps }: Props) {
  const { isDark, colors } = useRomBuzzTheme();
  const tone = useMemo(() => {
    if (!isMine) return isDark ? RECEIVED_TONES.dark : RECEIVED_TONES.light;
    // Shade the existing brand color for depth and readable white message text.
    const gradient = [shadeBrand(colors.brand, 0.10), shadeBrand(colors.brand, 0.18),
      shadeBrand(colors.brand, isDark ? 0.32 : 0.26)] as const;
    return { gradient, base: gradient[2], shadow: isDark ? "#000000" : shadeBrand(colors.brand, 0.55),
      edge: isDark ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.32)",
      bottom: isDark ? "rgba(0,0,0,0.32)" : "rgba(0,0,0,0.20)" };
  }, [isMine, isDark, colors.brand]);
  const corners = { borderTopLeftRadius: isMine ? 22 : 8, borderTopRightRadius: isMine ? 8 : 22 };
  return <Pressable {...pressableProps} style={({ pressed }) => [
    styles.outer, corners,
    { maxWidth, minWidth: variant === "text" ? 44 : 0, alignSelf: isMine ? "flex-end" : "flex-start",
      backgroundColor: tone.base, shadowColor: tone.shadow },
    Platform.OS === "ios" ? {
      shadowOpacity: isDark ? 0.34 : 0.18, shadowRadius: pressed ? 3 : 7,
      shadowOffset: { width: 0, height: pressed ? 2 : 5 },
    } : Platform.OS === "android" ? { elevation: pressed ? 1 : 4 } : {},
    pressed && styles.pressed, style,
  ]}>
    <LinearGradient colors={tone.gradient} locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }} end={{ x: 0.85, y: 1 }}
      style={[styles.inner, corners, variant === "media" ? styles.media : styles.text]}>
      {children}
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants" style={[
          styles.edge, corners,
          { borderTopColor: tone.edge, borderLeftColor: tone.edge,
            borderRightColor: tone.bottom, borderBottomColor: tone.bottom },
        ]} />
    </LinearGradient>
  </Pressable>;
}

const styles = StyleSheet.create({
  outer: { borderRadius: 22, marginVertical: 3, overflow: "visible", flexShrink: 0 },
  inner: { borderRadius: 22, overflow: "hidden" },
  text: { paddingHorizontal: 14, paddingVertical: 11 },
  media: { padding: 2 },
  edge: { position: "absolute", top: 1, bottom: 1, left: 1, right: 1,
    borderRadius: 21, borderWidth: 1 },
  pressed: { transform: [{ translateY: 1 }, { scale: 0.99 }] },
});
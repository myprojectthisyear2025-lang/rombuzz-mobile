import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, Text, View } from "react-native";
import { useChatWindow } from "../ChatWindowContext";
import { useChatWindowStyles } from "../styles/useChatWindowStyles";

const PROTECTED_STARS = [
  { left: "12%", top: "10%", size: 7 },
  { left: "35%", top: "16%", size: 4 },
  { left: "72%", top: "9%", size: 6 },
  { left: "88%", top: "24%", size: 4 },
  { left: "18%", top: "34%", size: 5 },
  { left: "51%", top: "31%", size: 8 },
  { left: "78%", top: "42%", size: 5 },
  { left: "28%", top: "55%", size: 6 },
  { left: "62%", top: "61%", size: 4 },
  { left: "91%", top: "70%", size: 7 },
  { left: "14%", top: "79%", size: 4 },
  { left: "47%", top: "84%", size: 6 },
  { left: "73%", top: "88%", size: 5 },
] as const;

export function ChatVideoPlayBadge() {
  const { styles, colors } = useChatWindowStyles();
  return (
    <View style={styles.videoPlayOverlay} pointerEvents="none">
      <View style={styles.videoPlayBadge}>
        <Ionicons name="play" size={22} color={colors.white} />
      </View>
    </View>
  );
}

export function ChatProtectedMediaOverlay({ maxViews }: { maxViews: 1 | 2 }) {
  const { protectedMediaAnim } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();
  const label = maxViews === 1 ? "View once" : "View twice";
  return (
    <>
      <View style={styles.protectedMediaOverlay} pointerEvents="none">
        <Animated.View
          style={[
            styles.protectedSparkleLayer,
            {
              opacity: protectedMediaAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.45, 1, 0.55],
              }),
              transform: [
                {
                  translateY: protectedMediaAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, -8],
                  }),
                },
              ],
            },
          ]}
        >
          {PROTECTED_STARS.map((star, index) => (
            <Animated.View
              key={index}
              style={[
                styles.protectedSparkleStar,
                {
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  borderRadius: star.size / 2,
                  transform: [
                    {
                      scale: protectedMediaAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.75, 1.35, 0.85],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
        <View style={styles.protectedPrivacyVeil} />
        <View style={styles.protectedIcon}>
          <Ionicons
            name={maxViews === 1 ? "eye-off" : "repeat"}
            size={28}
            color={colors.white}
          />
        </View>
        <Text style={styles.protectedTitle}>{label}</Text>
        <Text style={styles.protectedSub}>Tap to open privately</Text>
      </View>
      <View style={styles.viewBadge} pointerEvents="none">
        <Ionicons name="sparkles" size={14} color={colors.white} />
        <Text style={styles.viewBadgeText}>{label}</Text>
      </View>
    </>
  );
}

export function ChatHeartBurst({ messageKey }: { messageKey: string }) {
  const { heartBurstId, heartAnim } = useChatWindow();
  const { styles, colors } = useChatWindowStyles();
  if (heartBurstId !== messageKey) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.heartBurst,
        {
          opacity: heartAnim,
          transform: [
            {
              scale: heartAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1.35],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name="heart" size={76} color={colors.brand} />
    </Animated.View>
  );
}

/**
 * Path: src/features/home/HomeFeatureCard.tsx
 * Purpose: Premium human-led MicroBuzz and Discover homepage card.
 * Used by: HomeDashboard on the RomBuzz Home tab.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  RBZDesign,
} from "@/src/design/rombuzzDesign";

import {
  RBZFont,
} from "@/src/design/rombuzzTypography";

import HomeFeatureArtwork from "@/src/features/home/HomeFeatureArtwork";

type Scene =
  | "microbuzz"
  | "discover";

type Props = {
  title: string;
  description: string;
  badge: string;
  cta: string;
  scene: Scene;
  onPress: () => void;
  compact?: boolean;
};

export default function HomeFeatureCard({
  title,
  description,
  badge,
  cta,
  scene,
  onPress,
  compact = false,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.pressed,
      ]}
    >
      <HomeFeatureArtwork
        scene={scene}
      />

      <View style={styles.photoTint} />
      <View style={styles.bottomShade} />

      <View style={styles.badge}>
        <Ionicons
          name={
            scene === "microbuzz"
              ? "flash"
              : "sparkles"
          }
          size={11}
          color={
            RBZDesign.color.brand
          }
        />

        <Text style={styles.badgeText}>
          {badge}
        </Text>
      </View>

      <View style={styles.bottomContent}>
        <Text style={styles.title}>
          {title}
        </Text>

        <Text
          style={styles.description}
          numberOfLines={2}
        >
          {description}
        </Text>

        <View style={styles.cta}>
          <Text style={styles.ctaText}>
            {cta}
          </Text>

          <Ionicons
            name="arrow-forward"
            size={16}
            color={
              RBZDesign.color.brand
            }
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 214,
    padding: 12,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#18191D",

    justifyContent:
      "space-between",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderColor:
      "rgba(255,255,255,0.10)",
  },

  cardCompact: {
    minHeight: 252,
    padding: 11,
  },

  pressed: {
    opacity: 0.94,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  photoTint: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor:
      "rgba(8,8,11,0.03)",
  },

  bottomShade: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    height: 92,

    backgroundColor:
      "rgba(8,8,11,0.38)",
  },

  badge: {
    alignSelf: "flex-start",

    minHeight: 26,

    paddingHorizontal: 9,

    borderRadius: 999,

    backgroundColor:
      "rgba(255,255,255,0.93)",

    flexDirection: "row",

    alignItems: "center",

    gap: 4,

    zIndex: 2,
  },

  badgeText: {
    color:
      RBZDesign.color.ink,

    fontSize: 11,

    fontFamily:
      RBZFont.bold,
  },

  bottomContent: {
    zIndex: 2,

    marginTop: 66,
  },

  title: {
    color:
      RBZDesign.color.white,

    fontSize: 18,

    fontFamily:
      RBZFont.extraBold,

    letterSpacing: -0.35,
  },

  description: {
    color:
      "rgba(255,255,255,0.90)",

    fontSize: 12.25,

    fontFamily:
      RBZFont.regular,

    lineHeight: 16,

    marginTop: 3,
  },

  cta: {
    minHeight: 38,

    marginTop: 9,

    paddingHorizontal: 12,

    borderRadius: 14,

    backgroundColor:
      "rgba(255,255,255,0.96)",

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",
  },

  ctaText: {
    color:
      RBZDesign.color.ink,

    fontSize: 13,

    fontFamily:
      RBZFont.bold,
  },
});
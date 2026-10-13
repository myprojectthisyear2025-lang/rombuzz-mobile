/**
 * Path: src/features/onboarding/FirstSignupTourDiscoverPreview.tsx
 * Purpose: Show a fictional Discover profile in the signup tour.
 * Uses: Generated portrait, real Discover controls, Manrope, and theme colors.
 * Preview only: No likes, navigation, or account actions are performed.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import DiscoverCardActions from "@/src/features/discover/DiscoverCardActions";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

const noop = () => {};

export default function FirstSignupTourDiscoverPreview() {
  const { colors } = useRomBuzzTheme();

  return (
    <View
      pointerEvents="none"
      style={[s.frame, { backgroundColor: colors.background }]}
    >
      <View style={s.header}>
        <Text style={[s.title, { color: colors.text }]}>Discover</Text>
        <Ionicons name="options-outline" size={20} color={colors.icon} />
      </View>

      <ImageBackground
        source={require("../../../assets/images/rombuzz-tour-discover.png")}
        style={s.photo}
        imageStyle={s.photoImage}
      >
        <View style={s.exampleBadge}>
          <Text style={s.exampleText}>Example profile</Text>
        </View>

        <View style={s.details}>
          <Text style={s.name}>Maya, 26</Text>
          <Text style={s.bio}>Coffee walks & spontaneous weekends.</Text>
          <View style={s.chips}>
            {["Coffee", "Travel"].map((label) => (
              <View key={label} style={s.chip}>
                <Text style={s.chipText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <DiscoverCardActions
          buzzing={false}
          onSkip={noop}
          onBuzz={noop}
          onViewProfile={noop}
        />
      </ImageBackground>

      <View style={s.legend}>
        {[
          ["Skip", "Next person"],
          ["Buzz", "Show interest"],
          ["View profile", "Get to know them"],
        ].map(([label, description]) => (
          <View key={label} style={s.legendItem}>
            <Text style={[s.label, { color: colors.text }]}>{label}</Text>
            <Text style={[s.caption, { color: colors.textSecondary }]}>
              {description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  frame: { padding: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontFamily: RBZFont.extraBold, fontSize: 19 },
  photo: { height: 340, borderRadius: 18, overflow: "hidden" },
  photoImage: { borderRadius: 18 },
  exampleBadge: {
    alignSelf: "flex-start",
    margin: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.50)",
  },
  exampleText: {
    fontFamily: RBZFont.medium,
    fontSize: 10,
    color: "#FFFFFF",
  },
  details: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
    backgroundColor: "rgba(0,0,0,0.56)",
  },
  name: { fontFamily: RBZFont.extraBold, fontSize: 23, color: "#FFFFFF" },
  bio: {
    fontFamily: RBZFont.medium,
    fontSize: 11,
    lineHeight: 17,
    color: "#FFFFFF",
    marginTop: 3,
  },
  chips: { flexDirection: "row", gap: 7, marginTop: 9 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  chipText: { fontFamily: RBZFont.medium, fontSize: 10, color: "#FFFFFF" },
  legend: { flexDirection: "row", gap: 6, marginTop: 13 },
  legendItem: { flex: 1, alignItems: "center" },
  label: { fontFamily: RBZFont.bold, fontSize: 11, textAlign: "center" },
  caption: {
    fontFamily: RBZFont.regular,
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 3,
  },
});
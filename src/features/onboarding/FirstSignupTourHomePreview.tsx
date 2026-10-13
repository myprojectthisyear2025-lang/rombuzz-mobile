/**
 * Path: src/features/onboarding/FirstSignupTourHomePreview.tsx
 * Purpose: Show the real Home artwork and feature labels in the signup tour.
 * Uses: Existing bundled images, Manrope, and the active RomBuzz theme.
 * Preview only: Cards do not navigate or perform account actions.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

const FEATURES = [
  {
    title: "MicroBuzz",
    tag: "Instant",
    copy: "Vibes nearby.",
    action: "Go live",
    image: require("../../../assets/images/rombuzz-home-microbuzz.png"),
  },
  {
    title: "Discover",
    tag: "Tuned",
    copy: "Curated matches around.",
    action: "Find match",
    image: require("../../../assets/images/rombuzz-home-discover.png"),
  },
];

const SHORTCUTS = [
  { icon: "location-outline", label: "Nearby Energy" },
  { icon: "heart-outline", label: "Curated Matches" },
  { icon: "chatbubble-outline", label: "Chats" },
  { icon: "person-outline", label: "My Profile" },
] as const;

export default function FirstSignupTourHomePreview() {
  const { colors } = useRomBuzzTheme();

  return (
    <View
      pointerEvents="none"
      style={[s.frame, { backgroundColor: colors.background }]}
    >
      <View style={s.header}>
        <Text style={[s.brand, { color: colors.text }]}>
          Rom<Text style={{ color: colors.brand }}>Buzz</Text>
        </Text>
        <Ionicons
          name="notifications-outline"
          size={19}
          color={colors.icon}
        />
      </View>

      <Text style={[s.heading, { color: colors.text }]}>
        Find your kind of connection.
      </Text>

      <View style={s.cards}>
        {FEATURES.map((feature) => (
          <ImageBackground
            key={feature.title}
            source={feature.image}
            style={s.card}
            imageStyle={s.cardImage}
          >
            <View style={s.shade}>
              <View style={s.tag}>
                <Text style={s.tagText}>{feature.tag}</Text>
              </View>

              <View style={s.cardBottom}>
                <Text style={s.cardTitle}>{feature.title}</Text>
                <Text style={s.cardCopy}>{feature.copy}</Text>
                <View style={s.cardAction}>
                  <Text style={s.actionText}>{feature.action}</Text>
                  <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </ImageBackground>
        ))}
      </View>

      <Text style={[s.section, { color: colors.text }]}>
        Your pulse
      </Text>
      <View style={s.grid}>
        {SHORTCUTS.map(({ icon, label }) => (
          <View
            key={label}
            style={[
              s.shortcut,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name={icon} size={17} color={colors.icon} />
            <Text style={[s.shortcutText, { color: colors.text }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[s.example, { color: colors.textMuted }]}>
        Example preview
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  frame: { padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  brand: { fontFamily: RBZFont.extraBold, fontSize: 20, letterSpacing: -0.6 },
  heading: {
    fontFamily: RBZFont.bold,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
  },
  cards: { flexDirection: "row", gap: 10 },
  card: { flex: 1, height: 210, borderRadius: 16, overflow: "hidden" },
  cardImage: { borderRadius: 16 },
  shade: {
    flex: 1,
    padding: 11,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  tag: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.36)",
  },
  tagText: { fontFamily: RBZFont.semiBold, fontSize: 10, color: "#FFFFFF" },
  cardBottom: { gap: 5 },
  cardTitle: { fontFamily: RBZFont.extraBold, fontSize: 17, color: "#FFFFFF" },
  cardCopy: {
    fontFamily: RBZFont.medium,
    fontSize: 11,
    lineHeight: 16,
    color: "#FFFFFF",
  },
  cardAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.40)",
  },
  actionText: { fontFamily: RBZFont.bold, fontSize: 11, color: "#FFFFFF" },
  section: { fontFamily: RBZFont.bold, fontSize: 13, marginTop: 17, marginBottom: 9 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  shortcut: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  shortcutText: { fontFamily: RBZFont.semiBold, fontSize: 10 },
  example: {
    fontFamily: RBZFont.regular,
    fontSize: 9,
    textAlign: "center",
    marginTop: 12,
  },
});
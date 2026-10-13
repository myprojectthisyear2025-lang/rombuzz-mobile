/**
 * Path: src/features/onboarding/FirstSignupTourProfilePreview.tsx
 * Purpose: Illustrate Profile identity, shortcuts, tabs, and photo gallery.
 * Wallet is shown only as an existing shortcut; no purchase flow is implied.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import {
    TOUR_ART,
    TourAvatar,
    TourFrame,
    useTourPreviewStyles,
} from "./FirstSignupTourPreviewKit";

const SHORTCUTS = [
  { icon: "eye-outline", label: "Preview" },
  { icon: "wallet-outline", label: "Wallet" },
  { icon: "settings-outline", label: "Settings" },
] as const;

export default function FirstSignupTourProfilePreview() {
  const { colors, s } = useTourPreviewStyles();

  return (
    <TourFrame title="Profile" subtitle="Show your personality, your way.">
      <View style={[s.card, { gap: 15 }]}>
        <View style={s.row}>
          <TourAvatar size={62} />
          <View style={s.grow}>
            <Text style={[s.label, { fontSize: 19 }]}>Maya, 26</Text>
            <Text style={s.copy}>Coffee, travel & good conversation.</Text>
          </View>
        </View>

        <View style={local.shortcuts}>
          {SHORTCUTS.map(({ icon, label }) => (
            <View key={label} style={[s.tab, local.shortcut]}>
              <Ionicons name={icon} size={16} color={colors.icon} />
              <Text style={s.tiny}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[s.card, s.between]}>
        <View style={s.row}>
          <Ionicons name="flame-outline" size={18} color={colors.brand} />
          <Text style={s.label}>BuzzStreak</Text>
        </View>
        <Text style={s.copy}>Daily check-in</Text>
      </View>

      <View style={s.tabs}>
        {["Gallery", "About", "Private Notes"].map((label, index) => (
          <View
            key={label}
            style={[s.tab, index === 0 && s.activeTab]}
          >
            <Text style={index === 0 ? s.accent : s.copy}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={s.between}>
        <View style={s.row}>
          <Text style={s.label}>Photos</Text>
          <Text style={s.copy}>Reels</Text>
        </View>
        <Ionicons name="add-circle-outline" size={20} color={colors.icon} />
      </View>

      <View style={local.gallery}>
        {[TOUR_ART.portrait, TOUR_ART.cafe, TOUR_ART.sunset].map(
          (source, index) => (
            <Image key={index} source={source} style={local.photo} />
          ),
        )}
      </View>

      <Text style={s.copy}>
        Refresh your Gallery and About details. Use Preview to check how
        your profile looks.
      </Text>
    </TourFrame>
  );
}

const local = StyleSheet.create({
  shortcuts: { flexDirection: "row", gap: 7 },
  shortcut: { flex: 1, alignItems: "center", gap: 4 },
  gallery: { flexDirection: "row", gap: 6 },
  photo: { flex: 1, height: 120, borderRadius: 12 },
});
/**
 * Path: src/features/onboarding/FirstSignupTourLetsBuzzPreview.tsx
 * Purpose: Illustrate matched-person Posts/Reels and Gift, Comment, Share.
 * Uses bundled lifestyle artwork as fictional post content.
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

const ACTIONS = [
  { icon: "gift-outline", label: "Gift" },
  { icon: "chatbubble-outline", label: "Comment" },
  { icon: "share-social-outline", label: "Share" },
] as const;

export default function FirstSignupTourLetsBuzzPreview() {
  const { colors, s } = useTourPreviewStyles();

  return (
    <TourFrame title="Let’sBuzz" subtitle="Moments from people you matched with.">
      <View style={s.tabs}>
        <View style={[s.tab, s.activeTab]}>
          <Text style={s.accent}>Posts</Text>
        </View>
        <View style={s.tab}>
          <Text style={s.copy}>Reels</Text>
        </View>
      </View>

      <View style={[s.card, local.post]}>
        <View style={[s.row, local.padding]}>
          <TourAvatar size={36} />
          <View style={s.grow}>
            <Text style={s.label}>Maya</Text>
            <Text style={s.tiny}>Your match · Example post</Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.icon} />
        </View>

        <Image source={TOUR_ART.sunset} style={local.media} />

        <View style={[local.padding, { gap: 12 }]}>
          <Text style={s.copy}>A little sunset, a little adventure. ✨</Text>
          <View style={s.divider} />
          <View style={s.between}>
            {ACTIONS.map(({ icon, label }) => (
              <View key={label} style={local.action}>
                <Ionicons name={icon} size={17} color={colors.icon} />
                <Text style={s.copy}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={s.copy}>
        Switch to Reels for short videos from your matches.
      </Text>
    </TourFrame>
  );
}

const local = StyleSheet.create({
  post: { padding: 0, overflow: "hidden" },
  padding: { padding: 12 },
  media: { width: "100%", height: 195 },
  action: { flexDirection: "row", alignItems: "center", gap: 5 },
});
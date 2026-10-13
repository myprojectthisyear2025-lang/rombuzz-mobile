/**
 * Path: src/features/onboarding/FirstSignupTourSocialPreview.tsx
 * Purpose: Illustrate Likes You, Likes Sent, Matches, and Views Today.
 * Counts are fictional; Views Today is displayed as a statistic.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    TourAvatar,
    TourFrame,
    useTourPreviewStyles,
} from "./FirstSignupTourPreviewKit";

const METRICS = [
  { icon: "paper-plane-outline", label: "Likes Sent", count: "8" },
  { icon: "heart-outline", label: "Matches", count: "3" },
  { icon: "eye-outline", label: "Views Today", count: "12" },
] as const;

export default function FirstSignupTourSocialPreview() {
  const { colors, s } = useTourPreviewStyles();

  return (
    <TourFrame title="Social Stats" subtitle="Your connections at a glance.">
      <View style={[s.card, { gap: 13 }]}>
        <View style={s.between}>
          <View style={s.row}>
            <Ionicons name="heart" size={22} color={colors.brand} />
            <Text style={s.label}>Likes You</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
        </View>
        <Text style={local.count}>4</Text>
        <View style={s.between}>
          <Text style={s.copy}>Waiting for you</Text>
          <View style={local.avatars}>
            <TourAvatar size={29} />
            <TourAvatar size={29} initials="J" />
            <TourAvatar size={29} initials="A" />
          </View>
        </View>
      </View>

      <View style={local.metrics}>
        {METRICS.map(({ icon, label, count }) => (
          <View key={label} style={[s.card, local.metric]}>
            <Ionicons name={icon} size={18} color={colors.icon} />
            <Text style={[local.metricCount, { color: colors.text }]}>
              {count}
            </Text>
            <Text style={[s.tiny, local.centered]}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={s.label}>Recent activity</Text>
      <View style={[s.card, s.row]}>
        <TourAvatar size={36} />
        <View style={s.grow}>
          <Text style={s.label}>Maya liked your profile</Text>
          <Text style={s.tiny}>Example activity · Today</Text>
        </View>
        <Ionicons name="heart-outline" size={17} color={colors.brand} />
      </View>

      <Text style={s.copy}>
        Open Likes You to respond. Likes Sent and Matches show your
        outgoing interest and connections.
      </Text>
    </TourFrame>
  );
}

const local = StyleSheet.create({
  count: { fontSize: 34, fontFamily: "Manrope_800ExtraBold", color: "#F52E64" },
  avatars: { flexDirection: "row", gap: 3 },
  metrics: { flexDirection: "row", gap: 7 },
  metric: { flex: 1, paddingHorizontal: 5, alignItems: "center", gap: 5 },
  metricCount: { fontSize: 22, fontFamily: "Manrope_700Bold" },
  centered: { textAlign: "center" },
});
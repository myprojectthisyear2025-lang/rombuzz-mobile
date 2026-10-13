/**
 * Path: src/features/onboarding/FirstSignupTourMicroBuzzPreview.tsx
 * Purpose: Illustrate MicroBuzz location, selfie, nearby radar, and Go Live.
 * The radar is static and does not request location or start a session.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    TourAvatar,
    TourFrame,
    useTourPreviewStyles,
} from "./FirstSignupTourPreviewKit";

export default function FirstSignupTourMicroBuzzPreview() {
  const { colors, s } = useTourPreviewStyles();

  return (
    <TourFrame title="MicroBuzz" subtitle="Connect with nearby energy.">
      <View style={s.between}>
        <View style={[s.row, s.tab]}>
          <Ionicons name="location" size={14} color={colors.brand} />
          <Text style={s.label}>Location On</Text>
        </View>
        <View style={s.tab}>
          <Text style={s.copy}>Everyone ▾</Text>
        </View>
      </View>

      <View style={[s.card, s.row]}>
        <TourAvatar />
        <View style={s.grow}>
          <Text style={s.label}>You</Text>
          <Text style={s.copy}>Ready to go live</Text>
          <Text style={s.tiny}>100 m radius</Text>
        </View>
        <View style={s.button}>
          <Text style={s.buttonText}>Go Live</Text>
        </View>
      </View>

      <View style={[local.radar, { backgroundColor: colors.surface }]}>
        {[190, 136, 82].map((size) => (
          <View
            key={size}
            style={[
              local.ring,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: colors.borderStrong,
              },
            ]}
          />
        ))}
        <View style={[local.center, { backgroundColor: colors.brandSoft }]}>
          <Ionicons name="flash" size={25} color={colors.brand} />
        </View>
        <View style={local.firstPerson}>
          <TourAvatar size={34} initials="J" />
        </View>
        <View style={local.secondPerson}>
          <TourAvatar size={34} initials="A" />
        </View>
        <Text style={[s.tiny, local.radarLabel]}>
          Illustrative nearby radar
        </Text>
      </View>

      <View style={s.between}>
        <View style={[s.row, s.tab]}>
          <Ionicons name="refresh" size={15} color={colors.icon} />
          <Text style={s.label}>Refresh</Text>
        </View>
        <Text style={s.copy}>— Nearby</Text>
      </View>

      <Text style={s.copy}>
        Take a selfie and go live to scan nearby. Stop MicroBuzz when
        you’re done.
      </Text>
    </TourFrame>
  );
}

const local = StyleSheet.create({
  radar: {
    height: 220,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ring: { position: "absolute", borderWidth: 1 },
  center: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  firstPerson: { position: "absolute", left: "23%", top: 43 },
  secondPerson: { position: "absolute", right: "22%", bottom: 49 },
  radarLabel: { position: "absolute", bottom: 10 },
});
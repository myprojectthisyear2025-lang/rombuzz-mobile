// src/features/meetMiddle/components/MeetMiddleFinalMeetupCard.tsx
//
// RomBuzz Meet in the Middle final confirmed meetup card.
//
// Purpose:
// - Shows the confirmed meetup spot after both users accept.
// - Opens directions in the phone's map app/browser.
// - Keeps final meetup UI out of app/meet-middle/[peerId].tsx.
// - Does NOT build turn-by-turn navigation inside RomBuzz.
// - Does NOT expose exact user GPS.

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MeetMiddleMiniLogo from "@/src/components/meetMiddle/MeetMiddleMiniLogo";
import type { MeetMiddlePlace } from "@/src/features/meetMiddle/meetMiddleTypes";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  line: "rgba(177,18,60,0.14)",
  green: "#059669",
  softGreen: "#ECFDF5",
};

type Props = {
  peerName: string;
  place: MeetMiddlePlace;
  onMessagePeer?: () => void;
};

function readNumber(...values: any[]) {
  for (const value of values) {
    const next = Number(value);

    if (Number.isFinite(next)) {
      return next;
    }
  }

  return NaN;
}

function getPlaceLatLng(place: MeetMiddlePlace) {
  const raw: any = place?.raw || {};
  const rawProps: any = raw?.properties || {};

  const lat = readNumber(
    place?.lat,
    raw?.lat,
    raw?.latitude,
    rawProps?.lat,
    rawProps?.latitude
  );

  const lng = readNumber(
    place?.lng,
    (place as any)?.lon,
    (place as any)?.longitude,
    raw?.lng,
    raw?.lon,
    raw?.longitude,
    rawProps?.lng,
    rawProps?.lon,
    rawProps?.longitude
  );

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }

  return { lat, lng };
}

function buildDirectionsUrl(place: MeetMiddlePlace) {
  const coords = getPlaceLatLng(place);

  if (coords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }

  const query = encodeURIComponent(
    [
      place?.name,
      place?.address,
      place?.category,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || "meetup spot"
  );

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export default function MeetMiddleFinalMeetupCard({
  peerName,
  place,
  onMessagePeer,
}: Props) {
  const [directionsError, setDirectionsError] = useState("");

  const placeName = place?.isMidpoint
    ? "Private midpoint"
    : String(place?.name || "Confirmed meetup spot").trim();

  const address = String(
    place?.address ||
      place?.category ||
      "Confirmed meetup location"
  ).trim();

  const directionsUrl = useMemo(() => buildDirectionsUrl(place), [place]);

  const openDirections = async () => {
    setDirectionsError("");

    try {
      const canOpen = await Linking.canOpenURL(directionsUrl);

      if (!canOpen) {
        throw new Error("Your phone could not open the maps link.");
      }

      await Linking.openURL(directionsUrl);
    } catch (err: any) {
      setDirectionsError(
        err?.message || "Could not open directions. Please try again."
      );
    }
  };

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={["#FFFFFF", "#F0FDF4"]}
        style={styles.card}
      >
        <View style={styles.heroRow}>
          <View style={styles.logoCircle}>
            <MeetMiddleMiniLogo size={42} />
          </View>

          <View style={styles.heroTextWrap}>
            <Text style={styles.eyebrow}>Meetup confirmed</Text>
            <Text style={styles.title}>
              You and {peerName || "your match"} agreed on a spot.
            </Text>
          </View>

          <View style={styles.checkCircle}>
            <Ionicons name="checkmark-circle" size={26} color={RBZ.green} />
          </View>
        </View>

        <View style={styles.placeBox}>
          <View style={styles.placeIcon}>
            <Ionicons
              name={place?.isMidpoint ? "navigate-circle" : "location"}
              size={25}
              color={RBZ.white}
            />
          </View>

          <View style={styles.placeBody}>
            <Text numberOfLines={1} style={styles.placeName}>
              {placeName}
            </Text>

            <Text numberOfLines={3} style={styles.placeAddress}>
              {address}
            </Text>
          </View>
        </View>

        <View style={styles.privacyBox}>
          <Ionicons name="shield-checkmark" size={16} color={RBZ.green} />
          <Text style={styles.privacyText}>
            Directions open in your phone’s map app. RomBuzz does not show your exact live GPS to your match.
          </Text>
        </View>

        {!!directionsError ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{directionsError}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={openDirections}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="navigate" size={18} color={RBZ.white} />
            <Text style={styles.primaryText}>Open Directions</Text>
          </Pressable>

          <Pressable
            onPress={onMessagePeer}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={RBZ.c2} />
            <Text style={styles.secondaryText}>Message</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
  },
  card: {
    borderRadius: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.18)",
    shadowColor: "#059669",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: RBZ.green,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  title: {
    color: RBZ.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    marginTop: 2,
  },
  checkCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: RBZ.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  placeBox: {
    marginTop: 14,
    borderRadius: 23,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.16)",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: RBZ.green,
    alignItems: "center",
    justifyContent: "center",
  },
  placeBody: {
    flex: 1,
    minWidth: 0,
  },
  placeName: {
    color: RBZ.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  placeAddress: {
    color: RBZ.gray,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 3,
  },
  privacyBox: {
    marginTop: 11,
    borderRadius: 18,
    padding: 11,
    backgroundColor: RBZ.softGreen,
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.16)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  privacyText: {
    flex: 1,
    color: "#065F46",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  errorBox: {
    marginTop: 11,
    borderRadius: 18,
    padding: 11,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.18)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: "#991B1B",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  actions: {
    marginTop: 13,
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1.25,
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: RBZ.green,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryText: {
    color: RBZ.white,
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryButton: {
    flex: 0.85,
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  secondaryText: {
    color: RBZ.c2,
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
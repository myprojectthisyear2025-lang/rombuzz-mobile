// src/features/meetMiddle/components/MeetMiddleSuggestionsReadyCard.tsx
//
// RomBuzz Meet in the Middle suggestions-ready card.
//
// Purpose:
// - Shows the first safe result after both users share location.
// - Displays midpoint + nearby place count from backend response.
// - Does NOT render the map yet.
// - Does NOT show peer exact GPS.
// - Keeps app/meet-middle/[peerId].tsx as a coordinator.

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MeetMiddleMiniLogo from "@/src/components/meetMiddle/MeetMiddleMiniLogo";
import type {
  MeetMiddleApiResponse,
  MeetMiddlePlace,
  MeetMiddleSession,
} from "@/src/features/meetMiddle/meetMiddleTypes";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#fff5f8",
  line: "rgba(177,18,60,0.14)",
  green: "#059669",
  amber: "#d97706",
};

type Props = {
  peerName: string;
  session?: MeetMiddleSession | null;
  rawResponse?: MeetMiddleApiResponse | any;
  onContinueToMap?: () => void;
};

function getSessionFromResponse(
  session?: MeetMiddleSession | null,
  rawResponse?: MeetMiddleApiResponse | any
): MeetMiddleSession | null {
  return (
    session ||
    rawResponse?.session ||
    rawResponse?.data?.session ||
    rawResponse?.meetMiddleSession ||
    rawResponse?.data?.meetMiddleSession ||
    null
  );
}

function getPlaces(
  session?: MeetMiddleSession | null,
  rawResponse?: MeetMiddleApiResponse | any
): MeetMiddlePlace[] {
  const activeSession = getSessionFromResponse(session, rawResponse);

  const places =
    rawResponse?.places ||
    rawResponse?.data?.places ||
    rawResponse?.suggestions ||
    rawResponse?.data?.suggestions ||
    activeSession?.places ||
    activeSession?.suggestions ||
    [];

  return Array.isArray(places) ? places : [];
}

function getMidpointPlace(
  session?: MeetMiddleSession | null,
  rawResponse?: MeetMiddleApiResponse | any
): MeetMiddlePlace | null {
  const activeSession = getSessionFromResponse(session, rawResponse);

  return (
    rawResponse?.midpointPlace ||
    rawResponse?.data?.midpointPlace ||
    activeSession?.midpointPlace ||
    null
  );
}

function getRadiusMiles(
  session?: MeetMiddleSession | null,
  rawResponse?: MeetMiddleApiResponse | any
) {
  const activeSession = getSessionFromResponse(session, rawResponse);

  const raw =
    rawResponse?.radiusUsedMiles ||
    rawResponse?.data?.radiusUsedMiles ||
    activeSession?.radiusUsedMiles ||
    0;

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export default function MeetMiddleSuggestionsReadyCard({
  peerName,
  session,
  rawResponse,
  onContinueToMap,
}: Props) {
  const activeSession = useMemo(
    () => getSessionFromResponse(session, rawResponse),
    [session, rawResponse]
  );

  const places = useMemo(
    () => getPlaces(activeSession, rawResponse),
    [activeSession, rawResponse]
  );

  const midpointPlace = useMemo(
    () => getMidpointPlace(activeSession, rawResponse),
    [activeSession, rawResponse]
  );

  const radiusMiles = useMemo(
    () => getRadiusMiles(activeSession, rawResponse),
    [activeSession, rawResponse]
  );

  const placeCount = places.length;
  const midpointName =
    String(midpointPlace?.name || "").trim() ||
    "Private midpoint";

  const midpointAddress = String(midpointPlace?.address || "").trim();

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <LinearGradient colors={["#ECFDF5", "#FFFFFF"]} style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={42} color={RBZ.green} />
          <View style={styles.logoBadge}>
            <MeetMiddleMiniLogo size={32} />
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.eyebrow}>Midpoint ready</Text>

      <Text style={styles.title}>
        We found a private halfway area.
      </Text>

     <Text style={styles.description}>
  RomBuzz found a private midpoint and nearby places for you and {peerName || "your match"}.
</Text>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryBox}>
          <Ionicons name="navigate-circle" size={22} color={RBZ.c2} />
          <Text style={styles.summaryValue}>{midpointName}</Text>
          <Text style={styles.summaryLabel}>
            {midpointAddress || "Clickable midpoint option"}
          </Text>
        </View>

        <View style={styles.summaryBox}>
          <Ionicons name="business" size={22} color={RBZ.c2} />
          <Text style={styles.summaryValue}>{placeCount}</Text>
          <Text style={styles.summaryLabel}>
            {placeCount === 1 ? "nearby place" : "nearby places"}
          </Text>
        </View>
      </View>

      <View style={styles.privacyBox}>
        <View style={styles.privacyRow}>
          <Ionicons name="shield-checkmark" size={18} color={RBZ.green} />
          <Text style={styles.privacyText}>
            Exact GPS stays backend-only. The map will use approximate participant markers.
          </Text>
        </View>

        <View style={styles.privacyRow}>
          <Ionicons name="map" size={18} color={RBZ.c2} />
          <Text style={styles.privacyText}>
            The midpoint itself will be selectable just like a cafe, restaurant, park, or cinema.
          </Text>
        </View>

        {radiusMiles ? (
          <View style={styles.privacyRow}>
            <Ionicons name="radio" size={18} color={RBZ.amber} />
            <Text style={styles.privacyText}>
              Suggestions were searched within about {radiusMiles} mile{radiusMiles === 1 ? "" : "s"}.
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onContinueToMap}
        style={({ pressed }) => [
          styles.buttonWrap,
          pressed && styles.pressed,
        ]}
      >
        <LinearGradient
          colors={[RBZ.c2, RBZ.c4]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Ionicons name="map" size={20} color={RBZ.white} />
          <Text style={styles.buttonText}>Open Map & Suggestions</Text>
          <Ionicons name="arrow-forward" size={18} color={RBZ.white} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: RBZ.white,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: RBZ.line,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.16)",
  },
  logoBadge: {
    position: "absolute",
    right: 12,
    bottom: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: RBZ.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  eyebrow: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "900",
    color: RBZ.green,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: RBZ.ink,
    marginBottom: 10,
  },
  description: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: RBZ.gray,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  summaryBox: {
    flex: 1,
    minHeight: 116,
    borderRadius: 20,
    backgroundColor: "#FFF7FA",
    borderWidth: 1,
    borderColor: RBZ.line,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    color: RBZ.ink,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  summaryLabel: {
    color: RBZ.gray,
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 5,
  },
  privacyBox: {
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
    padding: 14,
    gap: 10,
    marginBottom: 14,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: RBZ.ink,
    fontWeight: "700",
  },
  buttonWrap: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  button: {
    minHeight: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: RBZ.white,
    fontSize: 15,
    fontWeight: "900",
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
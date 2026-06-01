// src/features/meetMiddle/components/MeetMiddlePlaceConfirmationCard.tsx
//
// RomBuzz Meet in the Middle place confirmation card.
//
// Purpose:
// - Shows the peer-selected meetup spot.
// - Lets this user accept it or pick another.
// - Keeps accept/reject UI out of app/meet-middle/[peerId].tsx.
// - Does NOT touch map rendering or chat thread rendering.

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
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
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  line: "rgba(177,18,60,0.14)",
  green: "#059669",
};

type Props = {
  peerName: string;
  place: MeetMiddlePlace;
  loading?: boolean;
  error?: string;
  onAccept: () => void;
  onPickAnother: () => void;
};

export default function MeetMiddlePlaceConfirmationCard({
  peerName,
  place,
  loading = false,
  error = "",
  onAccept,
  onPickAnother,
}: Props) {
  const placeName = place?.isMidpoint ? "The midpoint" : place?.name || "Selected place";
  const address = String(
    place?.address ||
      place?.category ||
      "Meetup spot selected by your match"
  ).trim();

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={["#FFFFFF", "#FFF6FA"]}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.logoBubble}>
            <MeetMiddleMiniLogo size={36} />
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.kicker}>Confirmation needed</Text>
            <Text style={styles.title}>
              {peerName || "Your match"} picked a meetup spot
            </Text>
          </View>
        </View>

        <View style={styles.placeBox}>
          <View style={styles.placeIcon}>
            <Ionicons
              name={place?.isMidpoint ? "navigate-circle" : "location"}
              size={24}
              color={RBZ.white}
            />
          </View>

          <View style={styles.placeTextWrap}>
            <Text numberOfLines={1} style={styles.placeName}>
              {placeName}
            </Text>
            <Text numberOfLines={2} style={styles.placeAddress}>
              {address}
            </Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="shield-checkmark" size={16} color={RBZ.green} />
          <Text style={styles.noteText}>
            Only confirm if this spot feels comfortable. You can still pick another place.
          </Text>
        </View>

        {!!error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={onPickAnother}
            disabled={loading}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && !loading && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            <Ionicons name="shuffle" size={17} color={RBZ.c2} />
            <Text style={styles.secondaryText}>Pick another</Text>
          </Pressable>

          <Pressable
            onPress={onAccept}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !loading && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            <Text style={styles.primaryText}>
              {loading ? "Confirming..." : "Accept spot"}
            </Text>
            <Ionicons name="checkmark-circle" size={18} color={RBZ.white} />
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
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: RBZ.line,
    shadowColor: "#b1123c",
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  logoBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF0F6",
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: RBZ.c2,
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
  placeBox: {
    marginTop: 14,
    borderRadius: 22,
    padding: 12,
    backgroundColor: "#FFF7FA",
    borderWidth: 1,
    borderColor: RBZ.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  placeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
  },
  placeTextWrap: {
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
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  noteBox: {
    marginTop: 11,
    borderRadius: 18,
    padding: 11,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.16)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  noteText: {
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
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: RBZ.white,
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
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  primaryText: {
    color: RBZ.white,
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.72,
  },
});
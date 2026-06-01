// src/features/meetMiddle/components/MeetMiddleLocationConsentCard.tsx
//
// RomBuzz Meet in the Middle location consent card.
//
// Purpose:
// - First real Meet in the Middle session stage.
// - User explicitly taps Share Location.
// - Explains privacy: exact GPS goes only to backend.
// - Does NOT show map yet.
// - Does NOT show peer exact GPS.

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MeetMiddleMiniLogo from "@/src/components/meetMiddle/MeetMiddleMiniLogo";

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
  loading?: boolean;
  error?: string;
  peerShared?: boolean;
  waitingForPeer?: boolean;
  suggestionsReady?: boolean;
  onShareLocation: () => void;
};

export default function MeetMiddleLocationConsentCard({
  peerName,
  loading = false,
  error = "",
  peerShared = false,
  waitingForPeer = false,
  suggestionsReady = false,
  onShareLocation,
}: Props) {
  const disabled = loading || waitingForPeer || suggestionsReady;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <LinearGradient colors={["#FFF0F5", "#FFFFFF"]} style={styles.iconCircle}>
          <MeetMiddleMiniLogo size={64} />
        </LinearGradient>
      </View>

      <Text style={styles.eyebrow}>Location consent</Text>

      <Text style={styles.title}>
        Share your location to find a private midpoint.
      </Text>

      <Text style={styles.description}>
        RomBuzz will use your current GPS only on the backend to calculate a
        halfway spot with {peerName || "your match"}. Your exact location is not
        shown to them.
      </Text>

      <View style={styles.privacyBox}>
        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed" size={18} color={RBZ.c2} />
          <Text style={styles.privacyText}>
            Exact GPS is sent only to RomBuzz backend.
          </Text>
        </View>

        <View style={styles.privacyRow}>
          <Ionicons name="eye-off" size={18} color={RBZ.c2} />
          <Text style={styles.privacyText}>
            Your match receives only privacy-safe approximate map data.
          </Text>
        </View>

        <View style={styles.privacyRow}>
          <Ionicons name="navigate" size={18} color={RBZ.c2} />
          <Text style={styles.privacyText}>
            Directions later start from your own phone location.
          </Text>
        </View>
      </View>

         {waitingForPeer ? (
        <View style={styles.statusBox}>
          <ActivityIndicator size="small" color={RBZ.c2} />
          <Text style={styles.statusText}>
            Location shared. Waiting for {peerName || "your match"}...
          </Text>
        </View>
      ) : peerShared ? (
        <View style={[styles.statusBox, styles.peerSharedBox]}>
          <Ionicons name="checkmark-circle" size={19} color={RBZ.green} />
          <Text style={[styles.statusText, styles.peerSharedText]}>
            {peerName || "Your match"} shared location. Now share yours to find the midpoint.
          </Text>
        </View>
      ) : suggestionsReady ? (
        <View style={[styles.statusBox, styles.readyBox]}>
          <Ionicons name="checkmark-circle" size={19} color={RBZ.green} />
          <Text style={[styles.statusText, styles.readyText]}>
            Both locations are shared. Suggestions are ready.
          </Text>
        </View>
      ) : null}

      {!!error ? (
        <View style={styles.errorBox}>
          <Ionicons name="warning" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onShareLocation}
        disabled={disabled}
        style={({ pressed }) => [
          styles.buttonWrap,
          pressed && !disabled && styles.pressed,
          disabled && styles.buttonDisabled,
        ]}
      >
        <LinearGradient
          colors={disabled ? ["#D1D5DB", "#9CA3AF"] : [RBZ.c2, RBZ.c4]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {loading ? (
            <ActivityIndicator size="small" color={RBZ.white} />
          ) : (
            <Ionicons name="location" size={20} color={RBZ.white} />
          )}

             <Text style={styles.buttonText}>
            {loading
              ? "Sharing location..."
              : waitingForPeer
                ? "Location Shared"
                : suggestionsReady
                  ? "Suggestions Ready"
                  : peerShared
                    ? "Share Your Location"
                    : "Share Location"}
          </Text>
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
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.14)",
  },
  eyebrow: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "900",
    color: RBZ.c2,
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
  privacyBox: {
    borderRadius: 20,
    backgroundColor: "#FFF7FA",
    borderWidth: 1,
    borderColor: RBZ.line,
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
  statusBox: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: "#FFF1F5",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },
  readyBox: {
    backgroundColor: "#ECFDF5",
    borderColor: "rgba(5,150,105,0.16)",
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: RBZ.c1,
    fontWeight: "800",
  },
  readyText: {
    color: RBZ.green,
  },
   peerSharedBox: {
    backgroundColor: "#ECFDF5",
    borderColor: "rgba(5,150,105,0.18)",
  },
  peerSharedText: {
    color: RBZ.green,
  },
  errorBox: {
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#DC2626",
    fontWeight: "800",
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
    fontSize: 16,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.86,
  },
});
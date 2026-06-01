// src/features/chat/thread/MeetMiddleFinalChatBubble.tsx
//
// RomBuzz Meet in the Middle final chat bubble.
//
// Purpose:
// - Shows the final confirmed meetup spot inside the main chat thread.
// - Opens directions to the confirmed picked spot.
// - Keeps final meetup chat UI out of app/chat/[peerId].tsx.
// - Does not expose either user's exact GPS.
// - Used by MeetMiddleChatBubble.tsx when milestone status is "confirmed".

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import type { MeetMiddlePlacePayload } from "@/src/features/chat/thread/MeetMiddleChatBubble";

const COLORS = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  green: "#059669",
  softGreen: "#ECFDF5",
  line: "rgba(177,18,60,0.14)",
};

type Props = {
  place?: MeetMiddlePlacePayload | null;
  peerName: string;
  isMine: boolean;
  onLongPress?: () => void;
};

function getCoords(place?: MeetMiddlePlacePayload | null) {
  const lat = Number(place?.coords?.lat);
  const lng = Number(place?.coords?.lng);

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

function getPlaceName(place?: MeetMiddlePlacePayload | null) {
  if (place?.isMidpoint) return "Private midpoint";
  return String(place?.name || "Confirmed meetup spot").trim();
}

function getAddress(place?: MeetMiddlePlacePayload | null) {
  return String(
    place?.address ||
      place?.category ||
      "Confirmed meetup location"
  ).trim();
}

function getFallbackMapsUrl(place?: MeetMiddlePlacePayload | null) {
  const coords = getCoords(place);

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

export default function MeetMiddleFinalChatBubble({
  place,
  peerName,
  isMine,
  onLongPress,
}: Props) {
  const [error, setError] = useState("");
  const { width } = useWindowDimensions();

  const bubbleWidth = useMemo(() => {
    const screenWidth = Number(width || 360);

    if (screenWidth >= 900) {
      return Math.min(430, Math.floor(screenWidth * 0.48));
    }

    if (screenWidth >= 700) {
      return Math.min(400, Math.floor(screenWidth * 0.54));
    }

    if (screenWidth >= 430) {
      return Math.min(350, Math.floor(screenWidth * 0.76));
    }

    return Math.min(318, Math.floor(screenWidth * 0.82));
  }, [width]);

  const placeName = getPlaceName(place);
  const address = getAddress(place);
  const coords = getCoords(place);

  const fallbackUrl = useMemo(() => getFallbackMapsUrl(place), [place]);

  const openDirections = async () => {
    setError("");

    try {
      if (coords) {
        const encodedName = encodeURIComponent(placeName);
        const iosUrl = `http://maps.apple.com/?ll=${coords.lat},${coords.lng}&q=${encodedName}`;
        const androidUrl = `geo:${coords.lat},${coords.lng}?q=${coords.lat},${coords.lng}(${encodedName})`;
        const nativeUrl = Platform.OS === "ios" ? iosUrl : androidUrl;

        const canOpenNative = await Linking.canOpenURL(nativeUrl).catch(() => false);

        if (canOpenNative) {
          await Linking.openURL(nativeUrl);
          return;
        }
      }

      await Linking.openURL(fallbackUrl);
    } catch (err: any) {
      setError(err?.message || "Could not open directions. Please try again.");
    }
  };

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={260}
      style={[
        styles.outer,
        { width: bubbleWidth },
        isMine ? styles.outerMine : styles.outerPeer,
      ]}
    >
      <LinearGradient
        colors={["#FFFFFF", "#FFF8FB"]}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <LinearGradient
            colors={[COLORS.green, "#10B981"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="checkmark" size={24} color={COLORS.white} />
          </LinearGradient>

          <View style={styles.headerTextWrap}>
            <Text style={styles.eyebrow}>Meetup confirmed</Text>
            <Text style={styles.title}>
              You and {peerName || "your match"} agreed on a spot.
            </Text>
          </View>
        </View>

        <View style={styles.placeBox}>
          <LinearGradient
            colors={[COLORS.c2, COLORS.c4]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.placeIcon}
          >
            <Ionicons
              name={place?.isMidpoint ? "navigate" : "location"}
              size={22}
              color={COLORS.white}
            />
          </LinearGradient>

          <View style={styles.placeTextWrap}>
            <Text numberOfLines={1} style={styles.placeName}>
              {placeName}
            </Text>

            <Text numberOfLines={3} style={styles.placeAddress}>
              {address}
            </Text>
          </View>
        </View>

        <View style={styles.privacyBox}>
          <Ionicons name="shield-checkmark" size={15} color={COLORS.green} />
          <Text style={styles.privacyText}>
            Directions open in your map app. Exact live GPS stays private.
          </Text>
        </View>

        {!!error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={15} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={openDirections}
          style={({ pressed }) => [
            styles.directionButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="navigate" size={18} color={COLORS.white} />
          <Text style={styles.directionText}>Open Directions</Text>
          <Ionicons name="arrow-forward" size={17} color={COLORS.white} />
        </Pressable>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginVertical: 5,
  },
  outerMine: {
    alignSelf: "flex-end",
  },
  outerPeer: {
    alignSelf: "flex-start",
  },
  card: {
    borderRadius: 20,
    padding: 11,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.20)",
    shadowColor: "#b1123c",
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
   headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: COLORS.c2,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  title: {
    color: COLORS.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    marginTop: 1,
  },
  placeBox: {
    marginTop: 10,
    padding: 9,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  placeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  placeTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  placeName: {
    color: COLORS.ink,
    fontSize: 13.5,
    fontWeight: "900",
  },
  placeAddress: {
    color: COLORS.gray,
    fontSize: 11.2,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 2,
  },
   privacyBox: {
    marginTop: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 13,
    backgroundColor: COLORS.softGreen,
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.14)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  privacyText: {
    flex: 1,
    color: "#047857",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "800",
  },
   errorBox: {
    marginTop: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 13,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.15)",
    flexDirection: "row",
    gap: 6,
  },
  errorText: {
    flex: 1,
    color: "#DC2626",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "800",
  },
   directionButton: {
    marginTop: 10,
    minHeight: 40,
    borderRadius: 15,
    backgroundColor: COLORS.c2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  directionText: {
    color: COLORS.white,
    fontSize: 12.8,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
});
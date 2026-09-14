/**
 * Path: src/features/discoverProfile/DiscoverProfileHero.tsx
 * Purpose: Clickable Discover hero with identity, location, distance, and preview chips.
 * Used by: DiscoverProfileScreen.tsx only.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function DiscoverProfileHero({
  imageUri,
  displayName,
  age,
  locationText,
  distanceText,
  chips,
  online,
  onPressPhoto,
}: {
  imageUri?: string;
  displayName: string;
  age: number | null;
  locationText?: string;
  distanceText?: string;
  chips: string[];
  online?: boolean;
  onPressPhoto: () => void;
}) {
  const { colors } = useRomBuzzTheme();

  const identity =
    age == null
      ? displayName
      : `${displayName}, ${age}`;

  const place = [locationText, distanceText]
    .filter(Boolean)
    .join(" • ");

  return (
    <Pressable
      onPress={onPressPhoto}
      disabled={!imageUri}
      style={[
        styles.hero,
        {
          backgroundColor: colors.surfaceMuted,
        },
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons
            name="person-outline"
            size={54}
            color={colors.iconMuted}
          />
        </View>
      )}

      <View style={styles.statusWrap}>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: online
                  ? "#35D07F"
                  : "rgba(255,255,255,0.55)",
              },
            ]}
          />

          <Text style={styles.statusText}>
            {online ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      <View style={styles.identityWrap}>
        <Text
          style={styles.name}
          numberOfLines={1}
        >
          {identity}
        </Text>

        {!!place && (
          <View style={styles.metaRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color="#fff"
            />

            <Text
              style={styles.metaText}
              numberOfLines={1}
            >
              {place}
            </Text>
          </View>
        )}

        {!!chips.length && (
          <View style={styles.chipRow}>
            {chips.map((chip, index) => (
              <View
                key={`${chip}-${index}`}
                style={styles.chip}
              >
                <Text
                  style={styles.chipText}
                  numberOfLines={1}
                >
                  {chip}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.78)",
  textShadowOffset: {
    width: 0,
    height: 1,
  },
  textShadowRadius: 5,
};

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: 22,
    overflow: "hidden",
    aspectRatio: 1.08,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  statusWrap: {
    position: "absolute",
    top: 12,
    right: 12,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(16,16,18,0.52)",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusText: {
    color: "#fff",
    fontFamily: RBZFont.semiBold,
    fontSize: 11,
  },

  identityWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
  },

  name: {
    color: "#fff",
    fontFamily: RBZFont.extraBold,
    fontSize: 28,
    lineHeight: 34,
    ...shadow,
  },

  metaRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    flexShrink: 1,
    color: "#fff",
    fontFamily: RBZFont.semiBold,
    fontSize: 12.5,
    ...shadow,
  },

  chipRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  chip: {
    maxWidth: "48%",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(15,15,18,0.52)",
  },

  chipText: {
    color: "#fff",
    fontFamily: RBZFont.semiBold,
    fontSize: 10.5,
  },
});
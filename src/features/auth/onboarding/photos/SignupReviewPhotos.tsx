/**
 * File: src/features/auth/onboarding/photos/SignupReviewPhotos.tsx
 * Purpose: Previews selected signup photos before upload.
 * Uses measured dimensions and Expo Image to display local image URIs.
 * Shows loading or error feedback instead of silently leaving blank tiles.
 * Preserves photo order and labels the first image as the profile avatar.
 */
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
    ActivityIndicator, StyleSheet, Text, View,
} from "react-native";

export default function SignupReviewPhotos({
  photos,
}: { photos: string[] }) {
  const { colors: c } = useRomBuzzTheme();
  const [width, setWidth] = useState(0);
  const selected = photos
    .map((uri) => String(uri || "").trim())
    .filter(Boolean);
  const tileWidth = Math.max(1, Math.floor((width - 10) / 2));

  return (
    <View style={[
      s.card,
      { backgroundColor: c.surface, borderColor: c.border },
    ]}>
      <View style={s.header}>
        <View style={s.titleRow}>
          <Ionicons name="images-outline" size={18} color={c.text} />
          <Text style={[s.title, { color: c.text }]}>Photos</Text>
        </View>
        <Text style={[s.caption, { color: c.textMuted }]}>
          {selected.length} selected
        </Text>
      </View>

      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={s.grid}
      >
        {width > 0 && selected.map((uri, index) => (
          <ReviewTile
            key={`${uri}-${index}`}
            uri={uri}
            index={index}
            width={tileWidth}
          />
        ))}
      </View>

      <Text style={[
        s.caption,
        { color: c.textSecondary, marginTop: 10 },
      ]}>
        {selected.length
          ? "Photos upload when you finish signup. Go back to change them."
          : "No photos selected. Go back and add at least two."}
      </Text>
    </View>
  );
}

function ReviewTile({
  uri, index, width,
}: { uri: string; index: number; width: number }) {
  const { colors: c } = useRomBuzzTheme();
  const [state, setState] = useState<
    "loading" | "loaded" | "error"
  >("loading");

  return (
    <View style={[
      s.tile,
      {
        width,
        height: Math.round(width * 1.2),
        backgroundColor: c.surfaceMuted,
        borderColor: index === 0 ? c.brand : c.border,
      },
    ]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        onLoadStart={() => setState("loading")}
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        accessibilityLabel={`Selected photo ${index + 1}`}
      />

      {state !== "loaded" && (
        <View style={[
          s.status,
          { backgroundColor: c.surfaceMuted },
        ]}>
          {state === "loading" ? (
            <>
              <ActivityIndicator color={c.brand} />
              <Text style={[s.caption, { color: c.textSecondary }]}>
                Loading photo…
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="image-outline" size={24} color={c.danger}
              />
              <Text style={[
                s.caption,
                { color: c.danger, textAlign: "center" },
              ]}>
                Could not load photo. Go back and select it again.
              </Text>
            </>
          )}
        </View>
      )}

      <View style={s.number}>
        <Text style={s.numberText}>{index + 1}</Text>
      </View>

      {index === 0 && (
        <View style={[s.badge, { backgroundColor: c.surface }]}>
          <Text style={[s.badgeText, { color: c.text }]}>
            Profile photo
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 12, borderRadius: 15, borderWidth: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 13.5, fontFamily: RBZFont.bold },
  caption: {
    fontSize: 10.5, lineHeight: 16, fontFamily: RBZFont.medium,
  },
  grid: {
    width: "100%", flexDirection: "row", flexWrap: "wrap",
    gap: 10, marginTop: 10,
  },
  tile: { borderRadius: 12, overflow: "hidden", borderWidth: 1 },
  status: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center",
    gap: 8, padding: 12,
  },
  number: {
    position: "absolute", top: 6, left: 6,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  numberText: {
    color: "white", fontSize: 10, fontFamily: RBZFont.bold,
  },
  badge: {
    position: "absolute", bottom: 6, left: 6,
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontFamily: RBZFont.bold },
});
// src/features/meetMiddle/components/MeetMiddlePlaceCarousel.tsx
// Shared swipeable venue cards for the Meet map preview and fullscreen map.

import type { MeetMiddlePlace } from "@/src/features/meetMiddle/meetMiddleTypes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";

const PINK = "#d8345f";
const DEEP_PINK = "#b1123c";
const PURPLE = "#b5179e";
const GREEN = "#059669";
const GAP = 10;

type Props = {
  places: MeetMiddlePlace[];
  selectedPlace?: MeetMiddlePlace | null;
  onSelectPlace: (place: MeetMiddlePlace) => void;
  cardWidth?: number;
};

function keyFor(place: MeetMiddlePlace) {
  return String(place.id || `${place.name}-${place.lat ?? place.coords?.lat ?? ""}-${place.lng ?? place.coords?.lng ?? ""}`);
}

function iconFor(place: MeetMiddlePlace): keyof typeof Ionicons.glyphMap {
  const value = `${place.category || ""} ${place.name || ""}`.toLowerCase();
  if (place.isMidpoint) return "navigate-circle";
  if (value.includes("coffee") || value.includes("cafe")) return "cafe";
  if (value.includes("restaurant") || value.includes("food")) return "restaurant";
  if (value.includes("park")) return "leaf";
  if (value.includes("cinema") || value.includes("movie")) return "film";
  if (value.includes("hotel") || value.includes("oyo")) return "bed";
  return "location";
}

function distanceFor(place: MeetMiddlePlace) {
  const meters = Number(place.distanceMeters || 0);
  if (!Number.isFinite(meters) || meters <= 0) return "Nearby option";
  return meters < 1000
    ? `${Math.round(meters)} m away`
    : `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km away`;
}

export default function MeetMiddlePlaceCarousel({
  places,
  selectedPlace,
  onSelectPlace,
  cardWidth: requestedWidth,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const cardWidth = requestedWidth || Math.max(260, screenWidth - 32);
  const selectedIndex = useMemo(() => {
    const selectedKey = selectedPlace ? keyFor(selectedPlace) : "";
    const found = places.findIndex((place) => keyFor(place) === selectedKey);
    return found < 0 ? 0 : found;
  }, [places, selectedPlace]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: selectedIndex * (cardWidth + GAP),
      animated: true,
    });
  }, [cardWidth, selectedIndex]);

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!places.length) return;
    const index = Math.max(
      0,
      Math.min(
        places.length - 1,
        Math.round(event.nativeEvent.contentOffset.x / (cardWidth + GAP))
      )
    );
    if (places[index]) onSelectPlace(places[index]);
  };

  if (!places.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.heading}>Choose your vibe</Text>
          <Text style={styles.subheading}>Swipe one spot at a time.</Text>
        </View>
        <Text style={styles.counter}>{selectedIndex + 1}/{places.length}</Text>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + GAP}
        snapToAlignment="start"
        contentContainerStyle={styles.cards}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {places.map((place, index) => {
          const selected = index === selectedIndex;
          const category = String(place.category || "Suggested").trim();
          return (
            <Pressable
              key={keyFor(place)}
              onPress={() => onSelectPlace(place)}
              style={[
                styles.card,
                { width: cardWidth },
                selected && styles.cardSelected,
              ]}
            >
              <LinearGradient
                colors={selected ? ["#FFF7FA", "#FFFFFF"] : ["#FFFFFF", "#FFF9FB"]}
                style={styles.cardInner}
              >
                <View style={styles.topRow}>
                  <View style={[styles.iconWrap, place.isMidpoint && styles.midpointIcon]}>
                    <Ionicons
                      name={iconFor(place)}
                      size={23}
                      color={place.isMidpoint ? "#FFFFFF" : PINK}
                    />
                  </View>
                  <View style={styles.titleWrap}>
                    <View style={styles.eyebrowRow}>
                      <Text numberOfLines={1} style={styles.eyebrow}>
                        {place.isMidpoint ? "Perfect Halfway" : category}
                      </Text>
                      <Text style={styles.index}>{index + 1}/{places.length}</Text>
                    </View>
                    <Text numberOfLines={1} style={styles.title}>
                      {place.isMidpoint ? "Meet in the Middle" : place.name}
                    </Text>
                  </View>
                </View>
                <Text numberOfLines={2} style={styles.address}>
                  {String(place.address || place.category || "Suggested meetup spot").trim()}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Ionicons
                      name={place.isMidpoint ? "navigate-circle" : "walk"}
                      size={14}
                      color={place.isMidpoint ? GREEN : PINK}
                    />
                    <Text style={styles.metaText}>
                      {place.isMidpoint ? "Balanced midpoint" : distanceFor(place)}
                    </Text>
                  </View>
                  <Text style={selected ? styles.selected : styles.tapHint}>
                    {selected ? "Selected" : "Tap to focus"}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>
      {places.length > 1 ? (
        <View style={styles.dots}>
          {places.map((place, index) => (
            <Pressable
              key={`dot-${keyFor(place)}`}
              onPress={() => onSelectPlace(place)}
              style={[styles.dot, index === selectedIndex && styles.dotActive]}
              hitSlop={8}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  headingCopy: { flex: 1 },
  heading: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  subheading: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  counter: { color: DEEP_PINK, fontSize: 11, fontWeight: "900" },
  cards: { gap: GAP, paddingVertical: 4 },
  card: {
    minHeight: 150,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.14)",
  },
  cardSelected: { borderColor: PINK, borderWidth: 2 },
  cardInner: { flex: 1, padding: 13, justifyContent: "center", gap: 8 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFF1F5",
    alignItems: "center",
    justifyContent: "center",
  },
  midpointIcon: { backgroundColor: PINK },
  titleWrap: { flex: 1, minWidth: 0 },
  eyebrowRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  eyebrow: {
    flex: 1,
    color: DEEP_PINK,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  index: { color: "#6b7280", fontSize: 10, fontWeight: "800" },
  title: { color: "#111827", fontSize: 16, fontWeight: "900", marginTop: 4 },
  address: { color: "#6b7280", fontSize: 12, lineHeight: 16, fontWeight: "700" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  metaPill: {
    minHeight: 28,
    borderRadius: 16,
    paddingHorizontal: 9,
    backgroundColor: "#FFF1F5",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: { color: DEEP_PINK, fontSize: 10, fontWeight: "900" },
  selected: { color: GREEN, fontSize: 10, fontWeight: "900" },
  tapHint: { color: "#6b7280", fontSize: 10, fontWeight: "800" },
  dots: {
    minHeight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(216,52,95,0.25)",
  },
  dotActive: { width: 18, backgroundColor: PURPLE },
});
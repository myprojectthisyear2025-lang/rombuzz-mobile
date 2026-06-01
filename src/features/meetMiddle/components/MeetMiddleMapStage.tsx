/*
src/features/meetMiddle/components/MeetMiddleMapStage.tsx

RomBuzz Meet in the Middle map/suggestions stage.

Purpose:
- Shows a privacy-safe map preview first.
- Lets users swipe one meetup spot card at a time.
- Opens the full RomBuzz map from the map preview.
- Does NOT expose exact peer GPS.
- Selection is handed back to parent so backend wiring can stay separate.
*/
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MeetMiddleFullScreenMap from "@/src/features/meetMiddle/components/MeetMiddleFullScreenMap";
import MeetMiddleNativeMap from "@/src/features/meetMiddle/components/MeetMiddleNativeMap";
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
};

type Props = {
  peerName?: string;
  session?: MeetMiddleSession | null;
  rawResponse?: MeetMiddleApiResponse | any;
  onBackToSummary?: () => void;
  onSelectPlace?: (place: MeetMiddlePlace) => void;
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
  const midpoint =
    rawResponse?.midpoint ||
    rawResponse?.data?.midpoint ||
    activeSession?.midpoint ||
    null;

  const existing =
    rawResponse?.midpointPlace ||
    rawResponse?.data?.midpointPlace ||
    activeSession?.midpointPlace ||
    null;

  if (existing) {
    return {
      ...existing,
      isMidpoint: true,
    };
  }

  if (midpoint?.lat && midpoint?.lng) {
    return {
      id: "midpoint",
      name: "Private midpoint",
      address: "Halfway point between both users",
      category: "midpoint",
      lat: Number(midpoint.lat),
      lng: Number(midpoint.lng),
      isMidpoint: true,
    };
  }

  return {
    id: "midpoint",
    name: "Private midpoint",
    address: "Halfway point between both users",
    category: "midpoint",
    isMidpoint: true,
  };
}

function normalizeDistance(place: MeetMiddlePlace) {
  const meters = Number(place?.distanceMeters || 0);
  if (!Number.isFinite(meters) || meters <= 0) return "";

  if (meters < 1000) return `${Math.round(meters)} m away`;

  const km = meters / 1000;
  return `${km.toFixed(km >= 10 ? 0 : 1)} km away`;
}

function getCategoryIcon(place: MeetMiddlePlace) {
  const raw = `${place?.category || ""} ${place?.name || ""}`.toLowerCase();

  if (place?.isMidpoint) return "navigate-circle";
  if (raw.includes("coffee") || raw.includes("cafe")) return "cafe";
  if (raw.includes("restaurant") || raw.includes("food")) return "restaurant";
  if (raw.includes("park")) return "leaf";
  if (raw.includes("movie") || raw.includes("cinema")) return "film";
  if (raw.includes("bar")) return "wine";
  if (raw.includes("mall") || raw.includes("shop")) return "bag";

  return "location";
}

function getPlaceKey(place: MeetMiddlePlace, index: number) {
  return String(
    place?.id ||
      `${place?.name || "place"}-${place?.lat || ""}-${place?.lng || ""}-${index}`
  );
}

function getSelectedPlaceKey(place?: MeetMiddlePlace | null) {
  if (!place) return "";

  return String(
    place.id || `${place.name || "place"}-${place.lat || ""}-${place.lng || ""}`
  );
}

function buildSelectablePlaces(
  session?: MeetMiddleSession | null,
  rawResponse?: MeetMiddleApiResponse | any
) {
  const midpointPlace = getMidpointPlace(session, rawResponse);
  const nearby = getPlaces(session, rawResponse);

  const all = [...(midpointPlace ? [midpointPlace] : []), ...nearby];
  const seen = new Set<string>();

  return all.filter((place, index) => {
    const key = getPlaceKey(place, index);
    if (seen.has(key)) return false;
    seen.add(key);
    return !!String(place?.name || "").trim();
  });
}

function PlaceSwipeCard({
  place,
  selected,
  width,
  index,
  total,
  onPress,
}: {
  place: MeetMiddlePlace;
  selected?: boolean;
  width: number;
  index: number;
  total: number;
  onPress: () => void;
}) {
  const icon = getCategoryIcon(place);
  const distance = normalizeDistance(place);
  const category = String(place.category || "").trim();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.swipeCard,
        { width },
        selected && styles.swipeCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={selected ? ["#FFF7FA", "#FFFFFF"] : ["#FFFFFF", "#FFF9FB"]}
        style={styles.swipeCardInner}
      >
        {selected ? (
          <LinearGradient
            colors={[RBZ.c2, RBZ.c4]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.selectedBorder}
          />
        ) : null}

        <View style={styles.swipeTopRow}>
          <View style={[styles.swipeIcon, place.isMidpoint && styles.midpointIcon]}>
            <Ionicons
              name={icon}
              size={24}
              color={place.isMidpoint ? RBZ.white : RBZ.c2}
            />
          </View>

          <View style={styles.swipeTitleWrap}>
            <View style={styles.swipeEyebrowRow}>
              <View style={styles.eyebrowBadge}>
                <Ionicons
                  name={place.isMidpoint ? "star" : "heart"}
                  size={10}
                  color={RBZ.c2}
                />
                <Text numberOfLines={1} style={styles.swipeEyebrow}>
                  {place.isMidpoint ? "Perfect Halfway" : category || "Suggested"}
                </Text>
              </View>

              <Text style={styles.swipeCount}>
                {index + 1}/{total}
              </Text>
            </View>

            <Text numberOfLines={1} style={styles.swipeName}>
              {place.isMidpoint ? "Meet in the Middle" : place.name}
            </Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.swipeAddress}>
          {String(place.address || place.category || "Suggested meetup spot").trim()}
        </Text>

        <View style={styles.swipeMetaRow}>
          <View style={styles.swipeMetaPill}>
            <Ionicons
              name={place.isMidpoint ? "navigate-circle" : "walk"}
              size={14}
              color={place.isMidpoint ? RBZ.green : RBZ.c2}
            />
            <Text style={styles.swipeMetaText}>
              {place.isMidpoint ? "Balanced midpoint" : distance || "Nearby option"}
            </Text>
          </View>

          {selected ? (
            <View style={styles.selectedPill}>
              <Ionicons name="checkmark-circle" size={14} color={RBZ.green} />
              <Text style={styles.selectedPillText}>Selected</Text>
            </View>
          ) : (
            <View style={styles.swipeHintPill}>
              <Ionicons name="hand-left" size={12} color={RBZ.gray} />
              <Text style={styles.swipeHintText}>Tap</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function MeetMiddleMapStage({
  peerName,
  session,
  rawResponse,
  onSelectPlace,
}: Props) {
  const [stageWidth, setStageWidth] = useState(0);
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const activeSession = useMemo(
    () => getSessionFromResponse(session, rawResponse),
    [session, rawResponse]
  );

  const places = useMemo(
    () => buildSelectablePlaces(activeSession, rawResponse),
    [activeSession, rawResponse]
  );

  const carouselCardWidth = Math.max(240, stageWidth || 320);

  const safeSelectedIndex = Math.min(selectedIndex, Math.max(places.length - 1, 0));
  const selectedPlace = places[safeSelectedIndex] || places[0] || null;

  const selectPlaceAtIndex = (index: number, shouldScroll = true) => {
    if (!places.length) return;

    const safeIndex = Math.max(0, Math.min(index, places.length - 1));
    setSelectedIndex(safeIndex);

    if (shouldScroll) {
      scrollViewRef.current?.scrollTo({
        x: safeIndex * carouselCardWidth,
        animated: true,
      });
    }
  };

  const handleCarouselMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const x = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(x / carouselCardWidth);
    selectPlaceAtIndex(nextIndex, false);
  };

  const handleMapPlaceSelect = (place: MeetMiddlePlace) => {
    const nextKey = getSelectedPlaceKey(place);
    const nextIndex = places.findIndex((item, index) => {
      return (
        getSelectedPlaceKey(item) === nextKey ||
        getPlaceKey(item, index) === nextKey
      );
    });

    if (nextIndex >= 0) {
      selectPlaceAtIndex(nextIndex);
    }
  };

  return (
    <View
      style={styles.stage}
      onLayout={(event) => {
        const nextWidth = Math.floor(event.nativeEvent.layout.width);
        if (nextWidth > 0 && nextWidth !== stageWidth) {
          setStageWidth(nextWidth);
        }
      }}
    >
      <View style={styles.mapPreview}>
        <MeetMiddleNativeMap
          session={activeSession}
          places={places}
          selectedPlace={selectedPlace}
          onSelectPlace={handleMapPlaceSelect}
        />

        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.24)"]}
          style={styles.mapGradient}
          pointerEvents="none"
        />

        <Pressable
          onPress={() => setFullMapOpen(true)}
          style={({ pressed }) => [
            styles.fullMapButton,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="expand" size={16} color={RBZ.c2} />
          <Text style={styles.fullMapButtonText}>Full Map</Text>
        </Pressable>
      </View>

      <MeetMiddleFullScreenMap
        visible={fullMapOpen}
        peerName={peerName || "your match"}
        session={activeSession}
        places={places}
        selectedPlace={selectedPlace}
        onClose={() => setFullMapOpen(false)}
        onSelectPlace={handleMapPlaceSelect}
      />

      <View style={styles.copyBox}>
        <View style={styles.copyIconWrapper}>
          <Ionicons name="shield-checkmark" size={16} color={RBZ.white} />
        </View>
        <Text style={styles.copyText}>
          Exact GPS stays backend-only. {peerName || "Your match"} sees only privacy-safe meetup suggestions.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionTitleCopy}>
            <Text style={styles.sectionTitle}>Choose your vibe</Text>
            <Text style={styles.sectionSubtitle}>
              Swipe one spot at a time.
            </Text>
          </View>

          {places.length > 1 ? (
            <View style={styles.carouselCounter}>
              <Ionicons name="swap-horizontal" size={12} color={RBZ.c2} />
              <Text style={styles.carouselCounterText}>
                {safeSelectedIndex + 1}/{places.length}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {places.length ? (
        <>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            decelerationRate="fast"
            snapToInterval={carouselCardWidth}
            snapToAlignment="start"
            contentContainerStyle={styles.carouselContent}
            onMomentumScrollEnd={handleCarouselMomentumEnd}
          >
            {places.map((place, index) => {
              const key = getPlaceKey(place, index);
              const selected = index === safeSelectedIndex;

              return (
                <PlaceSwipeCard
                  key={key}
                  place={place}
                  selected={selected}
                  width={carouselCardWidth}
                  index={index}
                  total={places.length}
                  onPress={() => selectPlaceAtIndex(index)}
                />
              );
            })}
          </ScrollView>

          {places.length > 1 ? (
            <View style={styles.dotsRow}>
              {places.map((place, index) => {
                const key = getPlaceKey(place, index);
                const active = index === safeSelectedIndex;

                return (
                  <Pressable
                    key={`dot-${key}`}
                    onPress={() => selectPlaceAtIndex(index)}
                    style={[styles.dot, active && styles.dotActive]}
                    hitSlop={8}
                  />
                );
              })}
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons name="map" size={32} color={RBZ.c2} />
          </View>
          <Text style={styles.emptyTitle}>Finding meetup spots...</Text>
          <Text style={styles.emptyText}>
            RomBuzz found the midpoint. Nearby suggestions may take a moment to appear.
          </Text>
        </View>
      )}

      {selectedPlace ? (
        <Pressable
          onPress={() => onSelectPlace?.(selectedPlace)}
          style={({ pressed }) => [
            styles.primaryButtonWrap,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={[RBZ.c2, RBZ.c4]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
          >
            <Ionicons name="heart" size={19} color={RBZ.white} />
            <Text numberOfLines={1} style={styles.primaryButtonText}>
              {selectedPlace.isMidpoint
                ? "Choose This Spot"
                : `Meet at ${selectedPlace.name}`}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={RBZ.white} />
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: "100%",
    marginTop: 4,
    position: "relative",
  },
  mapPreview: {
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 10,
    height: 174,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  mapGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
  },
  fullMapButton: {
    position: "absolute",
    top: 10,
    right: 10,
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: RBZ.line,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  fullMapButtonText: {
    color: RBZ.ink,
    fontSize: 12,
    fontWeight: "900",
  },
  copyBox: {
    marginTop: 6,
    borderRadius: 16,
    padding: 10,
    backgroundColor: "rgba(5,150,105,0.08)",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.16)",
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
  },
  copyIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RBZ.green,
    alignItems: "center",
    justifyContent: "center",
  },
  copyText: {
    flex: 1,
    color: "#065F46",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitleCopy: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    color: RBZ.ink,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: RBZ.gray,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  carouselCounter: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FFF1F5",
    borderWidth: 1,
    borderColor: RBZ.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  carouselCounterText: {
    color: RBZ.c1,
    fontSize: 11,
    fontWeight: "900",
  },
  carouselContent: {
    paddingVertical: 7,
  },
  swipeCard: {
    minHeight: 160,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: RBZ.white,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  swipeCardSelected: {
    borderColor: RBZ.c2,
    borderWidth: 2,
    shadowColor: RBZ.c2,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },
  swipeCardInner: {
    flex: 1,
    padding: 14,
    position: "relative",
  },
  selectedBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  swipeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  swipeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF1F5",
    alignItems: "center",
    justifyContent: "center",
  },
  midpointIcon: {
    backgroundColor: RBZ.c2,
  },
  swipeTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  swipeEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  eyebrowBadge: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF1F5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  swipeEyebrow: {
    color: RBZ.c1,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  swipeCount: {
    color: RBZ.gray,
    fontSize: 11,
    fontWeight: "800",
  },
  swipeName: {
    color: RBZ.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: -0.2,
  },
  swipeAddress: {
    color: RBZ.gray,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  swipeMetaRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  swipeMetaPill: {
    minHeight: 30,
    borderRadius: 16,
    paddingHorizontal: 10,
    backgroundColor: "#FFF1F5",
    borderWidth: 1,
    borderColor: RBZ.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  swipeMetaText: {
    color: RBZ.c1,
    fontSize: 11.5,
    fontWeight: "900",
  },
  selectedPill: {
    minHeight: 30,
    borderRadius: 16,
    paddingHorizontal: 10,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.2)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  selectedPillText: {
    color: RBZ.green,
    fontSize: 11,
    fontWeight: "900",
  },
  swipeHintPill: {
    minHeight: 30,
    borderRadius: 16,
    paddingHorizontal: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "rgba(107,114,128,0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  swipeHintText: {
    color: RBZ.gray,
    fontSize: 11,
    fontWeight: "800",
  },
  dotsRow: {
    minHeight: 22,
    marginTop: 8,
    marginBottom: 2,
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
  dotActive: {
    width: 20,
    backgroundColor: RBZ.c2,
  },
  emptyBox: {
    minHeight: 160,
    borderRadius: 24,
    backgroundColor: "#FFF7FA",
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    gap: 10,
  },
  emptyIconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFF1F5",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: RBZ.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  emptyText: {
    color: RBZ.gray,
    fontSize: 12.5,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
  primaryButtonWrap: {
    marginTop: 10,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: RBZ.c2,
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 24,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryButtonText: {
    flexShrink: 1,
    color: RBZ.white,
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

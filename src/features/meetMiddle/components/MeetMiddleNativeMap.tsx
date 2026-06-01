// src/features/meetMiddle/components/MeetMiddleNativeMap.tsx
//
// RomBuzz Meet in the Middle native map.
//
// Purpose:
// - Renders the real MapLibre v11 native map.
// - Uses the correct @maplibre/maplibre-react-native v11 API.
// - Shows privacy-safe participant markers, midpoint marker, and place markers.
// - Does NOT expose exact peer GPS.
// - Does NOT use Geoapify key in the frontend.

import { Ionicons } from "@expo/vector-icons";
import {
  Camera,
  Map,
  ViewAnnotation,
} from "@maplibre/maplibre-react-native";
import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  MeetMiddleApproximateParticipant,
  MeetMiddleCoords,
  MeetMiddlePlace,
  MeetMiddleSession,
} from "@/src/features/meetMiddle/meetMiddleTypes";

// OpenFreeMap Positron is a real street-map style for MapLibre.
// It looks much cleaner than MapLibre's green demo style and does not require
// exposing any Geoapify key in the mobile app.
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  green: "#059669",
  line: "rgba(177,18,60,0.14)",
};

type Props = {
  session?: MeetMiddleSession | null;
  places: MeetMiddlePlace[];
  selectedPlace?: MeetMiddlePlace | null;
  onSelectPlace?: (place: MeetMiddlePlace) => void;
  fullScreen?: boolean;
  showParticipantLabels?: boolean;
};

type MapPoint = {
  id: string;
  label: string;
  coordinate: [number, number];
  type: "midpoint" | "place" | "participant";
  place?: MeetMiddlePlace;
};

function isValidCoord(coord?: MeetMiddleCoords | null) {
  const lat = Number(coord?.lat);
  const lng = Number(coord?.lng);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function toCoordinate(coord: MeetMiddleCoords): [number, number] {
  return [Number(coord.lng), Number(coord.lat)];
}

function readNumber(...values: any[]) {
  for (const value of values) {
    const next = Number(value);

    if (Number.isFinite(next)) {
      return next;
    }
  }

  return NaN;
}

function getPlaceCoord(place?: MeetMiddlePlace | null): [number, number] | null {
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

  return [lng, lat];
}

function getParticipantCoord(
  participant: MeetMiddleApproximateParticipant
): [number, number] | null {
  const approx = participant.approximateCoords || participant.coords || null;

  if (!isValidCoord(approx)) return null;

  return toCoordinate(approx as MeetMiddleCoords);
}

function getPlaceKey(place: MeetMiddlePlace, index: number) {
  return String(
    place.id ||
      `${place.name || "place"}-${place.lat || ""}-${place.lng || ""}-${index}`
  );
}

function getSelectedPlaceKey(place?: MeetMiddlePlace | null) {
  if (!place) return "";

  return String(
    place.id ||
      `${place.name || "place"}-${place.lat || ""}-${place.lng || ""}`
  );
}

function getCategoryIcon(place?: MeetMiddlePlace | null): keyof typeof Ionicons.glyphMap {
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

function makeCameraCenter(points: MapPoint[]): [number, number] {
  if (!points.length) return [-96.797, 32.7767];

  const sum = points.reduce(
    (acc, point) => {
      acc.lng += point.coordinate[0];
      acc.lat += point.coordinate[1];
      return acc;
    },
    { lng: 0, lat: 0 }
  );

  return [sum.lng / points.length, sum.lat / points.length];
}

function makeZoom(points: MapPoint[]) {
  if (points.length <= 1) return 12;

  const lngs = points.map((p) => p.coordinate[0]);
  const lats = points.map((p) => p.coordinate[1]);

  const lngSpread = Math.max(...lngs) - Math.min(...lngs);
  const latSpread = Math.max(...lats) - Math.min(...lats);
  const spread = Math.max(lngSpread, latSpread);

  if (spread > 1.2) return 8;
  if (spread > 0.55) return 9;
  if (spread > 0.22) return 10;
  if (spread > 0.08) return 11;

  return 12;
}

function makeMapPoints(session?: MeetMiddleSession | null, places: MeetMiddlePlace[] = []) {
  const points: MapPoint[] = [];

  const midpoint = session?.midpoint || null;

  if (isValidCoord(midpoint)) {
    points.push({
      id: "midpoint",
      label: "Midpoint",
      coordinate: toCoordinate(midpoint as MeetMiddleCoords),
      type: "midpoint",
      place: {
        id: "midpoint",
        name: session?.midpointPlace?.name || "Private midpoint",
        address:
          session?.midpointPlace?.address ||
          "Halfway point between both users",
        category: "midpoint",
        lat: midpoint?.lat,
        lng: midpoint?.lng,
        isMidpoint: true,
      },
    });
  }

  const participants = Array.isArray(session?.approximateParticipants)
    ? session?.approximateParticipants || []
    : [];

  participants.forEach((participant, index) => {
    const coordinate = getParticipantCoord(participant);
    if (!coordinate) return;

    points.push({
      id: `participant-${participant.userId || participant.id || index}`,
      label: participant.name || `User ${index + 1}`,
      coordinate,
      type: "participant",
    });
  });

  places.forEach((place, index) => {
    if (place.isMidpoint) return;

    const coordinate = getPlaceCoord(place);
    if (!coordinate) return;

    points.push({
      id: `place-${getPlaceKey(place, index)}`,
      label: place.name,
      coordinate,
      type: "place",
      place,
    });
  });

  return points;
}

function MarkerButton({
  point,
  selected,
  showParticipantLabels,
  onPress,
}: {
  point: MapPoint;
  selected?: boolean;
  showParticipantLabels?: boolean;
  onPress?: () => void;
}) {
  const markerColor =
    point.type === "participant"
      ? RBZ.ink
      : selected
        ? RBZ.c4
        : point.type === "midpoint"
          ? RBZ.green
          : RBZ.c2;

  const shouldShowLabel = point.type !== "participant" || showParticipantLabels;

  return (
    <Pressable
      onPress={onPress}
      disabled={!point.place}
      style={({ pressed }) => [
        styles.annotationWrap,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.marker,
          {
            backgroundColor: markerColor,
            transform: [{ scale: selected ? 1.12 : 1 }],
          },
        ]}
      >
        <Ionicons
          name={
            point.type === "participant"
              ? "person"
              : getCategoryIcon(point.place)
          }
          size={18}
          color={RBZ.white}
        />
      </View>

      {shouldShowLabel ? (
        <View style={[styles.markerLabel, selected && styles.markerLabelSelected]}>
          <Text
            numberOfLines={1}
            style={[
              styles.markerLabelText,
              selected && styles.markerLabelTextSelected,
            ]}
          >
            {point.type === "midpoint" ? "Midpoint" : point.label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function MeetMiddleNativeMap({
  session,
  places,
  selectedPlace,
  onSelectPlace,
  fullScreen = false,
  showParticipantLabels = false,
}: Props) {
  const mapPoints = useMemo(() => {
    return makeMapPoints(session, places);
  }, [session, places]);

  const selectableMapPoints = useMemo(() => {
    return mapPoints.filter((point) => point.type !== "participant");
  }, [mapPoints]);

  const center = useMemo(() => {
    return makeCameraCenter(selectableMapPoints.length ? selectableMapPoints : mapPoints);
  }, [mapPoints, selectableMapPoints]);

  const zoom = useMemo(() => {
    return makeZoom(selectableMapPoints.length ? selectableMapPoints : mapPoints);
  }, [mapPoints, selectableMapPoints]);

  const selectedKey = getSelectedPlaceKey(selectedPlace);

  if (!mapPoints.length) {
    return (
      <View style={styles.emptyMap}>
        <Ionicons name="map" size={30} color={RBZ.c2} />
        <Text style={styles.emptyTitle}>Map data is not ready yet</Text>
        <Text style={styles.emptyText}>
          RomBuzz needs midpoint or place coordinates from the backend to draw the map.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.mapWrap, fullScreen && styles.mapWrapFullScreen]}>
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        logo={false}
        attribution={false}
        compass
        androidView="texture"
      >
        <Camera
          center={center}
          zoom={fullScreen ? Math.max(zoom - 0.4, 7.5) : zoom}
          easing="fly"
          duration={700}
        />

        {mapPoints.map((point) => {
          const placeKey = getSelectedPlaceKey(point.place);
          const selected =
            point.type === "midpoint"
              ? selectedPlace?.isMidpoint
              : !!placeKey && placeKey === selectedKey;

          return (
            <ViewAnnotation
              key={point.id}
              id={point.id}
              lngLat={point.coordinate}
              anchor="bottom"
            >
                <MarkerButton
                point={point}
                selected={selected}
                showParticipantLabels={showParticipantLabels}
                onPress={() => {
                  if (point.place) onSelectPlace?.(point.place);
                }}
              />
            </ViewAnnotation>
          );
        })}
      </Map>

      <View style={styles.mapPrivacyPill}>
        <Ionicons name="shield-checkmark" size={14} color={RBZ.green} />
        <Text style={styles.mapPrivacyText}>Approximate privacy-safe map</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    width: "100%",
    height: 300,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  mapWrapFullScreen: {
    flex: 1,
    height: undefined,
    borderRadius: 0,
    borderWidth: 0,
  },
  map: {
    flex: 1,
  },
  annotationWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: RBZ.white,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  markerLabel: {
    maxWidth: 120,
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },
  markerLabelSelected: {
    backgroundColor: RBZ.c2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  markerLabelText: {
    color: RBZ.ink,
    fontSize: 10.5,
    fontWeight: "900",
  },
  markerLabelTextSelected: {
    color: RBZ.white,
  },
  mapPrivacyPill: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  mapPrivacyText: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "900",
  },
  emptyMap: {
    width: "100%",
    minHeight: 240,
    borderRadius: 28,
    backgroundColor: "#FFF7FA",
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  emptyTitle: {
    color: RBZ.ink,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyText: {
    color: RBZ.gray,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
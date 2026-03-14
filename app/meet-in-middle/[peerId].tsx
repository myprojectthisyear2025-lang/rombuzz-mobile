/**
 * ============================================================
 * 📁 File: app/meet-in-middle/[peerId].tsx
 * 🎯 Screen: RomBuzz Mobile — Meet-in-the-Middle (Android + iOS)
 *
 * Fixes included:
 *  ✅ No false "Login required" (handles API_BASE with/without /api)
 *  ✅ Uses RBZ_USER first, token second
 *  ✅ Proper socket init (await getSocket)
 *  ✅ Safe emits + safe listeners
 *  ✅ White background UI
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";

import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";

const { width } = Dimensions.get("window");

type LatLng = { lat: number; lng: number };
type Place = {
  id?: string | number;
  name?: string;
  category?: string;
  coords?: { lat: number; lng: number };
  lat?: number;
  lng?: number;
  address?: string;
};

const RBZ = {
  // White UI
  bg: "#ffffff",
  card: "#ffffff",
  soft: "#f6f7fb",
  line: "rgba(17,24,39,0.10)",
  ink: "#111827",
  gray: "#6b7280",

  // RomBuzz accents
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",

  ok: "#22c55e",
  warn: "#f59e0b",
  danger: "#ef4444",
};

function roomId(a: string, b: string) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

function placeLatLng(p: Place): LatLng | null {
  const lat = p.coords?.lat ?? p.lat;
  const lng = p.coords?.lng ?? p.lng;
  if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
  return null;
}

/**
 * API_BASE in your app might already include `/api`.
 * This helper tries both:
 *   - `${API_BASE}/users/me`
 *   - `${API_BASE}/api/users/me`
 */
async function fetchMeIdWithToken(token: string): Promise<string | null> {
  const tryUrls = [`${API_BASE}/users/me`, `${API_BASE}/api/users/me`];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) continue;

      const data = await res.json().catch(() => null);
      const id = String(
        data?._id || data?.id || data?.user?._id || data?.user?.id || ""
      );
      if (id) return id;
    } catch {
      // try next url
    }
  }
  return null;
}

async function getDeviceLocation(): Promise<LatLng> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Location permission denied");

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return { lat: loc.coords.latitude, lng: loc.coords.longitude };
}

export default function MeetInMiddleScreen() {
  const router = useRouter();
  const { peerId, name, avatar } = useLocalSearchParams<{
    peerId: string;
    name?: string;
    avatar?: string;
  }>();

  const peer = String(peerId || "");
  const displayName = String(name || "RomBuzz User");
  const displayAvatar = String(avatar || "https://i.pravatar.cc/200?img=12");

  const [socket, setSocket] = useState<any>(null);

  const [myId, setMyId] = useState<string>("");
  const me = myId;

  // flow states
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [prompt, setPrompt] = useState<{ from: string } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [waiting, setWaiting] = useState(false);

  // locations
  const [myLoc, setMyLoc] = useState<LatLng | null>(null);
  const [peerLoc, setPeerLoc] = useState<LatLng | null>(null);
  const [midpoint, setMidpoint] = useState<LatLng | null>(null);

  // suggestions
  const [radiusMiles, setRadiusMiles] = useState<number>(2);
  const [canExpand, setCanExpand] = useState<boolean>(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [fetchingPlaces, setFetchingPlaces] = useState(false);

  // selection / finalize
  const [activePlaceKey, setActivePlaceKey] = useState<string>("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [incomingSelected, setIncomingSelected] = useState<Place | null>(null);
  const [finalized, setFinalized] = useState<{ place: Place } | null>(null);

  const mapRef = useRef<MapView | null>(null);

  const region: Region | undefined = useMemo(() => {
    const base = myLoc || peerLoc || midpoint;
    if (!base) return undefined;

    return {
      latitude: base.lat,
      longitude: base.lng,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [myLoc, peerLoc, midpoint]);

  const resetAll = useCallback(() => {
    setPrompt(null);
    setShowMap(false);
    setWaiting(false);
    setMyLoc(null);
    setPeerLoc(null);
    setMidpoint(null);
    setPlaces([]);
    setRadiusMiles(2);
    setCanExpand(false);
    setActivePlaceKey("");
    setSelectedPlace(null);
    setIncomingSelected(null);
    setFinalized(null);
  }, []);

  // ✅ init socket
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const s = await getSocket();
        if (!alive) return;
        setSocket(s);
      } catch (e) {
        console.warn("socket init failed:", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ Resolve myId WITHOUT false "login required"
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1) Fast path: RBZ_USER
        const rawUser = await SecureStore.getItemAsync("RBZ_USER");
        if (!alive) return;

        if (rawUser) {
          const u = JSON.parse(rawUser);
          const id = String(u?.id || u?._id || "");
          if (id) {
            setMyId(id);
            setLoading(false);
            return;
          }
        }

        // 2) Reliable path: token + /users/me (tries both base styles)
        const token = await SecureStore.getItemAsync("RBZ_TOKEN");
        if (!alive) return;

        if (token) {
          const id = await fetchMeIdWithToken(token);
          if (!alive) return;

          if (id) {
            setMyId(id);
            setLoading(false);
            return;
          }
        }

        // 3) Truly not logged in / token invalid
        setLoading(false);
        Alert.alert("Login required", "Your session expired. Please login again.");
        router.back();
      } catch {
        setLoading(false);
        Alert.alert("Login required", "Please login again.");
        router.back();
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  // ✅ Register + join room once socket + me are ready
  useEffect(() => {
    if (!socket || !me || !peer) return;

    socket?.emit?.("user:register", String(me));

    const rid = roomId(String(me), String(peer));
    socket?.emit?.("chat:joinRoom", { roomId: rid, userId: String(me) });
  }, [socket, me, peer]);

  const fetchSuggestions = useCallback(
    async (a: LatLng, b: LatLng, miles: number) => {
      try {
        setFetchingPlaces(true);

        const token = await SecureStore.getItemAsync("RBZ_TOKEN");
        if (!token) throw new Error("Missing token");

        const res = await fetch(`${API_BASE}/api/meet/suggest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ a, b, radiusMiles: miles }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to fetch suggestions");

        const mp = data?.smartMidpoint || data?.midpoint;
        if (mp?.lat && mp?.lng) setMidpoint({ lat: Number(mp.lat), lng: Number(mp.lng) });

        setPlaces(Array.isArray(data?.places) ? data.places : []);
        setCanExpand(Boolean(data?.canExpand));
        setRadiusMiles(Number(data?.radiusMiles || miles));
      } catch (e: any) {
        console.warn("meet/suggest error:", e?.message || e);
        setPlaces([]);
        setCanExpand(false);
      } finally {
        setFetchingPlaces(false);
      }
    },
    []
  );

  const startMeet = useCallback(async () => {
    if (!socket || !me || !peer) return;

    try {
      setStarting(true);

      const loc = await getDeviceLocation();
      setMyLoc(loc);
      setShowMap(true);
      setWaiting(true);

      socket?.emit?.("meet:request", { from: me, to: peer });
      socket?.emit?.("meet:accept", { from: me, to: peer, coords: loc });
    } catch (e: any) {
      Alert.alert("Location needed", e?.message || "Please enable location permission.");
    } finally {
      setStarting(false);
    }
  }, [socket, me, peer]);

  const acceptMeet = useCallback(async () => {
    if (!socket || !me || !peer) return;

    try {
      const loc = await getDeviceLocation();
      setMyLoc(loc);
      setPrompt(null);
      setShowMap(true);
      setWaiting(true);

      socket?.emit?.("meet:accept", { from: me, to: peer, coords: loc });
    } catch (e: any) {
      Alert.alert("Location needed", e?.message || "Please enable location permission.");
    }
  }, [socket, me, peer]);

  const declineMeet = useCallback(() => {
    if (!socket || !me || !peer) return;
    socket?.emit?.("meet:decline", { from: me, to: peer });
    resetAll();
  }, [socket, me, peer, resetAll]);

  const choosePlace = useCallback(
    (p: Place) => {
      if (!socket || !me || !peer) return;

      const key = String(p?.id ?? p?.name ?? "place");
      setActivePlaceKey(key);
      setSelectedPlace(p);

      socket?.emit?.("meet:place:selected", { from: me, to: peer, place: p });

      const ll = placeLatLng(p);
      if (ll && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: ll.lat,
            longitude: ll.lng,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          },
          420
        );
      }
    },
    [socket, me, peer]
  );

  const acceptSelectedPlace = useCallback(() => {
    if (!socket || !me || !peer || !incomingSelected) return;

    socket?.emit?.("meet:place:accepted", { from: me, to: peer, place: incomingSelected });
    setFinalized({ place: incomingSelected });
    setIncomingSelected(null);
  }, [socket, me, peer, incomingSelected]);

  const rejectSelectedPlace = useCallback(() => {
    if (!socket || !me || !peer || !incomingSelected) return;

    socket?.emit?.("meet:place:rejected", { from: me, to: peer, place: incomingSelected });
    setIncomingSelected(null);
  }, [socket, me, peer, incomingSelected]);

  const expandRadius = useCallback(async () => {
    if (!myLoc || !peerLoc) return;

    let next = radiusMiles;
    if (next < 5) next = 5;
    else if (next < 10) next = 10;
    else next = 20;

    await fetchSuggestions(myLoc, peerLoc, next);
  }, [myLoc, peerLoc, radiusMiles, fetchSuggestions]);

  // ✅ listeners
  useEffect(() => {
    if (!socket || !me || !peer) return;

    const onRequest = (data: any) => {
      const from = String(data?.from?.id || data?.from || "");
      if (from === peer) setPrompt({ from });
    };

    const onDecline = () => {
      Alert.alert("Meet request declined", `${displayName} didn’t want to share location right now.`);
      resetAll();
    };

    const onLocation = (data: any) => {
      const from = String(data?.from || data?.from?.id || "");
      const coords = data?.coords;

      if (!coords?.lat || !coords?.lng) return;

      const ll = { lat: Number(coords.lat), lng: Number(coords.lng) };
      if (from === peer) setPeerLoc(ll);
      if (from === me) setMyLoc(ll);
    };

    const onPlaceSelected = (data: any) => {
      const from = String(data?.from?.id || data?.from || "");
      if (from !== peer) return;
      if (data?.place) setIncomingSelected(data.place);
    };

    const onFinalized = (data: any) => {
      if (data?.place) {
        setFinalized({ place: data.place });
        setIncomingSelected(null);
      }
    };

    socket?.on?.("meet:request", onRequest);
    socket?.on?.("meet:decline", onDecline);
    socket?.on?.("meet:location", onLocation);
    socket?.on?.("meet:place:selected", onPlaceSelected);
    socket?.on?.("meet:finalized", onFinalized);

    return () => {
      socket?.off?.("meet:request", onRequest);
      socket?.off?.("meet:decline", onDecline);
      socket?.off?.("meet:location", onLocation);
      socket?.off?.("meet:place:selected", onPlaceSelected);
      socket?.off?.("meet:finalized", onFinalized);
    };
  }, [socket, me, peer, resetAll, displayName]);

  // fetch suggestions when both coords exist
  useEffect(() => {
    if (!myLoc || !peerLoc) return;
    setWaiting(false);
    fetchSuggestions(myLoc, peerLoc, radiusMiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myLoc, peerLoc, fetchSuggestions]);

  // fit map to both points
  useEffect(() => {
    if (!mapRef.current || !myLoc || !peerLoc) return;

    const coords = [
      { latitude: myLoc.lat, longitude: myLoc.lng },
      { latitude: peerLoc.lat, longitude: peerLoc.lng },
    ];

    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 90, right: 60, bottom: 260, left: 60 },
        animated: true,
      });
    }, 250);

    return () => clearTimeout(t);
  }, [myLoc, peerLoc]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: RBZ.bg }}>
        <View style={[styles.center, { flex: 1 }]}>
          <ActivityIndicator />
          <Text style={{ color: RBZ.gray, marginTop: 10, fontWeight: "800" }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: RBZ.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={RBZ.ink} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.hTitle}>Meet in the Middle</Text>
          <Text style={styles.hSub}>Find a fair halfway place for both of you.</Text>
        </View>

        <Pressable
          onPress={() => {
            Alert.alert(
              "Meet-in-the-Middle",
              "We use location only to suggest a midpoint. You can decline anytime."
            );
          }}
          style={styles.headerBtn}
        >
          <Ionicons name="information-circle" size={22} color={RBZ.gray} />
        </Pressable>
      </View>

      {!showMap ? (
        <View style={{ padding: 16, flex: 1 }}>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="navigate" size={20} color={RBZ.c2} />
            </View>

            <Text style={styles.heroTitle}>Halfway suggestions</Text>
            <Text style={styles.heroText}>
              Share location with your match (once) to get midpoint places. When both accept a place, we’ll drop it into chat.
            </Text>

            <View style={{ height: 14 }} />

            <Pressable
              disabled={!socket || starting}
              onPress={startMeet}
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: !socket || starting ? 0.55 : pressed ? 0.9 : 1 },
              ]}
            >
              {starting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="white" />
                  <Text style={styles.primaryBtnText}>Start meet</Text>
                </>
              )}
            </Pressable>

            <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Not now</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Map */}
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              style={{ flex: 1 }}
              initialRegion={region}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {myLoc && (
                <Marker
                  coordinate={{ latitude: myLoc.lat, longitude: myLoc.lng }}
                  title="You"
                  pinColor={RBZ.c2}
                />
              )}

              {peerLoc && (
                <Marker
                  coordinate={{ latitude: peerLoc.lat, longitude: peerLoc.lng }}
                  title={displayName}
                  pinColor={RBZ.c4}
                />
              )}

              {midpoint && (
                <Marker
                  coordinate={{ latitude: midpoint.lat, longitude: midpoint.lng }}
                  title="Middle"
                  pinColor={RBZ.warn}
                />
              )}

              {myLoc && peerLoc && (
                <Polyline
                  coordinates={[
                    { latitude: myLoc.lat, longitude: myLoc.lng },
                    { latitude: peerLoc.lat, longitude: peerLoc.lng },
                  ]}
                  strokeWidth={3}
                  strokeColor="rgba(17,24,39,0.25)"
                />
              )}

              {places.map((p) => {
                const ll = placeLatLng(p);
                if (!ll) return null;
                const key = String(p?.id ?? p?.name ?? `${ll.lat}_${ll.lng}`);
                return (
                  <Marker
                    key={key}
                    coordinate={{ latitude: ll.lat, longitude: ll.lng }}
                    title={p?.name || "Place"}
                    description={p?.address || p?.category}
                    pinColor={key === activePlaceKey ? RBZ.ok : RBZ.c3}
                  />
                );
              })}
            </MapView>

            <View style={styles.mapTopPill}>
              <Ionicons name="shield-checkmark" size={16} color={RBZ.gray} />
              <Text style={styles.mapTopText}>
                {waiting ? "Waiting for their location…" : "Pick a place you both like"}
              </Text>
            </View>
          </View>

          {/* Bottom sheet */}
          <View style={styles.sheet}>
            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Suggestions</Text>
                <Text style={styles.sheetSub}>
                  Radius: <Text style={{ color: RBZ.ink, fontWeight: "900" }}>{radiusMiles} miles</Text>
                </Text>
              </View>

              <Pressable onPress={declineMeet} style={styles.sheetClose}>
                <Ionicons name="close" size={18} color={RBZ.gray} />
              </Pressable>
            </View>

            {fetchingPlaces ? (
              <View style={[styles.center, { paddingVertical: 18 }]}>
                <ActivityIndicator />
                <Text style={{ color: RBZ.gray, marginTop: 10, fontWeight: "800" }}>Finding places…</Text>
              </View>
            ) : places.length === 0 ? (
              <View style={styles.noPlacesCard}>
                <Ionicons name="location" size={22} color={RBZ.gray} />
                <Text style={styles.noPlacesTitle}>No venues found</Text>
                <Text style={styles.noPlacesSub}>
                  Try expanding the radius, or use the midpoint marker as your suggestion.
                </Text>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <Pressable
                    disabled={!canExpand}
                    onPress={expandRadius}
                    style={({ pressed }) => [
                      styles.expandBtn,
                      { opacity: !canExpand ? 0.45 : pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Ionicons name="expand" size={16} color="white" />
                    <Text style={styles.expandBtnText}>Expand</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => Alert.alert("Midpoint", "You can use the middle marker and decide in chat.")}
                    style={({ pressed }) => [styles.ghostBtn, { opacity: pressed ? 0.9 : 1 }]}
                  >
                    <Ionicons name="pin" size={16} color={RBZ.ink} />
                    <Text style={styles.ghostBtnText}>Middle only</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 210 }} showsVerticalScrollIndicator={false}>
                {places.map((p) => {
                  const key = String(p?.id ?? p?.name ?? "");
                  const active = key === activePlaceKey;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => choosePlace(p)}
                      style={({ pressed }) => [
                        styles.placeRow,
                        active && styles.placeRowActive,
                        { opacity: pressed ? 0.92 : 1 },
                      ]}
                    >
                      <View style={styles.placeIcon}>
                        <Ionicons name="cafe" size={16} color={active ? "white" : RBZ.c4} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.placeName} numberOfLines={1}>
                          {p?.name || "Place"}
                        </Text>
                        <Text style={styles.placeAddr} numberOfLines={1}>
                          {p?.address || p?.category || "Venue"}
                        </Text>
                      </View>

                      <Ionicons name="chevron-forward" size={16} color={RBZ.gray} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {!!selectedPlace && !finalized && (
              <View style={styles.pickHint}>
                <Ionicons name="chatbubble-ellipses" size={16} color={RBZ.gray} />
                <Text style={styles.pickHintText}>
                  You picked <Text style={{ color: RBZ.ink, fontWeight: "900" }}>{selectedPlace?.name}</Text>. Waiting for them…
                </Text>
              </View>
            )}

            {!!finalized && (
              <View style={styles.finalCard}>
                <View style={styles.finalIcon}>
                  <Ionicons name="checkmark" size={18} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.finalTitle}>Meetup confirmed</Text>
                  <Text style={styles.finalSub} numberOfLines={2}>
                    {finalized.place?.name || "Your chosen place"} — added to chat.
                  </Text>
                </View>

                <Pressable onPress={() => router.push(`/chat/${peer}` as any)} style={styles.goChatBtn}>
                  <Ionicons name="chatbubbles" size={18} color="white" />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Receiver prompt modal */}
      <Modal transparent visible={!!prompt} animationType="fade" onRequestClose={() => setPrompt(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <View style={styles.modalAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Meet request</Text>
                <Text style={styles.modalSub}>
                  {displayName} wants to find a midway spot. Share your location?
                </Text>
              </View>
            </View>

            <View style={{ height: 12 }} />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={declineMeet} style={styles.modalGhostBtn}>
                <Text style={styles.modalGhostText}>Decline</Text>
              </Pressable>

              <Pressable onPress={acceptMeet} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Share & accept</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Incoming place selected modal */}
      <Modal
        transparent
        visible={!!incomingSelected}
        animationType="fade"
        onRequestClose={() => setIncomingSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <View style={styles.modalAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>They picked a place</Text>
                <Text style={styles.modalSub}>
                  <Text style={{ fontWeight: "900", color: RBZ.ink }}>
                    {incomingSelected?.name || "A place"}
                  </Text>
                  {"\n"}
                  {incomingSelected?.address || incomingSelected?.category || "Venue"}
                </Text>
              </View>
            </View>

            <View style={{ height: 12 }} />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={rejectSelectedPlace} style={styles.modalGhostBtn}>
                <Text style={styles.modalGhostText}>Reject</Text>
              </Pressable>

              <Pressable onPress={acceptSelectedPlace} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Accept</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },

  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: RBZ.bg,
    borderBottomWidth: 1,
    borderBottomColor: RBZ.line,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: RBZ.soft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  hTitle: { color: RBZ.ink, fontSize: 16, fontWeight: "900" },
  hSub: { color: RBZ.gray, fontSize: 12, marginTop: 2, fontWeight: "700" },

  heroCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: RBZ.card,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(216,52,95,0.12)",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  heroTitle: { color: RBZ.ink, fontSize: 16, fontWeight: "900" },
  heroText: { color: RBZ.gray, fontSize: 12, marginTop: 6, lineHeight: 16, fontWeight: "700" },

  primaryBtn: {
    height: 46,
    borderRadius: 16,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "white", fontWeight: "900" },

  secondaryBtn: {
    height: 46,
    borderRadius: 16,
    marginTop: 10,
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: RBZ.ink, fontWeight: "900" },

  mapTopPill: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: RBZ.line,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  mapTopText: { color: RBZ.ink, fontWeight: "900", fontSize: 12 },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: RBZ.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: RBZ.line,
  },
  sheetHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sheetTitle: { color: RBZ.ink, fontSize: 15, fontWeight: "900" },
  sheetSub: { color: RBZ.gray, fontSize: 12, marginTop: 2, fontWeight: "700" },
  sheetClose: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
  },

  noPlacesCard: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  noPlacesTitle: { color: RBZ.ink, fontWeight: "900", marginTop: 8 },
  noPlacesSub: { color: RBZ.gray, marginTop: 6, fontSize: 12, lineHeight: 16, fontWeight: "700" },

  expandBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  expandBtnText: { color: "white", fontWeight: "900" },

  ghostBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: RBZ.bg,
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ghostBtnText: { color: RBZ.ink, fontWeight: "900" },

  placeRow: {
    marginTop: 10,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  placeRowActive: {
    backgroundColor: "rgba(216,52,95,0.10)",
    borderColor: "rgba(216,52,95,0.25)",
  },
  placeIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(181,23,158,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(181,23,158,0.18)",
  },
  placeName: { color: RBZ.ink, fontWeight: "900" },
  placeAddr: { color: RBZ.gray, marginTop: 2, fontSize: 12, fontWeight: "700" },

  pickHint: {
    marginTop: 10,
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  pickHintText: { color: RBZ.gray, fontWeight: "800", fontSize: 12, flex: 1 },

  finalCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  finalIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: RBZ.ok,
    alignItems: "center",
    justifyContent: "center",
  },
  finalTitle: { color: RBZ.ink, fontWeight: "900" },
  finalSub: { color: RBZ.gray, marginTop: 2, fontSize: 12, fontWeight: "700" },
  goChatBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: RBZ.c4,
    alignItems: "center",
    justifyContent: "center",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    borderRadius: 22,
    padding: 16,
    backgroundColor: RBZ.bg,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  modalTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  modalTitle: { color: RBZ.ink, fontSize: 15, fontWeight: "900" },
  modalSub: { color: RBZ.gray, fontSize: 12, marginTop: 4, lineHeight: 16, fontWeight: "700" },

  modalGhostBtn: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
  },
  modalGhostText: { color: RBZ.ink, fontWeight: "900" },

  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: { color: "white", fontWeight: "900" },
});

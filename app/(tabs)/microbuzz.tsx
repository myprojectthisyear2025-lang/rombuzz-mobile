/**
 * ============================================================
 * 📁 File: app/(tabs)/microbuzz.tsx
 * 🎯 Screen: MicroBuzz (Mobile) — Real-time Radar + Selfie + Nearby
 *
 * ✅ WEB-PARITY FIX (IMPORTANT):
 * Web works because it continuously refreshes presence (updatedAt) while scanning.
 * This file now matches that exact behavior:
 *
 *   Every 2 seconds:
 *     1) refreshLocation()
 *     2) POST /microbuzz/activate   (heartbeat — keeps user "fresh")
 *     3) GET  /microbuzz/nearby     (scan)
 *
 * Uses SAME backend:
 *  - POST   /api/microbuzz/selfie
 *  - POST   /api/microbuzz/activate
 *  - GET    /api/microbuzz/nearby
 *  - POST   /api/microbuzz/deactivate
 *  - POST   /api/microbuzz/buzz
 *
 * Notes:
 *  - Reads auth token from SecureStore: "RBZ_TOKEN"
 *  - Reads user from SecureStore: "RBZ_USER"
 * ============================================================
 */

import MatchCelebrateOverlay from "@/src/components/match/MatchCelebrateOverlay";
import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

//Tips
const TIPS = [
  "Long press any avatar to peek their selfie",
  "People around you will appear here",
  "Stay a little, someone may pop up",
  "You're only shown to people you wanna see",
  "MicroBuzz shows people of your preferences",
  "You can extend your search by changing filters",
  "If you both Buzz each other → instant match⚡",
];


// Web parity timing
const TICK_MS = 2000;

// Web parity radius behavior:
// - Web uses ~0.75km in dev for easier testing.
// - Backend clamps in prod (often to 0.1km), but we still send it.
const RADIUS_KM = __DEV__ ? 0.75 : 0.1;

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#0b0b10",
  soft: "#f7f7fb",
  gray: "#6b7280",
  glass: "rgba(255,255,255,0.16)",
  glass2: "rgba(255,255,255,0.10)",
  ring: "rgba(255,255,255,0.22)",
} as const;

type NearbyUser = {
  id: string;
  name?: string;
  selfieUrl: string;
  distanceMeters?: number;
};

type BuzzRequestPayload = {
  fromId: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  selfieUrl?: string;
};

async function getToken() {
  return (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";
}

async function getUserId() {
  try {
    const raw = await SecureStore.getItemAsync("RBZ_USER");
    if (!raw) return "";
    const u = JSON.parse(raw);
    return u?.id || u?._id || "";
  } catch {
    return "";
  }
}
function getAge(dob?: string) {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}


function metersLabel(m?: number) {
  if (!m && m !== 0) return "";
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export default function MicroBuzzScreen() {
    // ------------------------------------------------------------
  // Tips carousel (15s rotation)
  // ------------------------------------------------------------
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Permissions
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [locGranted, setLocGranted] = useState<boolean>(false);

  // Live state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
const [mySelfieLocalUri, setMySelfieLocalUri] = useState<string>("");
const [previewImageUri, setPreviewImageUri] = useState<string>("");
  const [selfieUrl, setSelfieUrl] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const [busy, setBusy] = useState<string>("");

  // Radar
  const [nearby, setNearby] = useState<NearbyUser[]>([]);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Camera modal
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selfiePreviewOpen, setSelfiePreviewOpen] = useState(false);
  const cameraRef = useRef<CameraView>(null as any);

  // Buzz popup
  const [buzzReq, setBuzzReq] = useState<BuzzRequestPayload | null>(null);
  const [toast, setToast] = useState<{ title: string; sub?: string } | null>(null);

  const [matchOverlay, setMatchOverlay] = useState<{
  id: string;
  firstName?: string;
  selfieUrl?: string;
} | null>(null);

  // --- Refs to avoid stale interval closures (critical for parity) ---
  const isActiveRef = useRef(false);
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const selfieUrlRef = useRef<string>("");

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  useEffect(() => {
    selfieUrlRef.current = selfieUrl;
  }, [selfieUrl]);

  // Animations
  const sweep = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const radarSize = useMemo(() => {
    return Math.min(width - 56, 300);
  }, []);

  // ------------------------------------------------------------
  // Setup: permissions
  // ------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const loc = await Location.requestForegroundPermissionsAsync();
        setLocGranted(loc.status === "granted");
        if (loc.status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(next);
          coordsRef.current = next;
        }
      } catch {
        setLocGranted(false);
      }
    })();
  }, []);

  // ------------------------------------------------------------
  // Animations
  // ------------------------------------------------------------
  useEffect(() => {
    Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, sweep]);

  // ------------------------------------------------------------
  // Helpers: API
  // ------------------------------------------------------------
  async function apiFetch(path: string, init?: RequestInit) {
    const token = await getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      ...(init || {}),
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
      } as any,
    });
    return res;
  }

  async function uploadSelfie(uri: string) {
    const token = await getToken();
    const form = new FormData();

    form.append("selfie", {
      uri,
      name: "microbuzz.jpg",
      type: "image/jpeg",
    } as any);

    const res = await fetch(`${API_BASE}/microbuzz/selfie`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      } as any,
      body: form,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Selfie upload failed");
    if (!data?.url) throw new Error("Upload succeeded but no url returned");
    return data.url as string;
  }

  // ------------------------------------------------------------
  // Web-parity: refresh GPS
  // ------------------------------------------------------------
  async function refreshLocation() {
    if (!locGranted) return null;

    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(next);
      coordsRef.current = next;
      return next;
    } catch {
      return coordsRef.current;
    }
  }

  // ------------------------------------------------------------
  // Web-parity: heartbeat (keeps updatedAt fresh)
  // ------------------------------------------------------------
  async function heartbeatActivate() {
    const c = coordsRef.current;
    const sUrl = selfieUrlRef.current;
    if (!c || !sUrl) return;

    try {
      await apiFetch("/microbuzz/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: c.lat,
          lng: c.lng,
          selfieUrl: sUrl,
        }),
      });
    } catch {
      // silent — never block the loop
    }
  }

  // ------------------------------------------------------------
  // Web-parity: scan nearby
  // ------------------------------------------------------------
  async function scanNearby() {
    if (!isActiveRef.current) return;

    const c = coordsRef.current;
    if (!c) return;

    try {
      const q = `?lat=${encodeURIComponent(c.lat)}&lng=${encodeURIComponent(c.lng)}&radius=${RADIUS_KM}`;
      const res = await apiFetch(`/microbuzz/nearby${q}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) return;

      const list: NearbyUser[] = data?.users || [];
      setNearby(list);
    } catch {
      // silent
    }
  }

  // ------------------------------------------------------------
  // Web-parity: single tick (GPS -> heartbeat -> scan)
  // ------------------------------------------------------------
  async function tickOnce() {
    if (!isActiveRef.current) return;

    await refreshLocation();
    await heartbeatActivate();
    await scanNearby();
  }

  // ------------------------------------------------------------
  // Web-parity: start/stop scan loop
  // ------------------------------------------------------------
  async function startScanLoop() {
    stopScanLoop();

    // immediate tick (web does it instantly)
    await tickOnce();

    scanTimerRef.current = setInterval(() => {
      tickOnce();
    }, TICK_MS);
  }

  function stopScanLoop() {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
  }

  // ------------------------------------------------------------
  // Socket: connect + listeners
  // ------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = await getToken();
      if (!token) return;

 const s = await getSocket();

s.on("connect", async () => {
  if (!mounted) return;
  const uid = await getUserId();
  if (uid) s.emit("user:register", uid);
});

      // Someone buzzed you
     s.on("buzz_request", (data: any) => {
  if (!mounted) return;
  if (!data?.fromId) return;

  // Backend sends ONLY `name` + `selfieUrl`
  const fullName = (data.name || "").trim();
  const parts = fullName.split(" ");

  const safe: BuzzRequestPayload = {
    fromId: data.fromId,
    firstName: parts[0] || "Someone",
    lastName: parts.slice(1).join(" "),
    selfieUrl: data.selfieUrl,
    // dob not available from socket (backend does not send it)
  };

  setBuzzReq(safe);
});


      // Match event
    s.on("match", (data: any) => {
        if (!mounted) return;

        setBuzzReq(null);

        setMatchOverlay({
          id: String(data.otherUserId),
          firstName: data.otherName,
          selfieUrl: data.selfieUrl,
        });
      });


      // Presence updates (still useful)
      s.on("microbuzz_update", () => {
        if (!mounted) return;
        if (isActiveRef.current) {
          // quick refresh; loop still runs anyway
          scanNearby();
        }
      });

      s.on("connect_error", (e: any) => {
        console.log("MicroBuzz socket connect_error:", e?.message || e);
      });

      return () => {
        s.off("connect");
        s.off("buzz_request");
        s.off("match");
        s.off("microbuzz_update");
        s.off("connect_error");
      };
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ------------------------------------------------------------
  // Activate / Deactivate
  // ------------------------------------------------------------
  async function activateMicroBuzz() {
    try {
      if (!locGranted) throw new Error("Location permission not granted");
      if (!coordsRef.current) throw new Error("No location yet");
if (!mySelfieLocalUri) throw new Error("Take a selfie first");
      setBusy("Going live…");

      // upload selfie if needed
      let url = selfieUrlRef.current;
      if (!url) {
      url = await uploadSelfie(mySelfieLocalUri);
        setSelfieUrl(url);
        selfieUrlRef.current = url;
      }

      // initial activate (like web)
      const c = coordsRef.current!;
      const res = await apiFetch("/microbuzz/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: c.lat,
          lng: c.lng,
          selfieUrl: url,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Activate failed");

      setIsActive(true);
      isActiveRef.current = true;

      setBusy("");
      setToast({ title: "You’re Live ⚡", sub: "Scanning nearby people…" });
      setTimeout(() => setToast(null), 1800);

      await startScanLoop();
    } catch (e: any) {
      setBusy("");
      setToast({ title: "Go Live failed", sub: e?.message || "Try again" });
      setTimeout(() => setToast(null), 2200);
    }
  }

  async function deactivateMicroBuzz() {
    setBusy("Stopping…");

    stopScanLoop();
    setNearby([]);

    setIsActive(false);
    isActiveRef.current = false;

    try {
      const res = await apiFetch("/microbuzz/deactivate", { method: "POST" });
      await res.json().catch(() => null);
    } catch {
      // ignore
    }

    setBusy("");
    setToast({ title: "MicroBuzz off", sub: "You’re no longer visible" });
    setTimeout(() => setToast(null), 1800);
  }

  // ------------------------------------------------------------
  // Buzz action
  // ------------------------------------------------------------
  async function handleBuzz(toId: string) {
    try {
      setBusy("Buzzing…");
      const res = await apiFetch("/microbuzz/buzz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toId }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || "Buzz failed");

      if (data?.matched) {
        setToast({ title: "Instant match ⚡", sub: "Opening the door…" });
      } else if (data?.alreadyLiked) {
        setToast({ title: "Already buzzed", sub: "Wait for them to buzz back" });
      } else {
        setToast({ title: "Buzz sent 👋", sub: "If they buzz back → match" });
      }
      setTimeout(() => setToast(null), 2200);
    } catch (e: any) {
      setToast({ title: "Buzz failed", sub: e?.message || "Try again" });
      setTimeout(() => setToast(null), 2200);
    } finally {
      setBusy("");
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      stopScanLoop();
      // keep socket singleton alive for whole app (don’t disconnect here)
    };
  }, []);

  // ------------------------------------------------------------
  // Radar math: stable orbit placement
  // ------------------------------------------------------------
  const orbitMemo = useRef<Record<string, { a0: number; r: number }>>({}).current;

function getOrbit(u: NearbyUser, index: number, total: number) {
  if (!orbitMemo[u.id]) {
    const angle = (index / Math.max(1, total)) * Math.PI * 2;

    // spread users across full radar, avoid center + edges
    const minR = 0.28;
    const maxR = 0.92;
    const r = minR + ((index % 5) / 5) * (maxR - minR);

    orbitMemo[u.id] = { a0: angle, r };
  }
  return orbitMemo[u.id];
}


  const sweepRotate = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  const canGoLive = locGranted && !!coordsRef.current && !!mySelfieLocalUri && !busy;

  return (
    <View style={[styles.safe, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[RBZ.c1, RBZ.c4]}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color={RBZ.white} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>MicroBuzz</Text>
            <Text style={styles.subtitle}>Real-time radar • Ultra-local vibes</Text>
          </View>

          <Pressable
            onPress={() => {
              if (isActiveRef.current) {
                tickOnce();
              } else {
                refreshLocation();
              }
            }}
            style={styles.headerBtn}
          >
            <Ionicons name="locate" size={20} color={RBZ.white} />
          </Pressable>
        </LinearGradient>

        {/* Body */}
          <Animated.ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
          {/* Top: Selfie + Status Card */}
          <View style={styles.topCard}>
            <View style={styles.topRow}>
              <Pressable
                onPress={async () => {
                  if (!camPerm?.granted) {
                    await requestCamPerm();
                  }
                  setCameraOpen(true);
                }}
               onLongPress={() => {
                if (!mySelfieLocalUri) return;
                setPreviewImageUri(mySelfieLocalUri);
                setSelfiePreviewOpen(true);
              }}

                delayLongPress={300}
                style={styles.selfieBox}
              >
                {mySelfieLocalUri ? (
                <Image
                  source={{ uri: mySelfieLocalUri }}
                  style={[styles.selfieImg, styles.unmirror]}
                />
                ) : (
                  <View style={styles.selfieEmpty}>
                    <Ionicons name="camera" size={20} color={RBZ.white} />
                    <Text style={styles.selfieEmptyText}>Take selfie</Text>
                  </View>
                )}
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>
                  {isActive ? "You’re Live ⚡" : "Go Live in 10 seconds"}
                </Text>
                <Text style={styles.statusSub}>
                  {isActive
                    ? "People nearby can see you right now."
                    : "Selfie + location → show up on nearby radar."}
                </Text>

                <View style={styles.miniRow}>
                  <View style={styles.pill}>
                    <Ionicons name="location" size={14} color={RBZ.white} />
                    <Text style={styles.pillText}>
                      {locGranted ? (coordsRef.current ? "GPS Active" : "Getting GPS…") : "Location Off"}
                    </Text>
                  </View>
                  <View style={[styles.pill, { borderColor: RBZ.c3 }]}>
                    <Ionicons name="flash" size={14} color={RBZ.white} />
                    <Text style={styles.pillText}>{isActive ? "Scanning" : "Offline"}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Main CTA */}
            <View style={styles.ctaRow}>
              {!isActive ? (
                <Pressable
                  disabled={!canGoLive}
                  onPress={activateMicroBuzz}
                  style={[styles.primaryBtn, !canGoLive && { opacity: 0.55 }]}
                >
                  {busy ? <ActivityIndicator /> : <Ionicons name="flash" size={18} color={RBZ.white} />}
                  <Text style={styles.primaryBtnText}>{busy ? busy : "Go Live Now"}</Text>
                </Pressable>
              ) : (
                <Pressable onPress={deactivateMicroBuzz} style={styles.stopBtn}>
                  {busy ? <ActivityIndicator /> : <Ionicons name="power" size={18} color={RBZ.white} />}
                  <Text style={styles.stopBtnText}>{busy ? busy : "Stop"}</Text>
                </Pressable>
              )}

             <Pressable
                  onPress={async () => {
                    setBusy("Refreshing…");
                    await tickOnce();
                    setBusy("");
                  }}
                  style={styles.ghostBtn}
                >
                  <Ionicons name="refresh" size={18} color={RBZ.c1} />
                  <Text style={styles.ghostBtnText}>Refresh</Text>
                </Pressable>
            </View>
          </View>
                  <View style={styles.tipBox}>
                  <Ionicons name="sparkles" size={14} color={RBZ.c1} />
                  <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
                </View>


          {/* Radar */}
          <View style={styles.radarWrap}>
            <LinearGradient
              colors={["rgba(177,18,60,0.10)", "rgba(181,23,158,0.08)", "rgba(233,72,106,0.06)"]}
              style={[styles.radarCard, { width: radarSize + 28 }]}
            >
              <View style={[styles.radar, { width: radarSize, height: radarSize }]}>
                {/* Rings */}
                <View style={[styles.ring, { width: radarSize, height: radarSize }]} />
                <View style={[styles.ring, { width: radarSize * 0.72, height: radarSize * 0.72 }]} />
                <View style={[styles.ring, { width: radarSize * 0.44, height: radarSize * 0.44 }]} />

                {/* Pulse */}
                <Animated.View style={[styles.centerPulse, { transform: [{ scale: pulseScale }] }]} />

                {/* Sweep line */}
                <Animated.View
                  style={[
                    styles.sweep,
                    { width: radarSize, height: radarSize, transform: [{ rotate: sweepRotate }] },
                  ]}
                >
                  <View style={styles.sweepBeam} />
                </Animated.View>

                {/* Center */}
                <View style={styles.centerCore}>
                  <LinearGradient colors={[RBZ.c2, RBZ.c4]} style={styles.centerCoreGrad}>
                    <Ionicons name="flash" size={18} color={RBZ.white} />
                  </LinearGradient>
                </View>

                {/* Nearby users */}
                {nearby.slice(0, 10).map((u, i) => {
                  const { a0, r } = getOrbit(u, i, nearby.length);

                  const t =
                    typeof (sweep as any).__getValue === "function" ? ((sweep as any).__getValue() as number) : 0;
                  const angle = a0 + t * Math.PI * 2;
                  const radius = (radarSize / 2) * r;

                  const x = radarSize / 2 + Math.cos(angle) * radius;
                  const y = radarSize / 2 + Math.sin(angle) * radius;

                  return (
                    <Pressable
                      key={u.id}
                      onPress={() => handleBuzz(u.id)}
                      onLongPress={() => {
                        setPreviewImageUri(u.selfieUrl);
                        setSelfiePreviewOpen(true);
                      }}

                      style={[styles.userDot, { left: x - 22, top: y - 22 }]}
                    >
                      <Image source={{ uri: u.selfieUrl }} style={styles.userImg} />
                      <View style={styles.userGlow} />
                    </Pressable>
                  );
                })}

                {!isActive ? (
                  <View style={styles.lockOverlay}>
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={16} color={RBZ.white} />
                      <Text style={styles.lockText}>Go Live to scan</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Empty state */}
              {isActive && nearby.length === 0 ? (
                <View style={styles.emptyBelowRadar}>
                  <Text style={styles.emptyBelowTitle}>No one in range yet</Text>
                  <Text style={styles.emptyBelowSub}>Stay live - someone nearby may pop up</Text>
                </View>
              ) : null}

              {/* Footer stats */}
              <View style={styles.radarFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerVal}>{isActive ? nearby.length : "—"}</Text>
                  <Text style={styles.footerLabel}>Nearby</Text>
                </View>
                <View style={styles.footerDivider} />
                <View style={styles.footerItem}>
                  <Text style={styles.footerVal}>{isActive ? `${Math.round(RADIUS_KM * 1000)}m` : "—"}</Text>
                  <Text style={styles.footerLabel}>Radius</Text>
                </View>
                <View style={styles.footerDivider} />
                <View style={styles.footerItem}>
                  <Text style={styles.footerVal}>{isActive ? "Live" : "Off"}</Text>
                  <Text style={styles.footerLabel}>Status</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
            </Animated.ScrollView>

        {/* Busy overlay */}
        {busy ? (
          <View style={styles.busyOverlay}>
            <ActivityIndicator />
            <Text style={styles.busyText}>{busy}</Text>
          </View>
        ) : null}

        {/* Incoming Buzz Request */}
        <Modal visible={!!buzzReq} transparent animationType="fade">
          <View style={styles.modalDim}>
            <View style={styles.buzzCard}>
            <LinearGradient colors={[RBZ.c1, RBZ.c4]} style={styles.buzzHeader}>
  <View style={styles.buzzHeaderRow}>
    <View>
      <Text style={styles.buzzHeaderTitle}>Someone Buzzed You ⚡</Text>
      <Text style={styles.buzzHeaderSub}>Accept → instant match</Text>
    </View>

    {/* Ignore button (top-right) */}
    <Pressable
      onPress={async () => {
        try {
          setBusy("Ignoring…");
          await apiFetch("/microbuzz/buzz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toId: buzzReq?.fromId,
              confirm: "ignore",
            }),
          });
        } catch {}
        setBusy("");
        setBuzzReq(null);
      }}
      style={styles.ignoreBtn}
    >
      <Ionicons name="ban" size={16} color={RBZ.white} />
      <Text style={styles.ignoreText}>Ignore</Text>
    </Pressable>
  </View>
</LinearGradient>


              

              <View style={styles.buzzBody}>
               <Pressable
                  onPress={() => {
                    if (!buzzReq?.selfieUrl) return;
                    setPreviewImageUri(buzzReq.selfieUrl);
                    setSelfiePreviewOpen(true);
                  }}
                >
                  <Image
                    source={{ uri: buzzReq?.selfieUrl || "https://via.placeholder.com/120" }}
                    style={styles.buzzAvatar}
                  />
                </Pressable>

                <Text style={styles.buzzName}>
                  {buzzReq?.firstName} {buzzReq?.lastName}
                  {buzzReq?.dob ? `, ${getAge(buzzReq.dob)}` : ""}
                </Text>

                <View style={styles.buzzBtns}>
                  <Pressable
                    onPress={async () => {
                      try {
                        setBusy("Accepting…");
                        const res = await apiFetch("/microbuzz/buzz", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ toId: buzzReq?.fromId, confirm: true }),
                        });
                        await res.json().catch(() => null);
                      } catch {}
                      setBusy("");
                      setBuzzReq(null);
                    }}
                    style={styles.acceptBtn}
                  >
                    <Ionicons name="heart" size={18} color={RBZ.white} />
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>

                  <Pressable onPress={() => setBuzzReq(null)} style={styles.declineBtn}>
                    <Ionicons name="close" size={18} color={RBZ.white} />
                    <Text style={styles.declineText}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Selfie Preview Modal */}
        <Modal visible={selfiePreviewOpen} transparent animationType="fade">
          <Pressable
            style={styles.previewDim}
            onPress={() => {
              setSelfiePreviewOpen(false);
              setPreviewImageUri("");
            }}
          >
       <Image
          source={{ uri: previewImageUri }}
          style={[styles.previewImage, styles.unmirror]}
          resizeMode="contain"
        />


          </Pressable>
        </Modal>

        {/* Camera Modal */}
        <Modal visible={cameraOpen} transparent animationType="slide">
          <View style={styles.camDim}>
            <View style={styles.camSheet}>
              <View style={styles.camTop}>
                <Text style={styles.camTitle}>MicroBuzz Selfie</Text>
                <Pressable onPress={() => setCameraOpen(false)} style={styles.camClose}>
                  <Ionicons name="close" size={20} color={RBZ.white} />
                </Pressable>
              </View>

              {!camPerm?.granted ? (
                <View style={styles.camNeedPerm}>
                  <Text style={styles.camNeedPermText}>Camera permission needed</Text>
                  <Pressable onPress={requestCamPerm} style={styles.primaryBtn}>
                    <Ionicons name="camera" size={18} color={RBZ.white} />
                    <Text style={styles.primaryBtnText}>Grant permission</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.camBox}>
                  <CameraView ref={cameraRef} style={styles.camView} facing="front" />

                  <View style={styles.camControls}>
                    <Pressable
                      onPress={async () => {
                        try {
                        const pic = await (cameraRef.current as any)?.takePictureAsync?.({
                          quality: 0.7,
                          skipProcessing: true,
                          mirror: false, // ✅ FIX: prevent horizontal flip
                        });

                          if (pic?.uri) {
                            setMySelfieLocalUri(pic.uri);
                            setSelfieUrl("");
                            selfieUrlRef.current = "";
                            setCameraOpen(false);
                            setToast({ title: "Selfie saved ✅", sub: "Now go live" });
                            setTimeout(() => setToast(null), 1400);
                          }
                        } catch {}
                      }}
                      style={styles.snapBtn}
                    >
                      <LinearGradient colors={[RBZ.c2, RBZ.c4]} style={styles.snapGrad}>
                        <Ionicons name="radio-button-on" size={22} color={RBZ.white} />
                        <Text style={styles.snapText}>Snap</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Toast */}
        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            {toast.sub ? <Text style={styles.toastSub}>{toast.sub}</Text> : null}
          </View>
        ) : null}
        <MatchCelebrateOverlay
        visible={!!matchOverlay}
        matchUser={matchOverlay}
        onDone={() => setMatchOverlay(null)}
      />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RBZ.soft },
  container: { flex: 1, backgroundColor: RBZ.soft },

  header: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  title: { color: RBZ.white, fontSize: 18, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.88)", fontSize: 12, marginTop: 2 },

  body: { flex: 1, paddingHorizontal: 14, paddingTop: 12 },

  topCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 12,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  topRow: { flexDirection: "row", gap: 12, alignItems: "center" },

  selfieBox: {
    width: 82,
    height: 82,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(209, 31, 88, 1)",
    borderWidth: 2,
    borderColor: RBZ.c3,
  },
  selfieImg: { width: "100%", height: "100%" },
  selfieEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  selfieEmptyText: { color: RBZ.white, fontSize: 11, marginTop: 6, fontWeight: "700" },

  statusTitle: { fontSize: 15, fontWeight: "900", color: RBZ.ink },
  statusSub: { fontSize: 12, color: RBZ.gray, marginTop: 4, lineHeight: 16 },

  miniRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  pill: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(209, 31, 88, 1)",
    borderWidth: 1,
    borderColor: RBZ.c2,
  },
  pillText: { color: RBZ.white, fontSize: 11, fontWeight: "800" },

  ctaRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  primaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: RBZ.c1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: RBZ.white, fontWeight: "900" },

  stopBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(11,11,16,0.88)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.22)",
  },
  stopBtnText: { color: RBZ.white, fontWeight: "900" },

  ghostBtn: {
    width: 128,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(177,18,60,0.08)",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.18)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  ghostBtnText: { color: RBZ.c1, fontWeight: "900", fontSize: 12 },

  radarWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 14,
  },
  radarCard: {
    borderRadius: 22,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: RBZ.white,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  radar: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(214, 58, 107, 1)",
    overflow: "hidden",
  },

  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RBZ.ring,
  },
  centerPulse: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(233,72,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.22)",
  },
  sweep: { position: "absolute" },
  sweepBeam: {
    position: "absolute",
    left: "50%",
    top: 0,
    width: 2,
    height: "50%",
    backgroundColor: "rgba(233,72,106,0.38)",
  },
  centerCore: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  centerCoreGrad: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  userDot: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  userImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: RBZ.c3,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  userGlow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.22)",
  },

  emptyBelowRadar: {
    marginTop: 12,
    alignItems: "center",
  },
  emptyBelowTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: RBZ.ink,
  },
  emptyBelowSub: {
    marginTop: 4,
    fontSize: 12,
    color: RBZ.gray,
    textAlign: "center",
  },

  lockOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11,11,16,0.55)",
  },
  lockBadge: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(177,18,60,0.40)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  lockText: { color: RBZ.white, fontWeight: "900" },

  radarFooter: {
    marginTop: 12,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  footerItem: { alignItems: "center", flex: 1 },
  footerVal: { fontSize: 14, fontWeight: "900", color: RBZ.ink },
  footerLabel: { fontSize: 11, color: RBZ.gray, marginTop: 2, fontWeight: "700" },
  footerDivider: { width: 1, height: 28, backgroundColor: "rgba(0,0,0,0.08)" },

  busyOverlay: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18 + 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  busyText: { fontWeight: "800", color: RBZ.ink },

  previewDim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "90%",
    height: "70%",
    borderRadius: 16,
  },

  modalDim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  buzzCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  buzzHeader: { padding: 14 },
  buzzHeaderTitle: { color: RBZ.white, fontSize: 15, fontWeight: "900" },
  buzzHeaderSub: { color: "rgba(255,255,255,0.86)", marginTop: 4, fontSize: 12 },

  buzzBody: { padding: 14, alignItems: "center" },
  buzzAvatar: { width: 110, height: 110, borderRadius: 26, borderWidth: 2, borderColor: RBZ.c3 },
  buzzName: { marginTop: 10, fontSize: 16, fontWeight: "900", color: RBZ.ink },

  buzzBtns: { flexDirection: "row", gap: 10, marginTop: 14, width: "100%" },
  acceptBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: RBZ.c1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  acceptText: { color: RBZ.white, fontWeight: "900" },
  declineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: RBZ.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  declineText: { color: RBZ.white, fontWeight: "900" },

  camDim: {
    flex: 1,
    backgroundColor: "rgba(11,11,16,0.65)",
    justifyContent: "flex-end",
  },
  camSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: RBZ.white,
    paddingBottom: 18,
    overflow: "hidden",
  },
  camTop: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: RBZ.c1,
  },
  tipBox: {
  marginTop: -30,
  marginBottom: -10,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 12,
  backgroundColor: "rgba(177,18,60,0.08)",
  borderWidth: 1,
  borderColor: "rgba(177,18,60,0.18)",
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},
tipText: {
  flex: 1,
  fontSize: 12,
  fontWeight: "800",
  color: RBZ.c1,
},

  camTitle: { color: RBZ.white, fontWeight: "900", fontSize: 14 },
  camClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  camNeedPerm: { padding: 16, alignItems: "center", gap: 12 },
  camNeedPermText: { color: RBZ.gray, fontWeight: "800" },
  camBox: { padding: 14 },
  camView: {
    width: "100%",
    height: 320,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camControls: { marginTop: 12, alignItems: "center" },
  snapBtn: { width: "100%", height: 52, borderRadius: 16, overflow: "hidden" },
  snapGrad: { flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  snapText: { color: RBZ.white, fontWeight: "900" },

  toast: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18 + 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(15,15,18,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  unmirror: {
  transform: [{ scaleX: -1 }],
},
buzzHeaderRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

ignoreBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 999,
  backgroundColor: "rgba(0,0,0,0.22)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.28)",
},

ignoreText: {
  color: RBZ.white,
  fontSize: 12,
  fontWeight: "900",
},


  toastTitle: { color: RBZ.white, fontWeight: "900", fontSize: 13 },
  toastSub: { color: "rgba(255,255,255,0.86)", marginTop: 4, fontSize: 12 },
});

/**
 * ============================================================
 * 📁 File: app/(tabs)/microbuzz.tsx
 * 🎯 Screen: MicroBuzz (Mobile) — Premium Redesign
 * 
 * ✨ REDESIGN FEATURES:
 * - Dynamic "Presence Orb" with pulsing status
 * - Holographic "Proximity Ring" radar with depth
 * - Floating user capsules with distance indicators
 * - Cinematic gradients and glassmorphism
 * - Emotional micro-interactions
 * - Premium empty/permission states
 * - All original functionality preserved
 * ============================================================
 */

import MatchCelebrateOverlay from "@/src/components/match/MatchCelebrateOverlay";
import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// Premium color palette
const RBZ = {
  // Primary brand gradient
  c1: "#B1123C", // deep red
  c2: "#D8345F", // vibrant pink-red
  c3: "#E9486A", // soft rose
  c4: "#B5179E", // rich purple
  c5: "#8A4FFF", // electric purple (accent)
  
  // Neutrals
  white: "#FFFFFF",
  ink: "#0B0B10",
  inkLight: "#1A1525",
  soft: "#F7F7FB",
  gray: "#6B7280",
  
  // Glass effects
  glass: "rgba(255,255,255,0.08)",
  glass2: "rgba(255,255,255,0.12)",
  glass3: "rgba(255,255,255,0.03)",
  ring: "rgba(255,255,255,0.22)",
  
  // Glow
  glow: "rgba(216,52,95,0.3)",
  glowIntense: "rgba(216,52,95,0.6)",
} as const;

// MicroBuzz permission cache keys
const MBZ_CAMERA_GRANTED_KEY = "RBZ_MICROBUZZ_CAMERA_GRANTED";
const MBZ_LOCATION_GRANTED_KEY = "RBZ_MICROBUZZ_LOCATION_GRANTED";
const MBZ_ONBOARDED_KEY = "RBZ_MICROBUZZ_ONBOARDED";

// Dynamic status messages
const STATUS_MESSAGES = {
  inactive: [
    "Appear nearby",
    "Someone could be close",
    "Your moment awaits",
    "Go live, find chemistry",
  ],
  activating: [
    "Finding your signal",
    "Preparing your presence",
    "Scanning the area",
    "Almost there",
  ],
  live: [
    "You're visible now",
    "Someone noticed you",
    "Good energy around",
    "This could be tonight",
  ],
  empty: [
    "No signals yet",
    "You're the first",
    "Be the spark",
    "Quiet frequency",
  ],
};

const TIPS = [
  "Long press any avatar to peek their selfie",
  "People around you will appear in real time",
  "Stay live — someone may pop up any second",
  "You're only shown to people you wanna see",
  "If you both Buzz each other → instant match ⚡",
  "The closer they are, the warmer their glow",
];

// Web parity timing
const TICK_MS = 2000;
const RADIUS_KM = __DEV__ ? 0.75 : 0.1;

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
  // Tips carousel
  const [tipIndex, setTipIndex] = useState(0);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 15000);
    
    const statusTimer = setInterval(() => {
      setStatusMessageIndex((i) => (i + 1) % 4);
    }, 4000);
    
    return () => {
      clearInterval(tipTimer);
      clearInterval(statusTimer);
    };
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
  const [liveStartTime, setLiveStartTime] = useState<Date | null>(null);

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

  // Refs for intervals
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

  // Permission helpers
  async function syncCurrentLocation() {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      const granted = perm.status === "granted";
      setLocGranted(granted);
      if (!granted) return null;

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(next);
      coordsRef.current = next;
      return next;
    } catch {
      return coordsRef.current;
    }
  }

  async function persistMicroBuzzPermissionCache(cameraGranted: boolean, locationGranted: boolean) {
    try {
      await SecureStore.setItemAsync(MBZ_CAMERA_GRANTED_KEY, cameraGranted ? "true" : "false");
    } catch {}
    try {
      await SecureStore.setItemAsync(MBZ_LOCATION_GRANTED_KEY, locationGranted ? "true" : "false");
    } catch {}

    // Keep onboarded flag in sync: only true when both are granted
    try {
      const onboarded = cameraGranted && locationGranted ? "true" : "false";
      await SecureStore.setItemAsync(MBZ_ONBOARDED_KEY, onboarded);
    } catch {}
  }

  async function checkAndSyncMicroBuzzPermissions({ askCamera = false, askLocation = false } : { askCamera?: boolean; askLocation?: boolean }) {
    // Camera
    let cameraGranted = !!camPerm?.granted;
    // Only request camera if we are explicitly asking AND camera is not already granted
    if (askCamera && !cameraGranted) {
      try {
        const r = await requestCamPerm();
        cameraGranted = r?.granted === true;
      } catch {
        cameraGranted = !!camPerm?.granted;
      }
    }

    // Location
    let locationGranted = false;
    try {
      const current = await Location.getForegroundPermissionsAsync();
      locationGranted = current.status === "granted";
      if (!locationGranted && askLocation) {
        const req = await Location.requestForegroundPermissionsAsync();
        locationGranted = req.status === "granted";
      }
    } catch {
      locationGranted = false;
    }

    // Persist a cache for quick checks (doesn't replace OS truth)
    await persistMicroBuzzPermissionCache(cameraGranted, locationGranted);

    // Update local state
    setLocGranted(locationGranted);

    // If location is granted, immediately sync coords; otherwise clear coords
    if (locationGranted) {
      try {
        await syncCurrentLocation();
      } catch {
        // ignore
      }
    } else {
      setCoords(null);
      coordsRef.current = null;
    }

    return { cameraGranted, locationGranted };
  }

  async function ensureMicroBuzzPermissionsOnEntry() {
    try {
      const onboarded = await SecureStore.getItemAsync(MBZ_ONBOARDED_KEY);

      if (onboarded !== "true") {
        // Not onboarded: request missing permissions (ask flow)
        await checkAndSyncMicroBuzzPermissions({ askCamera: true, askLocation: true });
        // persistMicroBuzzPermissionCache already sets MBZ_ONBOARDED only when both granted
      } else {
        // Already onboarded: silently re-check OS state
        await checkAndSyncMicroBuzzPermissions({ askCamera: false, askLocation: false });
        // If permissions were revoked in settings, persistMicroBuzzPermissionCache will update MBZ_ONBOARDED to false
      }
    } catch {
      // ignore
    }
  }

  // Animations
  const sweep = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const orbPulse = useRef(new Animated.Value(0)).current;
  const sweepValueRef = useRef(0);

  const radarSize = useMemo(() => {
    return Math.min(width - 56, 320);
  }, []);

  // Setup permissions
  useEffect(() => {
    (async () => {
      try {
        // Always query the OS for the current foreground location permission and pick a location if available
        await checkAndSyncMicroBuzzPermissions({ askCamera: false, askLocation: false });
        await syncCurrentLocation();
      } catch {
        // ignore
      }
    })();
  }, []);

  // Silently sync permission cache when camera permission hook changes
  useEffect(() => {
    // run a non-asking sync whenever camera permission state reported by the hook changes
    (async () => {
      try {
        await checkAndSyncMicroBuzzPermissions({ askCamera: false, askLocation: false });
      } catch {}
    })();
  }, [camPerm?.granted]);

  // Focus hook to ensure onboarding + not re-prompting on subsequent opens
  useFocusEffect(
    React.useCallback(() => {
      ensureMicroBuzzPermissionsOnEntry();
    }, [])
  );

  // Animations loop
  useEffect(() => {
    const sweepListenerId = sweep.addListener(({ value }) => {
      sweepValueRef.current = value;
    });

    Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(orbPulse, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      sweep.removeListener(sweepListenerId);
    };
  }, [pulse, sweep, glowPulse, orbPulse]);

  // API helpers
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

  // REFRESH LOCATION: always query OS permission state each time before getting location
  async function refreshLocation() {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      const granted = perm.status === "granted";

      // If not granted, explicitly clear local coords and mark location as not granted
      if (!granted) {
        setLocGranted(false);
        setCoords(null);
        coordsRef.current = null;
        return null;
      }

      // granted === true
      setLocGranted(true);

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(next);
      coordsRef.current = next;
      return next;
    } catch {
      // On any error, clear coords and report null so downstream logic cannot use stale coordinates
      setLocGranted(false);
      setCoords(null);
      coordsRef.current = null;
      return null;
    }
  }

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
      // silent
    }
  }

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

  async function tickOnce() {
    if (!isActiveRef.current) return;
    await refreshLocation();
    await heartbeatActivate();
    await scanNearby();
  }

  async function startScanLoop() {
    stopScanLoop();
    await tickOnce();
    scanTimerRef.current = setInterval(() => {
      tickOnce();
    }, TICK_MS);
  }

  function stopScanLoop() {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
  }

  // Socket setup
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

      s.on("buzz_request", (data: any) => {
        if (!mounted || !data?.fromId) return;
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        const fullName = (data.name || "").trim();
        const parts = fullName.split(" ");

        const safe: BuzzRequestPayload = {
          fromId: data.fromId,
          firstName: parts[0] || "Someone",
          lastName: parts.slice(1).join(" "),
          selfieUrl: data.selfieUrl,
        };

        setBuzzReq(safe);
      });

      s.on("match", (data: any) => {
        if (!mounted) return;
        setBuzzReq(null);
        setMatchOverlay({
          id: String(data.otherUserId),
          firstName: data.otherName,
          selfieUrl: data.selfieUrl,
        });
      });

      s.on("microbuzz_update", () => {
        if (!mounted || !isActiveRef.current) return;
        scanNearby();
      });

      return () => {
        s.off("connect");
        s.off("buzz_request");
        s.off("match");
        s.off("microbuzz_update");
      };
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Activate / Deactivate
  async function activateMicroBuzz() {
    try {
      if (!locGranted) throw new Error("Location permission not granted");
      if (!coordsRef.current) throw new Error("No location yet");
      if (!mySelfieLocalUri) throw new Error("Take a selfie first");
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setBusy("Going live…");

      let url = selfieUrlRef.current;
      if (!url) {
        url = await uploadSelfie(mySelfieLocalUri);
        setSelfieUrl(url);
        selfieUrlRef.current = url;
      }

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
      setLiveStartTime(new Date());

      setBusy("");
      setToast({ title: "You're Live ⚡", sub: "Your presence is visible now" });
      setTimeout(() => setToast(null), 1800);

      await startScanLoop();
    } catch (e: any) {
      setBusy("");
      setToast({ title: "Go Live failed", sub: e?.message || "Try again" });
      setTimeout(() => setToast(null), 2200);
    }
  }

  async function deactivateMicroBuzz() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy("Stopping…");

    stopScanLoop();
    setNearby([]);

    setIsActive(false);
    isActiveRef.current = false;
    setLiveStartTime(null);

    try {
      await apiFetch("/microbuzz/deactivate", { method: "POST" });
    } catch {
      // ignore
    }

    setBusy("");
    setToast({ title: "MicroBuzz off", sub: "You're no longer visible" });
    setTimeout(() => setToast(null), 1800);
  }

  async function handleBuzz(toId: string) {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setBusy("Buzzing…");
      
      const res = await apiFetch("/microbuzz/buzz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toId }),
      });
      
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || "Buzz failed");

      if (data?.matched) {
        setToast({ title: "Instant Match ⚡", sub: "Opening the door…" });
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
    };
  }, []);

  // Radar math
  const orbitMemo = useRef<Record<string, { a0: number; r: number }>>({}).current;

  function getOrbit(u: NearbyUser, index: number, total: number) {
    if (!orbitMemo[u.id]) {
      const angle = (index / Math.max(1, total)) * Math.PI * 2;
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
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const orbScale = orbPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const canGoLive = locGranted && !!coordsRef.current && !!mySelfieLocalUri && !busy;
  const liveDuration = liveStartTime 
    ? Math.floor((Date.now() - liveStartTime.getTime()) / 60000)
    : 0;

  // Get dynamic status message
  const getStatusMessage = () => {
    if (!isActive) return STATUS_MESSAGES.inactive[statusMessageIndex % 4];
    if (nearby.length === 0) return STATUS_MESSAGES.empty[statusMessageIndex % 4];
    return STATUS_MESSAGES.live[statusMessageIndex % 4];
  };

  return (
    <View style={[styles.safe, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {/* Premium Header */}
        <LinearGradient
          colors={[RBZ.c1, RBZ.c4]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]
          }
        >
          <Pressable 
            onPress={() => router.back()} 
            style={styles.headerBtn}
            android_ripple={{ color: RBZ.glass2, borderless: true }}
          >
            <Ionicons name="chevron-back" size={22} color={RBZ.white} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>MicroBuzz</Text>
            <Text style={styles.subtitle}>{getStatusMessage()}</Text>
          </View>

          <Pressable
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (isActiveRef.current) {
                await tickOnce();
              } else {
                await refreshLocation();
              }
            }}
            style={styles.headerBtn}
            android_ripple={{ color: RBZ.glass2, borderless: true }}
          >
            <Ionicons 
              name={isActive ? "radio" : "locate"} 
              size={20} 
              color={RBZ.white} 
            />
          </Pressable>
        </LinearGradient>

        {/* Main Content */}
        <Animated.ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Presence Orb - Redesigned */}
          <View style={styles.presenceCard}>
            <View style={styles.presenceRow}>
              <Pressable
                onPress={async () => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                    // Fast path: only check/request camera permission
                    let granted = !!camPerm?.granted;
                    if (!granted) {
                      const r = await requestCamPerm();
                      granted = r?.granted === true;
                    }

                    if (granted) {
                      setCameraOpen(true);
                    } else {
                      setToast({
                        title: "Camera permission needed",
                        sub: "Allow camera access to take your presence selfie",
                      });
                      setTimeout(() => setToast(null), 2200);
                    }
                  } catch {
                    setToast({ title: "Camera failed", sub: "Please try again" });
                    setTimeout(() => setToast(null), 2200);
                  }
                }}
                hitSlop={12}
                onLongPress={() => {
                  if (!mySelfieLocalUri) return;
                  setPreviewImageUri(mySelfieLocalUri);
                  setSelfiePreviewOpen(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                delayLongPress={300}
                style={styles.presenceOrbContainer}
              >
                <Animated.View style={[
                  styles.presenceOrbGlow,
                  isActive && { transform: [{ scale: orbScale }] },
                  { opacity: isActive ? glowOpacity : 0.3 }
                ]}>
                  <LinearGradient
                    colors={isActive ? [RBZ.c2, RBZ.c5] : [RBZ.glass, RBZ.glass2]}
                    style={styles.presenceOrbGradient}
                  >
                    {mySelfieLocalUri ? (
                      <Image
                        source={{ uri: mySelfieLocalUri }}
                        style={[styles.presenceImage, styles.unmirror]}
                      />
                    ) : (
                      <View style={styles.presenceEmpty}>
                        <Ionicons name="camera" size={24} color={RBZ.white} />
                        <Text style={styles.presenceEmptyText}>Add</Text>
                      </View>
                    )}
                  </LinearGradient>
                </Animated.View>

                {isActive && (
                  <View style={styles.liveBadge}>
                    <LinearGradient
                      colors={[RBZ.c2, RBZ.c3]}
                      style={styles.liveBadgeInner}
                    >
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </LinearGradient>
                  </View>
                )}
              </Pressable>

              <View style={styles.presenceInfo}>
                <Text style={styles.presenceTitle}>
                  {isActive ? "You're Visible" : "Appear Nearby"}
                </Text>
                
                <View style={styles.presenceMetrics}>
                  <View style={styles.metricItem}>
                    <Ionicons name="time" size={14} color={RBZ.gray} />
                    <Text style={styles.metricText}>
                      {isActive ? `${liveDuration}m` : "—"}
                    </Text>
                  </View>
                  
                  <View style={styles.metricDivider} />
                  
                  <View style={styles.metricItem}>
                    <Ionicons name="people" size={14} color={RBZ.gray} />
                    <Text style={styles.metricText}>
                      {isActive ? nearby.length : "—"}
                    </Text>
                  </View>
                  
                  <View style={styles.metricDivider} />
                  
                  <View style={styles.metricItem}>
                    <Ionicons name="navigate" size={14} color={RBZ.gray} />
                    <Text style={styles.metricText}>
                      {Math.round(RADIUS_KM * 1000)}m
                    </Text>
                  </View>
                </View>

                <View style={styles.presenceBar}>
                  <LinearGradient
                    colors={[RBZ.c2, RBZ.c4]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.presenceBarFill,
                      { width: isActive ? '100%' : '0%' }
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.actionRow}>
              {!isActive ? (
                <Pressable
                  disabled={!canGoLive}
                  onPress={activateMicroBuzz}
                  style={[styles.primaryBtn, !canGoLive && styles.primaryBtnDisabled]}
                  android_ripple={{ color: RBZ.glass2 }}
                >
                  <LinearGradient
                    colors={canGoLive ? [RBZ.c2, RBZ.c4] : [RBZ.gray, RBZ.gray]}
                    style={styles.primaryBtnGradient}
                  >
                    {busy ? (
                      <ActivityIndicator color={RBZ.white} />
                    ) : (
                      <>
                        <Ionicons name="flash" size={20} color={RBZ.white} />
                        <Text style={styles.primaryBtnText}>Go Live</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable
                  onPress={deactivateMicroBuzz}
                  style={styles.stopBtn}
                  android_ripple={{ color: RBZ.glass2 }}
                >
                  <LinearGradient
                    colors={[RBZ.ink, RBZ.inkLight]}
                    style={styles.stopBtnGradient}
                  >
                    {busy ? (
                      <ActivityIndicator color={RBZ.white} />
                    ) : (
                      <>
                        <Ionicons name="power" size={20} color={RBZ.white} />
                        <Text style={styles.stopBtnText}>Stop</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              )}

              <Pressable
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setBusy("Refreshing…");
                  await tickOnce();
                  setBusy("");
                }}
                style={styles.secondaryBtn}
                android_ripple={{ color: RBZ.glass }}
              >
                <Ionicons name="refresh" size={18} color={RBZ.c1} />
              </Pressable>
            </View>
          </View>

          {/* Tip */}
          <View style={styles.tipContainer}>
            <Ionicons name="sparkles" size={14} color={RBZ.c2} />
            <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
          </View>

          {/* Proximity Ring - Redesigned Radar */}
          <View style={styles.radarWrapper}>
            <LinearGradient
              colors={[RBZ.inkLight, RBZ.ink]}
              style={[styles.radarCard, { width: radarSize + 32 }]}
            >
              <View style={[styles.radar, { width: radarSize, height: radarSize }]}>
                {/* Particle background */}
                <View style={styles.particleField}>
                  {[...Array(12)].map((_, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.particle,
                        {
                          left: `${20 + (i * 7) % 60}%`,
                          top: `${15 + (i * 13) % 70}%`,
                          opacity: pulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.1, 0.3],
                          }),
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Glow rings */}
                <View style={[styles.radarRing, styles.ringOuter]} />
                <View style={[styles.radarRing, styles.ringMiddle]} />
                <View style={[styles.radarRing, styles.ringInner]} />

                {/* Heat gradient */}
                <LinearGradient
                  colors={[
                    'rgba(177,18,60,0)',
                    'rgba(181,23,158,0.1)',
                    'rgba(216,52,95,0.2)',
                  ]}
                  style={styles.heatGradient}
                />

                {/* Sweep line */}
                <Animated.View
                  style={[
                    styles.sweep,
                    { transform: [{ rotate: sweepRotate }] },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(233,72,106,0.4)', 'transparent']}
                    style={styles.sweepBeam}
                  />
                </Animated.View>

                {/* Center pulse */}
                <Animated.View style={[
                  styles.centerPulse,
                  { transform: [{ scale: pulseScale }] }
                ]}>
                  <LinearGradient
                    colors={[RBZ.c2, RBZ.c4]}
                    style={styles.centerCore}
                  >
                    <Ionicons name="flash" size={24} color={RBZ.white} />
                  </LinearGradient>
                </Animated.View>

                {/* User capsules */}
                             {nearby.slice(0, 8).map((u, i) => {
                  const { a0, r } = getOrbit(u, i, nearby.length);
                  const t = sweepValueRef.current;
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
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[styles.userCapsule, { left: x - 24, top: y - 24 }]}
                    >
                      <Animated.View style={[
                        styles.userGlow,
                        { opacity: glowOpacity }
                      ]}>
                        <Image source={{ uri: u.selfieUrl }} style={styles.userImage} />
                      </Animated.View>
                      
                      {u.distanceMeters && (
                        <View style={styles.userDistance}>
                          <Text style={styles.userDistanceText}>
                            {metersLabel(u.distanceMeters)}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.userActiveDot} />
                    </Pressable>
                  );
                })}

                {/* Lock overlay when inactive */}
                {!isActive && (
                  <View style={styles.radarLock}>
                    <LinearGradient
                      colors={['rgba(11,11,16,0.7)', 'rgba(26,21,37,0.8)']}
                      style={styles.radarLockInner}
                    >
                      <View style={styles.radarLockBadge}>
                        <Ionicons name="lock-closed" size={16} color={RBZ.white} />
                        <Text style={styles.radarLockText}>Go Live to scan</Text>
                      </View>
                    </LinearGradient>
                  </View>
                )}
              </View>

              {/* Radar footer */}
              <View style={styles.radarFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerValue}>
                    {isActive ? nearby.length : '—'}
                  </Text>
                  <Text style={styles.footerLabel}>nearby</Text>
                </View>
                
                <View style={styles.footerDivider} />
                
                <View style={styles.footerItem}>
                  <Text style={styles.footerValue}>
                    {isActive ? `${liveDuration}m` : '—'}
                  </Text>
                  <Text style={styles.footerLabel}>live</Text>
                </View>
                
                <View style={styles.footerDivider} />
                
                <View style={styles.footerItem}>
                  <Text style={styles.footerValue}>
                    {Math.round(RADIUS_KM * 1000)}m
                  </Text>
                  <Text style={styles.footerLabel}>radius</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Empty state poetic message */}
          {isActive && nearby.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>quiet frequency</Text>
              <Text style={styles.emptySubtitle}>
                no one else live right now.{"\n"}
                you're the signal in the dark.
              </Text>
            </View>
          )}
        </Animated.ScrollView>

        {/* Busy overlay */}
        {busy && (
          <View style={styles.busyOverlay}>
            <ActivityIndicator color={RBZ.c2} />
            <Text style={styles.busyText}>{busy}</Text>
          </View>
        )}

        {/* Toast */}
        {toast && (
          <Animated.View style={styles.toast}>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            {toast.sub && <Text style={styles.toastSub}>{toast.sub}</Text>}
          </Animated.View>
        )}

        {/* Modals (preserved with premium styling) */}
        
        {/* Buzz Request Modal */}
        <Modal visible={!!buzzReq} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.buzzModal}>
              <LinearGradient colors={[RBZ.c1, RBZ.c4]} style={styles.buzzHeader}>
                <View>
                  <Text style={styles.buzzTitle}>⚡ Incoming Buzz</Text>
                  <Text style={styles.buzzSubtitle}>someone's interested</Text>
                </View>
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
                  <Ionicons name="close" size={18} color={RBZ.white} />
                </Pressable>
              </LinearGradient>

              <View style={styles.buzzContent}>
                <Pressable
                  onPress={() => {
                    if (!buzzReq?.selfieUrl) return;
                    setPreviewImageUri(buzzReq.selfieUrl);
                    setSelfiePreviewOpen(true);
                  }}
                >
                  <Image
                    source={{ uri: buzzReq?.selfieUrl }}
                    style={styles.buzzAvatar}
                  />
                </Pressable>

                <Text style={styles.buzzName}>
                  {buzzReq?.firstName} {buzzReq?.lastName}
                  {buzzReq?.dob && `, ${getAge(buzzReq.dob)}`}
                </Text>

                <View style={styles.buzzActions}>
                  <Pressable
                    onPress={async () => {
                      try {
                        setBusy("Accepting…");
                        await apiFetch("/microbuzz/buzz", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ toId: buzzReq?.fromId, confirm: true }),
                        });
                      } catch {}
                      setBusy("");
                      setBuzzReq(null);
                    }}
                    style={styles.acceptAction}
                  >
                    <LinearGradient colors={[RBZ.c2, RBZ.c4]} style={styles.actionGradient}>
                      <Ionicons name="heart" size={18} color={RBZ.white} />
                      <Text style={styles.actionText}>Accept</Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    onPress={() => setBuzzReq(null)}
                    style={styles.declineAction}
                  >
                    <Text style={styles.declineText}>Not now</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Selfie Preview Modal */}
        <Modal visible={selfiePreviewOpen} transparent animationType="fade">
          <Pressable
            style={styles.previewOverlay}
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
          <View style={styles.cameraOverlay}>
            <View style={[styles.cameraSheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
              <View style={styles.cameraHeader}>
                <Text style={styles.cameraTitle}>Your Presence Selfie</Text>
                <Pressable 
                  onPress={() => setCameraOpen(false)}
                  style={styles.cameraClose}
                >
                  <Ionicons name="close" size={22} color={RBZ.white} />
                </Pressable>
              </View>

              {!camPerm?.granted ? (
                <View style={styles.permissionContainer}>
                  <Ionicons name="camera-outline" size={48} color={RBZ.c2} />
                  <Text style={styles.permissionText}>Camera access needed</Text>
                  <Pressable onPress={requestCamPerm} style={styles.permissionBtn}>
                    <LinearGradient colors={[RBZ.c2, RBZ.c4]} style={styles.permissionGradient}>
                      <Text style={styles.permissionBtnText}>Grant Access</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.cameraContainer}>
                  <CameraView 
                    ref={cameraRef} 
                    style={styles.cameraView} 
                    facing="front"
                  />

                  <View style={styles.cameraControls}>
                    <Pressable
                      onPress={async () => {
                        try {
                          const pic = await (cameraRef.current as any)?.takePictureAsync?.({
                            quality: 0.8,
                            skipProcessing: true,
                            mirror: false,
                          });

                          if (pic?.uri) {
                            setMySelfieLocalUri(pic.uri);
                            setSelfieUrl("");
                            selfieUrlRef.current = "";
                            setCameraOpen(false);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            setToast({ title: "Selfie saved", sub: "Now go live" });
                            setTimeout(() => setToast(null), 1400);
                          }
                        } catch {}
                      }}
                      style={styles.captureBtn}
                    >
                      <LinearGradient colors={[RBZ.c2, RBZ.c4]} style={styles.captureGradient}>
                        <Ionicons name="radio-button-on" size={30} color={RBZ.white} />
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Match Celebrate Overlay */}
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
  safe: {
    flex: 1,
    backgroundColor: RBZ.soft,
  },
  container: {
    flex: 1,
    backgroundColor: RBZ.soft,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: RBZ.c1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: RBZ.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: RBZ.glass2,
  },
  headerCenter: {
    flex: 1,
  },
  title: {
    color: RBZ.white,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  subtitle: {
    color: RBZ.glass2,
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Presence Card
  presenceCard: {
    backgroundColor: RBZ.white,
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: RBZ.ink,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  presenceRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  presenceOrbContainer: {
    position: "relative",
  },
  presenceOrbGlow: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 4,
    backgroundColor: "rgba(216,52,95,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(216,52,95,0.35)",
  },
  presenceOrbGradient: {
    flex: 1,
    borderRadius: 44,
    overflow: "hidden",
  },
  presenceImage: {
    width: "100%",
    height: "100%",
  },
  presenceEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
  },
  presenceEmptyText: {
    color: RBZ.white,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: 0.3,
  },
  liveBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  liveBadgeInner: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RBZ.white,
  },
  liveBadgeText: {
    color: RBZ.white,
    fontSize: 9,
    fontWeight: "900",
  },
  presenceInfo: {
    flex: 1,
  },
  presenceTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: RBZ.ink,
    marginBottom: 8,
  },
  presenceMetrics: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricText: {
    fontSize: 13,
    fontWeight: "600",
    color: RBZ.gray,
  },
  metricDivider: {
    width: 1,
    height: 12,
    backgroundColor: RBZ.glass,
    marginHorizontal: 8,
  },
  presenceBar: {
    height: 4,
    backgroundColor: RBZ.glass,
    borderRadius: 2,
    overflow: "hidden",
  },
  presenceBarFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 16,
  },
  stopBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
  },
  stopBtnGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: RBZ.glass2,
  },
  stopBtnText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 16,
  },
  secondaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: RBZ.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: RBZ.glass2,
  },

  // Tip
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: RBZ.glass,
    borderRadius: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: RBZ.glass2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: RBZ.c2,
  },

  // Radar
  radarWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  radarCard: {
    borderRadius: 32,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RBZ.glass2,
  },
  radar: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.ink,
    overflow: "hidden",
  },
  particleField: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: RBZ.white,
  },
  radarRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RBZ.ring,
  },
  ringOuter: {
    width: "96%",
    height: "96%",
  },
  ringMiddle: {
    width: "68%",
    height: "68%",
  },
  ringInner: {
    width: "40%",
    height: "40%",
  },
  heatGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  sweep: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  sweepBeam: {
    position: "absolute",
    left: "50%",
    top: 0,
    width: "50%",
    height: "50%",
    transform: [{ translateX: -1 }],
  },
  centerPulse: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  centerCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: RBZ.white,
  },
  userCapsule: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  userGlow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    backgroundColor: RBZ.glow,
  },
  userImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: RBZ.white,
  },
  userDistance: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: RBZ.ink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RBZ.white,
  },
  userDistanceText: {
    color: RBZ.white,
    fontSize: 9,
    fontWeight: "800",
  },
  userActiveDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: RBZ.c3,
    borderWidth: 1,
    borderColor: RBZ.white,
  },
  radarLock: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  radarLockInner: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  radarLockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: RBZ.glass,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: RBZ.glass2,
  },
  radarLockText: {
    color: RBZ.white,
    fontWeight: "800",
    fontSize: 13,
  },
  radarFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: RBZ.glass2,
  },
  footerItem: {
    alignItems: "center",
    flex: 1,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: "900",
    color: RBZ.white,
  },
  footerLabel: {
    fontSize: 11,
    color: RBZ.gray,
    marginTop: 2,
    fontWeight: "600",
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: RBZ.glass2,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: RBZ.ink,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: RBZ.gray,
    textAlign: "center",
    lineHeight: 18,
  },

  // Busy overlay
  busyOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 30,
    padding: 16,
    borderRadius: 20,
    backgroundColor: RBZ.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: RBZ.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  busyText: {
    fontWeight: "700",
    color: RBZ.ink,
    fontSize: 14,
  },

  // Toast
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 30,
    padding: 16,
    borderRadius: 20,
    backgroundColor: RBZ.ink,
    borderWidth: 1,
    borderColor: RBZ.glass2,
  },
  toastTitle: {
    color: RBZ.white,
    fontWeight: "800",
    fontSize: 14,
  },
  toastSub: {
    color: RBZ.glass2,
    marginTop: 4,
    fontSize: 12,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11,11,16,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  buzzModal: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: RBZ.white,
  },
  buzzHeader: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buzzTitle: {
    color: RBZ.white,
    fontSize: 18,
    fontWeight: "900",
  },
  buzzSubtitle: {
    color: RBZ.glass2,
    fontSize: 13,
    marginTop: 2,
  },
  ignoreBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: RBZ.glass,
    alignItems: "center",
    justifyContent: "center",
  },
  buzzContent: {
    padding: 24,
    alignItems: "center",
  },
  buzzAvatar: {
    width: 120,
    height: 120,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: RBZ.c3,
  },
  buzzName: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "900",
    color: RBZ.ink,
  },
  buzzActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
  },
  acceptAction: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 14,
  },
  declineAction: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: RBZ.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: {
    color: RBZ.white,
    fontWeight: "700",
    fontSize: 14,
  },

  // Preview modal
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(11,11,16,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "90%",
    height: "70%",
    borderRadius: 24,
  },

  // Camera modal
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(11,11,16,0.7)",
    justifyContent: "flex-end",
  },
  cameraSheet: {
    backgroundColor: RBZ.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  cameraHeader: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: RBZ.c1,
  },
  cameraTitle: {
    color: RBZ.white,
    fontSize: 16,
    fontWeight: "900",
  },
  cameraClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: RBZ.glass,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionContainer: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: "700",
    color: RBZ.ink,
  },
  permissionBtn: {
    width: "100%",
    height: 50,
    borderRadius: 16,
    overflow: "hidden",
  },
  permissionGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionBtnText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 15,
  },
  cameraContainer: {
    padding: 16,
  },
  cameraView: {
    width: "100%",
    height: 360,
    borderRadius: 24,
    overflow: "hidden",
  },
  cameraControls: {
    marginTop: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  captureBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
  },
  captureGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Utility
  unmirror: {
    transform: [{ scaleX: -1 }],
  },
});
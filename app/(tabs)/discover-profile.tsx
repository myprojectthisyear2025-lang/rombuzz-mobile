/**
 * ============================================================================
 * 📁 File: app/(tabs)/discover-profile.tsx
 * 🎯 Screen: RomBuzz — Discover Profile (READ-ONY, PRE-MATCH)
 *
 * Purpose:
 *  - Shown when user taps Profile from Discover
 *  - NOT editable
 *  - NOT matched-only
 *  - High-signal profile preview
 *
 * Backend:
 *  - GET /api/users/:id
 *  - Uses preview payload first, hydrates safely
 *
 * ============================================================================
 */

import RBZImageViewer from "@/src/components/media/RBZImageViewer";
import { API_BASE } from "@/src/config/api";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  bg: "#f8fafc",
  card: "#ffffff",
  soft: "#f8fafc",
  line: "rgba(17,24,39,0.08)",
};

function pickPublicFields(u: any) {
  if (!u) return {};
  return {
    // core
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    name: u.name,
    dob: u.dob,
    avatar: u.avatar,
    bio: u.bio,
    city: u.city,
    gender: u.gender,
    orientation: u.orientation,
    height: u.height,
    lookingFor: u.lookingFor,
    interests: u.interests,
    hobbies: u.hobbies,
        media: u.media,
    photos: u.photos,
    distanceMeters: u.distanceMeters,
    distanceUnit: u.distanceUnit,
    distanceValue: u.distanceValue,
    distanceText: u.distanceText,
    distanceSource: u.distanceSource,
    isOnline: u.isOnline,
    favorites: u.favorites,
    voiceIntro: u.voiceIntro,

    // ✅ visibility controls (IMPORTANT)
    visibilityMode: u.visibilityMode,          // "public" | "matches" | "hidden"
    fieldVisibility: u.fieldVisibility,        // { fieldName: "public" | "matches" | "hidden" }

    // ✅ fields you requested (show only if public + exists)
    pronouns: u.pronouns,
    country: u.country,
    hometown: u.hometown,
    travelMode: u.travelMode,

    relationshipStyle: u.relationshipStyle,
    bodyType: u.bodyType,
    fitnessLevel: u.fitnessLevel,
    smoking: u.smoking,
    drinking: u.drinking,
    workoutFrequency: u.workoutFrequency,
    diet: u.diet,
    sleepSchedule: u.sleepSchedule,

    educationLevel: u.educationLevel,
    school: u.school,
    jobTitle: u.jobTitle,
    company: u.company,
    languages: u.languages,

    religion: u.religion,
    politicalViews: u.politicalViews,
    zodiac: u.zodiac,

    favoriteMusic: u.favoriteMusic,
    favoriteMovies: u.favoriteMovies,
    travelStyle: u.travelStyle,
    petsPreference: u.petsPreference,

    likes: u.likes,
    dislikes: u.dislikes,
  };
}

function hasValue(v: any) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "boolean") return v === true;
  return true;
}

function toText(v: any) {
  if (!hasValue(v)) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "boolean") return v ? "Yes" : "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  return String(v);
}

function showField(u: any, field: string, value: any) {
  if (!hasValue(value)) return false;

  if (u?.visibilityMode === "hidden") return false;

  const vis = u?.fieldVisibility?.[field];

  if (!vis || vis === "public") return true;
  if (vis === "matches") return false;

  return false;
}

function normalizeImageUrl(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function getImageUrlFromEntry(entry: any) {
  if (typeof entry === "string") return normalizeImageUrl(entry);
  return normalizeImageUrl(entry?.url);
}

function getMediaVisibility(entry: any) {
  return String(entry?.privacy || entry?.scope || "").toLowerCase().trim();
}

function getMediaCaption(entry: any) {
  return String(entry?.caption || "").toLowerCase().trim();
}

function isDiscoverSafeMediaEntry(entry: any) {
  const url = getImageUrlFromEntry(entry);
  if (!url) return false;

  const visibility = getMediaVisibility(entry);
  const caption = getMediaCaption(entry);
  const type = String(entry?.type || entry?.mediaType || "").toLowerCase().trim();

  if (
    visibility === "private" ||
    visibility === "matches" ||
    visibility === "matched-only" ||
    visibility === "hidden" ||
    visibility === "specific"
  ) {
    return false;
  }

  if (caption.includes("scope:private")) return false;
  if (caption.includes("scope:matches")) return false;
  if (caption.includes("scope:matched")) return false;
  if (caption.includes("privacy:private")) return false;
  if (caption.includes("privacy:matches")) return false;
  if (caption.includes("kind:reel")) return false;
  if (type === "video") return false;

  return true;
}


export default function DiscoverProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    id: string;
    preview?: string;
    returnTo?: string;
    source?: string;
  }>();

  const userId = String(params.id || "");
  const returnTo = params.returnTo
    ? decodeURIComponent(String(params.returnTo))
    : "/(tabs)/discover";

const previewUser = params.preview
  ? JSON.parse(decodeURIComponent(String(params.preview)))
  : null;


const [user, setUser] = useState<any>(previewUser || null);
const [loading, setLoading] = useState(!previewUser);


  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState<{
    likedByMe: boolean;
    likedMe: boolean;
    matched: boolean;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const actionSwipeX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
const [viewerOpen, setViewerOpen] = useState(false);
const [viewerIndex, setViewerIndex] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

   const age = useMemo(() => {
    if (!user?.dob) return null;
    const d = new Date(user.dob);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a;
  }, [user?.dob]);

  const displayName = useMemo(() => {
    const backendName = typeof user?.name === "string" ? user.name.trim() : "";
    if (backendName) return backendName;

    const first = typeof user?.firstName === "string" ? user.firstName.trim() : "";
    const last = typeof user?.lastName === "string" ? user.lastName.trim() : "";
    const full = [first, last].filter(Boolean).join(" ").trim();

    return full || "Rombuzz user";
  }, [user?.firstName, user?.lastName, user?.name]);

const distanceText = useMemo(() => {
  const source = String(user?.distanceSource || "").trim();

  // Only show distance if backend calculated it from fresh phone GPS.
  // This prevents stale/random saved-location distances like 1277km.
  if (source !== "fresh_gps") return "";

  if (typeof user?.distanceText === "string" && user.distanceText.trim()) {
    return user.distanceText.trim();
  }

  return "";
}, [user]);


  const voiceUrl = useMemo(() => {
    if (!user) return "";
    if (user.voiceIntro) return user.voiceIntro;
    if (Array.isArray(user.favorites)) {
      const v = user.favorites.find((f: string) => f.startsWith("voice:"));
      return v ? v.replace("voice:", "") : "";
    }
    return "";
  }, [user]);

 const photos: string[] = useMemo(() => {
  const set = new Set<string>();
  const avatarUrl = normalizeImageUrl(user?.avatar);

  if (avatarUrl) {
    set.add(avatarUrl);
  }

  if (Array.isArray(user?.media)) {
    user.media.forEach((m: any) => {
      if (!isDiscoverSafeMediaEntry(m)) return;
      const url = getImageUrlFromEntry(m);
      if (url) set.add(url);
    });
  }

  if (Array.isArray(user?.photos)) {
    user.photos.forEach((p: any) => {
      if (typeof p !== "string" && !isDiscoverSafeMediaEntry(p)) return;
      const url = getImageUrlFromEntry(p);
      if (url) set.add(url);
    });
  }

  return Array.from(set).slice(0, 9);
}, [user]);

  const heroImage = photos[0] || normalizeImageUrl(user?.avatar);
 const relationshipMode = useMemo(() => {
  if (statusLoading) return "loading";
  if (relationshipStatus?.matched) return "matched";
  if (relationshipStatus?.likedMe) return "incoming";
  if (relationshipStatus?.likedByMe) return "requested";
  return "discover";
}, [relationshipStatus, statusLoading]);

const getFreshViewerCoords = async () => {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      console.warn("Discover profile location permission denied");
      return null;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = Number(pos?.coords?.latitude);
    const lng = Number(pos?.coords?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90) return null;
    if (lng < -180 || lng > 180) return null;

    let country = "";
    let isoCountryCode = "";

    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      const place = Array.isArray(places) ? places[0] : null;
      country = String(place?.country || "").trim();
      isoCountryCode = String(place?.isoCountryCode || "").trim();
    } catch (geoErr) {
      console.warn("Discover profile reverse geocode failed:", geoErr);
    }

    return { lat, lng, country, isoCountryCode };
  } catch (err) {
    console.warn("Fresh discover-profile location failed:", err);
    return null;
  }
};


const loadProfile = async (options?: { showSpinner?: boolean }) => {
  if (!userId) return;

  try {
    if (options?.showSpinner !== false) {
      setLoading(true);
    }

      const storedToken = token || (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";
    if (!storedToken) return;

    if (!token) setToken(storedToken);

    const freshCoords = await getFreshViewerCoords();

    let profileUrl = `${API_BASE}/users/${encodeURIComponent(userId)}`;

       if (freshCoords) {
      const qs = new URLSearchParams({
        lat: String(freshCoords.lat),
        lng: String(freshCoords.lng),
      });

      if (freshCoords.isoCountryCode) {
        qs.set("viewerCountry", freshCoords.isoCountryCode);
      } else if (freshCoords.country) {
        qs.set("viewerCountry", freshCoords.country);
      }

      profileUrl = `${profileUrl}?${qs.toString()}`;

      // Keep saved backend location fresh too, but never block profile loading on this.
      fetch(`${API_BASE}/users/location`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: freshCoords.lat,
          lng: freshCoords.lng,
        }),
      }).catch(() => {});
    }

    const res = await fetch(profileUrl, {
      headers: { Authorization: `Bearer ${storedToken}` },
    });
    const data = await res.json();

    if (data?.user) {
      const next = pickPublicFields(data.user);

      setUser((prev: any) => {
        const mergedMedia = [
          ...(Array.isArray(prev?.media) ? prev.media : []),
          ...(Array.isArray(next?.media) ? next.media : []),
        ];

        const mergedPhotos = [
          ...(Array.isArray(prev?.photos) ? prev.photos : []),
          ...(Array.isArray(next?.photos) ? next.photos : []),
        ];

        const dedupe = (arr: any[]) => {
          const seen = new Set<string>();
          const out: any[] = [];

          for (const x of arr) {
            const k = getImageUrlFromEntry(x);
            if (!k || seen.has(k)) continue;

            seen.add(k);
            out.push(typeof x === "string" ? k : { ...x, url: k });
          }

          return out;
        };

        const base = { ...(prev || {}) };

        Object.entries(next || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)) {
            (base as any)[k] = v;
          }
        });

   return {
  ...base,
  distanceMeters:
    typeof (next as any)?.distanceMeters === "number"
      ? (next as any).distanceMeters
      : null,
  distanceUnit:
    typeof (next as any)?.distanceUnit === "string"
      ? (next as any).distanceUnit
      : "",
  distanceValue:
    typeof (next as any)?.distanceValue === "number"
      ? (next as any).distanceValue
      : null,
  distanceText:
    typeof (next as any)?.distanceText === "string"
      ? (next as any).distanceText
      : "",
  distanceSource:
    typeof (next as any)?.distanceSource === "string"
      ? (next as any).distanceSource
      : "",
  media: dedupe(mergedMedia),
  photos: dedupe(mergedPhotos),
};
      });

      setHydrated(true);
    }
  } catch (err) {
    console.warn("Discover profile load failed:", err);
  } finally {
    if (options?.showSpinner !== false) {
      setLoading(false);
    }
  }
};

useEffect(() => {
  if (!userId) return;
  loadProfile({ showSpinner: true });
}, [userId]);


const loadRelationshipStatus = async () => {
  if (!userId) return;

  try {
    setStatusLoading(true);

    const storedToken = token || (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";
    if (!storedToken) return;

    if (!token) setToken(storedToken);

    const res = await fetch(`${API_BASE}/likes/status/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    });

    const data = await res.json().catch(() => null);

    setRelationshipStatus({
      likedByMe: !!data?.likedByMe,
      likedMe: !!data?.likedMe,
      matched: !!data?.matched,
    });
  } catch (err) {
    console.warn("Discover profile status failed:", err);
    setRelationshipStatus({
      likedByMe: false,
      likedMe: false,
      matched: false,
    });
  } finally {
    setStatusLoading(false);
  }
};

useEffect(() => {
  if (!userId) return;
  loadRelationshipStatus();
}, [userId]);

const onRefresh = async () => {
  if (!userId || refreshing) return;

  try {
    setRefreshing(true);

    await Promise.allSettled([
      loadProfile({ showSpinner: false }),
      loadRelationshipStatus(),
    ]);
  } finally {
    setRefreshing(false);
  }
};

const goBackSmart = () => {
  router.replace(returnTo as any);
};

const goToMatchedProfile = () => {
  router.replace(
    `/view-profile?id=${encodeURIComponent(userId)}&returnTo=${encodeURIComponent(returnTo)}` as any
  );
};

const sendMatchRequest = async () => {
  if (!userId || actionLoading) return;

  try {
    setActionLoading(true);

    const storedToken = token || (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";
    if (!storedToken) {
      Alert.alert("Login required", "Please log in again.");
      return;
    }

    if (!token) setToken(storedToken);

    const res = await fetch(`${API_BASE}/likes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${storedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: userId }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (data?.error === "already liked") {
        setRelationshipStatus((prev) => ({
          likedByMe: true,
          likedMe: !!prev?.likedMe,
          matched: !!prev?.matched,
        }));
        return;
      }

      Alert.alert("Could not send request", data?.error || "Please try again.");
      return;
    }

    if (data?.matched) {
      setRelationshipStatus({
        likedByMe: false,
        likedMe: false,
        matched: true,
      });
      goToMatchedProfile();
      return;
    }

    setRelationshipStatus({
      likedByMe: true,
      likedMe: false,
      matched: false,
    });
  } catch (err) {
    console.warn("Send match request failed:", err);
    Alert.alert("Could not send request", "Please try again.");
  } finally {
    setActionLoading(false);
  }
};

const respondToMatchRequest = async (action: "accept" | "reject") => {
  if (!userId || actionLoading) return;

  try {
    setActionLoading(true);

    const storedToken = token || (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";
    if (!storedToken) {
      Alert.alert("Login required", "Please log in again.");
      return;
    }

    if (!token) setToken(storedToken);

    const res = await fetch(`${API_BASE}/likes/respond`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${storedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fromId: userId,
        action,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      Alert.alert("Could not update request", data?.error || "Please try again.");
      return;
    }

    if (action === "accept") {
      setRelationshipStatus({
        likedByMe: false,
        likedMe: false,
        matched: true,
      });
      goToMatchedProfile();
      return;
    }

    setRelationshipStatus({
      likedByMe: false,
      likedMe: false,
      matched: false,
    });
    goBackSmart();
  } catch (err) {
    console.warn("Respond match request failed:", err);
    Alert.alert("Could not update request", "Please try again.");
  } finally {
    setActionLoading(false);
  }
};

const handlePrimaryAction = () => {
  if (relationshipMode === "incoming") {
    respondToMatchRequest("accept");
    return;
  }

  if (relationshipMode === "discover") {
    sendMatchRequest();
    return;
  }

  if (relationshipMode === "matched") {
    goToMatchedProfile();
  }
};

const handleSecondaryAction = () => {
  if (relationshipMode === "incoming") {
    respondToMatchRequest("reject");
    return;
  }

  goBackSmart();
};

const animateSwipeBack = () => {
  Animated.spring(actionSwipeX, {
    toValue: 0,
    friction: 7,
    tension: 80,
    useNativeDriver: true,
  }).start();
};

const animateSwipeOut = (direction: "left" | "right", onDone: () => void) => {
  Animated.timing(actionSwipeX, {
    toValue: direction === "right" ? SCREEN_WIDTH : -SCREEN_WIDTH,
    duration: 160,
    useNativeDriver: true,
  }).start(() => {
    actionSwipeX.setValue(0);
    onDone();
  });
};

const panResponder = useMemo(
  () =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,

      onMoveShouldSetPanResponder: (_, gesture) => {
        if (viewerOpen || actionLoading || relationshipMode === "loading") return false;

        const absX = Math.abs(gesture.dx);
        const absY = Math.abs(gesture.dy);

        return absX > 14 && absX > absY * 1.8;
      },

      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        if (viewerOpen || actionLoading || relationshipMode === "loading") return false;

        const absX = Math.abs(gesture.dx);
        const absY = Math.abs(gesture.dy);

        return absX > 18 && absX > absY * 2;
      },

      onPanResponderGrant: () => {
        actionSwipeX.stopAnimation();
      },

      onPanResponderMove: (_, gesture) => {
        const clamped = Math.max(-130, Math.min(130, gesture.dx));
        actionSwipeX.setValue(clamped);
      },

      onPanResponderRelease: (_, gesture) => {
        const threshold = 70;
        const fastEnough = Math.abs(gesture.vx) > 0.65;
        const farEnough = Math.abs(gesture.dx) > threshold;

        if ((farEnough || fastEnough) && gesture.dx > 0) {
          animateSwipeOut("right", handlePrimaryAction);
          return;
        }

        if ((farEnough || fastEnough) && gesture.dx < 0) {
          animateSwipeOut("left", handleSecondaryAction);
          return;
        }

        animateSwipeBack();
      },

      onPanResponderTerminate: animateSwipeBack,
    }),
  [viewerOpen, actionLoading, relationshipMode, token, userId, returnTo]
);

  const playVoice = async () => {
    try {
      if (!voiceUrl) return;
      if (playing && soundRef.current) {
        await soundRef.current.stopAsync();
        setPlaying(false);
        return;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: voiceUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlaying(true);
      sound.setOnPlaybackStatusUpdate((s: any) => {
        if (s?.didJustFinish) setPlaying(false);
      });
    } catch {}
  };

if (loading && !user) {
  return (
    <View style={[styles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={RBZ.c3} />
    </View>
  );
}



  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={{ color: RBZ.muted }}>Profile unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[RBZ.c1, RBZ.c3, RBZ.c4]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={goBackSmart} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={RBZ.white} />
        </Pressable>

        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

              <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={RBZ.c2}
            colors={[RBZ.c2, RBZ.c3, RBZ.c4]}
          />
        }
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.heroSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: heroImage }}
                style={styles.avatar}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.3)"]}
                style={styles.avatarOverlay}
              />
                       <View style={styles.onlineBadge}>
                <View
                  style={[
                    styles.onlineDot,
                    { backgroundColor: user?.isOnline ? "#22c55e" : "#9ca3af" },
                  ]}
                />
              </View>
            </View>

                <View style={styles.nameContainer}>
              <Text style={styles.name}>
                {displayName}
                {age !== null ? `, ${age}` : ""}
              </Text>
              {distanceText ? (
                <View style={styles.distanceBadge}>
                  <Ionicons name="location-outline" size={12} color={RBZ.muted} />
                  <Text style={styles.distanceText}>{distanceText}</Text>
                </View>
              ) : null}

              {voiceUrl ? (
                <Pressable onPress={playVoice} style={styles.voiceCard}>
                  <LinearGradient
                    colors={[RBZ.c2, RBZ.c3]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.voiceGradient}
                  >
                    <Ionicons
                      name={playing ? "stop" : "play"}
                      size={18}
                      color={RBZ.white}
                    />
                    <Text style={styles.voiceText}>
                      {playing ? "Playing..." : "Voice intro"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              ) : null}
            </View>
          </View>

                         <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.actionCard,
              {
                transform: [
                  {
                    translateX: actionSwipeX,
                  },
                  {
                    rotate: actionSwipeX.interpolate({
                      inputRange: [-130, 0, 130],
                      outputRange: ["-3deg", "0deg", "3deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            {relationshipMode === "loading" ? (
              <View style={styles.actionLoadingRow}>
                <ActivityIndicator size="small" color={RBZ.c2} />
                <Text style={styles.actionHint}>Checking match status...</Text>
              </View>
            ) : relationshipMode === "incoming" ? (
              <>
                <Ionicons name="heart-circle" size={48} color={RBZ.c3} style={styles.actionIcon} />
                <Text style={styles.actionTitle}>
                  {user?.firstName || "This user"} wants to match! 💕
                </Text>
                <Text style={styles.actionHint}>
                  Swipe right to accept • Swipe left to reject
                </Text>

                <View style={styles.actionRow}>
                  <Pressable
                    disabled={actionLoading}
                    onPress={() => respondToMatchRequest("reject")}
                    style={[styles.actionButton, styles.rejectButton, actionLoading && styles.actionDisabled]}
                  >
                    <Ionicons name="close" size={20} color={RBZ.c1} />
                    <Text style={styles.rejectText}>Decline</Text>
                  </Pressable>

                  <Pressable
                    disabled={actionLoading}
                    onPress={() => respondToMatchRequest("accept")}
                    style={[styles.actionButton, styles.acceptButton, actionLoading && styles.actionDisabled]}
                  >
                    <Ionicons name="heart" size={20} color={RBZ.white} />
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>
                </View>
              </>
            ) : relationshipMode === "discover" ? (
              <>
                <Ionicons name="sparkles" size={48} color={RBZ.c3} style={styles.actionIcon} />
                <Text style={styles.actionTitle}>
                  Interested in {user?.firstName || "this profile"}?
                </Text>
                <Text style={styles.actionHint}>
                  Swipe right to send request • Swipe left to skip
                </Text>

                <View style={styles.actionRow}>
                  <Pressable
                    disabled={actionLoading}
                    onPress={goBackSmart}
                    style={[styles.actionButton, styles.skipButton, actionLoading && styles.actionDisabled]}
                  >
                    <Ionicons name="close" size={20} color={RBZ.muted} />
                    <Text style={styles.skipText}>Skip</Text>
                  </Pressable>

                  <Pressable
                    disabled={actionLoading}
                    onPress={sendMatchRequest}
                    style={[styles.actionButton, styles.sendButton, actionLoading && styles.actionDisabled]}
                  >
                    <Ionicons name="heart" size={20} color={RBZ.white} />
                    <Text style={styles.sendText}>Send Request</Text>
                  </Pressable>
                </View>
              </>
            ) : relationshipMode === "requested" ? (
              <>
                <Ionicons name="checkmark-circle" size={48} color={RBZ.c2} style={styles.actionIcon} />
                <Text style={styles.actionTitle}>Request Sent! ✨</Text>
                <Text style={styles.actionHint}>
                  You've sent a match request to {user?.firstName || "this user"}.
                </Text>

                <View style={styles.actionRow}>
                  <Pressable onPress={goBackSmart} style={[styles.actionButton, styles.skipButton]}>
                    <Ionicons name="arrow-back" size={20} color={RBZ.muted} />
                    <Text style={styles.skipText}>Back</Text>
                  </Pressable>

                  <View style={[styles.actionButton, styles.requestedButton]}>
                    <Ionicons name="checkmark-circle" size={20} color={RBZ.c2} />
                    <Text style={styles.requestedText}>Pending</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Ionicons name="people" size={48} color={RBZ.c3} style={styles.actionIcon} />
                <Text style={styles.actionTitle}>
                  You're Matched! 🎉
                </Text>
                <Text style={styles.actionHint}>
                  Tap below to start chatting and view exclusive content.
                </Text>

                         <Pressable
                  disabled={actionLoading}
                  onPress={goToMatchedProfile}
                  style={[styles.actionButton, styles.sendButton, styles.fullActionButton]}
                >
                  <Ionicons name="chatbubbles" size={20} color={RBZ.white} />
                  <Text style={styles.sendText}>Open Chat</Text>
                            </Pressable>
                      </>
            )}
          </Animated.View>

          {user.bio ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About {user.firstName}</Text>
              <Text style={styles.cardText}>{user.bio}</Text>
            </View>
          ) : null}

          {photos.length > 0 && (
            <View style={styles.gallerySection}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <View style={styles.gallery}>
                {photos.map((p, i) => (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setViewerIndex(i);
                      setViewerOpen(true);
                    }}
                    style={styles.galleryItem}
                  >
                    <Image
                      source={{ uri: p }}
                      style={{
                        width: (SCREEN_WIDTH - 48) / 3,
                        height: (SCREEN_WIDTH - 48) / 3,
                      }}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.3)"]}
                      style={styles.galleryOverlay}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Info</Text>

            {showField(user, "pronouns", user.pronouns) && (
              <Info label="Pronouns" value={toText(user.pronouns)} />
            )}
            {showField(user, "city", user.city) && (
              <Info label="City" value={toText(user.city)} />
            )}
            {showField(user, "country", user.country) && (
              <Info label="Country" value={toText(user.country)} />
            )}
            {showField(user, "hometown", user.hometown) && (
              <Info label="Hometown" value={toText(user.hometown)} />
            )}
            {showField(user, "gender", user.gender) && (
              <Info label="Gender" value={toText(user.gender)} />
            )}
            {showField(user, "orientation", user.orientation) && (
              <Info label="Orientation" value={toText(user.orientation)} />
            )}
            {showField(user, "lookingFor", user.lookingFor) && (
              <Info label="Looking for" value={toText(user.lookingFor)} />
            )}
            {showField(user, "relationshipStyle", user.relationshipStyle) && (
              <Info label="Relationship style" value={toText(user.relationshipStyle)} />
            )}
            {showField(user, "height", user.height) && (
              <Info label="Height" value={toText(user.height)} />
            )}
            {showField(user, "travelMode", user.travelMode) && (
              <Info label="Travel mode" value="Available" />
            )}
          </View>

          {(showField(user, "bodyType", user.bodyType) ||
            showField(user, "fitnessLevel", user.fitnessLevel) ||
            showField(user, "smoking", user.smoking) ||
            showField(user, "drinking", user.drinking) ||
            showField(user, "workoutFrequency", user.workoutFrequency) ||
            showField(user, "diet", user.diet) ||
            showField(user, "sleepSchedule", user.sleepSchedule)) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Lifestyle</Text>

              {showField(user, "bodyType", user.bodyType) && (
                <Info label="Body type" value={toText(user.bodyType)} />
              )}
              {showField(user, "fitnessLevel", user.fitnessLevel) && (
                <Info label="Fitness level" value={toText(user.fitnessLevel)} />
              )}
              {showField(user, "smoking", user.smoking) && (
                <Info label="Smoking" value={toText(user.smoking)} />
              )}
              {showField(user, "drinking", user.drinking) && (
                <Info label="Drinking" value={toText(user.drinking)} />
              )}
              {showField(user, "workoutFrequency", user.workoutFrequency) && (
                <Info label="Workout" value={toText(user.workoutFrequency)} />
              )}
              {showField(user, "diet", user.diet) && (
                <Info label="Diet" value={toText(user.diet)} />
              )}
              {showField(user, "sleepSchedule", user.sleepSchedule) && (
                <Info label="Sleep schedule" value={toText(user.sleepSchedule)} />
              )}
            </View>
          )}

          {(showField(user, "educationLevel", user.educationLevel) ||
            showField(user, "school", user.school) ||
            showField(user, "jobTitle", user.jobTitle) ||
            showField(user, "company", user.company) ||
            showField(user, "languages", user.languages)) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Background</Text>

              {showField(user, "educationLevel", user.educationLevel) && (
                <Info label="Education" value={toText(user.educationLevel)} />
              )}
              {showField(user, "school", user.school) && (
                <Info label="School" value={toText(user.school)} />
              )}
              {showField(user, "jobTitle", user.jobTitle) && (
                <Info label="Job title" value={toText(user.jobTitle)} />
              )}
              {showField(user, "company", user.company) && (
                <Info label="Company" value={toText(user.company)} />
              )}
              {showField(user, "languages", user.languages) && (
                <Info label="Languages" value={toText(user.languages)} />
              )}
            </View>
          )}

          {(showField(user, "religion", user.religion) ||
            showField(user, "politicalViews", user.politicalViews) ||
            showField(user, "zodiac", user.zodiac)) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Beliefs & Identity</Text>

              {showField(user, "religion", user.religion) && (
                <Info label="Religion" value={toText(user.religion)} />
              )}
              {showField(user, "politicalViews", user.politicalViews) && (
                <Info label="Political views" value={toText(user.politicalViews)} />
              )}
              {showField(user, "zodiac", user.zodiac) && (
                <Info label="Zodiac" value={toText(user.zodiac)} />
              )}
            </View>
          )}

          {(showField(user, "favoriteMusic", user.favoriteMusic) ||
            showField(user, "favoriteMovies", user.favoriteMovies) ||
            showField(user, "travelStyle", user.travelStyle) ||
            showField(user, "petsPreference", user.petsPreference) ||
            showField(user, "likes", user.likes) ||
            showField(user, "dislikes", user.dislikes)) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Interests & Preferences</Text>

              {showField(user, "favoriteMusic", user.favoriteMusic) && (
                <Info label="Fav music" value={toText(user.favoriteMusic)} />
              )}
              {showField(user, "favoriteMovies", user.favoriteMovies) && (
                <Info label="Fav movies" value={toText(user.favoriteMovies)} />
              )}
              {showField(user, "travelStyle", user.travelStyle) && (
                <Info label="Travel style" value={toText(user.travelStyle)} />
              )}
              {showField(user, "petsPreference", user.petsPreference) && (
                <Info label="Pet preference" value={toText(user.petsPreference)} />
              )}
              {showField(user, "likes", user.likes) && (
                <Info label="Likes" value={toText(user.likes)} />
              )}
              {showField(user, "dislikes", user.dislikes) && (
                <Info label="Dislikes" value={toText(user.dislikes)} />
              )}
            </View>
          )}

          {user.interests?.length ? (
            <ChipSection title="Interests" items={user.interests} />
          ) : null}
          {user.hobbies?.length ? (
            <ChipSection title="Hobbies" items={user.hobbies} />
          ) : null}
        </Animated.View>
      </Animated.ScrollView>

        <RBZImageViewer
        visible={viewerOpen}
        items={photos.map((p, i) => ({
          id: `${user?.id || "discover-user"}-photo-${i}`,
          url: p,
          title: displayName ? `${displayName}'s photo` : "Photo",
        }))}
        initialIndex={viewerIndex}
        title={displayName ? `${displayName}'s photo` : "Photo"}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
      />
    </View>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ChipSection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.chips}>
        {items.map((x, i) => (
          <View key={i} style={styles.chip}>
            <Text style={styles.chipText}>{x}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RBZ.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    color: RBZ.white,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  scrollView: {
    flex: 1,
  },

  heroSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: RBZ.white,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: RBZ.white,
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nameContainer: {
    alignItems: "center",
  },
  name: {
    fontSize: 32,
    fontWeight: "800",
    color: RBZ.ink,
    marginBottom: 8,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(107,114,128,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  distanceText: {
    color: RBZ.muted,
    fontSize: 13,
    fontWeight: "500",
  },

   voiceCard: {
    alignSelf: "center",
    marginTop: 10,
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  voiceGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  voiceText: {
    color: RBZ.white,
    fontWeight: "800",
    fontSize: 12,
  },

  actionCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 24,
    backgroundColor: RBZ.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    alignItems: "center",
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 12,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: RBZ.ink,
    textAlign: "center",
    marginBottom: 8,
  },
  actionHint: {
    fontSize: 13,
    fontWeight: "500",
    color: RBZ.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fullActionButton: {
    marginTop: 8,
    width: "100%",
  },
  rejectButton: {
    backgroundColor: "rgba(177,18,60,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(177,18,60,0.2)",
  },
  acceptButton: {
    backgroundColor: RBZ.c2,
  },
  skipButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  sendButton: {
    backgroundColor: RBZ.c2,
  },
  requestedButton: {
    backgroundColor: "rgba(216,52,95,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(216,52,95,0.2)",
  },
  rejectText: {
    color: RBZ.c1,
    fontWeight: "700",
    fontSize: 16,
  },
  acceptText: {
    color: RBZ.white,
    fontWeight: "800",
    fontSize: 16,
  },
  skipText: {
    color: RBZ.muted,
    fontWeight: "700",
    fontSize: 16,
  },
  sendText: {
    color: RBZ.white,
    fontWeight: "800",
    fontSize: 16,
  },
  requestedText: {
    color: RBZ.c2,
    fontWeight: "800",
    fontSize: 16,
  },
  actionDisabled: {
    opacity: 0.55,
  },

  card: {
    backgroundColor: RBZ.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: RBZ.ink,
  },
  cardText: {
    color: RBZ.ink,
    lineHeight: 22,
    fontSize: 15,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: RBZ.line,
  },
  infoLabel: {
    color: RBZ.muted,
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    color: RBZ.ink,
    fontWeight: "600",
    fontSize: 14,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(233,72,106,0.12)",
    borderRadius: 24,
  },
  chipText: {
    color: RBZ.c2,
    fontSize: 13,
    fontWeight: "600",
  },

  gallerySection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: RBZ.ink,
    marginBottom: 12,
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  galleryItem: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  galleryOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
  },
});
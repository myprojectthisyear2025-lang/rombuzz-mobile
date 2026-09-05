/**
 * ============================================================
 * 📁 File: app/(tabs)/discover.tsx
 * 🎯 Purpose: RomBuzz Mobile — Discover (Swipe Deck)
 *
 * Uses SAME backend endpoints as web:
 *  - GET  `${API_BASE}/discover?...`
 *  - POST `${API_BASE}/likes` body: { to: userId }
 *
 * Notes:
 *  - No backend changes.
 *  - Blur preview respects favorites: "blur:blurred" / "blur:clear"
 *  - Hidden users are already filtered server-side (visibilityMode "hidden")
 * ============================================================
 */

import { API_BASE } from "@/src/config/api";
import { LOOKING_FOR_WITH_ALL } from "@/src/constants/lookingFor";
import {
  relationshipStyleKeyFromValue,
} from "@/src/constants/relationshipStyles";
import {
  loadSavedDiscoverFilters,
  saveDiscoverFilters,
} from "@/src/features/discover/discoverFilterStorage";
import { useCachedDiscoverDeck } from "@/src/features/performance/useCachedDiscoverDeck";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const { width, height } = Dimensions.get("window");

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  black: "#0b0b10",
  soft: "#f7f7fb",
  gray: "#6b7280",
} as const;


function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function computeAge(dob: any) {
  if (!dob) return null;
  try {
    const raw = String(dob).trim();
    let d: Date;

    // mm/dd/yyyy
    if (raw.includes("/")) {
      const parts = raw.split(/[\/\-]/).map((x) => parseInt(x, 10));
      if (parts.length !== 3) return null;
      const [m, day, y] = parts;
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(raw);
    }

    if (Number.isNaN(d.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const mm = now.getMonth() - d.getMonth();
    if (mm < 0 || (mm === 0 && now.getDate() < d.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}

function getBlurMode(u: any) {
  const favorites = u?.favorites;
  if (Array.isArray(favorites)) {
    const tag = favorites.find((f: any) => typeof f === "string" && f.startsWith("blur:"));
    if (tag === "blur:blurred") return "blurred";
    if (tag === "blur:clear") return "clear";
  }
  return "clear";
}
function normalizeImageUrl(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function getImageUrlFromEntry(entry: any) {
  if (typeof entry === "string") return normalizeImageUrl(entry);

  return normalizeImageUrl(
    entry?.url ||
      entry?.mediaUrl ||
      entry?.fileUrl ||
      entry?.secureUrl ||
      entry?.secure_url ||
      entry?.src ||
      entry?.imageUrl ||
      entry?.photoUrl ||
      entry?.videoUrl ||
      ""
  );
}

function getMediaVisibility(entry: any) {
  return String(entry?.privacy || entry?.visibility || entry?.scope || "")
    .toLowerCase()
    .trim();
}

function getMediaCaption(entry: any) {
  return String(entry?.caption || entry?.text || entry?.description || "")
    .toLowerCase()
    .trim();
}

function isDiscoverSafeMediaEntry(entry: any) {
  if (typeof entry === "string") return !!normalizeImageUrl(entry);

  const url = getImageUrlFromEntry(entry);
  if (!url) return false;

  const visibility = getMediaVisibility(entry);
  const caption = getMediaCaption(entry);
  const type = String(entry?.type || entry?.mediaType || "")
    .toLowerCase()
    .trim();

  if (
    visibility === "private" ||
    visibility === "matches" ||
    visibility === "matched" ||
    visibility === "matched-only" ||
    visibility === "matched_only" ||
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
  if (caption.includes("privacy:matched")) return false;
  if (caption.includes("kind:reel")) return false;
  if (caption.includes("kind:video")) return false;
  if (type === "video" || type === "reel") return false;

  return true;
}

function extractUserImageUrls(user: any): string[] {
  if (!user) return [];

  const seen = new Set<string>();
  const urls: string[] = [];

  const pushUrl = (value: any) => {
    const url = normalizeImageUrl(value);
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };

  // Avatar is allowed as the fallback/hero Discover image.
  pushUrl(user.avatar);

  if (Array.isArray(user.media)) {
    user.media.forEach((m: any) => {
      if (!isDiscoverSafeMediaEntry(m)) return;
      pushUrl(getImageUrlFromEntry(m));
    });
  }

  if (Array.isArray(user.photos)) {
    user.photos.forEach((p: any) => {
      if (!isDiscoverSafeMediaEntry(p)) return;
      pushUrl(getImageUrlFromEntry(p));
    });
  }

  return urls;
}

function getUserImages(user: any): string[] {
  const urls = extractUserImageUrls(user).slice(0, 6);
  return urls.length ? urls : ["https://picsum.photos/700/900"];
}

function getImageUri(user: any): string {
  return getUserImages(user)[0] || "https://picsum.photos/700/900";
}

type DiscoverFilters = {
  rangeMiles: number;
  ageMin: number;
  ageMax: number;
  gender: string;
  lookingFor: string[];
  vibe: string[];
  relationshipStyle: string[];
  bodyType: string[];
  fitnessLevel: string[];
  smoking: string[];
  drinking: string[];
  workoutFrequency: string[];
  diet: string[];
  sleepSchedule: string[];
  educationLevel: string[];
  travelStyle: string[];
  petsPreference: string[];
  zodiac: string[];
  loveLanguage: string[];
  interest: string[];
  onlineOnly: boolean;
  verifiedOnly: boolean;
  photosOnly: boolean;
};

const DEFAULT_DISCOVER_FILTERS: DiscoverFilters = {
  rangeMiles: 25,
  ageMin: 21,
  ageMax: 35,
  gender: "",
  lookingFor: [],
  vibe: [],
  relationshipStyle: [],
  bodyType: [],
  fitnessLevel: [],
  smoking: [],
  drinking: [],
  workoutFrequency: [],
  diet: [],
  sleepSchedule: [],
  educationLevel: [],
  travelStyle: [],
  petsPreference: [],
  zodiac: [],
  loveLanguage: [],
  interest: [],
  onlineOnly: false,
  verifiedOnly: false,
  photosOnly: true,
};

function normalizeDiscoverFilterState(
  value: Partial<DiscoverFilters> | null | undefined
): DiscoverFilters {
  const merged: DiscoverFilters = {
    ...DEFAULT_DISCOVER_FILTERS,
    ...(value || {}),
  };

  const relationshipStyle = relationshipStyleKeyFromValue(
    Array.isArray(merged.relationshipStyle)
      ? merged.relationshipStyle[0]
      : ""
  );

  return {
    ...merged,
    relationshipStyle: relationshipStyle
      ? [relationshipStyle]
      : [],
    // Travel Style is legacy/web-only now.
    travelStyle: [],
  };
}

function parseDiscoverFilters(raw: unknown): DiscoverFilters {
  if (typeof raw !== "string" || !raw.trim()) {
    return normalizeDiscoverFilterState(
      DEFAULT_DISCOVER_FILTERS
    );
  }

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);

    return normalizeDiscoverFilterState(
      parsed && typeof parsed === "object"
        ? parsed
        : {}
    );
  } catch {
    return normalizeDiscoverFilterState(
      DEFAULT_DISCOVER_FILTERS
    );
  }
}

function hasAnyActiveFilter(filters: DiscoverFilters, topLookingFor: string) {
  return !!(
    topLookingFor ||
    filters.gender ||
    filters.vibe.length ||
    filters.relationshipStyle.length ||
    filters.bodyType.length ||
    filters.fitnessLevel.length ||
    filters.smoking.length ||
    filters.drinking.length ||
    filters.workoutFrequency.length ||
    filters.diet.length ||
    filters.sleepSchedule.length ||
    filters.educationLevel.length ||
    filters.travelStyle.length ||
    filters.petsPreference.length ||
    filters.zodiac.length ||
    filters.loveLanguage.length ||
    filters.interest.length ||
    filters.onlineOnly ||
    filters.verifiedOnly ||
    filters.ageMin !== DEFAULT_DISCOVER_FILTERS.ageMin ||
    filters.ageMax !== DEFAULT_DISCOVER_FILTERS.ageMax ||
    filters.rangeMiles !== DEFAULT_DISCOVER_FILTERS.rangeMiles
  );
}

function buildExpandedFilters(filters: DiscoverFilters): DiscoverFilters {
  return {
    ...filters,

    // ✅ HARD filters stay untouched:
    // rangeMiles, ageMin, ageMax, gender, onlineOnly, verifiedOnly, photosOnly

    // ✅ SOFT filters are relaxed only after user taps "Expand Search"
    lookingFor: [],
    vibe: [],
    relationshipStyle: [],
    bodyType: [],
    fitnessLevel: [],
    smoking: [],
    drinking: [],
    workoutFrequency: [],
    diet: [],
    sleepSchedule: [],
    educationLevel: [],
    travelStyle: [],
    petsPreference: [],
    zodiac: [],
    loveLanguage: [],
    interest: [],
  };
}

function applyClientOnlyFilters(list: any[], filters: DiscoverFilters) {
  return list.filter((u) => {
    if (filters.photosOnly) {
      if (extractUserImageUrls(u).length === 0) return false;
    }

    const age = computeAge(u?.dob);
    if (age != null) {
      if (age < filters.ageMin || age > filters.ageMax) return false;
    }

    return true;
  });
}

function getUserStableId(user: any) {
  return String(user?.id || user?._id || "").trim();
}

function sameUserOrder(a: any[], b: any[]) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  return a.every((item, index) => {
    const left = getUserStableId(item);
    const right = getUserStableId(b[index]);
    return !!left && left === right;
  });
}

function keepVisibleCardStable(prev: any[], fresh: any[]) {
  if (!Array.isArray(prev) || prev.length === 0) return fresh;
  if (!Array.isArray(fresh) || fresh.length === 0) return fresh;

  if (sameUserOrder(prev, fresh)) return prev;

  const currentId = getUserStableId(prev[0]);
  if (!currentId) return fresh;

  const freshCurrent = fresh.find((u) => getUserStableId(u) === currentId);
  if (!freshCurrent) return fresh;

  const rest = fresh.filter((u) => getUserStableId(u) !== currentId);
  return [freshCurrent, ...rest];
}

export default function DiscoverSwipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ discoverFilters?: string }>();

  const hasIncomingFilters =
    typeof params.discoverFilters === "string" &&
    params.discoverFilters.trim().length > 0;

  const headerTopPadding =
    Platform.OS === "ios" ? 8 : Math.max(insets.top, 8) + 6;

  const parsedFilters = useMemo(
    () => parseDiscoverFilters(params.discoverFilters),
    [params.discoverFilters]
  );


// ================================
// 🔥 Rombuzz-style swipe engine
// ================================
const translateX = useSharedValue(0);
const translateY = useSharedValue(0);
const rotateZ = useSharedValue(0);

const SWIPE_THRESHOLD = width * 0.25;

const animatedCardStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: translateX.value },
    { translateY: translateY.value },
    { rotateZ: `${rotateZ.value}deg` },
  ],
}));

const likeOpacity = useAnimatedStyle(() => ({
  opacity: interpolate(
    translateX.value,
    [0, width * 0.25],
    [0, 1],
    Extrapolate.CLAMP
  ),
}));

const nopeOpacity = useAnimatedStyle(() => ({
  opacity: interpolate(
    translateX.value,
    [-width * 0.25, 0],
    [1, 0],
    Extrapolate.CLAMP
  ),
}));

const nextScale = useAnimatedStyle(() => ({
  transform: [
    {
      scale: interpolate(
        translateX.value,
        [-width * 0.5, 0, width * 0.5],
        [0.98, 0.94, 0.98],
        Extrapolate.CLAMP
      ),
    },
  ],
}));

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const usersRef = useRef<any[]>([]);
  const current = users[0] || null;

  // ✅ LookingFor filter ("All" = empty string)
  const [filterLookingFor, setFilterLookingFor] = useState<string>("");

  const [appliedFilters, setAppliedFilters] =
    useState<DiscoverFilters>(parsedFilters);

  // Prevent Discover from loading default profiles before saved filters restore.
  const [filtersReady, setFiltersReady] =
    useState<boolean>(hasIncomingFilters);

  // ✅ strict = exact filters. fallback = user manually expanded soft filters.
  const [phase, setPhase] = useState<"strict" | "fallback">("strict");
  const [expandedSearch, setExpandedSearch] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [quietRefreshing, setQuietRefreshing] = useState(false);
  const [buzzing, setBuzzing] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // “reveal” controls blurRadius for blurred profiles (tap/drag reveals)
  const [reveal, setReveal] = useState(0);

  const {
    hydrateCachedDiscoverDeck,
    saveCachedDiscoverDeck,
    preloadDiscoverImages,
  } = useCachedDiscoverDeck();

  const discoverCacheInput = useMemo(
    () => ({
      filters: appliedFilters as Record<string, any>,
      lookingFor: expandedSearch || phase === "fallback" ? "" : filterLookingFor,
      phase,
      expanded: expandedSearch || phase === "fallback",
    }),
    [appliedFilters, expandedSearch, filterLookingFor, phase]
  );

  const persistDiscoverDeck = useCallback(
    (nextUsers: any[]) => {
      saveCachedDiscoverDeck(discoverCacheInput, nextUsers);
      preloadDiscoverImages(nextUsers);
    },
    [discoverCacheInput, preloadDiscoverImages, saveCachedDiscoverDeck]
  );

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    let alive = true;

    const restoreFilters = async () => {
      setFiltersReady(false);

      // Filters just applied from the Filter screen always win.
      if (hasIncomingFilters) {
        setAppliedFilters(parsedFilters);
        setFilterLookingFor(
          parsedFilters.lookingFor.length > 0
            ? parsedFilters.lookingFor[0]
            : ""
        );
        setPhase("strict");
        setExpandedSearch(false);
        setFiltersReady(true);
        return;
      }

      // App restart / fresh Discover visit:
      // restore this user's latest saved filters.
      const saved = normalizeDiscoverFilterState(
        await loadSavedDiscoverFilters<DiscoverFilters>(
          DEFAULT_DISCOVER_FILTERS
        )
      );

      if (!alive) return;

      setAppliedFilters(saved);
      setFilterLookingFor(
        Array.isArray(saved.lookingFor) &&
        saved.lookingFor.length > 0
          ? saved.lookingFor[0]
          : ""
      );
      setPhase("strict");
      setExpandedSearch(false);
      setFiltersReady(true);
    };

    restoreFilters();

    return () => {
      alive = false;
    };
  }, [hasIncomingFilters, parsedFilters]);

  useEffect(() => {
    if (!filtersReady) return;

    let alive = true;

    const hydrateDeckBeforeNetwork = async () => {
      const cached = await hydrateCachedDiscoverDeck(discoverCacheInput);

      if (!alive || !cached.hit) return;

      setUsers(cached.users);
      setReveal(0);
      setPhotoIndex(0);
      setLoading(false);
      preloadDiscoverImages(cached.users);
    };

    hydrateDeckBeforeNetwork();

    return () => {
      alive = false;
    };
  }, [
    discoverCacheInput,
    filtersReady,
    hydrateCachedDiscoverDeck,
    preloadDiscoverImages,
  ]);

  const authHeaders = useCallback(async () => {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");

    if (!token) {
      throw new Error("AUTH_MISSING");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }, []);

   const getFreshDeviceCoords = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        console.warn("📍 Discover GPS permission denied");
        return null;
      }

      // Do not let a slow GPS lock Discover on refresh.
      // Prefer fresh coordinates, but fall back to a recent cached device location.
      const freshPosition = await Promise.race<any>([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 3500);
        }),
      ]);

      const position =
        freshPosition ||
        (await Location.getLastKnownPositionAsync({
          maxAge: 10 * 60 * 1000,
          requiredAccuracy: 10000,
        }));

      if (!position) {
        console.warn("📍 Discover GPS timed out with no last known location");
        return null;
      }

      const lat = Number(position?.coords?.latitude);
      const lng = Number(position?.coords?.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (lat < -90 || lat > 90) return null;
      if (lng < -180 || lng > 180) return null;

      let country = "";
      let isoCountryCode = "";

      try {
        const places = await Promise.race<any>([
          Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lng,
          }),
          new Promise<any[]>((resolve) => {
            setTimeout(() => resolve([]), 1500);
          }),
        ]);

        const place = Array.isArray(places) ? places[0] : null;
        country = String(place?.country || "").trim();
        isoCountryCode = String(place?.isoCountryCode || "").trim();
      } catch (geoErr) {
        console.warn("📍 Discover reverse geocode failed:", geoErr);
      }

      return { lat, lng, country, isoCountryCode };
    } catch (err) {
      console.warn("📍 Discover GPS read failed:", err);
      return null;
    }
  }, []);

    const fetchDiscover = useCallback(
    async (override?: {
      lookingFor?: string;
      phase?: "strict" | "fallback";
      expanded?: boolean;
      withFreshCoords?: boolean;
      silent?: boolean;
    }) => {
      let hadUsableCache = false;
      const silent = !!override?.silent;

      // Once cached users are available, the remaining network work
      // becomes a quiet background refresh instead of blocking the deck.
      let backgroundRefresh = silent;

      if (backgroundRefresh) {
        setQuietRefreshing(true);
      }

      try {
        const lookingFor =
          typeof override?.lookingFor === "string"
            ? override.lookingFor
            : filterLookingFor;

        const nextPhase =
          override?.phase === "fallback" || override?.phase === "strict"
            ? override.phase
            : phase;

              const shouldExpand =
          typeof override?.expanded === "boolean"
            ? override.expanded
            : expandedSearch;

        const effective =
          shouldExpand || nextPhase === "fallback"
            ? buildExpandedFilters(appliedFilters)
            : appliedFilters;

        const effectiveLookingFor =
          shouldExpand || nextPhase === "fallback" ? "" : lookingFor;

              const requestCacheInput = {
          filters: effective as Record<string, any>,
          lookingFor: effectiveLookingFor,
          phase: nextPhase,
          expanded: shouldExpand || nextPhase === "fallback",
        };

        if (!silent) {
          setMessage("");
        }

        const cached = await hydrateCachedDiscoverDeck(requestCacheInput);

        if (cached.hit) {
          hadUsableCache = true;
          backgroundRefresh = true;

          // Show the small cached deck immediately.
          setUsers(cached.users);
          setReveal(0);
          setPhotoIndex(0);
          setLoading(false);
          setQuietRefreshing(true);
          preloadDiscoverImages(cached.users);
        } else if (!silent) {
          setLoading(true);
        }

        const qs = new URLSearchParams();

        if (effectiveLookingFor) qs.set("lookingFor", effectiveLookingFor);
        if (nextPhase) qs.set("phase", nextPhase);

        if (effective.rangeMiles > 0) {
          qs.set("range", String(Math.round(effective.rangeMiles * 1609.34)));
        }

        if (effective.gender) qs.set("gender", effective.gender);
        if (effective.onlineOnly) qs.set("online", "active");
        if (effective.verifiedOnly) qs.set("verified", "true");

        if (effective.vibe[0]) qs.set("vibe", effective.vibe[0]);
        if (effective.zodiac[0]) qs.set("zodiac", effective.zodiac[0]);
        if (effective.loveLanguage[0]) qs.set("love", effective.loveLanguage[0]);
        if (effective.interest[0]) qs.set("interest", effective.interest[0]);

        if (effective.relationshipStyle[0]) {
          qs.set("relationshipStyle", effective.relationshipStyle[0]);
        }
        if (effective.bodyType[0]) qs.set("bodyType", effective.bodyType[0]);
        if (effective.fitnessLevel[0]) {
          qs.set("fitnessLevel", effective.fitnessLevel[0]);
        }
        if (effective.smoking[0]) qs.set("smoking", effective.smoking[0]);
        if (effective.drinking[0]) qs.set("drinking", effective.drinking[0]);
        if (effective.workoutFrequency[0]) {
          qs.set("workoutFrequency", effective.workoutFrequency[0]);
        }
        if (effective.diet[0]) qs.set("diet", effective.diet[0]);
        if (effective.sleepSchedule[0]) {
          qs.set("sleepSchedule", effective.sleepSchedule[0]);
        }
        if (effective.educationLevel[0]) {
          qs.set("educationLevel", effective.educationLevel[0]);
        }
        if (effective.petsPreference[0]) {
          qs.set("petsPreference", effective.petsPreference[0]);
        }

        if (override?.withFreshCoords === true) {
          const freshCoords = await getFreshDeviceCoords();

          if (freshCoords) {
            qs.set("lat", String(freshCoords.lat));
            qs.set("lng", String(freshCoords.lng));

            if (freshCoords.isoCountryCode) {
              qs.set("viewerCountry", freshCoords.isoCountryCode);
            } else if (freshCoords.country) {
              qs.set("viewerCountry", freshCoords.country);
            }
          }
        }

        const headers = await authHeaders();
        const res = await fetch(`${API_BASE}/discover?${qs.toString()}`, {
          headers,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.error || "discover_failed";

          if (res.status === 401 || msg.toLowerCase().includes("token")) {
            await SecureStore.deleteItemAsync("RBZ_TOKEN");
            throw new Error("AUTH_EXPIRED");
          }

          throw new Error(msg);
        }

           const serverList = Array.isArray(data?.users) ? data.users : [];
        const finalList = applyClientOnlyFilters(serverList, effective);

        setUsers((prev) => {
          const next = backgroundRefresh
            ? keepVisibleCardStable(prev, finalList)
            : finalList;

          usersRef.current = next;
          return next;
        });

        if (!backgroundRefresh) {
          setReveal(0);
          setPhotoIndex(0);
        }

        if (finalList.length > 0) {
          saveCachedDiscoverDeck(requestCacheInput, finalList);
          preloadDiscoverImages(finalList);
        }
        } catch (e: any) {
        if (!hadUsableCache && !silent) {
          setUsers([]);
        }

        if (e?.message === "AUTH_MISSING" || e?.message === "AUTH_EXPIRED") {
          setMessage("Session expired. Please login again.");
          router.replace("/auth/login");
        } else if (!hadUsableCache && !silent) {
          setMessage(e?.message || "Failed to load Discover");
        }
         } finally {
        if (backgroundRefresh) {
          setQuietRefreshing(false);
        }

        if (!backgroundRefresh) {
          setLoading(false);
        }
      }
    },
       [
      authHeaders,
      appliedFilters,
      expandedSearch,
      filterLookingFor,
      getFreshDeviceCoords,
      hydrateCachedDiscoverDeck,
      phase,
      preloadDiscoverImages,
      router,
      saveCachedDiscoverDeck,
    ]
  );


useFocusEffect(
  useCallback(() => {
    if (!filtersReady) return undefined;

    fetchDiscover({ withFreshCoords: false });

    const gpsRefreshTimer = setTimeout(() => {
      fetchDiscover({
        withFreshCoords: true,
        silent: true,
      });
    }, 900);

    return () => {
      clearTimeout(gpsRefreshTimer);
    };
  }, [fetchDiscover, filtersReady])
);

const canExpandSearch =
  !loading &&
  !current &&
  phase === "strict" &&
  !expandedSearch &&
  hasAnyActiveFilter(appliedFilters, filterLookingFor);

const handleExpandSearch = useCallback(async () => {
  setExpandedSearch(true);
  setPhase("fallback");
  setMessage("Expanding search while keeping your hard filters…");

  await fetchDiscover({
    phase: "fallback",
    expanded: true,
    lookingFor: "",
  });
}, [fetchDiscover]);


const removeTopCard = useCallback(() => {
  setUsers((prev) => {
    const next = prev.slice(1);

    if (next.length > 0) {
      persistDiscoverDeck(next);
    }

    return next;
  });

  setReveal(0);
  setPhotoIndex(0);
}, [persistDiscoverDeck]);

  const openProfile = useCallback(() => {
    if (!current) return;

    // We pass a preview payload because Discover already returns safe profile fields
    // and we don't want to depend on extra endpoints.
       const safePreviewMedia = Array.isArray(current.media)
      ? current.media.filter((m: any) => isDiscoverSafeMediaEntry(m))
      : [];

    const safePreviewPhotos = Array.isArray((current as any).photos)
      ? (current as any).photos.filter((p: any) => isDiscoverSafeMediaEntry(p))
      : [];

   const preview = {
  id: current.id,
  firstName: current.firstName,
  lastName: current.lastName,
  avatar: normalizeImageUrl(current.avatar),
  media: safePreviewMedia,
  photos: safePreviewPhotos,
  dob: current.dob,

   city: current.city,
   height: current.height,
   orientation: current.orientation,
   lookingFor: current.lookingFor,
   relationshipStyle: (current as any).relationshipStyle || "",
   zodiac: current.zodiac || "",

   travelVibes: Array.isArray((current as any).travelVibes)
     ? (current as any).travelVibes.slice(0, 5)
     : [],

   interests: current.interests || [],
  hobbies: current.hobbies || [],
  favorites: current.favorites || [],
      distanceMeters: current.distanceMeters,
      distanceText: current.distanceText || "",
      isOnline: !!current.isOnline,
      status: current.status || "inactive",
      fieldVisibility: current.fieldVisibility || {},
      visibilityMode: current.visibilityMode || "full",
    };

  // ✅ TypeScript-safe bypass (typed routes sometimes don't pick up new routes immediately)
router.push({
  pathname: "/discover-profile",
  params: {
    id: String(current.id),
    preview: encodeURIComponent(JSON.stringify(preview)),
  },
} as any);

  }, [current, router]);

  const likeAPI = useCallback(
    async (userId: string) => {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ to: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "like_failed");
      return data;
    },
    [authHeaders]
  );

  const handleSkip = useCallback(() => {
  if (!current) return;
  setMessage("");
  removeTopCard();
}, [current, removeTopCard]);


   const handleBuzz = useCallback(async () => {
    if (!current || buzzing) return;
    setBuzzing(true);
    setMessage("");

    try {
      const data = await likeAPI(String(current.id));

      if (data?.matched) {
        setMessage(`💞 It's a match with ${current.firstName || "someone"}!`);
        setReveal(1);
      } else {
        setMessage(`✅ You buzzed ${current.firstName || "someone"}!`);
        setReveal((r) => clamp(r + 0.35, 0, 1));
      }

      // let the card leave first, then show the toast clearly on top
      removeTopCard();

      // hide the toast after a short moment
      setTimeout(() => {
        setMessage("");
      }, 1800);
    } catch (e: any) {
      setMessage(e?.message || "Something went wrong");

      setTimeout(() => {
        setMessage("");
      }, 1800);
    } finally {
      setBuzzing(false);
    }
  }, [buzzing, current, likeAPI, removeTopCard]);
// ======================================
// 🔁 Swipe → JS bridge (MUST be after handlers)
// ======================================
const onSwipeComplete = useCallback(
  (dir: "left" | "right") => {
    if (dir === "right") {
      handleBuzz();
    } else {
      handleSkip();
    }
  },
  [handleBuzz, handleSkip]
);

// ================================
// 🔥 Rombuzz-style swipe engine
// ================================
const swipeGesture = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
    translateY.value = e.translationY;
    rotateZ.value = e.translationX * 0.05;
  })
  .onEnd((e) => {
    const swipeRight = e.translationX > SWIPE_THRESHOLD || e.velocityX > 900;
    const swipeLeft = e.translationX < -SWIPE_THRESHOLD || e.velocityX < -900;

    if (swipeRight || swipeLeft) {
      translateX.value = withTiming(
        swipeRight ? width * 1.3 : -width * 1.3,
        { duration: 220 },
        () => {
          runOnJS(onSwipeComplete)(swipeRight ? "right" : "left");
          translateX.value = 0;
          translateY.value = 0;
          rotateZ.value = 0;
        }
      );
    } else {
      translateX.value = withSpring(0, { damping: 18 });
      translateY.value = withSpring(0, { damping: 18 });
      rotateZ.value = withSpring(0);
    }
  });


   const topBlurMode = getBlurMode(current);
  const blurRadius =
    topBlurMode === "blurred" ? Math.round((1 - reveal) * 18) : 0;

  const age = computeAge(current?.dob);
  const serverDistanceText =
    typeof current?.distanceText === "string"
      ? current.distanceText.trim()
      : "";

  const distanceText =
    serverDistanceText && serverDistanceText !== "—"
      ? serverDistanceText
      : typeof current?.distanceMeters === "number"
      ? `${Math.max(1, Math.ceil(current.distanceMeters / 1000))} km away`
      : null;

  const onPickLookingFor = async (key: string) => {
    const nextFilters: DiscoverFilters = {
      ...appliedFilters,
      lookingFor: key ? [key] : [],
    };

    setFilterLookingFor(key);
    setAppliedFilters(nextFilters);
    setUsers([]);
    setReveal(0);

    // The top Looking For row is part of Discover filtering,
    // so persist it just like filters applied from the Filter screen.
    await saveDiscoverFilters(nextFilters);

    // Reset strict cycle whenever the intent changes.
    setPhase("strict");
    setExpandedSearch(false);

    setMessage("");
    await fetchDiscover({
      lookingFor: key,
      phase: "strict",
      expanded: false,
    });
  };

   return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
<LinearGradient
  colors={[RBZ.c1, RBZ.c4]}
  style={[styles.header, { paddingTop: headerTopPadding }]}
>
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerBtn}
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          >
            <Ionicons name="arrow-back" size={20} color={RBZ.white} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.hTitle}>Discover</Text>
            <Text style={styles.hSub}>Swipe to buzz • Tap to view</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
  {/* Filter */}
  <Pressable
    onPress={() =>
      router.push({
        pathname: "/filter",
        params: {
          discoverFilters: encodeURIComponent(
            JSON.stringify({
              ...appliedFilters,
              lookingFor: filterLookingFor
                ? [filterLookingFor]
                : appliedFilters.lookingFor,
            })
          ),
        },
      } as any)
    }
    style={styles.headerBtn}
    android_ripple={{ color: "rgba(255,255,255,0.2)" }}
  >
    <Ionicons name="options" size={20} color={RBZ.white} />
  </Pressable>

  {/* Refresh */}
  <Pressable
    onPress={() => fetchDiscover({ withFreshCoords: true })}
    style={styles.headerBtn}
    android_ripple={{ color: "rgba(255,255,255,0.2)" }}
  >
    <Ionicons name="refresh" size={18} color={RBZ.white} />
  </Pressable>
</View>
</View>

        {/* Looking For row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vibesRow}
        >
          {LOOKING_FOR_WITH_ALL.map((option) => {
            const active = option.key === filterLookingFor;

            return (
              <Pressable
                key={option.key || "all"}
                onPress={() => onPickLookingFor(option.key)}
                style={[
                  styles.vibeChip,
                  active ? styles.vibeChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.vibeText,
                    active ? styles.vibeTextActive : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Content */}
         <View style={styles.body}>
        {loading && !current ? (
          <View style={styles.center}>
            <ActivityIndicator color={RBZ.c3} />
            <Text style={styles.centerText}>Finding people near you…</Text>
          </View>
        ) : !current ? (
          <View style={styles.center}>
            <Ionicons name="sparkles" size={28} color={RBZ.c3} />
            <Text style={styles.emptyTitle}>
              {canExpandSearch ? "No strict matches left" : "No more profiles"}
            </Text>

            <Text style={styles.emptySub}>
              {canExpandSearch
                ? "Your hard filters are still respected. Expand Search will loosen lifestyle and preference filters only."
                : expandedSearch
                ? "Expanded search is active. Try changing filters or refresh."
                : "Try a different vibe or refresh."}
            </Text>

            {canExpandSearch ? (
              <Pressable onPress={handleExpandSearch} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Expand Search</Text>
              </Pressable>
                    ) : (
              <Pressable
                onPress={() => fetchDiscover({ withFreshCoords: true })}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Refresh</Text>
              </Pressable>
            )}

            {expandedSearch ? (
              <Pressable
                onPress={async () => {
                  setExpandedSearch(false);
                  setPhase("strict");
                  await fetchDiscover({ phase: "strict", expanded: false });
                }}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>Back to Strict Filters</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
              <GestureHandlerRootView style={styles.deck}>
                {quietRefreshing ? (
                  <View pointerEvents="none" style={styles.refreshPill}>
                    <ActivityIndicator size="small" color={RBZ.c3} />
                    <Text style={styles.refreshPillText}>Refreshing nearby</Text>
                  </View>
                ) : null}

                {/* Next card (peek) */}
                 {users[1] ? (
                  <Animated.View style={[styles.card, styles.cardBehind, nextScale]}>
                  <Image
                      source={{ uri: getImageUri(users[1]) }}
                      style={styles.cardImg}
                      fadeDuration={0}
                    />

                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={styles.cardShade} />
                  </Animated.View>
                ) : null}

            {/* Top card */}
       <GestureDetector gesture={swipeGesture}>
  <Animated.View style={[styles.card, animatedCardStyle]}>
    <Pressable
      style={{ flex: 1 }}
      onPress={() => {
        const imgs = getUserImages(current);
        if (imgs.length > 1) {
          setPhotoIndex((i) => (i + 1) % imgs.length);
        }
      }}
      onLongPress={openProfile}
    >
      <Image
        source={{ uri: getUserImages(current)[photoIndex] }}
        style={styles.cardImg}
        blurRadius={blurRadius}
        fadeDuration={0}
      />
    </Pressable>

    {/* Like / Nope overlays */}
    <Animated.View style={[styles.badgeLike, likeOpacity]}>
      <Text style={styles.badgeText}>BUZZ</Text>
    </Animated.View>

    <Animated.View style={[styles.badgeNope, nopeOpacity]}>
      <Text style={styles.badgeText}>SKIP</Text>
    </Animated.View>

    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.90)"]}
      style={styles.cardShade}
    />

    {/* Bottom info */}
    <View style={styles.info}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
        <Text style={styles.name}>
          {current?.firstName || "Someone"}
          {age ? `, ${age}` : ""}
        </Text>
        {distanceText ? <Text style={styles.distance}>{distanceText}</Text> : null}
      </View>

      {!!current?.city && <Text style={styles.city}>{String(current.city)}</Text>}

      <View style={styles.chipsRow}>
        {Array.isArray(current?.interests) &&
          current.interests.slice(0, 4).map((x: any, idx: number) => (
            <View key={`${x}-${idx}`} style={styles.chip}>
              <Text style={styles.chipText}>{String(x)}</Text>
            </View>
          ))}
      </View>

      {!!current?.bio && (
        <Text style={styles.bio} numberOfLines={3}>
          {String(current.bio)}
        </Text>
      )}
    </View>

    {/* Bottom actions */}
    <View style={styles.actions}>
      <Pressable onPress={handleSkip} style={[styles.actBtn, styles.actSkip]}>
        <Ionicons name="close" size={22} color={RBZ.white} />
      </Pressable>

      <Pressable
        onPress={handleBuzz}
        disabled={buzzing}
        style={[
          styles.actBtn,
          styles.actBuzzPrimary,
          buzzing && { opacity: 0.7 },
        ]}
      >
        {buzzing ? (
          <ActivityIndicator color={RBZ.white} />
        ) : (
          <Ionicons name="heart" size={22} color={RBZ.white} />
        )}
      </Pressable>

      <Pressable onPress={openProfile} style={[styles.actBtn, styles.actView]}>
        <Ionicons name="person" size={22} color={RBZ.white} />
      </Pressable>
    </View>
  </Animated.View>
</GestureDetector>

            </GestureHandlerRootView>
        )}
      </View>
            {!!message && (
        <View pointerEvents="none" style={styles.toastOverlay}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{message}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const CARD_W = Math.min(width - 28, 420);
const CARD_H = Math.min(height - 280, 540);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RBZ.soft },

  header: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  hTitle: { color: RBZ.white, fontSize: 22, fontWeight: "900" },
  hSub: { color: "rgba(255,255,255,0.86)", fontSize: 12, marginTop: 2 },

  vibesRow: { paddingTop: 8, paddingBottom: 1, gap: 10, paddingHorizontal: 2 },
  vibeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  vibeChipLocked: {
    backgroundColor: "rgba(0,0,0,0.18)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  vibeChipActive: {
    backgroundColor: RBZ.white,
    borderColor: RBZ.white,
  },
  vibeText: { color: "rgba(255,255,255,0.92)", fontWeight: "800", fontSize: 13 },
  vibeTextActive: { color: RBZ.c1 },

   body: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },

  toastOverlay: {
    position: "absolute",
    top: 150,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
    alignItems: "center",
  },
  toast: {
    maxWidth: "92%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.14)",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  toastText: {
    color: RBZ.black,
    fontWeight: "800",
    fontSize: 14,
    textAlign: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  centerText: { color: RBZ.gray, fontWeight: "700" },
  emptyTitle: { color: RBZ.black, fontSize: 20, fontWeight: "900", marginTop: 6 },
  emptySub: { color: RBZ.gray, fontWeight: "600", textAlign: "center" },
   primaryBtn: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: RBZ.c1,
  },
  primaryBtnText: { color: RBZ.white, fontWeight: "900" },
  secondaryBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(177,18,60,0.08)",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.18)",
  },
  secondaryBtnText: {
    color: RBZ.c1,
    fontWeight: "900",
  },

    deck: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  refreshPill: {
    position: "absolute",
    top: 4,
    zIndex: 20,
    elevation: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  refreshPillText: {
    color: RBZ.black,
    fontSize: 12,
    fontWeight: "800",
  },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: RBZ.white,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardBehind: {
    position: "absolute",
    top: 10,
  },
  cardImg: { width: "100%", height: "100%" },
  cardShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 170,
  },

  badgeLike: {
    position: "absolute",
    top: 18,
    left: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(229,72,106,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  badgeNope: {
    position: "absolute",
    top: 18,
    right: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(177,18,60,0.90)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  badgeText: { color: RBZ.white, fontWeight: "900", letterSpacing: 1 },

  info: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 86,
  },
  name: { color: RBZ.white, fontSize: 26, fontWeight: "900" },
  distance: { color: "rgba(255,255,255,0.88)", fontWeight: "800", fontSize: 12, marginBottom: 2 },
  city: { color: "rgba(255,255,255,0.86)", fontWeight: "700", marginTop: 4 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  chipText: { color: RBZ.white, fontWeight: "800", fontSize: 12 },

  tapHint: { color: "rgba(255,255,255,0.78)", marginTop: 10, fontWeight: "700", fontSize: 12 },

  actions: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actBtn: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
 actSkip: {
  backgroundColor: RBZ.c2, // soft red-pink
  borderWidth: 1,
  borderColor: RBZ.c3,
},

actView: {
  backgroundColor: RBZ.c4, // purple brand
  borderWidth: 1,
  borderColor: RBZ.c3,
},

actBuzzPrimary: {
  backgroundColor: RBZ.c3, // ❤️ MAIN ACTION
  borderWidth: 2,
  borderColor: RBZ.white,
  shadowColor: RBZ.c3,
  shadowOpacity: 0.6,
  shadowRadius: 12,
  elevation: 8,
},
bio: {
  marginTop: 8,
  color: "rgba(255,255,255,0.85)",
  fontSize: 13,
  fontWeight: "600",
  lineHeight: 18,
},

});

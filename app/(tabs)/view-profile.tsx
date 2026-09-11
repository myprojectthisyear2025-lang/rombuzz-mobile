
/**
 * ============================================================================
 * 📁 File: app/(tabs)/view-profile.tsx
 * 🎯 Screen: RomBuzz Mobile — ViewProfile (MATCHED USERS ONLY)
 * 🚀 Fully wired with backend, real-time data, complete UI
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import RBZImageViewer from "@/src/components/media/RBZImageViewer";
import RBZVideoViewer, {
  type RBZVideoViewerItem,
} from "@/src/components/media/RBZVideoViewer";
import {
  type BuzzPokeMeta,
} from "@/src/components/profile/BuzzPokeCard";
import ViewProfileGallery from "@/src/components/profile/ViewProfileGallery";
import ViewProfileMediaActions from "@/src/components/profile/ViewProfileMediaActions";
import RBZReportSheet from "@/src/components/reporting/RBZReportSheet";
import { API_BASE } from "@/src/config/api";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import {
  fetchFreshViewProfile,
  mergeStableViewProfile,
  readCachedViewProfile,
} from "@/src/features/performance/viewProfile/rbzViewProfileCache";
import ViewProfileHero from "@/src/features/viewProfile/hero/ViewProfileHero";
import ViewProfileDetailsInfo from "@/src/features/viewProfile/info/ViewProfileDetailsInfo";
import ViewProfileIntroInfo from "@/src/features/viewProfile/info/ViewProfileIntroInfo";
import ViewProfileLifestyleInfo from "@/src/features/viewProfile/info/ViewProfileLifestyleInfo";
import ViewProfilePersonalityInfo from "@/src/features/viewProfile/info/ViewProfilePersonalityInfo";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  c5: "#9d174d",

  white: "#ffffff",
  bg: "#fafafc",
  ink: "#111827",
  muted: "#6b7280",
  soft: "#f7f7fb",
  line: "rgba(17,24,39,0.10)",
  cardBg: "#ffffff",
  success: "#22c55e",
  offline: "#9ca3af",
  error: "#ef4444",
  warning: "#f59e0b",
};

type MediaItem = {
  id: string;
  url: string;
  mediaUrl?: string;
  videoUrl?: string;
  type?: "image" | "reel";

  caption?: string;
  privacy?: string;

  provider?: string;
  storage?: string;
  streamUid?: string;
  playback?: any;
  thumbnailUrl?: string;
  cloudflareStream?: any;
  status?: string;
  duration?: number;
};

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  age?: number;
  dob?: string;
  avatar?: string;
  bio?: string;
  interests?: string[];
  hobbies?: string[];
  city?: string;
  gender?: string;
  orientation?: string;
  lookingFor?: string;
   height?: string;
  voiceDurationSec?: number;

  // likes/dislikes can be string OR arrays depending on backend/user save
  likes?: any;
  dislikes?: any;

  voiceUrl?: string;
  voiceIntro?: string;

  // ✅ ProfileInfoTab fields (mobile)
  pronouns?: string;
  country?: string;
  hometown?: string;
  travelMode?: boolean; // legacy/web
  travelVibes?: string[];

  relationshipStyle?: string;

  bodyType?: string;
  fitnessLevel?: string;
  smoking?: string;
  drinking?: string;
  workoutFrequency?: string;
  diet?: string;
  sleepSchedule?: string;

  educationLevel?: string;
  school?: string;
  jobTitle?: string;
  company?: string;
  languages?: string[];

  religion?: string;
  politicalViews?: string;
  zodiac?: string;

  favoriteMusic?: string[];
  favoriteMovies?: string[];
  travelStyle?: string;
  petsPreference?: string;

  vibeTags?: string[];

  distanceMiles?: number;

  distanceKm?: number;
  distance?: number;
  online?: boolean;

  // ✅ MEDIA SOURCES (FIX FOR TS ERRORS)
  media?: any[];
  photos?: any[];
  reels?: any[];
  gallery?: any[];
  uploads?: any[];

  profileViews?: {
    total: number;
    today: number;
    lastViewDate: string;
  };
  lastActive?: string;
  createdAt?: string;
}


interface ProfileResponse {
  user: UserProfile;
  matched: boolean;
  likedByMe?: boolean;
  likedMe?: boolean;
  blocked?: boolean;
}

function inferType(m: any): "image" | "reel" {
  if (!m) return "image";

  const type = String(m?.type || "").toLowerCase();
  const caption = String(m?.caption || "").toLowerCase();

  // 🔥 IMPORTANT: preserve backend reel type + Cloudflare Stream profile reels
  if (
    isCloudflareStreamMedia(m) ||
    caption.includes("kind:reel") ||
    caption.includes("kind:video")
  ) {
    return "reel";
  }

  if (
    type === "reel" ||
    type === "video" ||
    type.includes("reel") ||
    type.includes("video")
  ) {
    return "reel";
  }

  const url = String(m?.url || m || "");

  if (
    url.includes("/video/upload/") ||
    url.match(/\.(mp4|mov|m4v|webm|avi|wmv|flv|mkv|mpg|mpeg)(\?|#|$)/i)
  ) {
    return "reel";
  }

  return "image";
}


function inferScopeFromCaption(caption: string): "public" | "matches" | "private" {
  const t = String(caption || "");
  if (t.includes("scope:matches")) return "matches";
  if (t.includes("scope:private")) return "private";
  if (t.includes("scope:public")) return "public";
  return "public";
}

function getMediaUrlFromEntry(entry: any) {
  if (typeof entry === "string") return String(entry || "").trim();

  return String(
    entry?.url ||
      entry?.mediaUrl ||
      entry?.fileUrl ||
      entry?.secureUrl ||
      entry?.secure_url ||
      entry?.src ||
      entry?.imageUrl ||
      entry?.photoUrl ||
      entry?.videoUrl ||
      entry?.playback?.hls ||
      entry?.playback?.dash ||
      ""
  ).trim();
}

function getStreamUidFromEntry(entry: any) {
  if (!entry || typeof entry === "string") return "";

  return String(
    entry?.streamUid ||
      entry?.uid ||
      entry?.cloudflareStream?.uid ||
      ""
  ).trim();
}

function isCloudflareStreamMedia(entry: any) {
  return (
    String(entry?.provider || entry?.storage || "").toLowerCase() === "cloudflare_stream" ||
    !!getStreamUidFromEntry(entry)
  );
}

function stripSignedUrlQuery(url: string) {
  return String(url || "").split("?")[0].split("#")[0].trim();
}

function getMediaStableKey(entry: any, url?: string) {
  if (typeof entry === "string") {
    return stripSignedUrlQuery(entry);
  }

  return String(
    entry?.streamUid ||
      entry?.cloudflareStream?.uid ||
      entry?.r2Key ||
      entry?.key ||
      entry?.mediaId ||
      entry?.id ||
      entry?._id ||
      stripSignedUrlQuery(url || getMediaUrlFromEntry(entry))
  ).trim();
}

function canViewerSeeMedia(m: any) {
  if (!m) return false;
  
  if (typeof m === "string") return true;

  const caption = String(m?.caption || "").toLowerCase();
  const scope = String(m?.scope || inferScopeFromCaption(caption)).toLowerCase();
  const privacy = String(m?.privacy || m?.visibility || "").toLowerCase();

  const matchedOnly =
    scope === "matches" ||
    privacy === "matches" ||
    privacy === "matched" ||
    privacy === "matched-only" ||
    caption.includes("scope:matches") ||
    caption.includes("scope:matched") ||
    caption.includes("privacy:matches");

  if (matchedOnly) return true;

  if (scope === "private") return false;
  if (caption.includes("scope:private")) return false;
  if (caption.includes("privacy:private")) return false;
  if (privacy === "private") return false;

  return scope === "public" || privacy === "public" || !privacy;
}

function buildDirectStreamPlaybackUrl(streamUid: string) {
  const uid = String(streamUid || "").replace(/[^a-zA-Z0-9_-]/g, "").trim();
  if (!uid) return "";

  return `https://videodelivery.net/${uid}/manifest/video.m3u8`;
}

function buildDirectStreamThumbnailUrl(streamUid: string) {
  const uid = String(streamUid || "").replace(/[^a-zA-Z0-9_-]/g, "").trim();
  if (!uid) return "";

  return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;
}

async function resolveStreamPlayback(streamUid: string) {
  const uid = String(streamUid || "").trim();
  if (!uid) {
    return {
      url: "",
      thumbnailUrl: "",
      status: "",
      duration: 0,
    };
  }

  try {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");
    if (!token) {
      return {
        url: buildDirectStreamPlaybackUrl(uid),
        thumbnailUrl: buildDirectStreamThumbnailUrl(uid),
        status: "",
        duration: 0,
      };
    }

    const res = await fetch(`${API_BASE}/stream/${uid}/playback`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json().catch(() => ({}));

    const resolvedUrl = String(
      json?.playback?.hls ||
        json?.playback?.dash ||
        ""
    ).trim();

    return {
      url: resolvedUrl || buildDirectStreamPlaybackUrl(uid),
      thumbnailUrl: String(json?.thumbnailUrl || "").trim() || buildDirectStreamThumbnailUrl(uid),
      status: String(json?.status || "").trim(),
      duration: Number(json?.duration || 0),
    };
  } catch {
    return {
      url: buildDirectStreamPlaybackUrl(uid),
      thumbnailUrl: buildDirectStreamThumbnailUrl(uid),
      status: "",
      duration: 0,
    };
  }
}

export default function ViewProfile() {
  const router = useRouter();
  const { colors } = useRomBuzzTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{
    userId?: string;
    id?: string;
    fromChat?: string;
    fromMatches?: string;
    returnTo?: string;
  }>();
  const userId = String(params.userId || params.id || "");
  const returnTo = String(params.returnTo || "").trim();

  // ✅ If you came from chat thread OR Matches tab → trust it and allow viewing
  const bypassMatchGate = params.fromChat === "1" || params.fromMatches === "1";

  const handleGoBack = useCallback(() => {
    if (returnTo) {
      router.replace(returnTo as any);
      return;
    }

    const canGoBack =
      typeof (router as any)?.canGoBack === "function"
        ? (router as any).canGoBack()
        : false;

    if (canGoBack) {
      router.back();
      return;
    }

    router.replace("/profile" as any);
  }, [router, returnTo]);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [matched, setMatched] = useState(false);
  const [buzzMeta, setBuzzMeta] = useState<BuzzPokeMeta>({
    count: 0,
    lastBuzz: null,
    lastBuzzLabel: "No buzz yet",
  });

  const profileRef = useRef<ProfileResponse | null>(null);
  const requestSeqRef = useRef(0);
  const hydratedCacheForRef = useRef("");

   // voice intro
   const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [voiceDurationSec, setVoiceDurationSec] = useState(0);
  // gallery
  const [tab, setTab] = useState<"photos" | "reels">("photos");

  // shared image viewer (photos only for now)
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerItems, setImageViewerItems] = useState<any[]>([]);

  // shared video viewer (reels only)
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const [videoViewerIndex, setVideoViewerIndex] = useState(0);
  const [videoViewerItems, setVideoViewerItems] = useState<RBZVideoViewerItem[]>([]);

  const [refreshing, setRefreshing] = useState(false);

  // ✅ 3-dot menu as true overlay (so it never hides under About)
  const [showMenu, setShowMenu] = useState(false);
  const menuBtnRef = useRef<View | null>(null);
   const [menuPos, setMenuPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const [blockLoading, setBlockLoading] = useState(false);
  const [unmatchLoading, setUnmatchLoading] = useState(false);
  const [reportSheetVisible, setReportSheetVisible] = useState(false);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Calculate age from DOB
  const age = useMemo(() => {

    if (!user?.dob) return null;
    try {
      const birthDate = new Date(user.dob);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  }, [user?.dob]);

  // Full name
  const fullName = useMemo(() => {
    if (!user) return "RomBuzz User";

    const first = String(user.firstName || "").trim();
    const last = String(user.lastName || "").trim();
    const combined = [first, last].filter(Boolean).join(" ").trim();
    const rawName = String(user.name || "").trim();

    if (first && last) return `${first} ${last}`;
    if (rawName.includes(" ")) return rawName;
    return combined || rawName || first || last || "RomBuzz User";
  }, [user]);

  // Distance text
  const distanceText = useMemo(() => {
    if (!user) return "";
const d = user.distanceMiles ?? user.distanceKm ?? user.distance ?? null;
    if (d === null || d === undefined) return "";
    const num = Number(d);
    if (!Number.isFinite(num)) return "";
    if (user.distanceMiles !== undefined) return `${Math.round(num)} mi away`;
    if (user.distanceKm !== undefined) return `${Math.round(num)} km away`;
    return `${Math.round(num)} km away`;
  }, [user]);

  // Voice URL
  const voiceUrl = useMemo(() => {
    if (!user) return "";
    // Check various possible fields for voice URL
   const possibleFields = [
  user.voiceIntro,
  user.voiceUrl,
  ...(user.media || []).filter((m: any) => 
    String(m.caption || "").includes("voice:")
  ).map((m: any) => String(m.url || ""))
];

    return possibleFields.find(url => url && url.trim()) || "";
  }, [user]);

       // Media processing
 const allMedia: MediaItem[] = useMemo(() => {
  if (!user) return [];

  const rawMedia = (Array.isArray(user?.media) ? user.media : []) as any[];

  // Only use legacy fallback arrays if backend did not send media[].
  // View Profile must not merge media + photos + reels together because backend
  // may derive photos/reels from the same media list.
  const fallbackRaw =
    rawMedia.length > 0
      ? []
      : [
          ...(Array.isArray(user?.reels) ? user.reels : []),
          ...(Array.isArray(user?.photos) ? user.photos : []),
          ...(Array.isArray(user?.gallery) ? user.gallery : []),
          ...(Array.isArray(user?.uploads) ? user.uploads : []),
        ];

  const sourceRaw = rawMedia.length > 0 ? rawMedia : fallbackRaw;

  const seenKeys = new Set<string>();
  const seenUrls = new Set<string>();
  const merged: MediaItem[] = [];

  const pushItem = (item: any, idx: number, source: string) => {
    const url = getMediaUrlFromEntry(item);
    const streamUid = getStreamUidFromEntry(item);

    if (!url && !streamUid) return;

    const cleanUrl = stripSignedUrlQuery(url);
    const key = getMediaStableKey(item, url) || streamUid || cleanUrl;

    if (!key || seenKeys.has(key)) return;
    if (cleanUrl && seenUrls.has(cleanUrl)) return;
    if (!canViewerSeeMedia(item)) return;

    if (typeof item === "string") {
      seenKeys.add(key);
      if (cleanUrl) seenUrls.add(cleanUrl);

      merged.push({
        id: `legacy-${source}-${idx}-${key}`,
        mediaId: `legacy-${source}-${idx}-${key}`,
        url,
        mediaUrl: url,
        type: inferType({ url }),
        caption: "",
        privacy: "public",
      } as any);
      return;
    }

    const id = String(item?.id || item?._id || item?.mediaId || streamUid || key);
    const caption = String(item?.caption || item?.text || item?.description || "");
    const privacy = String(item?.privacy || item?.visibility || item?.scope || "public").toLowerCase();
    const type = inferType({ ...item, url, streamUid });

    seenKeys.add(key);
    if (cleanUrl) seenUrls.add(cleanUrl);

    merged.push({
      ...item,
      id,
      mediaId: String(item?.mediaId || id),
      url,
      mediaUrl: String(item?.mediaUrl || url),
      videoUrl: String(item?.videoUrl || url),
      type,
      caption,
      privacy,

      provider: item?.provider,
      storage: item?.storage,
      streamUid,
      playback: item?.playback,
      thumbnailUrl: item?.thumbnailUrl,
      cloudflareStream: item?.cloudflareStream,
      status: item?.status || item?.cloudflareStream?.status,
      duration: Number(item?.duration || item?.cloudflareStream?.duration || 0),
    });
  };

  sourceRaw.forEach((item, idx) =>
    pushItem(item, idx, rawMedia.length > 0 ? "media" : "fallback")
  );

  return merged;
}, [user]);

  const photos = useMemo(() => allMedia.filter((m) => m.type === "image"), [allMedia]);
const reels = useMemo(() => allMedia.filter((m) => m.type === "reel"), [allMedia]);

  const gridSize = useMemo(() => {
    const padding = 16 * 2;
    const gaps = 8 * 2;
    return Math.floor((width - padding - gaps) / 3);
  }, [width]);

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------
  const applyProfileBundle = useCallback(
    (bundle: { profile: ProfileResponse }) => {
      const nextProfile = mergeStableViewProfile(
        profileRef.current,
        bundle.profile
      ) as ProfileResponse;

      profileRef.current = nextProfile;

      setProfile(nextProfile);
      setUser(nextProfile.user);
      setMatched(!!nextProfile.matched);
      setVoiceDurationSec(Number(nextProfile?.user?.voiceDurationSec || 0));
    },
    []
  );

  const loadProfile = useCallback(
    async (mode: "initial" | "silent" | "refresh" = "initial") => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const requestId = ++requestSeqRef.current;
      const visibleProfileId = String(profileRef.current?.user?.id || "");
      const hasVisibleProfileForThisUser = visibleProfileId === userId;
      const hasDifferentProfileVisible = !!visibleProfileId && visibleProfileId !== userId;

      const shouldShowBlockingLoader =
        mode === "initial" && !hasVisibleProfileForThisUser;

      if (hasDifferentProfileVisible) {
        profileRef.current = null;
        setProfile(null);
        setUser(null);
        setMatched(false);
        setVoiceDurationSec(0);
      }

      if (shouldShowBlockingLoader) {
        setLoading(true);
      }

      if (mode === "refresh") {
        setRefreshing(true);
      }

      try {
        const shouldTryCache =
          mode !== "refresh" &&
          hydratedCacheForRef.current !== userId;

        if (shouldTryCache) {
          const cached = await readCachedViewProfile(userId);

          if (cached?.profile?.user && requestId === requestSeqRef.current) {
            hydratedCacheForRef.current = userId;

            applyProfileBundle({
              profile: cached.profile,
            });

            setLoading(false);
          }
        }

        const fresh = await fetchFreshViewProfile(userId);

        if (requestId !== requestSeqRef.current) return;

        hydratedCacheForRef.current = userId;

        applyProfileBundle({
          profile: fresh.profile,
        });
      } catch (e: any) {
        const currentVisibleId = String(profileRef.current?.user?.id || "");

        if (!profileRef.current?.user || currentVisibleId !== userId) {
          Alert.alert("Error", e?.message || "Failed to load profile");
          handleGoBack();
        }
      } finally {
        if (requestId === requestSeqRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [applyProfileBundle, handleGoBack, userId]
  );

  const refreshProfile = useCallback(async () => {
    await loadProfile("refresh");
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile(profileRef.current?.user ? "silent" : "initial");
    }, [loadProfile])
  );

  useEffect(() => {
    return () => {
      (async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          }
        } catch {}
        soundRef.current = null;
      })();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // VOICE PLAY
  // ---------------------------------------------------------------------------
  const playVoice = async () => {
    if (!voiceUrl) {
      Alert.alert("Voice", "This user has no voice intro.");
      return;
    }

    try {
      if (playing && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status?.isLoaded && status.isPlaying) {
          await soundRef.current.pauseAsync();
          setPlaying(false);
          return;
        }

        if (status?.isLoaded) {
          await soundRef.current.playAsync();
          setPlaying(true);
          return;
        }
      }

      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: voiceUrl },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setPlaying(true);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (!status?.isLoaded) return;

        if (status?.durationMillis && !voiceDurationSec) {
          setVoiceDurationSec(Math.max(1, Math.round(status.durationMillis / 1000)));
        }

        if (status?.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (e: any) {
      setPlaying(false);
      try {
        await soundRef.current?.unloadAsync();
      } catch {}
      soundRef.current = null;
      Alert.alert("Voice", e?.message || "Unable to play voice intro.");
    }
  };

  // ---------------------------------------------------------------------------
  // MENU OPEN (measure button → position modal dropdown)
  // ---------------------------------------------------------------------------
  const openMenu = () => {
    // measureInWindow exists on native component refs (View)
    // @ts-ignore
    menuBtnRef.current?.measureInWindow?.((x: number, y: number, w: number, h: number) => {
      setMenuPos({ x, y, w, h });
      setShowMenu(true);
    });
  };

  // ---------------------------------------------------------------------------
  // MENU ACTIONS
  // ---------------------------------------------------------------------------
  const handleBlock = async () => {
    if (!userId || blockLoading) return;
    
    const confirmMessage = profile?.blocked 
      ? `Unblock ${fullName}? They will be able to message and view you again.`
      : `Block ${fullName}? They will not be able to message or view you.`;

    Alert.alert(
      profile?.blocked ? "Unblock User" : "Block User",
      confirmMessage,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: profile?.blocked ? "Unblock" : "Block",
          style: profile?.blocked ? "default" : "destructive",
          onPress: async () => {
            try {
              setBlockLoading(true);
              const token = await SecureStore.getItemAsync("RBZ_TOKEN");
              
              const endpoint = profile?.blocked ? `${API_BASE}/unblock` : `${API_BASE}/block`;
              const method = profile?.blocked ? "POST" : "POST";
              
              const res = await fetch(endpoint, {
                method,
                headers: { 
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ targetId: userId }),
              });

              if (!res.ok) throw new Error("Operation failed");

              Alert.alert(
                "Success", 
                profile?.blocked ? "User unblocked successfully!" : "User blocked successfully!"
              );
              
              // Refresh profile to update blocked status
              await loadProfile();
              setShowMenu(false);
              
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Operation failed");
            } finally {
              setBlockLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUnmatch = async () => {
    if (!userId || unmatchLoading) return;

    Alert.alert(
      "Unmatch User",
      `Unmatch with ${fullName}? This will remove your match connection.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            try {
              setUnmatchLoading(true);
              const token = await SecureStore.getItemAsync("RBZ_TOKEN");
              
              const res = await fetch(`${API_BASE}/unmatch/${userId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
              });

              const data = await res.json().catch(() => ({}));
              
              if (!res.ok) throw new Error(data?.error || "Unmatch failed");

              Alert.alert("Unmatched", "You are no longer connected with this user.");
              router.back();
              
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to unmatch");
            } finally {
              setUnmatchLoading(false);
            }
          },
        },
      ]
    );
  };

   // ---------------------------------------------------------------------------
  // OPEN IMAGE VIEWER (shared universal file)
  // ---------------------------------------------------------------------------
  const openImageViewer = useCallback((items: MediaItem[], index: number) => {
    const onlyImages = items
      .filter((x) => (x?.type || "image") !== "reel" && !!x?.url)
      .map((x) => ({
        ...x,
        id: String(x.id),
        mediaId: String((x as any)?.mediaId || x.id),
        url: String(x.url),
        mediaUrl: String((x as any)?.mediaUrl || x.url),
      }));

    const safeIndex = Math.max(0, Math.min(index, Math.max(0, onlyImages.length - 1)));

    setImageViewerItems(onlyImages);
    setImageViewerIndex(safeIndex);
    setImageViewerOpen(true);
  }, []);

  const closeImageViewer = useCallback(() => {
    setImageViewerOpen(false);
  }, []);

  // ---------------------------------------------------------------------------
  // OPEN VIDEO VIEWER (shared universal file for reels)
  // ---------------------------------------------------------------------------
  const openVideoViewer = useCallback(async (items: MediaItem[], index: number) => {
    const reelEntries = items.filter((x) => {
      const streamUid = getStreamUidFromEntry(x);

      return (
        (x?.type || "image") === "reel" &&
        (
          !!x?.url ||
          !!x?.mediaUrl ||
          !!x?.videoUrl ||
          !!x?.playback?.hls ||
          !!x?.playback?.dash ||
          !!streamUid
        )
      );
    });

    const onlyReels = await Promise.all(
      reelEntries.map(async (x) => {
        const streamUid = getStreamUidFromEntry(x);
        const existingUrl = String(
          x.url ||
            x.mediaUrl ||
            x.videoUrl ||
            x.playback?.hls ||
            x.playback?.dash ||
            ""
        ).trim();

        const resolvedStream = !existingUrl && streamUid
          ? await resolveStreamPlayback(streamUid)
          : {
              url: "",
              thumbnailUrl: "",
              status: "",
              duration: 0,
            };

        const resolvedUrl = existingUrl || resolvedStream.url;
        const resolvedThumbnail = String(
          (x as any)?.poster ||
            (x as any)?.thumbnail ||
            (x as any)?.thumbnailUrl ||
            resolvedStream.thumbnailUrl ||
            ""
        ).trim();

        return {
          ...x,
          id: String(x.id || streamUid),
          mediaId: String((x as any)?.mediaId || x.id || streamUid),
          url: resolvedUrl,
          mediaUrl: resolvedUrl,
          videoUrl: resolvedUrl,
          title: fullName ? `${fullName}'s Reel` : "Reel",
          poster: resolvedThumbnail,
          thumbnail: resolvedThumbnail,
          thumbnailUrl: resolvedThumbnail,
          streamUid,
          provider: (x as any)?.provider,
          storage: (x as any)?.storage,
          cloudflareStream: (x as any)?.cloudflareStream,
          status: String((x as any)?.status || resolvedStream.status || ""),
          duration: Number((x as any)?.duration || resolvedStream.duration || 0),
        };
      })
    );

    const target = items[Math.max(0, Math.min(index, Math.max(0, items.length - 1)))];
    const targetKey = getMediaStableKey(target);
    const safeIndexFromTarget = onlyReels.findIndex((x) => getMediaStableKey(x) === targetKey);
    const safeIndex =
      safeIndexFromTarget >= 0
        ? safeIndexFromTarget
        : Math.max(0, Math.min(index, Math.max(0, onlyReels.length - 1)));

    setVideoViewerItems(onlyReels);
    setVideoViewerIndex(safeIndex);
    setVideoViewerOpen(true);
  }, [fullName]);

  const closeVideoViewer = useCallback(() => {
    setVideoViewerOpen(false);
  }, []);

   // ---------------------------------------------------------------------------
  // RENDER STATES
  // ---------------------------------------------------------------------------
  if (loading && !user) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.brand}
        />

        <Text
          style={[
            styles.unavailableText,
            {
              marginTop: 14,
              color: colors.text,
            },
          ]}
        >
          Loading profile
        </Text>

        <Text
          style={[
            styles.unavailableSubtext,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          Getting the latest profile details...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <Text
          style={[
            styles.unavailableText,
            {
              color: colors.text,
            },
          ]}
        >
          Profile unavailable
        </Text>

        <Text
          style={[
            styles.unavailableSubtext,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          This profile could not be loaded.
        </Text>

        <Pressable
          onPress={handleGoBack}
          style={[
            styles.backButton,
            {
              backgroundColor:
                colors.brand,
            },
          ]}
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  // Keep matched-only UI accurate for normal flow,
  // but allow matched-entry contexts like chat/matches to show matched actions.
  const viewingAsMatched = bypassMatchGate ? true : matched;

  // ---------------------------------------------------------------------------
  // MAIN UI
  // ---------------------------------------------------------------------------
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={handleGoBack}
          style={styles.backButtonHeader}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.icon}
          />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
          ]}
        >
          Profile
        </Text>

        <View
          ref={menuBtnRef}
          collapsable={false}
          style={styles.headerRight}
        >
          <Pressable
            onPress={openMenu}
            style={styles.headerMenuButton}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={colors.icon}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProfile}
            tintColor={colors.brand}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 120,
        }}
      >
        <ViewProfileHero
          userId={userId}
          avatar={user?.avatar}
          fullName={fullName}
          age={age}
          city={user?.city}
          online={user?.online}
          distanceText={distanceText}
          matched={viewingAsMatched}
          buzzMeta={buzzMeta}
          onBuzzMetaChange={setBuzzMeta}
          onChat={() => {
            router.push({
              pathname: "/chat/[peerId]" as any,
              params: {
                peerId: userId,
                name: fullName,
                avatar: user.avatar || "",
              },
            });
          }}
        />

        <ViewProfileIntroInfo
          bio={user?.bio}
          voiceUrl={voiceUrl}
          voiceDurationSec={voiceDurationSec}
          playing={playing}
          onPressVoice={playVoice}
        />

        {/* Gallery */}
        <ViewProfileGallery
          tab={tab}
          onTabChange={setTab}
          photos={photos}
          reels={reels}
          gridSize={gridSize}
          onOpenPhoto={(_, index) =>
            openImageViewer(photos, index)
          }
          onOpenReel={(_, index) =>
            openVideoViewer(reels, index)
          }
        />

        <ViewProfileDetailsInfo
          user={user}
        />

        <ViewProfileLifestyleInfo
          user={user}
        />

        <ViewProfilePersonalityInfo
          user={user}
        />
      </ScrollView>

      {/* ✅ 3-dot menu overlay (always above About/Details/etc) */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          onPress={() => setShowMenu(false)}
          style={styles.menuBackdrop}
        >
          <View
            style={[
              styles.menuDropdownModal,
              menuPos
                ? {
                    // dropdown below the 3-dot button
                    top: Math.max(insets.top + 8, menuPos.y + menuPos.h + 8),
                    // align right edge to button right edge (clamped)
                    left: Math.max(12, Math.min(menuPos.x + menuPos.w - 160, width - 12 - 160)),
                  }
                : { top: insets.top + 90, right: 16 },
            ]}
          >
            <Pressable
              onPress={async () => {
                await handleBlock();
                // handleBlock already closes menu at end, but keep this safe
              }}
              disabled={blockLoading}
              style={styles.menuItem}
            >
              <Ionicons
                name={profile?.blocked ? "lock-open" : "ban"}
                size={16}
                color={profile?.blocked ? RBZ.success : RBZ.error}
              />
              <Text
                style={[
                  styles.menuItemText,
                  {
                    color:
                      colors.text,
                  },
                  profile?.blocked && {
                    color:
                      RBZ.success,
                  },
                ]}
              >
                {blockLoading ? "Processing..." : profile?.blocked ? "Unblock" : "Block"}
              </Text>
            </Pressable>

                  <Pressable
              onPress={() => {
                setShowMenu(false);
                setReportSheetVisible(true);
              }}
              style={[
                styles.menuItem,
                {
                  borderBottomColor:
                    colors.border,
                },
              ]}
            >
              <Ionicons
                name="warning"
                size={16}
                color={RBZ.warning}
              />

              <Text
                style={[
                  styles.menuItemText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Report
              </Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                await handleUnmatch();
              }}
              disabled={unmatchLoading}
              style={styles.menuItem}
            >
              <Ionicons name="heart-dislike" size={16} color={RBZ.c1} />
              <Text style={[styles.menuItemText, { color: RBZ.c1 }]}>
                {unmatchLoading ? "Processing..." : "Unmatch"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

         <RBZReportSheet
        visible={reportSheetVisible}
        onClose={() => setReportSheetVisible(false)}
        target={{
          targetType: "profile",
          targetId: String(userId),
          reportedUserId: String(userId),
          source: "mobile_view_profile",
          title: fullName,
          subtitle: user?.city ? String(user.city) : "RomBuzz profile",
          avatar: user?.avatar || "",
          evidenceSnapshot: {
            screen: "view_profile",
            reportedUserName: fullName,
            reportedUserAvatar: user?.avatar || "",
            reportedUserCity: user?.city || "",
            reportedUserAge: age,
            matched: viewingAsMatched,
            distanceText,
          },
        }}
      />

          {/* Media Viewer */}
         <RBZImageViewer
        visible={imageViewerOpen}
        items={imageViewerItems}
        initialIndex={imageViewerIndex}
        title={`${fullName}'s Photo`}
        onClose={closeImageViewer}
        onIndexChange={setImageViewerIndex}
        FooterComponent={({ item }) => {
          if (!item) return null;

          return (
            <View pointerEvents="box-none" style={styles.imageViewerMediaActionsWrap}>
              <ViewProfileMediaActions
                item={item as any}
                ownerId={userId}
                ownerName={fullName}
                ownerAvatar={user.avatar || ""}
                mediaKind="photo"
                onRefresh={refreshProfile}
              />
            </View>
          );
        }}
      />

      <RBZVideoViewer
        visible={videoViewerOpen}
        items={videoViewerItems}
        initialIndex={videoViewerIndex}
        title={`${fullName}'s Reel`}
        onClose={closeVideoViewer}
        onIndexChange={setVideoViewerIndex}
        FooterComponent={({ item }) => {
          if (!item) return null;

          return (
            <View pointerEvents="box-none" style={styles.videoViewerMediaActionsWrap}>
              <ViewProfileMediaActions
                item={item as any}
                ownerId={userId}
                ownerName={fullName}
                ownerAvatar={user.avatar || ""}
                mediaKind="reel"
                onRefresh={refreshProfile}
              />
            </View>
          );
        }}
      />
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RBZ.bg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.bg,
  },
  loadingText: {
    marginTop: 12,
    color: RBZ.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  unavailableText: {
    fontSize: 18,
    fontWeight: "800",
    color: RBZ.muted,
    marginBottom: 8,
  },
  unavailableSubtext: {
    fontSize: 14,
    color: RBZ.muted,
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: RBZ.c1,
  },
  backButtonText: {
    color: RBZ.white,
    fontWeight: "700",
    fontSize: 14,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 10,
    paddingBottom: 6,

    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",

    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  backButtonHeader: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontFamily:
      RBZFont.bold,

    fontSize: 16,
  },

  headerRight: {
    width: 42,
    height: 42,
  },

  headerMenuButton: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  streakBadgeText: {
    color: RBZ.white,
    fontSize: 12,
    fontWeight: "800",
  },
  heroSection: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: RBZ.cardBg,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.1)",
    shadowColor: RBZ.c3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: RBZ.white,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: RBZ.soft,
  },
  statusDot: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: RBZ.white,
  },
  nameContainer: {
      alignItems: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  nameRow: {
   flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  name: {
    fontSize: 26,
    fontWeight: "900",
    color: RBZ.ink,
  },
  age: {
    fontSize: 26,
    fontWeight: "700",
    color: RBZ.muted,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 14,
    color: RBZ.muted,
    fontWeight: "600",
    marginLeft: 8,
  },
  streakDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245,158,11,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  streakText: {
    color: RBZ.warning,
    fontWeight: "700",
    fontSize: 12,
  },
  buzzMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  buzzMetaChip: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(216,52,95,0.08)",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  buzzMetaCount: {
    color: RBZ.c2,
    fontWeight: "900",
    fontSize: 12,
  },
  buzzMetaTime: {
    color: RBZ.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    overflow: "hidden",
  },
  buzzButton: {
    shadowColor: RBZ.c2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buzzButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buzzButtonText: {
    color: RBZ.white,
    fontWeight: "800",
    fontSize: 15,
  },
  chatButton: {
    backgroundColor: "rgba(233,72,106,0.05)",
    borderWidth: 2,
    borderColor: "rgba(233,72,106,0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  chatButtonText: {
    color: RBZ.c2,
    fontWeight: "800",
    fontSize: 15,
  },
   menuContainer: {
    position: "relative",
    width: 50,
    height: 50,
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(233,72,106,0.05)",
    borderWidth: 2,
    borderColor: "rgba(233,72,106,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ✅ Modal overlay menu (true top layer)
  menuBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  menuDropdownModal: {
    position: "absolute",
    width: 160,
    backgroundColor: RBZ.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RBZ.line,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 30,
    overflow: "hidden",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(17,24,39,0.05)",
  },
  menuItemText: {
    color: RBZ.ink,
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: RBZ.cardBg,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: RBZ.ink,
  },
  cardContent: {
    color: RBZ.ink,
    lineHeight: 22,
    fontWeight: "500",
    fontSize: 14,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(233,72,106,0.05)",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.1)",
  },
  voiceButtonText: {
    color: RBZ.c2,
    fontWeight: "700",
    fontSize: 15,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  detailItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(17,24,39,0.02)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.05)",
  },
  detailLabel: {
    fontSize: 12,
    color: RBZ.muted,
    fontWeight: "600",
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    color: RBZ.ink,
    fontWeight: "700",
    marginTop: 2,
  },
  likesSection: {
    marginTop: 16,
    gap: 12,
  },
  likeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(17,24,39,0.02)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.05)",
  },
  likeLabel: {
    fontSize: 13,
    color: RBZ.muted,
    fontWeight: "600",
    flex: 1,
  },
  likeValue: {
    fontSize: 14,
    color: RBZ.ink,
    fontWeight: "700",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.2)",
  },
  chipText: {
    color: RBZ.c2,
    fontWeight: "700",
    fontSize: 13,
  },
  hobbyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(233,72,106,0.08)",
  },
  hobbyChipText: {
    color: RBZ.c3,
    fontWeight: "700",
    fontSize: 13,
  },
   viewerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  viewerHeaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  viewerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  viewerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  viewerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  viewerTitle: {
    color: RBZ.white,
    fontSize: 16,
    fontWeight: "800",
  },
  viewerSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  viewerBody: {
    flex: 1,
  },
  zoomablePage: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
  videoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlaceholder: {
    color: RBZ.white,
    fontSize: 18,
  },
  imageViewerMediaActionsWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  videoViewerMediaActionsWrap: {
    width: "100%",
    height: "100%",
  },

  // ✅ viewer swipe nav buttons
  viewerNavBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  viewerNavLeft: {
    left: 10,
  },
  viewerNavRight: {
    right: 10,
  },

  viewerFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  viewerActions: {
    flexDirection: "row",
    gap: 10,
  },
  viewerActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(233,72,106,0.25)",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.3)",
  },
  viewerActionText: {
    color: RBZ.white,
    fontWeight: "700",
    fontSize: 13,
  },

  // ---------------------------------------------------------------------------
  // ✅ NEW PROFILE INFO UI
  // ---------------------------------------------------------------------------
  infoRows: {
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(17,24,39,0.02)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.05)",
  },
  infoIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216,52,95,0.08)",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.14)",
  },
  infoRowMid: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: RBZ.muted,
    fontWeight: "700",
  },
  infoValue: {
    marginTop: 2,
    fontSize: 14,
    color: RBZ.ink,
    fontWeight: "800",
  },

  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(233,72,106,0.08)",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.16)",
  },
  pillText: {
    color: RBZ.c2,
    fontWeight: "800",
    fontSize: 13,
  },

  subSectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    color: RBZ.muted,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.2,
  },

  chipsWrapSoft: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  softChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(216,52,95,0.06)",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.12)",
  },
  softChipText: {
    color: RBZ.c2,
    fontWeight: "800",
    fontSize: 13,
  },
  
});

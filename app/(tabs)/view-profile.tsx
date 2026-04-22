
/**
 * ============================================================================
 * 📁 File: app/(tabs)/view-profile.tsx
 * 🎯 Screen: RomBuzz Mobile — ViewProfile (MATCHED USERS ONLY)
 * 🚀 Fully wired with backend, real-time data, complete UI
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import BuzzPokeCard, {
  type BuzzPokeMeta,
} from "@/src/components/profile/BuzzPokeCard";
import PhotoGrid from "@/src/components/profile/Gallery/PhotoGrid";
import ReelGrid from "@/src/components/profile/Gallery/ReelGrid";
import { API_BASE } from "@/src/config/api";

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
  type?: "image" | "reel";

  caption?: string;
  privacy?: string;
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

  // likes/dislikes can be string OR arrays depending on backend/user save
  likes?: any;
  dislikes?: any;

  voiceUrl?: string;
  voiceIntro?: string;

  // ✅ ProfileInfoTab fields (mobile)
  pronouns?: string;
  country?: string;
  hometown?: string;
  travelMode?: boolean;

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

  // 🔥 IMPORTANT: preserve backend reel type
  if (
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
// ---------------------------------------------------------------------------
// PROFILE INFO HELPERS (supports string / array formats from backend)
// ---------------------------------------------------------------------------
const toTitle = (s: any) => {
  const t = String(s || "").trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const asArray = (v: any): string[] => {
  if (Array.isArray(v)) {
    return v
      .flat()
      .filter(Boolean)
      .map((x) => String(x).trim())
      .filter(Boolean);
  }

  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];

    // ✅ split by comma OR newline OR bullet OR pipe
    const parts = t
      .split(/,|\n|•|\||·/g)
      .map((x) => x.trim())
      .filter(Boolean);

    // if splitting didn't really split, keep original as single item
    return parts.length > 1 ? parts : [t];
  }

  return [];
};


const hasAny = (...vals: any[]) => {
  return vals.some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return String(v || "").trim().length > 0;
  });
};

export default function ViewProfile() {
   const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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
  const [stories, setStories] = useState<any[]>([]);
  const [buzzMeta, setBuzzMeta] = useState<BuzzPokeMeta>({
    count: 0,
    lastBuzz: null,
    lastBuzzLabel: "No buzz yet",
  });
  const hasStory = stories.length > 0;

  // voice intro
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  // gallery
  const [tab, setTab] = useState<"photos" | "reels">("photos");
   const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerItems, setViewerItems] = useState<MediaItem[]>([]);
  const viewerListRef = useRef<FlatList<MediaItem>>(null);

  const [refreshing, setRefreshing] = useState(false);

  const goToViewerIndex = (nextIndex: number) => {
    const max = Math.max(0, (viewerItems?.length || 0) - 1);
    const clamped = Math.max(0, Math.min(nextIndex, max));
    setViewerIndex(clamped);
    try {
      viewerListRef.current?.scrollToIndex({ index: clamped, animated: true });
    } catch {}
  };

  // ✅ 3-dot menu as true overlay (so it never hides under About)
  const [showMenu, setShowMenu] = useState(false);
  const menuBtnRef = useRef<View | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const [blockLoading, setBlockLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [unmatchLoading, setUnmatchLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState("");

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
  
  // Debug log
  console.log('Processing media for user:', {
    media: user?.media?.slice(0, 2),
    photos: user?.photos?.slice(0, 2)
  });
  
  // Extract from all possible fields
  const rawMedia = (Array.isArray(user?.media) ? user.media : []) as any[];
  const rawPhotos = (Array.isArray(user?.photos) ? user.photos : []) as any[];
  const gallery = (Array.isArray(user?.gallery) ? user.gallery : []) as any[];
  const uploads = (Array.isArray(user?.uploads) ? user.uploads : []) as any[];
  
  // Combine all sources
  const allRaw = [...rawMedia, ...rawPhotos, ...gallery, ...uploads];
  
  console.log('Total raw items:', allRaw.length);
  
  const merged = allRaw
    .map((item: any, idx: number): MediaItem | undefined => {
      // Handle string URLs (simple format)
      if (typeof item === 'string') {
        const url = item.trim();
        if (!url) return undefined;
        
        return {
          id: `media-${idx}-${Date.now()}`,
          url,
          type: inferType({ url }),
          caption: '',
          privacy: 'public'
        };
      }
      
      // Handle object format
      if (item && typeof item === 'object') {
        const id = String(item?.id || item?._id || `item-${idx}-${Date.now()}`);
        
        // Try multiple possible URL fields
        const url = String(
          item?.url || 
          item?.secure_url || 
          item?.src || 
          item?.mediaUrl ||
          item?.fileUrl ||
          item?.imageUrl ||
          item?.videoUrl ||
          ''
        ).trim();
        
        if (!url) return undefined;
        
        const caption = String(item?.caption || item?.text || item?.description || '');
        const privacy = String(item?.privacy || item?.visibility || 'public').toLowerCase();
        
        return {
          id,
          url,
          type: inferType(item),
          caption,
          privacy
        };
      }
      
      return undefined;
    })
    .filter((m): m is MediaItem => Boolean(m));
  
  console.log('Processed media items:', merged.length, merged.slice(0, 2));
  
  // Filter by visibility
  const visible = merged.filter((m) => canViewerSeeMedia(m));
  console.log('Visible after filtering:', visible.length);
  
  return visible;
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
    const loadProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      if (!token) throw new Error("Session expired");

      // 1. Load profile with match check
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

          const data: ProfileResponse = await res.json().catch(() => ({} as any));

      // ✅ still fail if request itself failed or user payload missing
      if (!res.ok || !data?.user) {
        Alert.alert("Profile unavailable", "Failed to load this profile.", [
          { text: "Go back", onPress: () => router.back() },
        ]);
        return;
      }

      setProfile(data);
      setUser(data.user);

      // ✅ Source of truth for matched state = likes/status endpoint
      let resolvedMatched = !!data?.matched;
      try {
        const statusRes = await fetch(
          `${API_BASE}/likes/status/${encodeURIComponent(String(userId))}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const statusData = await statusRes.json().catch(() => ({}));
        if (statusRes.ok) {
          resolvedMatched = !!statusData?.matched;
        }
      } catch {
        // keep fallback from profile response
      }

      setMatched(resolvedMatched);

      // 2. Load stories
      try {
        const storiesRes = await fetch(`${API_BASE}/stories/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const storiesData = await storiesRes.json().catch(() => ({}));
        setStories(Array.isArray(storiesData?.stories) ? storiesData.stories : []);
      } catch {
        setStories([]);
      }

    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load profile");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [userId])
  );

  useEffect(() => {
    loadProfile();
  }, [userId]);

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
        await soundRef.current.stopAsync();
        setPlaying(false);
        return;
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

      sound.setOnPlaybackStatusUpdate((s: any) => {
        if (s?.didJustFinish) setPlaying(false);
      });
    } catch {
      Alert.alert("Voice", "Unable to play voice intro");
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

  const handleReport = async () => {
    if (!userId || reportLoading) return;

    const trimmedReason = reportReason.trim();
    if (!trimmedReason) return;

    try {
      setReportLoading(true);
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      
      const res = await fetch(`${API_BASE}/report`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ targetId: userId, reason: trimmedReason }),
      });

      if (!res.ok) throw new Error("Report failed");

      Alert.alert("Report Submitted", "Thank you for helping keep RomBuzz safe.");
      setReportModalVisible(false);
      setReportReason("");
      setShowMenu(false);
      
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to submit report");
    } finally {
      setReportLoading(false);
    }
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
  // OPEN MEDIA VIEWER
  // ---------------------------------------------------------------------------
  const openViewer = (items: MediaItem[], index: number) => {
    setViewerItems(items);
    setViewerIndex(index);
    setViewerOpen(true);
  };

  // ---------------------------------------------------------------------------
  // RENDER STATES
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={RBZ.c3} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

     if (!user) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.unavailableText}>Profile unavailable</Text>
        <Text style={styles.unavailableSubtext}>This profile could not be loaded.</Text>
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go back</Text>
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
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[RBZ.c2, RBZ.c3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={handleGoBack} style={styles.backButtonHeader}>
          <Ionicons name="arrow-back" size={22} color={RBZ.white} />
        </Pressable>
        
           <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>View Profile</Text>
          <Text style={styles.headerSubtitle}>Matched Connection</Text>
        </View>
        
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProfile}
            tintColor={RBZ.c3}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 120,
        }}
      >
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <Pressable
            onPress={() => {
              if (!hasStory) {
                Alert.alert("Story", "No active story right now.");
                return;
              }
              Alert.alert("Story", "Stories feature coming soon!");
            }}
            style={styles.avatarContainer}
          >
            <LinearGradient
              colors={hasStory ? [RBZ.c2, RBZ.c3, RBZ.c4] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyRing}
            >
              <View style={styles.avatarInner}>
                <Image 
                  source={{ uri: user.avatar || "https://i.pravatar.cc/300?img=12" }} 
                  style={styles.avatar} 
                />
                <View style={[
                  styles.statusDot,
                  { backgroundColor: user?.online ? RBZ.success : RBZ.offline }
                ]} />
              </View>
            </LinearGradient>
          </Pressable>

                  <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{fullName}</Text>
              {age !== null && (
                <Text style={styles.age}>, {age}</Text>
              )}
              {distanceText ? (
                <Text style={styles.distanceText}> • {distanceText}</Text>
              ) : null}
            </View>

            {viewingAsMatched ? (
              <View style={styles.buzzMetaRow}>
                <View style={styles.buzzMetaChip}>
                  <Ionicons name="flash" size={12} color={RBZ.c2} />
                  <Text style={styles.buzzMetaCount}>
                    {Number(buzzMeta?.count || 0)} streak
                  </Text>
                </View>

                <Text style={styles.buzzMetaTime}>
                  {buzzMeta?.lastBuzzLabel || "No buzz yet"}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <BuzzPokeCard
              userId={userId}
              matched={viewingAsMatched}
              onMetaChange={setBuzzMeta}
            />

            <Pressable
              onPress={() => {
                router.push({
                  pathname: "/chat/[peerId]" as any,
                  params: {
                    peerId: userId,
                    name: fullName,
                    avatar: user.avatar || "",
                  },
                });
              }}
              style={[styles.actionButton, styles.chatButton]}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color={RBZ.c2} />
              <Text style={styles.chatButtonText}>Chat</Text>
            </Pressable>

            {/* 3-dot Menu Button (opens a Modal overlay so it never goes under About) */}
            <View style={styles.menuContainer}>
              <View ref={menuBtnRef} collapsable={false}>
                <Pressable onPress={openMenu} style={styles.menuButton}>
                  <Ionicons name="ellipsis-vertical" size={20} color={RBZ.muted} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* About Section */}
        {user?.bio ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>About</Text>
            </View>
            <Text style={styles.cardContent}>{user.bio}</Text>
          </View>
        ) : null}

        {/* Voice Intro */}
        {voiceUrl ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="mic" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Voice Intro</Text>
            </View>
            <Pressable onPress={playVoice} style={styles.voiceButton}>
              <Ionicons 
                name={playing ? "stop-circle" : "play-circle"} 
                size={28} 
                color={playing ? RBZ.success : RBZ.c2} 
              />
              <Text style={styles.voiceButtonText}>
                {playing ? "Playing..." : "Play Voice Intro"}
              </Text>
            </Pressable>
          </View>
        ) : null}

   {/* Gallery */}
        <View style={styles.galleryCard}>
          <View style={styles.galleryHeader}>
            <View style={styles.galleryTitleRow}>
              <Ionicons name="images" size={20} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Gallery</Text>
            </View>
            
            <View style={styles.galleryTabs}>
              <Pressable
                onPress={() => setTab("photos")}
                style={[styles.tab, tab === "photos" && styles.activeTab]}
              >
                <Text style={[styles.tabText, tab === "photos" && styles.activeTabText]}>
                  Photos ({photos.length})
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => setTab("reels")}
                style={[styles.tab, tab === "reels" && styles.activeTab]}
              >
                <Text style={[styles.tabText, tab === "reels" && styles.activeTabText]}>
                  Reels ({reels.length})
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.galleryHint}>
            {tab === "photos" 
              ? "Shared photos for vibes and moments"
              : "Reels showing personality and interests"}
          </Text>

          {tab === "photos" ? (
            photos.length > 0 ? (
              <View style={styles.gridContainer}>
                <PhotoGrid
                  items={photos}
                  size={gridSize}
                  onOpen={(m: any) => {
                    const idx = photos.findIndex((x) => String(x.id) === String(m?.id));
                    openViewer(photos, Math.max(0, idx));
                  }}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color={RBZ.line} />
                <Text style={styles.emptyText}>No photos shared yet</Text>
              </View>
            )
          ) : reels.length > 0 ? (
            <View style={styles.gridContainer}>
              <ReelGrid
                items={reels}
                size={gridSize}
                onOpen={(m: any) => {
                  const idx = reels.findIndex((x) => String(x.id) === String(m?.id));
                    openViewer(reels, Math.max(0, idx));
                  }}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="videocam-outline" size={48} color={RBZ.line} />
                <Text style={styles.emptyText}>No reels shared yet</Text>
              </View>
            )}
          </View>

        {/* Profile Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={18} color={RBZ.c2} />
            <Text style={styles.cardTitle}>Details</Text>
          </View>
          <View style={styles.detailsGrid}>
            {user?.city ? (
              <View style={styles.detailItem}>
                <Ionicons name="location" size={14} color={RBZ.muted} />
                <Text style={styles.detailLabel}>City</Text>
                <Text style={styles.detailValue}>{user.city}</Text>
              </View>
            ) : null}

            {user?.gender ? (
              <View style={styles.detailItem}>
                <Ionicons name="person" size={14} color={RBZ.muted} />
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{user.gender}</Text>
              </View>
            ) : null}

            {user?.orientation ? (
              <View style={styles.detailItem}>
                <Ionicons name="heart" size={14} color={RBZ.muted} />
                <Text style={styles.detailLabel}>Orientation</Text>
                <Text style={styles.detailValue}>{user.orientation}</Text>
              </View>
            ) : null}

            {user?.lookingFor ? (
              <View style={styles.detailItem}>
                <Ionicons name="search" size={14} color={RBZ.muted} />
                <Text style={styles.detailLabel}>Looking For</Text>
                <Text style={styles.detailValue}>{user.lookingFor}</Text>
              </View>
            ) : null}

            {user?.height ? (
              <View style={styles.detailItem}>
                <Ionicons name="resize" size={14} color={RBZ.muted} />
                <Text style={styles.detailLabel}>Height</Text>
                <Text style={styles.detailValue}>{user.height}</Text>
              </View>
            ) : null}
          </View>

        </View>

        {/* ------------------------------------------------------------------- */}
        {/* ✅ PROFILE INFO (from ProfileInfoTab) — show only if filled */}
        {/* ------------------------------------------------------------------- */}

        {/* BASICS (extra) */}
        {hasAny(user?.pronouns, user?.country, user?.hometown, user?.relationshipStyle) ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Basics</Text>
            </View>

            <View style={styles.infoRows}>
              {user?.pronouns ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="chatbubbles" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Pronouns</Text>
                    <Text style={styles.infoValue}>{toTitle(user.pronouns)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.country ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="flag" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Country</Text>
                    <Text style={styles.infoValue}>{toTitle(user.country)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.hometown ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="home" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Hometown</Text>
                    <Text style={styles.infoValue}>{toTitle(user.hometown)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.relationshipStyle ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="heart-half" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Relationship style</Text>
                    <Text style={styles.infoValue}>{toTitle(user.relationshipStyle)}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* BODY & BASICS */}
        {hasAny(user?.bodyType, user?.fitnessLevel) ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="body" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Body & Basics</Text>
            </View>

            <View style={styles.pillGrid}>
              {user?.bodyType ? (
                <View style={styles.pill}>
                  <Ionicons name="person" size={12} color={RBZ.c2} />
                  <Text style={styles.pillText}>{toTitle(user.bodyType)}</Text>
                </View>
              ) : null}

              {user?.fitnessLevel ? (
                <View style={styles.pill}>
                  <Ionicons name="fitness" size={12} color={RBZ.c2} />
                  <Text style={styles.pillText}>{toTitle(user.fitnessLevel)}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* LIFESTYLE */}
        {hasAny(
          user?.smoking,
          user?.drinking,
          user?.workoutFrequency,
          user?.diet,
          user?.sleepSchedule,
          user?.travelStyle,
          user?.petsPreference,
          user?.travelMode
        ) ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="leaf" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Lifestyle</Text>
            </View>

            <View style={styles.infoRows}>
              {user?.smoking ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="flame" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Smoking</Text>
                    <Text style={styles.infoValue}>{toTitle(user.smoking)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.drinking ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="wine" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Drinking</Text>
                    <Text style={styles.infoValue}>{toTitle(user.drinking)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.workoutFrequency ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="barbell" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Workout</Text>
                    <Text style={styles.infoValue}>{toTitle(user.workoutFrequency)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.diet ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="restaurant" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Diet</Text>
                    <Text style={styles.infoValue}>{toTitle(user.diet)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.sleepSchedule ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="moon" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Sleep</Text>
                    <Text style={styles.infoValue}>{toTitle(user.sleepSchedule)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.travelStyle ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="airplane" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Travel style</Text>
                    <Text style={styles.infoValue}>{toTitle(user.travelStyle)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.petsPreference ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="paw" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Pets</Text>
                    <Text style={styles.infoValue}>{toTitle(user.petsPreference)}</Text>
                  </View>
                </View>
              ) : null}

              {typeof user?.travelMode === "boolean" ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="navigate" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Travel mode</Text>
                    <Text style={styles.infoValue}>{user.travelMode ? "On" : "Off"}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* BACKGROUND */}
        {hasAny(user?.educationLevel, user?.school, user?.jobTitle, user?.company, user?.languages) ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="school" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Background</Text>
            </View>

            <View style={styles.infoRows}>
              {user?.educationLevel ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="ribbon" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Education</Text>
                    <Text style={styles.infoValue}>{toTitle(user.educationLevel)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.school ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="library" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>School</Text>
                    <Text style={styles.infoValue}>{toTitle(user.school)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.jobTitle ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="briefcase" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Job title</Text>
                    <Text style={styles.infoValue}>{toTitle(user.jobTitle)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.company ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="business" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Company</Text>
                    <Text style={styles.infoValue}>{toTitle(user.company)}</Text>
                  </View>
                </View>
              ) : null}

              {asArray(user?.languages).length > 0 ? (
                <View style={styles.chipsWrapSoft}>
                  {asArray(user.languages).map((lang, idx) => (
                    <View key={`${lang}-${idx}`} style={styles.softChip}>
                      <Ionicons name="language" size={12} color={RBZ.c2} />
                      <Text style={styles.softChipText}>{toTitle(lang)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* BELIEFS */}
        {hasAny(user?.religion, user?.politicalViews, user?.zodiac) ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="aperture" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Beliefs</Text>
            </View>

            <View style={styles.infoRows}>
              {user?.religion ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="sparkles" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Religion</Text>
                    <Text style={styles.infoValue}>{toTitle(user.religion)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.politicalViews ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="globe" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Political views</Text>
                    <Text style={styles.infoValue}>{toTitle(user.politicalViews)}</Text>
                  </View>
                </View>
              ) : null}

              {user?.zodiac ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBubble}>
                    <Ionicons name="planet" size={14} color={RBZ.c2} />
                  </View>
                  <View style={styles.infoRowMid}>
                    <Text style={styles.infoLabel}>Zodiac</Text>
                    <Text style={styles.infoValue}>{toTitle(user.zodiac)}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* FAVORITES */}
        {hasAny(user?.favoriteMusic, user?.favoriteMovies) ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Favorites</Text>
            </View>

            {asArray(user?.favoriteMusic).length > 0 ? (
              <>
                <Text style={styles.subSectionTitle}>Music</Text>
                <View style={styles.chipsWrapSoft}>
                  {asArray(user.favoriteMusic).map((x, idx) => (
                    <View key={`fm-${x}-${idx}`} style={styles.softChip}>
                      <Ionicons name="musical-notes" size={12} color={RBZ.c2} />
                      <Text style={styles.softChipText}>{x}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {asArray(user?.favoriteMovies).length > 0 ? (
              <>
                <Text style={styles.subSectionTitle}>Movies</Text>
                <View style={styles.chipsWrapSoft}>
                  {asArray(user.favoriteMovies).map((x, idx) => (
                    <View key={`mv-${x}-${idx}`} style={styles.softChip}>
                      <Ionicons name="film" size={12} color={RBZ.c2} />
                      <Text style={styles.softChipText}>{x}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        {/* VIBE TAGS (optional bonus if present) */}
        {asArray(user?.vibeTags).length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="happy" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Vibes</Text>
            </View>
            <View style={styles.pillGrid}>
              {asArray(user.vibeTags).map((tag, idx) => (
                <View key={`vb-${tag}-${idx}`} style={styles.pill}>
                  <Ionicons name="sparkles" size={12} color={RBZ.c2} />
                  <Text style={styles.pillText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}


        {/* Interests */}
        {user?.interests && user.interests.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Interests</Text>
            </View>
            <View style={styles.chipsContainer}>
              {user.interests.map((interest, idx) => (
                <LinearGradient
                  key={`${interest}-${idx}`}
                  colors={['rgba(216,52,95,0.1)', 'rgba(233,72,106,0.05)']}
                  style={styles.chip}
                >
                  <Ionicons name="star" size={12} color={RBZ.c2} />
                  <Text style={styles.chipText}>{interest}</Text>
                </LinearGradient>
              ))}
            </View>
          </View>
        )}
          {/* Likes & Dislikes */}
                 {(user?.likes || user?.dislikes) && (
            <View style={styles.likesSection}>
              {user?.likes ? (
                <View style={styles.likeItem}>
                  <Ionicons name="thumbs-up" size={14} color={RBZ.success} />
                  <Text style={styles.likeLabel}>Likes</Text>
                 <View style={styles.chipsWrapSoft}>
                  {asArray(user.likes).map((x, idx) => (
                    <View key={`like-${x}-${idx}`} style={styles.softChip}>
                      <Ionicons name="thumbs-up" size={12} color={RBZ.success} />
                      <Text style={styles.softChipText}>{x}</Text>
                    </View>
                  ))}
                </View>
                </View>
              ) : null}

              {user?.dislikes ? (
                <View style={styles.likeItem}>
                  <Ionicons name="thumbs-down" size={14} color={RBZ.error} />
                  <Text style={styles.likeLabel}>Dislikes</Text>
                  <View style={styles.chipsWrapSoft}>
                    {asArray(user.dislikes).map((x, idx) => (
                      <View key={`dislike-${x}-${idx}`} style={styles.softChip}>
                        <Ionicons name="thumbs-down" size={12} color={RBZ.error} />
                        <Text style={styles.softChipText}>{x}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          )}

        {/* Hobbies */}
        {user?.hobbies && user.hobbies.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="game-controller" size={18} color={RBZ.c2} />
              <Text style={styles.cardTitle}>Hobbies</Text>
            </View>
            <View style={styles.chipsContainer}>
              {user.hobbies.map((hobby, idx) => (
                <View key={`${hobby}-${idx}`} style={styles.hobbyChip}>
                  <Ionicons name="checkmark-circle" size={12} color={RBZ.c3} />
                  <Text style={styles.hobbyChipText}>{hobby}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
                  profile?.blocked && { color: RBZ.success },
                ]}
              >
                {blockLoading ? "Processing..." : profile?.blocked ? "Unblock" : "Block"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (reportLoading) return;
                setReportModalVisible(true);
              }}
              disabled={reportLoading}
              style={styles.menuItem}
            >
              <Ionicons name="warning" size={16} color={RBZ.warning} />
              <Text style={styles.menuItemText}>
                {reportLoading ? "Processing..." : "Report"}
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

      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (reportLoading) return;
          setReportModalVisible(false);
        }}
      >
        <Pressable
          style={styles.reportModalBackdrop}
          onPress={() => {
            if (reportLoading) return;
            setReportModalVisible(false);
          }}
        >
          <Pressable style={styles.reportModalCard} onPress={() => {}}>
            <Text style={styles.reportModalTitle}>Report User</Text>
            <Text style={styles.reportModalHelper}>
              Share a short reason so we can review this report.
            </Text>

            <TextInput
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="Describe what happened"
              placeholderTextColor={RBZ.muted}
              multiline
              textAlignVertical="top"
              editable={!reportLoading}
              style={styles.reportInput}
            />

            <View style={styles.reportActions}>
              <Pressable
                onPress={() => {
                  if (reportLoading) return;
                  setReportModalVisible(false);
                }}
                style={[styles.reportActionButton, styles.reportCancelButton]}
              >
                <Text style={styles.reportCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleReport}
                disabled={reportLoading}
                style={[styles.reportActionButton, styles.reportSubmitButton, reportLoading && styles.reportSubmitButtonDisabled]}
              >
                <Text style={styles.reportSubmitText}>
                  {reportLoading ? "Submitting..." : "Submit"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Media Viewer */}
      <Modal 
        visible={viewerOpen} 
        transparent={false} 
        animationType="fade" 
        onRequestClose={() => setViewerOpen(false)}
      >
          <View style={styles.viewerContainer}>
            <LinearGradient
              colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']}
              style={[styles.viewerHeader, { paddingTop: insets.top + 8 }]}
              >
              <Pressable onPress={() => setViewerOpen(false)} style={styles.viewerCloseButton}>
                <Ionicons name="close" size={24} color={RBZ.white} />
              </Pressable>
              
              <View style={styles.viewerTitleContainer}>
                <Text style={styles.viewerTitle} numberOfLines={1}>
                  {fullName}'s {viewerItems[viewerIndex]?.type === "reel" ? "Reel" : "Photo"}
                </Text>
                <Text style={styles.viewerSubtitle}>
                  {viewerIndex + 1} of {viewerItems.length}
                </Text>
              </View>
              
              <View style={{ width: 44 }} />
            </LinearGradient>
             <View style={styles.viewerBody}>
                <FlatList
                ref={(r) => {
                  // ✅ callback refs must return void (TS fix)
                  // @ts-ignore
                  viewerListRef.current = r;
                }}
                data={viewerItems}
                keyExtractor={(item) => String(item.id)}
                horizontal

                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={
                  viewerItems.length > 0 ? Math.max(0, Math.min(viewerIndex, viewerItems.length - 1)) : 0
                }
                getItemLayout={(_, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}

                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const next = Math.round(x / Math.max(1, width));
                  setViewerIndex(next);
                }}
                renderItem={({ item }) => {
                  return (
                    <View style={{ width }}>
                      {item?.type === "reel" ? (
                        <View style={styles.videoContainer}>
                          {/* Video player placeholder (your reel player can go here later) */}
                          <Text style={styles.videoPlaceholder}>Video Player</Text>
                        </View>
                      ) : (
                        <Image
                          source={{ uri: item?.url }}
                          style={styles.viewerImage}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  );
                }}
              />

              {/* ✅ Tap navigation (prev/next) */}
              {viewerItems.length > 1 ? (
                <>
                  <Pressable
                    onPress={() => goToViewerIndex(viewerIndex - 1)}
                    style={[styles.viewerNavBtn, styles.viewerNavLeft]}
                    hitSlop={12}
                  >
                    <Ionicons name="chevron-back" size={26} color={RBZ.white} />
                  </Pressable>

                  <Pressable
                    onPress={() => goToViewerIndex(viewerIndex + 1)}
                    style={[styles.viewerNavBtn, styles.viewerNavRight]}
                    hitSlop={12}
                  >
                    <Ionicons name="chevron-forward" size={26} color={RBZ.white} />
                  </Pressable>
                </>
              ) : null}
            </View>

          </View>
        </Modal>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: RBZ.c2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    color: RBZ.white,
    fontSize: 18,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
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
  storyRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
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
  reportModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.35)",
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  reportModalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: RBZ.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  reportModalTitle: {
    color: RBZ.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  reportModalHelper: {
    marginTop: 6,
    color: RBZ.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  reportInput: {
    minHeight: 120,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
    backgroundColor: RBZ.soft,
    color: RBZ.ink,
    fontSize: 14,
    fontWeight: "500",
  },
  reportActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  reportActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  reportCancelButton: {
    backgroundColor: "rgba(17,24,39,0.04)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },
  reportCancelText: {
    color: RBZ.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  reportSubmitButton: {
    backgroundColor: RBZ.c2,
  },
  reportSubmitButtonDisabled: {
    opacity: 0.7,
  },
  reportSubmitText: {
    color: RBZ.white,
    fontSize: 14,
    fontWeight: "800",
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
  galleryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: RBZ.cardBg,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },
  galleryHeader: {
    marginBottom: 12,
  },
  galleryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  galleryTabs: {
    flexDirection: "row",
    backgroundColor: "rgba(17,24,39,0.03)",
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: RBZ.white,
    shadowColor: RBZ.c3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: RBZ.muted,
    fontWeight: "700",
    fontSize: 13,
  },
  activeTabText: {
    color: RBZ.c2,
    fontWeight: "800",
  },
  galleryHint: {
    color: RBZ.muted,
    fontWeight: "600",
    fontSize: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  gridContainer: {
    marginTop: 8,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    color: RBZ.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  viewerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  viewerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 10,
  },
  viewerTitle: {
    color: RBZ.white,
    fontSize: 16,
    fontWeight: "800",
  },
  viewerSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  viewerBody: {
    flex: 1,
    justifyContent: "center",
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

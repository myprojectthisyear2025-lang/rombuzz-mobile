/**
 * ============================================================================
 * 📁 File: app/(tabs)/discover-profile.tsx
 * 🎯 Screen: RomBuzz — Discover Profile (READ-ONLY, PRE-MATCH)
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

import { API_BASE } from "@/src/config/api";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  bg: "#ffffff",
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
  if (typeof v === "boolean") return v === true; // only show true booleans
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

  // Global profile hidden
  if (u?.visibilityMode === "hidden") return false;

  // Per-field visibility
  const vis = u?.fieldVisibility?.[field];

  // Default = public
  if (!vis || vis === "public") return true;

  // Discover is PRE-MATCH → do NOT show matches-only fields
  if (vis === "matches") return false;

  return false;
}


export default function DiscoverProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string; preview?: string }>();

  const userId = String(params.id || "");
// Preview is allowed only for skeletons — not content
const previewUser = params.preview
  ? JSON.parse(decodeURIComponent(String(params.preview)))
  : null;


const [user, setUser] = useState<any>(previewUser || null);

// ✅ If we already have preview data, don't block the UI with a spinner
const [loading, setLoading] = useState(!previewUser);


  const [hydrated, setHydrated] = useState(false); // ✅ ADD THIS
// 🔍 Fullscreen photo viewer
const [viewerOpen, setViewerOpen] = useState(false);
const [viewerIndex, setViewerIndex] = useState(0);
const viewerRef = useRef<ScrollView>(null);


  // Voice
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  // Compute age
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

 // Distance (US → miles, others → km)
const distanceText = useMemo(() => {
  const d = user?.distanceMeters;
  if (typeof d !== "number") return "";

  const isUS =
    user?.country === "United States" ||
    user?.country === "US" ||
    user?.countryCode === "US";

  if (isUS) {
    const miles = d / 1609.34;
    return `${miles.toFixed(1)} miles away`;
  }

  return `${(d / 1000).toFixed(1)} km away`;
}, [user]);


  // Voice URL
  const voiceUrl = useMemo(() => {
    if (!user) return "";
    if (user.voiceIntro) return user.voiceIntro;
    if (Array.isArray(user.favorites)) {
      const v = user.favorites.find((f: string) => f.startsWith("voice:"));
      return v ? v.replace("voice:", "") : "";
    }
    return "";
  }, [user]);

  // Photos only (Discover = photos, no reels)
 const photos: string[] = useMemo(() => {
  const set = new Set<string>();

  // media objects (PhotoBuzz / FaceBuzz)
  if (Array.isArray(user?.media)) {
    user.media.forEach((m: any) => {
      if (typeof m === "string") set.add(m);
      else if (m?.url) set.add(m.url);
    });
  }

  // legacy photos array
  if (Array.isArray(user?.photos)) {
    user.photos.forEach((p: any) => {
      if (typeof p === "string") set.add(p);
      else if (p?.url) set.add(p.url);
    });
  }

  return Array.from(set).slice(0, 9);
}, [user]);


 // Load from backend (hydration)
useEffect(() => {
  if (!userId) return;
  (async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      if (!token) return;

      const res = await fetch(`${API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

   if (data?.user) {
  const next = pickPublicFields(data.user);

  setUser((prev: any) => {
    // keep preview gallery + add server gallery (never shrink)
    const mergedMedia = [
      ...(Array.isArray(prev?.media) ? prev.media : []),
      ...(Array.isArray(next?.media) ? next.media : []),
    ];

    const mergedPhotos = [
      ...(Array.isArray(prev?.photos) ? prev.photos : []),
      ...(Array.isArray(next?.photos) ? next.photos : []),
    ];

    // de-dupe by url/string
    const dedupe = (arr: any[]) => {
      const seen = new Set<string>();
      const out: any[] = [];
      for (const x of arr) {
        const k =
          typeof x === "string" ? x : typeof x?.url === "string" ? x.url : "";
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push(x);
      }
      return out;
    };

  const base = { ...(prev || {}) };

// only overwrite if backend actually has a value
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
      : (prev as any)?.distanceMeters,
  media: dedupe(mergedMedia),
  photos: dedupe(mergedPhotos),
};

  });

  setHydrated(true);
}


    } catch {
      // silent fail (preview already shown)
    } finally {
      setLoading(false);
    }
  })();
}, [userId]);


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
      {/* Header */}
      <LinearGradient
        colors={[RBZ.c2, RBZ.c3]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
       <Pressable onPress={() => router.replace("/(tabs)/discover")}>
        <Ionicons name="arrow-back" size={22} color={RBZ.white} />
      </Pressable>

        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 22 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: user.avatar || photos[0] }}
            style={styles.avatar}
          />
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {user.firstName}
            {age !== null ? `, ${age}` : ""}
          </Text>

          <View
            style={[
              styles.onlineDot,
              { backgroundColor: user?.isOnline ? "#22c55e" : "#9ca3af" },
            ]}
          />
        </View>


       {distanceText ? (
  <Text style={styles.distance}>{distanceText}</Text>
) : null}

        </View>

        {/* Voice */}
        {voiceUrl ? (
          <Pressable onPress={playVoice} style={styles.voice}>
            <Ionicons
              name={playing ? "stop-circle" : "play-circle"}
              size={28}
              color={RBZ.c2}
            />
            <Text style={styles.voiceText}>
              {playing ? "Playing..." : "Play voice intro"}
            </Text>
          </Pressable>
        ) : null}

        {/* Bio */}
        {user.bio ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.cardText}>{user.bio}</Text>
          </View>
        ) : null}

          {/* Gallery */}
       {photos.length > 0 && (
          <View style={styles.gallery}>
            {photos.map((p, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  setViewerIndex(i);
                  setViewerOpen(true);
                }}
              >
                <Image
                  source={{ uri: p }}
                  style={{
                   width: (width - 32 - 12) / 3,
                    height: (width - 32 - 12) / 3,

                    borderRadius: 10,
                  }}
                />
              </Pressable>
            ))}
  </View>
)}

            {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>

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
            <Info label="Travel mode" value="On" />
          )}
        </View>

        {/* Lifestyle */}
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

        {/* Background */}
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

        {/* Beliefs */}
        {(showField(user, "religion", user.religion) ||
          showField(user, "politicalViews", user.politicalViews) ||
          showField(user, "zodiac", user.zodiac)) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Beliefs</Text>

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

        {/* Preferences */}
        {(showField(user, "favoriteMusic", user.favoriteMusic) ||
          showField(user, "favoriteMovies", user.favoriteMovies) ||
          showField(user, "travelStyle", user.travelStyle) ||
          showField(user, "petsPreference", user.petsPreference) ||
          showField(user, "likes", user.likes) ||
          showField(user, "dislikes", user.dislikes)) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Preferences</Text>

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


        {/* Interests */}
        {user.interests?.length ? (
          <ChipSection title="Interests" items={user.interests} />
        ) : null}

        {/* Hobbies */}
        {user.hobbies?.length ? (
          <ChipSection title="Hobbies" items={user.hobbies} />
        ) : null}
      </ScrollView>

      {/* Fullscreen Photo Viewer */}
      {viewerOpen && (
        <View style={styles.viewerOverlay}>
          {/* Close */}
          <Pressable
            onPress={() => setViewerOpen(false)}
            style={[
              styles.viewerClose,
              { top: insets.top + 12 }
            ]}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>

          {/* Swipeable images */}
         <ScrollView
            ref={viewerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onLayout={() => {
              // 🔥 scroll ONLY after layout is ready
              viewerRef.current?.scrollTo({
                x: viewerIndex * width,
                animated: false,
              });
            }}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
              setViewerIndex(index);
            }}
          >

            {photos.map((p, i) => (
             <View
                key={i}
                style={[
                  styles.viewerSlide,
                  {
                    width, // ✅ REAL WIDTH
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                  }
                ]}
              >

                <Image
                  source={{ uri: p }}
                  style={styles.viewerImage}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: "space-between",
  },
  headerTitle: {
    color: RBZ.white,
    fontSize: 16,
    fontWeight: "600",
  },

  hero: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: { fontSize: 22, fontWeight: "700", color: RBZ.ink },


distance: {
  color: RBZ.muted,
  fontSize: 13,
},


  voice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  voiceText: { color: RBZ.c2, fontWeight: "500" },

  card: {
    backgroundColor: RBZ.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
  },
  cardTitle: {
    fontWeight: "700",
    marginBottom: 8,
    color: RBZ.ink,
  },
  cardText: { color: RBZ.ink, lineHeight: 20 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  infoLabel: { color: RBZ.muted },
  infoValue: { color: RBZ.ink, fontWeight: "500" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(233,72,106,0.12)",
    borderRadius: 20,
  },
  chipText: { color: RBZ.c1, fontSize: 13 },

  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 40,
  },
 viewerOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "#000",
  zIndex: 999,
},
nameRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},

onlineDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
},

viewerClose: {
  position: "absolute",
  right: 16,
  zIndex: 1000,
  padding: 6,
  backgroundColor: "rgba(0,0,0,0.4)",
  borderRadius: 20,
},

viewerSlide: {
  width: undefined, // set dynamically
  height: "100%",
  justifyContent: "center",
  alignItems: "center",
},



viewerImage: {
  width: "100%",
  height: "100%",
  resizeMode: "contain",
},

});

/**
 * ============================================================================
 * 📁 File: app/(tabs)/profile.tsx
 * 🎯 RomBuzz Mobile — Profile (FULL: Web parity, minus Social Stats)
 *
 * Uses backend (NO backend changes):
 *  - GET  /profile/full         → load user + media + posts
 *  - PUT  /users/me             → update profile fields
 *  - POST /upload-media         → save gallery items (caption buckets)
 *  - POST /posts                → create MyBuzz post (optional)
 *  - PATCH /account/deactivate  → deactivate
 *  - DELETE /account/delete     → delete
 *
 * Notes:
 *  - Social Stats excluded (you have a separate tab already)
 *  - Uses Cloudinary unsigned upload (same as web)
 * ============================================================================
 */

import PrivateNotesTab from "@/src/components/profile/PrivateNotesTab";
import ProfileInfoTab from "@/src/components/profile/ProfileInfoTab";
import AddStoryModal from "@/src/components/story/AddStoryModal";
import StoryAvatar from "@/src/components/story/StoryAvatar";
import StoryViewer from "@/src/components/story/StoryViewer";

import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BuzzStreakCard from "@/src/components/profile/BuzzStreakCard";
import GallerySection from "@/src/components/profile/Gallery/GallerySection";
import { API_BASE } from "@/src/config/api";


const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b40000ff",
  white: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  bg: "#ffffff",
  card: "#ffffff",
  soft: "#f8fafc",
  line: "rgba(17,24,39,0.08)",
} as const;

// Cloudinary (same as web Profile.jsx)
const CLOUD_NAME = "drhx99m5f";
const UPLOAD_PRESET = "rombuzz_unsigned";

type Audience = "public" | "matches" | "hidden";
function buildGuidanceList(user: any) {
  if (!user) return [];
  const list: { icon: string; text: string }[] = [];

  const hasVoice =
    Array.isArray(user.favorites) &&
    user.favorites.some((f: string) => f.startsWith("voice:"));

  const photoCount =
    (Array.isArray(user.photos) ? user.photos.length : 0) +
    (Array.isArray(user.media) ? user.media.length : 0);

  if (!hasVoice) {
    list.push({
      icon: "🎧",
      text: "Add a voice intro — people trust voices more than photos.",
    });
  }

  if (photoCount < 3) {
    list.push({
      icon: "📸",
      text: "Add more photos so people can feel your vibe.",
    });
  }

  list.push(
    { icon: "🔥", text: "Check in today to keep your BuzzStreak alive." },
    { icon: "📍", text: "Try MicroBuzz to meet people nearby in real life." },
    { icon: "💞", text: "Swipe on Discover to find new matches." },
    { icon: "📝", text: "Post on MyBuzz so matches know you better." },
    { icon: "✨", text: "Updating your profile boosts visibility." }
  );

  return list;
}


function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function extractVoiceFromFavorites(favorites: any[] = []) {
  for (const item of favorites) {
    if (typeof item === "string" && item.startsWith("voice:")) {
      return item.slice("voice:".length);
    }
  }
  return "";
}

function upsertVoiceInFavorites(favorites: any[] = [], voiceUrl: string) {
  const next = Array.isArray(favorites) ? [...favorites] : [];
  // remove existing voice:
  for (let i = next.length - 1; i >= 0; i--) {
    if (typeof next[i] === "string" && next[i].startsWith("voice:")) next.splice(i, 1);
  }
  if (voiceUrl) next.push(`voice:${voiceUrl}`);
  return next;
}

function computeCompletion(u: any) {
  if (!u) return 0;
  let score = 0;
  const checks = [
    !!u.firstName,
    !!u.bio,
    !!u.avatar,
    Array.isArray(u.interests) && u.interests.length >= 2,
    Array.isArray(u.hobbies) && u.hobbies.length >= 2,
    (Array.isArray(u.photos) && u.photos.length >= 2) ||
      (Array.isArray(u.media) && u.media.length >= 2),
    !!extractVoiceFromFavorites(u.favorites || []),
  ];
  checks.forEach((ok) => (score += ok ? 1 : 0));
  return score / checks.length; // ✅ FIX
}


async function getTokenOrThrow() {
  const t = await SecureStore.getItemAsync("RBZ_TOKEN");
  if (!t) throw new Error("RBZ_TOKEN missing");
  return t;
}

async function apiFetch(path: string, init: RequestInit = {}) {
  init = init || {};
  let token: string;

  try {
    token = await getTokenOrThrow();
  } catch {
    // Token missing → force logout
    await SecureStore.deleteItemAsync("RBZ_TOKEN");
    await SecureStore.deleteItemAsync("RBZ_USER");
    throw new Error("Session expired");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || "Request failed";

    // 🔥 GLOBAL JWT EXPIRY HANDLER
    if (
      msg.toLowerCase().includes("expired") ||
      msg.toLowerCase().includes("invalid token")
    ) {
      await SecureStore.deleteItemAsync("RBZ_TOKEN");
      await SecureStore.deleteItemAsync("RBZ_USER");
      throw new Error("SESSION_EXPIRED");
    }

    throw new Error(msg);
  }

  return data;
}


async function apiJson(path: string, method: string, body: any) {
  let token: string;

  try {
    token = await getTokenOrThrow();
  } catch {
    await SecureStore.deleteItemAsync("RBZ_TOKEN");
    await SecureStore.deleteItemAsync("RBZ_USER");
    throw new Error("SESSION_EXPIRED");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || "Request failed";

    if (
      msg.toLowerCase().includes("expired") ||
      msg.toLowerCase().includes("invalid token")
    ) {
      await SecureStore.deleteItemAsync("RBZ_TOKEN");
      await SecureStore.deleteItemAsync("RBZ_USER");
      throw new Error("SESSION_EXPIRED");
    }

    throw new Error(msg);
  }

  return data;
}


async function uploadToCloudinaryUnsigned(fileUri: string, mimeType: string, filename: string) {
  const fd = new FormData();
 fd.append(
  "file",
  {
    uri: fileUri,
    type: mimeType,
    name: filename,
  } as any
);

  fd.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
    method: "POST",
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Cloudinary upload failed");
  return data; // contains secure_url
}

function Pill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        active ? { backgroundColor: RBZ.c3, borderColor: RBZ.c3 } : null,
      ]}
    >
      <Text style={[styles.pillText, active ? { color: RBZ.white } : null]}>{label}</Text>
    </Pressable>
  );
}

function Chip({
  text,
  selected,
  onPress,
}: {
  text: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected ? { backgroundColor: "rgba(233,72,106,0.14)", borderColor: RBZ.c3 } : null,
      ]}
    >
      <Text style={[styles.chipText, selected ? { color: RBZ.c1 } : null]}>{text}</Text>
    </Pressable>
  );
}

const INTEREST_OPTIONS = [
  "Music",
  "Travel",
  "Movies",
  "TV Shows",
  "Foodie",
  "Coffee",
  "Tea",
  "Fitness",
  "Gym",
  "Yoga",
  "Meditation",
  "Mental Health",
  "Self-growth",
  "Fashion",
  "Streetwear",
  "Photography",
  "Videography",
  "Art",
  "Design",
  "Books",
  "Writing",
  "Poetry",
  "Gaming",
  "Esports",
  "Anime",
  "Manga",
  "Technology",
  "Startups",
  "Business",
  "Investing",
  "Crypto",
  "AI",
  "Psychology",
  "Philosophy",
  "Podcasts",
  "Live concerts",
  "Festivals",
  "Nature",
  "Beaches",
  "Mountains",
  "Sunsets",
  "Road trips",
];

const HOBBY_OPTIONS = [
  "Hiking",
  "Walking",
  "Running",
  "Gym workouts",
  "Yoga",
  "Pilates",
  "Swimming",
  "Cycling",
  "Cooking",
  "Baking",
  "Meal prepping",
  "Trying new recipes",
  "Photography",
  "Photo editing",
  "Videography",
  "Content creation",
  "Dancing",
  "Singing",
  "Playing instruments",
  "DJing",
  "Painting",
  "Sketching",
  "DIY projects",
  "Gardening",
  "Plant care",
  "Reading",
  "Journaling",
  "Writing",
  "Learning languages",
  "Coding",
  "Side projects",
  "Building apps",
  "Gaming",
  "Board games",
  "Chess",
  "Puzzle solving",
  "Travel planning",
  "Backpacking",
  "Volunteering",
  "Community work",
];


// ---------- Info tab pickers (no typing)
const CITY_OPTIONS = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "San Jose",
  "Austin",
  "Jacksonville",
  "San Francisco",
  "Columbus",
  "Fort Worth",
  "Indianapolis",
  "Charlotte",
  "Seattle",
  "Denver",
  "Washington",
];

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Trans Man",
  "Trans Woman",
  "Prefer not to say",
];

const ORIENTATION_OPTIONS = [
  "Straight",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Pansexual",
  "Asexual",
  "Queer",
  "Questioning",
];

const LOOKINGFOR_OPTIONS = [
  "Serious",
  "Casual",
  "Friends",
  "GymBuddy",
  "Flirty",
  "Chill",
  "Timepass",
];


// Chip options (Likes/Dislikes) — you chose picker/chips, no typing
const LIKE_CHIP_OPTIONS = [
  "Coffee",
  "Tea",
  "Dogs",
  "Cats",
  "Gym",
  "Hiking",
  "Movies",
  "Music",
  "Travel",
  "Foodie",
  "Anime",
  "Gaming",
  "Art",
  "Books",
  "Dancing",
  "Cooking",
  "Beach",
  "Mountains",
  "Night drives",
  "Deep talks",
];

const DISLIKE_CHIP_OPTIONS = [
  "Smoking",
  "Drugs",
  "Lies",
  "Ghosting",
  "Rudeness",
  "Drama",
  "Late replies",
  "Negativity",
  "Cheating",
  "Manipulation",
  "Judgmental",
  "Disrespect",
];

// ---------- Helpers
function toTitle(s?: string) {
  return (s || "").trim();
}

function parseHeight(height?: string): { ft: number; inch: number } {
  // expects like: 5'11" or 5'11
  const h = (height || "").trim();
  const m = h.match(/(\d)\s*'\s*(\d{1,2})/);
  if (!m) return { ft: 5, inch: 8 };
  const ft = Math.max(4, Math.min(7, parseInt(m[1], 10) || 5));
  const inch = Math.max(0, Math.min(11, parseInt(m[2], 10) || 0));
  return { ft, inch };
}

function formatHeight(ft: number, inch: number) {
  return `${ft}'${inch}"`;
}

function parseDateSafe(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function computeAgeFromDob(dob?: string) {
  const d = parseDateSafe(dob);
  if (!d) return null;

  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

type ProfileForm = {
  // Identity
  firstName: string;
  lastName: string;
  gender: string;
  genderVisibility: string;
  pronouns: string;
  orientation: string;
  orientationVisibility: string;
  dob: string;

  // Location
  city: string;
  country: string;
  hometown: string;
  latitude: number | null;
  longitude: number | null;
  distanceVisibility: string;
  travelMode: boolean;

  // About
  bio: string;
  voiceUrl?: string;
  vibeTags: string[];

  // Dating
  lookingFor: string;
  relationshipStyle: string;
  interestedIn: string[];

  // Body
  height: string;
  bodyType: string;
  fitnessLevel: string;

  // Lifestyle
  smoking: string;
  drinking: string;
  workoutFrequency: string;
  diet: string;
  sleepSchedule: string;

  // Background
  educationLevel: string;
  school: string;
  jobTitle: string;
  company: string;
  languages: string[];

  // Beliefs
  religion: string;
  politicalViews: string;
  zodiac: string;

  // Interests
  interests: string[];
  hobbies: string[];
  favoriteMusic: string[];
  favoriteMovies: string[];
  travelStyle: string;
  petsPreference: string;

  // Legacy / misc
  likes: string;
  dislikes: string;
  favorites: any[];
  visibilityMode: Audience;
  fieldVisibility: Record<string, Audience>;
};

const VISIBILITY_OPTIONS: {
  label: string;
  value: Audience;
}[] = [
  { label: "Public", value: "public" },
  { label: "Matches only", value: "matches" },
  { label: "Hidden", value: "hidden" },
];
const LOOKING_FOR_MAP = [
  { key: "serious", label: "Serious" },
  { key: "casual", label: "Casual" },
  { key: "friends", label: "Friends" },
  { key: "gymbuddy", label: "GymBuddy" },
  { key: "flirty", label: "Flirty" },
  { key: "chill", label: "Chill" },
  { key: "timepass", label: "Timepass" },
];


const lookingForLabelFromValue = (val?: string) => {
  if (!val) return "";
  // if already a label, keep it
  const byLabel = LOOKING_FOR_MAP.find((x) => x.label.toLowerCase() === val.toLowerCase());
  if (byLabel) return byLabel.label;

  // if it's a key, convert to label
  const byKey = LOOKING_FOR_MAP.find((x) => x.key === val);
  return byKey ? byKey.label : val;
};

const lookingForKeyFromLabel = (label?: string) => {
  if (!label) return "";
  const found = LOOKING_FOR_MAP.find((x) => x.label === label);
  return found ? found.key : label; // fallback
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [user, setUser] = useState<any>(null);
  const completion = useMemo(() => computeCompletion(user), [user]);


  // Modals
  type EditTarget =
  | "bio"
  | "interests"
  | "voice"
  | "info"
  | "all"
  | null;

const [editTarget, setEditTarget] = useState<EditTarget>(null);

// Avatar fullscreen viewer
const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
// Add Story modal
const [addStoryOpen, setAddStoryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
const hydratedOnceRef = useRef(false);

  // ---------- Inline edit (Info tab only)
  type InlineField =
    | "city"
    | "gender"
    | "orientation"
    | "lookingFor"
    | "height"
    | "dob"
    | "likes"
    | "dislikes"
    | null;

  const [editingField, setEditingField] = useState<InlineField>(null);

  const [selectOpen, setSelectOpen] = useState<{
    field: Exclude<InlineField, null | "dob" | "likes" | "dislikes">;
    title: string;
    options: string[];
    value: string;
  } | null>(null);

  const [heightTemp, setHeightTemp] = useState<{ ft: number; inch: number }>(() => parseHeight(""));
  const [dobPickerOpen, setDobPickerOpen] = useState(false);
  const [dobTemp, setDobTemp] = useState<Date>(() => parseDateSafe(user?.dob) || new Date(2000, 0, 1));

  // One-time warning memory (for this session)
  const [identityWarnAccepted, setIdentityWarnAccepted] = useState(false);

  const saveSingleField = async (patch: Partial<any>) => {
    try {
      setUploading(true);

      const data = await apiJson("/users/me", "PUT", patch);

      // ✅ Always update form immediately
      setForm((p: any) => ({ ...p, ...patch }));

      // ✅ Always merge + persist (even if backend returns partial user)
      const merged = {
        ...(user || {}),
        ...patch,
        ...(data?.user || {}),
      };

      setUser(merged);
      await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(merged));


      setEditingField(null);
      setSelectOpen(null);
      setDobPickerOpen(false);

  } catch (e: any) {
  console.log("❌ loadProfile error:", e?.message || e);

  if (e?.message === "SESSION_EXPIRED") {
    Alert.alert("Session expired", "Please log in again.");
    router.replace("/auth/login");
    return;
  }

  Alert.alert("Profile", e?.message || "Failed to load profile");
}
    setUploading(false);


  };

const [tab, setTab] = useState<"info" | "gallery" | "notes">("gallery");

const showBioOnly = editTarget === "bio";
const showInterestsOnly = editTarget === "interests";
const showInfoOnly = editTarget === "info";
const showAll = editTarget === "all";

  // Edit form (subset of web, but supports all core fields + favorites voice)
const [form, setForm] = useState<ProfileForm>({
  // Identity
  firstName: "",
  lastName: "",
  gender: "",
  genderVisibility: "public",
  pronouns: "",
  orientation: "",
  orientationVisibility: "public",
  dob: "",

  // Location
  city: "",
  country: "",
  hometown: "",
  latitude: null,
  longitude: null,
  distanceVisibility: "public",
  travelMode: false,

  // About
  bio: "",
  vibeTags: [],

  // Dating
  lookingFor: "",
  relationshipStyle: "",
  interestedIn: [],

  // Body
  height: "",
  bodyType: "",
  fitnessLevel: "",

  // Lifestyle
  smoking: "",
  drinking: "",
  workoutFrequency: "",
  diet: "",
  sleepSchedule: "",

  // Background
  educationLevel: "",
  school: "",
  jobTitle: "",
  company: "",
  languages: [],

  // Beliefs
  religion: "",
  politicalViews: "",
  zodiac: "",

  // Interests
  interests: [],
  hobbies: [],
  favoriteMusic: [],
  favoriteMovies: [],
  travelStyle: "",
  petsPreference: "",

  // Legacy
  likes: "",
  dislikes: "",
  favorites: [],
  visibilityMode: "public",
  fieldVisibility: {},
});


  // Voice
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [recording, setRecording] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string>("");
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  const fullName = useMemo(() => {
    const fn = user?.firstName || user?.name || "";
    const ln = user?.lastName || "";
    const n = `${fn} ${ln}`.trim();
    return n || "Your Profile";
  }, [user]);

  const avatarUri = useMemo(() => {
    return (
      user?.avatar ||
      user?.avatarUrl ||
      user?.photoUrl ||
      user?.profilePic ||
      user?.photos?.[0] ||
      user?.media?.[0] ||
      ""
    );
  }, [user]);

  const mediaList: string[] = useMemo(() => {
    const a = Array.isArray(user?.media) ? user.media : [];
    const b = Array.isArray(user?.photos) ? user.photos : [];
    // merge unique
    const set = new Set<string>();
    [...a, ...b].forEach((x) => typeof x === "string" && set.add(x));
    return Array.from(set);
  }, [user]);

  const posts = useMemo(() => {
    return Array.isArray(user?.posts) ? user.posts : [];
  }, [user]);
  const [guidanceIndex, setGuidanceIndex] = useState(0);

  // STORY STATE (REAL: backed by /api/stories/me)
const [hasStory, setHasStory] = useState(false);
const [myStories, setMyStories] = useState<any[]>([]);
const [storyOwner, setStoryOwner] = useState<any>(null);
const [storyOpen, setStoryOpen] = useState(false);


// loads story state for avatar ring + future viewer
const loadMyStories = useCallback(async () => {
  try {
    const data = await apiFetch("/stories/me");
    const list = Array.isArray(data?.stories) ? data.stories : [];

    setMyStories(list);
    setHasStory(list.length > 0);
    setStoryOwner(data?.user || null);
  } catch {
    // don't block profile if stories fail
    setMyStories([]);
    setHasStory(false);
    setStoryOwner(null);
  }
}, []);



const guidanceList = useMemo(
  () => buildGuidanceList(user),
  [user]
);

useEffect(() => {
  if (!guidanceList.length) return;

  const id = setInterval(() => {
    setGuidanceIndex((i) => (i + 1) % guidanceList.length);
  }, 30000); // 30 seconds

  return () => clearInterval(id);
}, [guidanceList]);


 const hydrateFormFromUser = useCallback((u: any) => {
  const fav = Array.isArray(u?.favorites) ? u.favorites : [];
  setVoiceUrl(extractVoiceFromFavorites(fav));

if (hydratedOnceRef.current) return;
hydratedOnceRef.current = true;

setForm({
  // Identity
  firstName: u?.firstName || "",
  lastName: u?.lastName || "",
  gender: u?.gender || "",
  genderVisibility: u?.genderVisibility || "public",
  pronouns: u?.pronouns || "",
  orientation: u?.orientation || "",
  orientationVisibility: u?.orientationVisibility || "public",
  dob: u?.dob || "",

  // Location
  city: u?.city || "",
  country: u?.country || "",
  hometown: u?.hometown || "",
  latitude: u?.latitude ?? null,
  longitude: u?.longitude ?? null,
  distanceVisibility: u?.distanceVisibility || "public",
  travelMode: !!u?.travelMode,

  // About
  bio: u?.bio || "",
  vibeTags: Array.isArray(u?.vibeTags) ? u.vibeTags : [],

  // Dating
  lookingFor: u?.lookingFor || "",
  relationshipStyle: u?.relationshipStyle || "",
  interestedIn: Array.isArray(u?.interestedIn) ? u.interestedIn : [],

  // Body
  height: u?.height || "",
  bodyType: u?.bodyType || "",
  fitnessLevel: u?.fitnessLevel || "",

  // Lifestyle
  smoking: u?.smoking || "",
  drinking: u?.drinking || "",
  workoutFrequency: u?.workoutFrequency || "",
  diet: u?.diet || "",
  sleepSchedule: u?.sleepSchedule || "",

  // Background
  educationLevel: u?.educationLevel || "",
  school: u?.school || "",
  jobTitle: u?.jobTitle || "",
  company: u?.company || "",
  languages: Array.isArray(u?.languages) ? u.languages : [],

  // Beliefs
  religion: u?.religion || "",
  politicalViews: u?.politicalViews || "",
  zodiac: u?.zodiac || "",

  // Interests
  interests: Array.isArray(u?.interests) ? u.interests : [],
  hobbies: Array.isArray(u?.hobbies) ? u.hobbies : [],
  favoriteMusic: Array.isArray(u?.favoriteMusic) ? u.favoriteMusic : [],
  favoriteMovies: Array.isArray(u?.favoriteMovies) ? u.favoriteMovies : [],
  travelStyle: u?.travelStyle || "",
  petsPreference: u?.petsPreference || "",

  // Legacy
  likes: Array.isArray(u?.likes) ? u.likes.join(", ") : (u?.likes || ""),
  dislikes: Array.isArray(u?.dislikes) ? u.dislikes.join(", ") : (u?.dislikes || ""),
  favorites: Array.isArray(u?.favorites) ? u.favorites : [],
  visibilityMode: u?.visibilityMode || "public",
  fieldVisibility: u?.fieldVisibility || {},
});


}, []);

 const hydrateUserFromLocal = useCallback(async () => {
  // 🛑 HARD STOP: prevent infinite loop
  if (hydratedOnceRef.current) return;

  try {
    const cached = await SecureStore.getItemAsync("RBZ_USER");
    if (!cached) return;

    const u = JSON.parse(cached);

    hydratedOnceRef.current = true; // ✅ lock immediately

    // ✅ INSTANT PROFILE RENDER (ONE TIME)
    setUser(u);
    hydrateFormFromUser(u);
  } catch (e) {
    console.log("Failed to hydrate RBZ_USER", e);
  }
}, [hydrateFormFromUser]);


const lastProfileSyncRef = useRef<number>(0);

const loadProfile = useCallback(
  async (opts?: { background?: boolean }) => {
    const background = !!opts?.background;

    try {
      // Show loader ONLY if we have no cached user yet
      if (!background && !user) {
        setLoading(true);
      }

      const data = await apiFetch("/profile/full");
      const u = data?.user;

   if (u) {
  setUser(u);

  // only hydrate form once per session
  if (!hydratedOnceRef.current) {
    hydrateFormFromUser(u);
    hydratedOnceRef.current = true;
  }

  await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(u));
}


      // stories can refresh silently
      loadMyStories().catch(() => {});

      lastProfileSyncRef.current = Date.now();
    } catch (e: any) {
      console.log("❌ loadProfile:", e?.message || e);

      if (e?.message === "SESSION_EXPIRED") {
        Alert.alert("Session expired", "Please log in again.");
        router.replace("/auth/login");
        return;
      }

      if (!background) {
        Alert.alert("Profile", e?.message || "Failed to load profile");
      }
    } finally {
      if (!background && !user) {
        setLoading(false);
      }
    }
  },
  [hydrateFormFromUser, loadMyStories, user]
);


useFocusEffect(
  useCallback(() => {
    // 1️⃣ Instant render from cache
    hydrateUserFromLocal();

    // 2️⃣ Silent refresh if stale 
    const now = Date.now();
    const STALE_MS = 60_000;

if (
  !lastProfileSyncRef.current ||
  now - lastProfileSyncRef.current > STALE_MS
) {
  loadProfile({ background: true });
}

  }, [hydrateUserFromLocal, loadProfile])
);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProfile();
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  // ---------- Avatar change (Cloudinary + PUT /users/me + optional gallery save + optional auto-post)
  const changeAvatar = async () => {
    try {
      setUploading(true);
      const pick = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (pick.canceled) return;

      const asset = pick.assets?.[0];
      if (!asset?.uri) return;

      const uploaded = await uploadToCloudinaryUnsigned(asset.uri, asset.mimeType || "image/jpeg", "avatar.jpg");
      const url = uploaded?.secure_url;
      if (!url) throw new Error("Upload did not return secure_url");

      // 1) Update avatar field
      const updated = await apiJson("/users/me", "PUT", { avatar: url });

      // 2) Save into gallery as FaceBuzz (caption: "facebuzz")
      // (same behavior as web; if your backend supports this endpoint)
      try {
        await apiJson("/upload-media", "POST", {
          fileUrl: url,
          type: "image",
          caption: "facebuzz",
        });
      } catch {
        // don't block avatar success if gallery endpoint errors
      }

      // 3) Optional auto-create MyBuzz post (same as web vibe)
      try {
        await apiJson("/posts", "POST", {
          type: "photo",
          mediaUrl: url,
          text: `${updated?.user?.firstName || "Someone"} updated their profile photo 💫`,
          privacy: "public",
        });
      } catch {
        // don't block avatar success if posts endpoint differs
      }

      if (updated?.user) {
        setUser((prev: any) => ({ ...(prev || {}), ...updated.user }));
        await SecureStore.setItemAsync("RBZ_USER", JSON.stringify({ ...(user || {}), ...updated.user }));
      }

      Alert.alert("Profile", "Avatar updated!");
      await loadProfile();
    } catch (e: any) {
      Alert.alert("Avatar", e?.message || "Failed to update avatar");
    } finally {
      setUploading(false);
    }
  };
  // ---------- Avatar tap handler
const handleAvatarPress = () => {
  if (!avatarUri) return;

  // If user has a story, ask what to do
  if (hasStory) {
    Alert.alert(
      "Profile",
      "What would you like to view?",
      [
        {
          text: "View profile picture",
          onPress: () => setAvatarViewerOpen(true),
        },
        {
        
  text: "View story",
  onPress: async () => {
    try {
      // ensure fresh stories
    const data = await apiFetch("/stories/me");
const list = Array.isArray(data?.stories) ? data.stories : [];

if (!list.length) {
  Alert.alert("Story", "No stories available.");
  return;
}

setMyStories(list);
setStoryOwner(data?.user || null);
setStoryOpen(true);

    } catch {
      Alert.alert("Story", "Failed to load stories.");
    }
  },
},

        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
    return;
  }

  // No story → directly open avatar
  setAvatarViewerOpen(true);
};


  // ---------- Gallery upload (FaceBuzz / PhotoBuzz / ReelsBuzz)
  const addToGallery = async (bucket: "facebuzz" | "photobuzz" | "reelsbuzz") => {
    try {
      setUploading(true);

      const allowVideo = bucket === "reelsbuzz";
      const pick = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: allowVideo ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        videoMaxDuration: 60,
      });

      if (pick.canceled) return;
      const asset = pick.assets?.[0];
      if (!asset?.uri) return;

      const isVideo = asset.type === "video";
      if (isVideo && !allowVideo) {
        Alert.alert("Gallery", "Only photos allowed in this section.");
        return;
      }

      const mime = asset.mimeType || (isVideo ? "video/mp4" : "image/jpeg");
      const filename = isVideo ? "media.mp4" : "media.jpg";

      const uploaded = await uploadToCloudinaryUnsigned(asset.uri, mime, filename);
      const url = uploaded?.secure_url;
      if (!url) throw new Error("Upload did not return secure_url");

      // Save to backend gallery
      await apiJson("/upload-media", "POST", {
        fileUrl: url,
        type: isVideo ? "video" : "image",
        caption: bucket,
      });

      Alert.alert("Gallery", "Uploaded!");
      await loadProfile();
    } catch (e: any) {
      Alert.alert("Gallery", e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------- Voice Intro record/upload/play
  const startRecording = async () => {
    try {
      if (recording) return;

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Voice Intro", "Microphone permission is required.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      recordingRef.current = rec;
      setRecording(true);

      // Safety auto-stop at 60s
      setTimeout(async () => {
        if (recordingRef.current) {
          try {
            await stopRecording(true);
          } catch {}
        }
      }, 60000);
    } catch (e: any) {
      Alert.alert("Voice Intro", e?.message || "Could not start recording");
    }
  };

  const stopRecording = async (autoStop = false) => {
    try {
      const rec = recordingRef.current;
      if (!rec) return;

      setRecording(false);
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("Recording URI missing");

      // Upload to Cloudinary
      setUploading(true);

   // Cloudinary accepts direct file URI from Expo Recording
const uploaded = await uploadToCloudinaryUnsigned(
  uri,
  "audio/m4a",
  "voice.m4a"
);

      const url = uploaded?.secure_url;
      if (!url) throw new Error("Upload did not return secure_url");

      // Save voice into favorites as voice:<url> (same as web)
      const nextFavorites = upsertVoiceInFavorites(form.favorites || [], url);
      const updated = await apiJson("/users/me", "PUT", { favorites: nextFavorites });

      setVoiceUrl(url);
setForm((p: ProfileForm) => ({ ...p, favorites: nextFavorites }));

      if (updated?.user) {
        setUser((prev: any) => ({ ...(prev || {}), ...updated.user }));
        await SecureStore.setItemAsync("RBZ_USER", JSON.stringify({ ...(user || {}), ...updated.user }));
      }

      Alert.alert("Voice Intro", autoStop ? "Saved (60s max)" : "Saved!");
      await loadProfile();
    } catch (e: any) {
      Alert.alert("Voice Intro", e?.message || "Failed to save voice intro");
    } finally {
      setUploading(false);
    }
  };

  const playVoice = async () => {
    try {
      if (!voiceUrl) return;
      if (playing) {
        await soundRef.current?.stopAsync();
        setPlaying(false);
        return;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: voiceUrl }, { shouldPlay: true });
      soundRef.current = sound;
      setPlaying(true);

      sound.setOnPlaybackStatusUpdate((st: any) => {
        if (st?.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (e: any) {
      Alert.alert("Voice Intro", "Could not play audio");
    }
  };

  // ---------- Save profile
  const saveProfile = async () => {
    try {
      setUploading(true);

      // Build payload similar to web
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio,
        gender: form.gender,
        dob: form.dob,
        city: form.city,
        height: form.height,
        orientation: form.orientation,
        lookingFor: form.lookingFor,
        likes: form.likes,
        dislikes: form.dislikes,
        interests: form.interests,
        hobbies: form.hobbies,
        favorites: form.favorites,
        visibilityMode: form.visibilityMode,
        fieldVisibility: form.fieldVisibility,
      };

      const data = await apiJson("/users/me", "PUT", payload);

      if (data?.user) {
        setUser((prev: any) => ({ ...(prev || {}), ...data.user }));
        await SecureStore.setItemAsync("RBZ_USER", JSON.stringify({ ...(user || {}), ...data.user }));
      }

setEditTarget(null);
      Alert.alert("Profile", "Saved!");
      await loadProfile();
    } catch (e: any) {
      Alert.alert("Profile", e?.message || "Save failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------- Settings: Deactivate/Delete/Logout
  const logout = async () => {
    Alert.alert("Logout", "Log out of RomBuzz?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("RBZ_TOKEN");
          await SecureStore.deleteItemAsync("RBZ_USER");
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const deactivateAccount = async () => {
    Alert.alert("Deactivate", "Deactivate your account? You can come back later.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: async () => {
          try {
            setUploading(true);
            await apiFetch("/account/deactivate", { method: "PATCH" });
            await SecureStore.deleteItemAsync("RBZ_TOKEN");
            await SecureStore.deleteItemAsync("RBZ_USER");
            router.replace("/auth/login");
          } catch (e: any) {
            Alert.alert("Deactivate", e?.message || "Failed");
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  const deleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This permanently deletes your account and data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setUploading(true);
              await apiFetch("/account/delete", { method: "DELETE" });
              await SecureStore.deleteItemAsync("RBZ_TOKEN");
              await SecureStore.deleteItemAsync("RBZ_USER");
              router.replace("/auth/login");
            } catch (e: any) {
              Alert.alert("Delete", e?.message || "Failed");
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  // ---------- UI helpers
  const screenW = Dimensions.get("window").width;

  const galleryBuckets = useMemo(() => {
    // On web, caption routes “facebuzz/photobuzz/reelsbuzz”.
    // Here we show quick upload entry points + a unified preview grid.
    return [
      { key: "facebuzz" as const, title: "FaceBuzz", sub: "Your best face", icon: "sparkles" as const },
      { key: "photobuzz" as const, title: "PhotoBuzz", sub: "Lifestyle pics", icon: "images" as const },
      { key: "reelsbuzz" as const, title: "ReelsBuzz", sub: "Up to 60s", icon: "videocam" as const },
    ];
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: RBZ.bg }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, color: RBZ.muted }}>Loading profile…</Text>
      </View>
    );
  }

  return (
  <ScrollView
  style={{ flex: 1, backgroundColor: RBZ.bg }}
  showsVerticalScrollIndicator={false}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
  contentContainerStyle={{
    paddingBottom: 90 + insets.bottom,
  }}
    >

      {/* HERO */}
    <LinearGradient
  colors={[RBZ.c1, RBZ.c4]}
  style={[styles.hero, { paddingTop: insets.top + 16 }]}
  >
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{fullName}</Text>
            <Text style={styles.heroSub}>
              Member since{" "}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "—"}
            </Text>
          </View>
        <Pressable
  onPress={() => router.push("/(tabs)/settings")}
  style={styles.heroIconBtn}
>
  <Ionicons name="settings-outline" size={20} color={RBZ.white} />
</Pressable>
        </View>

        <View style={styles.heroCard}>
<View style={styles.avatarWrap}>
  {/* Avatar (animated ring when story exists) */}
 <StoryAvatar
  uri={avatarUri}
  hasStory={hasStory}
  seen={myStories.every((s) => s.viewed === true)}
  size={86}
  onPress={handleAvatarPress}
/>


  {/* Camera icon → change avatar (only when no story) */}
  {!hasStory && (
    <Pressable onPress={changeAvatar} style={styles.cameraBadge} hitSlop={10}>
      <Ionicons name="camera" size={14} color={RBZ.white} />
    </Pressable>
  )}
</View>

  <View style={{ flex: 1 }}>
  {guidanceList.length > 0 && (
  <View style={styles.guidanceInline}>
    <Text style={styles.guidanceInlineText}>
      {guidanceList[guidanceIndex].icon}{" "}
      {guidanceList[guidanceIndex].text}
    </Text>
  </View>
)}

<View style={styles.actionRow}>
 <Pressable
  onPress={() => setAddStoryOpen(true)}
  style={[styles.actionBtn, { backgroundColor: RBZ.c3 }]}
>
  <Ionicons name="add-circle-outline" size={16} color={RBZ.white} />
  <Text style={styles.actionBtnText}>Add Story</Text>
</Pressable>


 <Pressable
  onPress={() => setEditTarget("all")}
  style={[styles.actionBtn, { backgroundColor: RBZ.c3 }]}
>

    <Ionicons name="create-outline" size={16} color={RBZ.white} />
    <Text style={styles.actionBtnText}>Edit</Text>
  </Pressable>
</View>

</View>
</View>
</LinearGradient>

{/* BUZZSTREAK */}
<BuzzStreakCard />


          {/* TABS */}
          <View style={[styles.section, { paddingTop: 6 }]}>
        <View style={styles.tabRow}>
          <Pill active={tab === "gallery"} label="Gallery" onPress={() => setTab("gallery")} />
           <Pill active={tab === "info"} label="About" onPress={() => setTab("info")} />
          <Pill active={tab === "notes"} label="Private Notes" onPress={() => setTab("notes")} />
        </View>

      {tab === "info" && (
  <ProfileInfoTab
    /* core */
    user={user}
    form={form}
    styles={styles}
    RBZ={RBZ}

    /* inline edit state */
    editingField={editingField}
    setEditingField={setEditingField}
    selectOpen={selectOpen}
    setSelectOpen={setSelectOpen}
    heightTemp={heightTemp}
    setHeightTemp={setHeightTemp}
    dobPickerOpen={dobPickerOpen}
    setDobPickerOpen={setDobPickerOpen}
    dobTemp={dobTemp}
    setDobTemp={setDobTemp}

    /* identity warning */
    identityWarnAccepted={identityWarnAccepted}
    setIdentityWarnAccepted={setIdentityWarnAccepted}

    /* helpers */
    toTitle={toTitle}
    computeAgeFromDob={computeAgeFromDob}
    parseDateSafe={parseDateSafe}
    parseHeight={parseHeight}
    formatHeight={formatHeight}

    /* actions */
    saveSingleField={saveSingleField}
    setForm={setForm}
    setEditTarget={setEditTarget}

    /* voice intro */
    recording={recording}
    startRecording={startRecording}
    stopRecording={stopRecording}
    playVoice={playVoice}
    voiceUrl={voiceUrl}
    playing={playing}

    /* chips */
    Chip={Chip}

    /* constants */
    CITY_OPTIONS={CITY_OPTIONS}
    GENDER_OPTIONS={GENDER_OPTIONS}
    ORIENTATION_OPTIONS={ORIENTATION_OPTIONS}
    LOOKINGFOR_OPTIONS={LOOKINGFOR_OPTIONS}
    LIKE_CHIP_OPTIONS={LIKE_CHIP_OPTIONS}
    DISLIKE_CHIP_OPTIONS={DISLIKE_CHIP_OPTIONS}
  />

)}
 </View>


       {/* GALLERY TAB */}
{tab === "gallery" && (
  <GallerySection
    ownerId={String(user?.id || user?._id || "")}
    media={(Array.isArray(user?.media) ? user.media : []).map((m: any) => ({
      id: String(m.id || m.url),
      url: String(m.url),
      type: m.type === "video" ? "video" : "image",
      caption: m.caption || "",
      privacy: m.privacy,
      createdAt: m.createdAt,
    }))}
    uploading={uploading}
    setUploading={setUploading}
    apiFetch={apiFetch}
    apiJson={apiJson}
    onRefresh={onRefresh}
  />
)}
{tab === "notes" && <PrivateNotesTab />}

      {/* LOADING OVERLAY */}
      <Modal visible={uploading} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator />
            <Text style={{ marginTop: 10, color: RBZ.muted }}>Uploading…</Text>
          </View>
        </View>
      </Modal>
{/* AVATAR FULLSCREEN VIEWER */}
<Modal
  visible={avatarViewerOpen}
  transparent
  animationType="fade"
  onRequestClose={() => setAvatarViewerOpen(false)}
>
  <View
    style={{
      flex: 1,
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {/* Close button */}
    <Pressable
      onPress={() => setAvatarViewerOpen(false)}
      style={{
        position: "absolute",
        top: insets.top + 14,
        right: 14,
        zIndex: 10,
      }}
    >
      <Ionicons name="close" size={28} color="#fff" />
    </Pressable>

    {/* Fullscreen image */}
    {avatarUri && (
      <Image
        source={{ uri: avatarUri }}
        style={{
          width: "100%",
          height: "100%",
          resizeMode: "contain",
        }}
      />
    )}
  </View>
</Modal>

      {/* EDIT MODAL */}
<Modal
  visible={editTarget !== null}
  animationType="slide"
  onRequestClose={() => setEditTarget(null)}
>
          <View
            style={{
              flex: 1,
              backgroundColor: RBZ.bg,
              paddingBottom: insets.bottom,
            }}
          >
          <LinearGradient colors={[RBZ.c1, RBZ.c4]} style={styles.modalHeader}>
<Pressable onPress={() => setEditTarget(null)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={RBZ.white} />
            </Pressable>
<Text style={styles.modalTitle}>
  {editTarget === "bio" && "Edit Bio"}
  {editTarget === "interests" && "Edit Interests & Hobbies"}
  {editTarget === "info" && "Edit Info"}
  {editTarget === "all" && "Edit Profile"}
</Text>
           {editTarget && (
  <Pressable onPress={saveProfile} style={styles.modalSave}>
    <Text style={{ color: RBZ.white, fontWeight: "800" }}>Save</Text>
  </Pressable>
)}

          </LinearGradient>

       <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>

  {(showAll || showBioOnly || showInfoOnly) && (
    <View style={styles.formCard}>

      {(showAll || showInfoOnly) && (
        <>
          <Text style={styles.formLabel}>First name</Text>
          <TextInput
            value={form.firstName}
            editable={showAll} // only full edit can change names (optional)
            onChangeText={(v) => setForm((p: ProfileForm) => ({ ...p, firstName: v }))}
            placeholder="First name"
            placeholderTextColor={RBZ.muted}
            style={[styles.input, !showAll && { opacity: 0.5 }]}
          />

          <Text style={styles.formLabel}>Last name</Text>
          <TextInput
            value={form.lastName}
            editable={showAll} // only full edit can change names (optional)
            onChangeText={(v) => setForm((p: ProfileForm) => ({ ...p, lastName: v }))}
            placeholder="Last name"
            placeholderTextColor={RBZ.muted}
            style={[styles.input, !showAll && { opacity: 0.5 }]}
          />
        </>
      )}

      {(showAll || showBioOnly) && (
        <>
          <Text style={styles.formLabel}>Bio</Text>
          <TextInput
            value={form.bio}
            editable
            onChangeText={(v) => setForm((p: ProfileForm) => ({ ...p, bio: v }))}
            multiline
            style={styles.input}
          />
        </>
      )}

      {(showAll || showInfoOnly) && (
        <>
          <Text style={styles.formLabel}>City</Text>
          <TextInput
            value={form.city}
            editable
            onChangeText={(v) => setForm((p: ProfileForm) => ({ ...p, city: v }))}
            placeholder="City"
            placeholderTextColor={RBZ.muted}
            style={styles.input}
          />

          <Text style={styles.formLabel}>Orientation</Text>
          <TextInput
            value={form.orientation}
            editable
            onChangeText={(v) => setForm((p: ProfileForm) => ({ ...p, orientation: v }))}
            placeholder="Straight / Gay / Bi / ..."
            placeholderTextColor={RBZ.muted}
            style={styles.input}
          />

          <Text style={styles.formLabel}>Looking for</Text>
          <TextInput
            value={form.lookingFor}
            editable
            onChangeText={(v) => setForm((p: ProfileForm) => ({ ...p, lookingFor: v }))}
            placeholder="Serious / Casual / Friends / ..."
            placeholderTextColor={RBZ.muted}
            style={styles.input}
          />

          <Text style={styles.formLabel}>Likes</Text>
          <TextInput
            value={form.likes}
            editable={showAll}  // keep likes/dislikes for full edit only (optional)
            onChangeText={(v) => setForm((p: ProfileForm) => ({ ...p, likes: v }))}
            placeholder="What you like"
            placeholderTextColor={RBZ.muted}
            style={[styles.input, !showAll && { opacity: 0.5 }]}
          />

          <Text style={styles.formLabel}>Dislikes</Text>
          <TextInput
            value={form.dislikes}
            editable={showAll} // optional
            onChangeText={(v) => setForm((p: ProfileForm) => ({ ...p, dislikes: v }))}
            placeholder="What you dislike"
            placeholderTextColor={RBZ.muted}
            style={[styles.input, !showAll && { opacity: 0.5 }]}
          />
        </>
      )}

    </View>
  )}


     {(showAll || showInterestsOnly) && (
  <View style={[styles.formCard, { marginTop: 12 }]}>
    <Text style={styles.cardTitle}>Interests (max 10)</Text>
    <View style={styles.chipWrap}>
      {INTEREST_OPTIONS.map((x) => {
        const selected = form.interests.includes(x);
        return (
          <Chip
            key={x}
            text={x}
            selected={selected}
            onPress={() => {
              if (!(editTarget === "interests" || editTarget === "all")) return;
              setForm((p: ProfileForm) => {
                const arr = [...(p.interests || [])];
                const idx = arr.indexOf(x);
                if (idx >= 0) arr.splice(idx, 1);
                else {
                  if (arr.length >= 10) return p;
                  arr.push(x);
                }
                return { ...p, interests: arr };
              });
            }}
          />
        );
      })}
    </View>

    <Text style={[styles.cardTitle, { marginTop: 14 }]}>Hobbies (max 10)</Text>
    <View style={styles.chipWrap}>
      {HOBBY_OPTIONS.map((x) => {
        const selected = form.hobbies.includes(x);
        return (
          <Chip
            key={x}
            text={x}
            selected={selected}
            onPress={() => {
              if (!(editTarget === "interests" || editTarget === "all")) return;
              setForm((p: ProfileForm) => {
                const arr = [...(p.hobbies || [])];
                const idx = arr.indexOf(x);
                if (idx >= 0) arr.splice(idx, 1);
                else {
                  if (arr.length >= 10) return p;
                  arr.push(x);
                }
                return { ...p, hobbies: arr };
              });
            }}
          />
        );
      })}
    </View>
  </View>
)}


        {editTarget === "all" && (
  <View style={[styles.formCard, { marginTop: 12 }]}>
    <Text style={styles.cardTitle}>Visibility</Text>

    <View style={styles.visibilityRow}>
      {VISIBILITY_OPTIONS.map((v) => {
        const active = form.visibilityMode === v.value;
        return (
          <Pressable
            key={v.value}
            onPress={() =>
              setForm((p: ProfileForm) => ({
                ...p,
                visibilityMode: v.value,
              }))
            }
            style={[
              styles.visibilityChip,
              active && styles.visibilityChipActive,
            ]}
          >
            <Text
              style={[
                styles.visibilityText,
                active && styles.visibilityTextActive,
              ]}
            >
              {v.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
)}
            <View style={{ height: 20 }} />
          </ScrollView>
          
        </View>
      </Modal>
{/* ADD STORY MODAL (REAL) */}
<AddStoryModal
  visible={addStoryOpen}
  onClose={() => setAddStoryOpen(false)}
  onPosted={(story) => {
    // ✅ Instant ring update (NO refresh required)
    setAddStoryOpen(false);
    setHasStory(true);

    if (story) {
      setMyStories((prev) => {
        const prevArr = Array.isArray(prev) ? prev : [];
        const next = [story, ...prevArr];

        // de-dupe if backend returns same story twice later
        const seen = new Set<string>();
        return next.filter((s: any) => {
          const key = String(s?.id || s?._id || s?.createdAt || Math.random());
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
    }
    loadMyStories().catch(() => {});
  }}
/>
{/* STORY VIEWER (MUST BE ROOT LEVEL) */}
{storyOpen && myStories.length > 0 && (
  <StoryViewer
    stories={myStories}
    owner={storyOwner}
    onClose={() => setStoryOpen(false)}
  />
)}

</ScrollView>
);
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  hero: {
    paddingTop: 16 + 12, // base padding
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroTitle: { color: RBZ.white, fontSize: 22, fontWeight: "900" },
  heroSub: { color: "rgba(255,255,255,0.75)", marginTop: 4, fontWeight: "600" },
  heroIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  heroCard: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
storyBtn: {
  backgroundColor: "rgba(255,255,255,0.25)",
},

  avatarWrap: { width: 86, height: 86 },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 28,
    borderColor: RBZ.c3,
    padding: 2,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: 24, backgroundColor: "rgba(255,255,255,0.18)" },
  cameraBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: RBZ.c3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },


  actionRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  actionBtnText: { color: RBZ.white, fontWeight: "900" },

  section: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },

  tabRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: RBZ.soft,
  },
  pillText: { color: RBZ.ink, fontWeight: "900" },

  card: {
    backgroundColor: RBZ.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  cardTitle: { color: RBZ.ink, fontWeight: "900", fontSize: 14 },
  cardBody: { marginTop: 8, color: RBZ.ink, lineHeight: 20 },

  cardCta: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardCtaText: { color: RBZ.c3, fontWeight: "900" },

  softBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: RBZ.soft,
  },
  softBtnText: { fontWeight: "900" },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: RBZ.soft,
  },
  chipText: { color: RBZ.muted, fontWeight: "800", fontSize: 12 },

  bucketRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: RBZ.soft,
  },
  bucketIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: RBZ.c3,
    alignItems: "center",
    justifyContent: "center",
  },
  bucketTitle: { fontWeight: "900", color: RBZ.ink },
  bucketSub: { marginTop: 2, color: RBZ.muted, fontWeight: "700", fontSize: 12 },

  grid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridItem: { aspectRatio: 1, borderRadius: 16, overflow: "hidden", backgroundColor: RBZ.soft },
  gridImg: { width: "100%", height: "100%" },

  reactionPill: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  reactionText: { color: RBZ.ink, fontWeight: "800", fontSize: 12 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  guidanceInline: {
  marginBottom: 6,
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 10,
  backgroundColor: "rgba(255,255,255,0.18)",
},
guidanceInlineText: {
  fontSize: 12,
  fontWeight: "800",
  color: "#ffffff",
},

  overlayCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: RBZ.card,
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RBZ.line,
  },

  modalHeader: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalClose: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  modalTitle: { color: RBZ.white, fontWeight: "900", fontSize: 16 },
  modalSave: {
    width: 70,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  formCard: {
    backgroundColor: RBZ.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  formLabel: { marginTop: 10, color: RBZ.muted, fontWeight: "800", fontSize: 12 },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: RBZ.line,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: RBZ.ink,
    backgroundColor: RBZ.soft,
    fontWeight: "700",
  },

  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: RBZ.card,
    marginBottom: 10,
  },
  settingsText: { flex: 1, color: RBZ.ink, fontWeight: "900" },
visibilityRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 10,
},

visibilityChip: {
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: RBZ.line,
  backgroundColor: RBZ.soft,
},

visibilityChipActive: {
  backgroundColor: "rgba(233,72,106,0.18)",
  borderColor: RBZ.c3,
},

visibilityText: {
  color: RBZ.muted,
  fontWeight: "800",
  fontSize: 12,
},

visibilityTextActive: {
  color: RBZ.c1,
},
infoRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: 12,
  borderTopWidth: 1,
  borderTopColor: "rgba(255,255,255,0.06)",
},

infoLabel: {
  color: RBZ.muted,
  fontWeight: "800",
  fontSize: 13,
},

infoValue: {
  color: RBZ.ink,
  fontWeight: "900",
  fontSize: 13,
  maxWidth: "60%",
  textAlign: "right",
},


pickerCard: {
  width: "100%",
  borderRadius: 20,
  padding: 16,
  backgroundColor: RBZ.card, // ✅ white card
  borderWidth: 1,
  borderColor: RBZ.line,
},


pickerTitle: {
  color: RBZ.ink,
  fontWeight: "900",
  fontSize: 16,
  marginBottom: 12,
},


pickerOption: {
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: RBZ.line,
  marginBottom: 8,
  backgroundColor: RBZ.soft,
},


pickerOptionActive: {
  borderColor: RBZ.c3,
  backgroundColor: "rgba(233,72,106,0.14)",
},

pickerOptionText: {
  color: RBZ.ink,
  fontWeight: "800",
},


pickerOptionTextActive: {
  color: RBZ.c1,
},

});

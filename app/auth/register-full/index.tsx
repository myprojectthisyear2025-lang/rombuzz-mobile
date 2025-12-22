/**
 * ============================================================================
 * 📁 File: app/auth/register-full/index.tsx
 * 🎯 Screen: RomBuzz Mobile — Full Register Wizard (Steps 1–6)
 *
 * PURPOSE:
 *   - Mobile clone of web `src/pages/Register.jsx` flow.
 *   - Runs AFTER email is verified in `app/auth/signup.tsx`.
 *   - Guides user through 6 steps: basic info, preferences, interests,
 *     photos, optional phone/voice, and final summary.
 *
 * FLOW:
 *   - Expects `verifiedEmail` in route params (from Signup screen).
 *   - Maintains `form` state identical to web:
 *       firstName, lastName, password, confirm, gender, dob, lookingFor,
 *       interestedIn, ageMin, ageMax, distance, visibilityMode,
 *       interests, photos, avatar, phone, voiceUrl
 *   - On Finish:
 *       → POST `${API_BASE}/auth/register-full` with full payload
 *       → Save token + user to SecureStore
 *       → Redirect to `/(tabs)` (main app)
 *
 * CONNECTED FILES:
 *   - app/auth/signup.tsx    → sends verifiedEmail here
 *   - Step components:
 *       ./steps/Step1Basic
 *       ./steps/Step2Prefs
 *       ./steps/Step3Interests
 *       ./steps/Step4Photos
 *       ./steps/Step5Optional
 *       ./steps/Step6Summary
 *
 * BACKEND:
 *   - POST /auth/register-full
 *   - Response: { token, user }
 * ============================================================================
 */

import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image, // ADD THIS
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { API_BASE } from "../../../src/config/api";

// Step components
import Step1Basic from "./steps/Step1Basic";
import Step2Prefs from "./steps/Step2Prefs";
import Step4Photos from "./steps/Step4Photos";
import Step6Summary from "./steps/Step6Summary";

/* =========================
   Catalogs (match web)
========================= */
export const GENDERS = [
  "Male",
  "Female",
  "Non-binary",
  "Other",
  "Prefer not to say",
];

export const LOOKING_FOR = [
  { key: "serious", label: "Long-term" },
  { key: "casual", label: "Casual" },
  { key: "friends", label: "Friends" },
  { key: "gymbuddy", label: "GymBuddy" },
];

export const INTEREST_OPTIONS = [
  "Music", "Travel", "Movies", "Foodie", "Sports", "Art", "Books", "Gaming", "Fitness", "Pets",
  "Photography", "Dancing", "Coding", "Hiking", "Cooking", "Yoga", "Cycling", "Running", "Basketball",
  "Soccer", "Tennis", "Volleyball", "Swimming", "Camping", "Gardening", "Board Games", "Podcasting",
  "Stand-up Comedy", "Theatre", "Painting", "Writing", "Poetry", "Astrology", "Meditation", "Crafts",
  "Karaoke", "Live Music", "Coffee", "Tea", "Anime", "K-pop", "DIY", "Makeup", "Fashion", "Cars",
  "Tech", "Startups", "Investing", "Volunteering",
];

export const VISIBILITY_MODES = [
  { key: "auto", label: "Auto (blur until match)" },
  { key: "limited", label: "Limited preview" },
  { key: "full", label: "Full profile" },
  { key: "hidden", label: "Hidden (not in Discover)" },
];

/* =========================
   Helpers (same as web)
========================= */
const isValidDate = (value?: string) => {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const iso = d.toISOString().slice(0, 10);
  return iso === value;
};

const isAdult = (isoDOB?: string) => {
  if (!isoDOB || !isValidDate(isoDOB)) return false;
  const dob = new Date(isoDOB);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 18;
};

export type RegisterForm = {
  firstName: string;
  lastName: string;
  password: string;
  confirm: string;
  gender: string;
  dob: string;
  lookingFor: string;
  interestedIn: string[];
  ageMin: number;
  ageMax: number;
  distance: number;
  visibilityMode: string;
  interests: string[];
  phone: string;
  voiceUrl: string;
  photos: string[];
  avatar: string;
};

export default function RegisterFullScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verifiedEmail?: string }>();
const { width, height } = useWindowDimensions(); // Get screen dimensions
  const isSmallScreen = height < 700; // Detect small screens
  const [email] = useState<string>(params.verifiedEmail || "");
  const [step, setStep] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    password: "",
    confirm: "",
    gender: "",
    dob: "",
    lookingFor: "",
    interestedIn: [],
    ageMin: 18,
    ageMax: 35,
    distance: 25,
    visibilityMode: "auto",
    interests: [],
    phone: "",
    voiceUrl: "",
    photos: [],
    avatar: "",
  });

  const setField = (key: keyof RegisterForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleInterestedIn = (key: string) =>
    setForm((prev) => {
      const s = new Set(prev.interestedIn);
      s.has(key) ? s.delete(key) : s.add(key);
      return { ...prev, interestedIn: Array.from(s) };
    });

  const toggleInterestChip = (value: string) =>
    setForm((prev) => {
      const s = new Set(prev.interests);
      if (s.has(value)) s.delete(value);
      else {
        if (s.size >= 5) return prev; // max 5
        s.add(value);
      }
      return { ...prev, interests: Array.from(s) };
    });

  const addPhotoUrl = (url: string) =>
    setForm((prev) => {
      if (!url.trim()) return prev;
      const photos = [...prev.photos, url.trim()];
      const avatar = prev.avatar || photos[0];
      return { ...prev, photos, avatar };
    });

  const removePhotoUrl = (url: string) =>
    setForm((prev) => {
      const photos = prev.photos.filter((p) => p !== url);
      const avatar = photos.includes(prev.avatar) ? prev.avatar : photos[0] || "";
      return { ...prev, photos, avatar };
    });

  const setAvatar = (url: string) => setField("avatar", url);

  const dobInvalid =
    !!form.dob && (!isValidDate(form.dob) || !isAdult(form.dob));

  const canNext1 =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.password.length >= 6 &&
    form.password === form.confirm &&
    form.gender &&
    form.dob &&
    isValidDate(form.dob) &&
    isAdult(form.dob) &&
    form.lookingFor &&
    form.interestedIn.length > 0;

   const canNext2 =
    form.ageMin >= 18 &&
    form.ageMin <= form.ageMax &&
    form.ageMax <= 100 &&
    form.distance >= 1 &&
    form.distance <= 100 &&
    form.interests.length > 0 &&
    form.interests.length <= 5;

  // At least 2 *real* photos (non-empty strings)
  const canNext4 =
    form.photos.filter((p) => p && p.trim().length > 0).length >= 2;


  const progressPct = useMemo(
    () => (step / 4) * 100,
    [step]
  );


  const finish = async () => {
    setError("");

    if (!email.trim()) {
      setError("Missing verified email. Please go back and verify your email again.");
      return;
    }

    if (!canNext4) {
      setError("Please complete all required sections before finishing.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        email: email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
        gender: form.gender,
        dob: form.dob,
        lookingFor: form.lookingFor,
        interestedIn: form.interestedIn,
        preferences: {
          ageRange: [form.ageMin, form.ageMax],
          distanceMiles: form.distance,
        },
        visibilityMode: form.visibilityMode,
        interests: form.interests,
        avatar: form.avatar,
        photos: form.photos,
        phone: form.phone || "",
        voiceUrl: form.voiceUrl || "",
      };

      const res = await axios.post(`${API_BASE}/auth/register-full`, payload);
      const { token, user } = res.data || {};

      if (!token || !user) {
        throw new Error("Registration failed. Invalid response.");
      }

      await SecureStore.setItemAsync("RBZ_TOKEN", token);
      await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(user));

      router.replace("/(tabs)");
    } catch (e: any) {
      setError(
        e.response?.data?.error ||
          e.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1Basic
            form={form}
            setField={setField}
            dobInvalid={dobInvalid}
            canNext={!!canNext1}
            onNext={() => setStep(2)}
          />
        );
            case 2:
        return (
          <Step2Prefs
            form={form}
            setField={setField}
            canNext={!!canNext2}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        );

      case 3:
        return (
          <Step4Photos
            form={form}
            setField={setField}
            canNext={!!canNext4}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        );

      case 4:
      default:
        return (
          <Step6Summary
            email={email}
            form={form}
            error={error}
            onBack={() => setStep(4)}
            onFinish={finish}
            busy={busy}
          />
        );

    }
  };
return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[
          styles.card,
          isSmallScreen && styles.cardSmall, // Adjust for small screens
        ]}>
     {/* Header */}
<View style={{ alignItems: "center", marginBottom: 10 }}>
  <Image
    source={require("../../../assets/images/logo.png")}
    style={{ width: 70, height: 70, marginBottom: 6 }}
    resizeMode="contain"
  />

  <Text style={[
    styles.title,
    isSmallScreen && styles.titleSmall
  ]}>
    Create your RomBuzz
  </Text>

  <Text style={[
    styles.subtitle,
    isSmallScreen && styles.subtitleSmall
  ]}>
    Step {step} of 4
  </Text>
</View>


          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>

          {busy && step !== 6 && (
            <View style={styles.busyRow}>
              <ActivityIndicator />
              <Text style={styles.busyText}>Saving...</Text>
            </View>
          )}

          {/* Body - Optimized for all screen sizes */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              isSmallScreen && styles.scrollContentSmall
            ]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {renderStep()}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

// =============================
// 🎨 Styles - Responsive for All Screens
// =============================
const styles = StyleSheet.create({
  // Wrap everything in SafeAreaView for notches
  safeArea: {
    flex: 1,
    backgroundColor: "#ff2f6e",
  },
  container: {
    flex: 1,
    backgroundColor: "#ff2f6e",
    paddingHorizontal: 16,
    // REMOVED: justifyContent: "center" - Was causing issues
  },
  card: {
  backgroundColor: "#fff",
  borderRadius: 18,
  paddingVertical: 10,        // ↓ reduced from 20
  paddingHorizontal: 20,
  width: "100%",
  flex: 1,
  marginTop: 4,               // ↓ reduced from 10
  marginBottom: 4,            // ↓ reduced from 10

    // Shadow for better visual separation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSmall: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ff2f6e",
    textAlign: "center",
    marginBottom: 4,
  },
  titleSmall: {
    fontSize: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitleSmall: {
    fontSize: 12,
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#ffe2ee",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ff2f6e",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1, // Important for ScrollView to expand
    paddingBottom: 30, // Extra padding for keyboard
  },
  scrollContentSmall: {
    paddingBottom: 20,
  },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
  },
  busyText: {
    fontSize: 13,
    color: "#777",
  },
});

/**
 * ============================================================
 * 📁 File: src/features/auth/login/useLoginController.ts
 * 🎯 Purpose: Own login state, provider actions, and routing.
 *
 * LOCATION:
 *   src/features/auth/login/useLoginController.ts
 *
 * USED BY:
 *   app/auth/login.tsx
 * ============================================================
 */

import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";

import {
  clearFirstSignupTourPending,
} from "../../onboarding/firstSignupTourStorage";
import {
  clearOnboardingDraft,
  saveOnboardingDraft,
} from "../onboarding/rbzOnboardingDraft";
import { loginWithApple } from "./appleLogin";
import {
  loginWithEmail,
  loginWithGoogle,
} from "./loginApi";
import type { LoginResult } from "./loginTypes";

function profileLooksComplete(user: any) {
  if (!user) return false;

  const required = [
    user.firstName,
    user.lastName,
    user.gender,
    user.dob,
    user.avatar,
  ];

  const hasPhotos =
    Array.isArray(user.photos) && user.photos.length > 0;

  const hasInterests =
    Array.isArray(user.interests) && user.interests.length > 0;

  return (
    required.every(Boolean) &&
    hasPhotos &&
    hasInterests &&
    Boolean(user.lookingFor)
  );
}

function dateOnly(value: any) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function useLoginController() {
  const router = useRouter();

  const googleWebClientId =
    Constants.expoConfig?.extra?.googleWebClientId || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] =
    useState(false);
  const [appleLoading, setAppleLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const completeLogin = async (
    result: LoginResult,
    provider: "email" | "google" | "apple",
  ) => {
    if (result.kind === "cancelled") return;

    if (result.kind === "error") {
      setError(result.message);
      return;
    }

    const user = result.user || {};

    // ✅ Any successful login is an existing-account flow.
    // Never carry a pending "new signup" tour into a normal login.
    await clearFirstSignupTourPending().catch(() => {});

    const incomplete =
      result.status === "incomplete_profile" ||
      !profileLooksComplete(user);

    if (incomplete) {
      const resumeEmail = String(
        user.email || email || "",
      )
        .trim()
        .toLowerCase();

      if (!resumeEmail) {
        setError(
          "This profile is incomplete, but its email could not be restored.",
        );
        return;
      }

      // This is an authenticated existing account, not a brand-new
      // signup-verification flow. Seed a recovery draft so _layout
      // keeps the user inside onboarding until the profile is complete.
      await saveOnboardingDraft({
        step: 1,
        email: resumeEmail,
        authProvider: "",
        form: {
          firstName: String(user.firstName || ""),
          lastName: String(user.lastName || ""),
          password: provider === "email" ? password : "",
          confirm: provider === "email" ? password : "",
          gender: String(user.gender || ""),
          dob: dateOnly(user.dob),
          lookingFor: String(user.lookingFor || ""),
          city: String(user.city || ""),
          height: String(user.height || ""),
          interestedIn: Array.isArray(user.interestedIn)
            ? user.interestedIn
            : [],
          ageMin: Number(user.preferences?.ageMin || 18),
          ageMax: Number(user.preferences?.ageMax || 35),
          distance: Number(user.preferences?.distance || 25),
          visibilityMode: String(
            user.visibilityMode || "auto",
          ),
          likes: String(user.likes || ""),
          dislikes: String(user.dislikes || ""),
          interests: Array.isArray(user.interests)
            ? user.interests
            : [],
          phone: String(user.phone || ""),
          voiceUrl: String(user.voiceUrl || ""),
          voiceDurationSec: Number(
            user.voiceDurationSec || 0,
          ),
          photos: Array.isArray(user.photos)
            ? user.photos
            : [],
          avatar: String(user.avatar || ""),
        },
      });
    } else {
      // A completed account must not inherit an abandoned signup
      // draft that happens to remain on this device.
      await clearOnboardingDraft().catch(() => {});
    }

    await SecureStore.setItemAsync(
      "RBZ_TOKEN",
      result.token,
    );

    await SecureStore.setItemAsync(
      "RBZ_USER",
      JSON.stringify(result.user),
    );

    if (incomplete) {
      router.replace("/auth/register-full");
      return;
    }

    router.replace("/(tabs)/homepage");
  };

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError(
        "Email and password are required.",
      );
      return;
    }

    setLoading(true);

    try {
      await completeLogin(
        await loginWithEmail(email, password),
        "email",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await completeLogin(
        await loginWithGoogle(googleWebClientId),
        "google",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    setAppleLoading(true);

    try {
      await completeLogin(
        await loginWithApple(),
        "apple",
      );
    } finally {
      setAppleLoading(false);
    }
  };

  return {
    router,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    googleLoading,
    appleLoading,
    error,
    handleLogin,
    handleGoogleLogin,
    handleAppleLogin,
  };
}
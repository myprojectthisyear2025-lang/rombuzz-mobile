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

import { loginWithApple } from "./appleLogin";
import {
    loginWithEmail,
    loginWithGoogle,
} from "./loginApi";
import type { LoginResult } from "./loginTypes";

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
    checkProfile: boolean,
  ) => {
    if (result.kind === "cancelled") return;

    if (result.kind === "error") {
      setError(result.message);
      return;
    }

    await SecureStore.setItemAsync(
      "RBZ_TOKEN",
      result.token,
    );

    await SecureStore.setItemAsync(
      "RBZ_USER",
      JSON.stringify(result.user),
    );

    if (
      checkProfile &&
      (
        result.status === "incomplete_profile" ||
        !result.user.profileComplete
      )
    ) {
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
        false,
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
        true,
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
        true,
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
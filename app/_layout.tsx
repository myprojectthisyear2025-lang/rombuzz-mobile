/**
 * ============================================================
 * 📁 File: app/_layout.tsx
 * 🎯 Purpose: Single, clean app entry controller
 *
 * FLOW:
 *  App opens
 *   → Splash (index.tsx plays animation)
 *   → Auth check (RBZ_TOKEN)
 *   → Logged in  → /(tabs)
 *   → Logged out → /auth/login
 *
 * IMPORTANT:
 *  - Redirect happens ONLY ONCE
 *  - Tabs decide homepage + last screen
 *  - No route policing after entry
 * ============================================================
 */

import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";

export default function RootLayout() {
  const router = useRouter();

  const [checkedAuth, setCheckedAuth] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  // 🔐 Check auth ONCE
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("RBZ_TOKEN");
        setLoggedIn(!!token);
      } catch {
        setLoggedIn(false);
      } finally {
        setCheckedAuth(true);
      }
    };

    checkAuth();
  }, []);

  // 🚦 Redirect ONCE after splash window (~2s)
  useEffect(() => {
    if (!checkedAuth || loggedIn === null) return;

    const timer = setTimeout(() => {
      if (loggedIn) {
        router.replace("/(tabs)/homepage");
      } else {
        router.replace("/auth/login");
      }
    }, 2000); // splash duration

    return () => clearTimeout(timer);
  }, [checkedAuth, loggedIn]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/forgot-password" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      <StatusBar style="auto" />
    </>
  );
}

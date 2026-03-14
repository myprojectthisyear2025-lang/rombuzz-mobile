
// ============================================================
// 📁 File: app/_layout.tsx
// 🎯 Purpose: Splash → Start / Home routing (single source of truth)
//
// FLOW:
//   App opens → Splash (2-3 seconds) → Check auth → Home or Start
//   Auth screens are entered only by user action
// ============================================================

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments() as string[];

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [splashDone, setSplashDone] = useState(false);

  // ------------------------------------------------------------
  // 🔍 Check auth on mount (only once)
  // ------------------------------------------------------------
 // 🔁 Reactive auth sync (LOGIN + LOGOUT)
useEffect(() => {
  let mounted = true;

  const syncAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      if (mounted) setLoggedIn(!!token);
    } catch {
      if (mounted) setLoggedIn(false);
    } finally {
      if (mounted) setReady(true);
    }
  };

  // Initial check
  syncAuth();

  // 🔥 React to login/logout changes
  const interval = setInterval(syncAuth, 400);

  return () => {
    mounted = false;
    clearInterval(interval);
  };
}, []);


  // In the _layout.tsx file, update the routing logic:

// ------------------------------------------------------------
// 🎬 Handle splash completion and initial routing
// ------------------------------------------------------------
useEffect(() => {
  // Wait for both: auth check ready AND splash screen done
  if (!ready || loggedIn === null || !splashDone) return;

  console.log("🚀 Initial routing decision:", {
    loggedIn,
    currentRoute: segments.join("/")
  });

  // Give a tiny delay for smooth transition
  const timer = setTimeout(() => {
    if (loggedIn) {
      console.log("✅ User is logged in, going to home");
      router.replace("/(tabs)/homepage");
    } else {
      console.log("🚫 User is logged out, going to login");
      // FIX: Use the correct path to login
      router.replace("/auth/login");
    }
  }, 2000);

  return () => clearTimeout(timer);
}, [ready, loggedIn, splashDone]);

// ------------------------------------------------------------
// 🧠 Handle route protection AFTER initial load
// ------------------------------------------------------------
useEffect(() => {
  if (!ready || loggedIn === null || !splashDone) return;

  const current = segments.join("/");
  console.log("🔍 Route protection check:", { current, loggedIn });

  // Skip for initial routes (handled above)
  if (current === "index") return;

  // 🔒 Logged out users should only see start or auth screens
  if (loggedIn === false) {
    if (current !== "start" && !current.startsWith("auth")) {
      console.log("🚫 Logged out user accessing protected route, redirecting to login");
      // FIX: Use the correct path
      router.replace("/auth/login");
      return;
    }
  }

  // 🔓 Logged in users should NOT see start or auth screens
  if (loggedIn === true) {
    if (current === "start" || current.startsWith("auth")) {
      console.log("✅ Logged in user accessing auth/start, redirecting to home");
      router.replace("/(tabs)/homepage");
      return;
    }
  }
}, [ready, loggedIn, segments, splashDone]);

  // ------------------------------------------------------------
  // ⏳ Wait for splash to complete (called from index.tsx via event or context)
  // In the useEffect for splash timer:
useEffect(() => {
  // Splash animation takes ~2.1 seconds + a buffer
  const timer = setTimeout(() => {
    console.log("✨ Splash time completed");
    setSplashDone(true);
  }, 2100); // Match exactly the splash animation duration from index.tsx

  return () => clearTimeout(timer);
}, []);

  // ------------------------------------------------------------
  // ⏳ Initial blank render until auth is known
  // ------------------------------------------------------------
  if (!ready || loggedIn === null || !splashDone) {
    return (
      <ThemeProvider
        value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      >
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  // ------------------------------------------------------------
  // 🚦 ROUTE DEFINITIONS (ORDER MATTERS)
  // ------------------------------------------------------------
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Splash */}
          <Stack.Screen name="index" />

        {/* Public start (guest only) */}
        <Stack.Screen name="start" />

        {/* Auth (entered manually only) */}
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/forgot-password" />

        {/* Protected app */}
        <Stack.Screen name="(tabs)" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
        </GestureHandlerRootView>

  );
}

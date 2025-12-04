// ============================================================
// 📁 File: app/_layout.tsx
// 🎯 Purpose: Make Splash → Login → Tabs flow work correctly
//      - Shows custom splash (app/index.tsx) FIRST
//      - Then applies login protection
// ============================================================

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segmentsRaw = useSegments();
  const segments = segmentsRaw as string[]; // 👈 cast so TS stops crying
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  // 🔍 On mount → check token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('RBZ_TOKEN');
        setLoggedIn(!!token);
      } catch (e) {
        setLoggedIn(false);
      }
      setReady(true);
    };

    checkAuth();
  }, []);

  // 🔀 When token + ready → handle navigation
  useEffect(() => {
    if (!ready || loggedIn === null) return;

    const inAuthGroup = segments[0] === 'auth';
    const onSplash = segments.length === 0; // 👈 splash = app/index.tsx (no segments yet)

    // 🌟 Allow splash to appear without redirects
    if (onSplash) return;

    if (!loggedIn && !inAuthGroup) {
      router.replace('/auth/login');
    }

    if (loggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [ready, loggedIn, segments, router]);

  // ⏳ Startup loading state before first render
  if (!ready || loggedIn === null) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 👇 Splash route MUST come first */}
        <Stack.Screen name="index" />

        {/* Auth stack */}
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/forgot-password" />

        {/* Protected tabs */}
        <Stack.Screen name="(tabs)" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

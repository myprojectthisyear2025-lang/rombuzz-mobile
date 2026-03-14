/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/_layout.tsx
 * 🎯 Purpose: Settings stack router (kept inside Tabs, but hidden from tab bar)
 * ============================================================================
 */
import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}

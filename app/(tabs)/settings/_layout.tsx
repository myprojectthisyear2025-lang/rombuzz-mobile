/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/_layout.tsx
 * 🎯 Purpose: Settings stack router (kept inside Tabs, but hidden from tab bar)
 * ============================================================================
 */
import { Stack } from "expo-router";
import React from "react";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { SettingsDialogProvider } from "@/src/components/settings/SettingsDialog";

export default function SettingsLayout() {
  const { colors } = useRomBuzzTheme();
  return (
    <SettingsDialogProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </SettingsDialogProvider>
  );
}

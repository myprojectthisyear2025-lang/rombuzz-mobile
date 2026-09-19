/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/index.tsx
 * 🎯 Purpose: RomBuzz mobile Settings home.
 *
 * Responsibilities:
 * - Navigate to account, privacy, safety, notification and support settings.
 * - Expose public Privacy Policy and Terms links inside the app.
 * - Keep account deletion available through Security & Login.
 * ============================================================================
 */

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Linking } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { useSettingsAlert } from "@/src/components/settings/SettingsDialog";

import { Card, NavRow, ScreenShell, SectionTitle, SmallText } from "../../../src/components/settings/_ui";
import { requestFirstSignupTourReplay } from "../../../src/features/onboarding/firstSignupTourReplay";

const PRIVACY_POLICY_URL = "https://rombuzz.com/privacy";
const TERMS_URL = "https://rombuzz.com/terms";
const DELETE_INFO_URL = "https://rombuzz.com/delete-account";

export default function SettingsHome() {
  const alert = useSettingsAlert();
  const router = useRouter();

  const { mode } = useRomBuzzTheme();

  const appearanceLabel = mode === "system" ? "System" : mode === "dark" ? "Dark" : "Light";

  const openPublicPage = async (url: string, label: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      alert(
        label,
        "RomBuzz could not open this page. Please try again when you have an internet connection.",
      );
    }
  };

  const logout = async () => {
    await Promise.allSettled([
      SecureStore.deleteItemAsync("RBZ_TOKEN"),
      SecureStore.deleteItemAsync("RBZ_USER"),
      SecureStore.deleteItemAsync("token"),
      SecureStore.deleteItemAsync("user"),
    ]);

    router.replace("/auth/login");
  };

  return (
    <ScreenShell title="Settings">
      <SectionTitle>Account</SectionTitle>
      <Card>
        <NavRow
          icon="person-outline"
          label="Account"
          description="Your name and email"
          onPress={() => router.push("/(tabs)/settings/account")}
        />
        <NavRow
          icon="lock-closed-outline"
          label="Security & Login"
          onPress={() => router.push("/(tabs)/settings/security")}
        />
      </Card>

      <SectionTitle>Privacy & safety</SectionTitle>
      <Card>
        <NavRow
          icon="shield-outline"
          label="Privacy controls"
          onPress={() => router.push("/(tabs)/settings/privacy")}
        />
        <NavRow
          icon="ban-outline"
          label="Blocking & Safety"
          onPress={() => router.push("/(tabs)/settings/blocking")}
        />
      </Card>

      <SectionTitle>App</SectionTitle>
      <Card>
        <NavRow
          icon="contrast-outline"
          label="Appearance"
          value={appearanceLabel}
          onPress={() => router.push("/(tabs)/settings/appearance")}
        />
        <NavRow
          icon="notifications-outline"
          label="Notifications"
          onPress={() => router.push("/(tabs)/settings/notifications")}
        />
        <NavRow
          icon="sparkles-outline"
          label="Tour"
          description="Take another look around RomBuzz"
          accent
          onPress={requestFirstSignupTourReplay}
        />
      </Card>

      <SectionTitle>Support</SectionTitle>
      <Card>
        <NavRow
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => router.push("/(tabs)/settings/help")}
        />
        <NavRow
          icon="document-text-outline"
          label="Privacy Policy"
          external
          onPress={() => openPublicPage(PRIVACY_POLICY_URL, "Privacy Policy")}
        />
        <NavRow
          icon="document-outline"
          label="Terms of Service"
          external
          onPress={() => openPublicPage(TERMS_URL, "Terms of Service")}
        />
        <NavRow
          icon="information-circle-outline"
          label="Account deletion information"
          external
          onPress={() => openPublicPage(DELETE_INFO_URL, "Account deletion information")}
        />
      </Card>

      <SectionTitle>Account actions</SectionTitle>
      <Card>
        <NavRow
          icon="log-out-outline"
          label="Log out"
          chevron={false}
          onPress={() =>
            alert("Logout?", "Do you want to log out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Logout", style: "destructive", onPress: logout },
            ])
          }
        />
      </Card>
      <SmallText>
        Privacy Policy, Terms of Service, and account deletion information open on rombuzz.com.
      </SmallText>
    </ScreenShell>
  );
}

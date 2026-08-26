/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/index.tsx
 * 🎯 Purpose: RomBuzz mobile Settings home.
 *
 * Responsibilities:
 * - Navigate to account, privacy, safety, notification and support settings.
 * - Expose public Privacy Policy and Terms links inside the app.
 * - Keep permanent account deletion available from the Danger zone.
 * ============================================================================
 */

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Alert, Linking } from "react-native";

import {
  Card,
  NavRow,
  ScreenShell,
  SectionTitle,
  SmallText,
} from "../../../src/components/settings/_ui";

const PRIVACY_POLICY_URL = "https://rombuzz.com/privacy";
const TERMS_URL = "https://rombuzz.com/terms";
const DELETE_INFO_URL = "https://rombuzz.com/delete-account";

export default function SettingsHome() {
  const router = useRouter();

  const openPublicPage = async (url: string, label: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
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
          onPress={() =>
            router.push("/(tabs)/settings/account")
          }
        />

        <NavRow
          icon="lock-closed-outline"
          label="Security & Login"
          onPress={() =>
            router.push("/(tabs)/settings/security")
          }
        />
      </Card>

      <SectionTitle>Preferences</SectionTitle>

      <Card>
        <NavRow
          icon="shield-outline"
          label="Privacy controls"
          onPress={() =>
            router.push("/(tabs)/settings/privacy")
          }
        />

        <NavRow
          icon="notifications-outline"
          label="Notifications"
          onPress={() =>
            router.push("/(tabs)/settings/notifications")
          }
        />
      </Card>

      <SectionTitle>Safety</SectionTitle>

      <Card>
        <NavRow
          icon="ban-outline"
          label="Blocking & Safety"
          onPress={() =>
            router.push("/(tabs)/settings/blocking")
          }
        />
      </Card>

      <SectionTitle>Support</SectionTitle>

      <Card>
        <NavRow
          icon="help-circle-outline"
          label="Help"
          onPress={() =>
            router.push("/(tabs)/settings/help")
          }
        />
      </Card>

      <SectionTitle>Legal</SectionTitle>

      <Card>
        <NavRow
          icon="document-text-outline"
          label="Privacy Policy"
          onPress={() =>
            openPublicPage(
              PRIVACY_POLICY_URL,
              "Privacy Policy",
            )
          }
        />

        <NavRow
          icon="document-outline"
          label="Terms of Service"
          onPress={() =>
            openPublicPage(
              TERMS_URL,
              "Terms of Service",
            )
          }
        />

        <NavRow
          icon="information-circle-outline"
          label="Account deletion information"
          onPress={() =>
            openPublicPage(
              DELETE_INFO_URL,
              "Account deletion information",
            )
          }
        />
      </Card>

      <SectionTitle>Danger zone</SectionTitle>

      <Card>
        <NavRow
          icon="trash-outline"
          label="Delete account"
          onPress={() =>
            router.push(
              "/(tabs)/settings/manage-account",
            )
          }
          danger
        />

        <NavRow
          icon="log-out-outline"
          label="Logout"
          onPress={() =>
            Alert.alert(
              "Logout?",
              "Do you want to log out?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Logout",
                  style: "destructive",
                  onPress: logout,
                },
              ],
            )
          }
        />
      </Card>

      <SmallText>
        Privacy Policy, Terms of Service, and account deletion
        information open on rombuzz.com.
      </SmallText>
    </ScreenShell>
  );
}
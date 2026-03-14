/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/index.tsx
 * 🎯 Purpose: Settings home (matches web sections, mobile-first UI)
 * ============================================================================
 */
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Alert } from "react-native";
import { Card, NavRow, ScreenShell, SectionTitle, SmallText } from "./_ui";

export default function SettingsHome() {
  const router = useRouter();

 const logout = async () => {
  await SecureStore.deleteItemAsync("RBZ_TOKEN");
  await SecureStore.deleteItemAsync("RBZ_USER");

  // go outside tabs – let root layout decide
  router.replace("/auth/login");
};


  return (
    <ScreenShell title="Settings">
      <SectionTitle>Account</SectionTitle>
      <Card>
        <NavRow icon="person-outline" label="Account" onPress={() => router.push("/(tabs)/settings/account")} />
        <NavRow icon="lock-closed-outline" label="Security & Login" onPress={() => router.push("/(tabs)/settings/security")} />
      </Card>

      <SectionTitle>Preferences</SectionTitle>
      <Card>
        <NavRow icon="shield-outline" label="Privacy" onPress={() => router.push("/(tabs)/settings/privacy")} />
        <NavRow icon="notifications-outline" label="Notifications" onPress={() => router.push("/(tabs)/settings/notifications")} />
      </Card>

      <SectionTitle>Safety</SectionTitle>
      <Card>
        <NavRow icon="ban-outline" label="Blocking & Safety" onPress={() => router.push("/(tabs)/settings/blocking")} />
      </Card>

      <SectionTitle>Support</SectionTitle>
      <Card>
        <NavRow icon="help-circle-outline" label="Help" onPress={() => router.push("/(tabs)/settings/help")} />
      </Card>

      <SectionTitle>Danger zone</SectionTitle>
      <Card>
        <NavRow icon="pause-circle-outline" label="Deactivate account" onPress={() => router.push("/(tabs)/settings/manage-account")} />
        <NavRow icon="trash-outline" label="Delete account" onPress={() => router.push("/(tabs)/settings/manage-account?mode=delete")} danger />
        <NavRow
          icon="log-out-outline"
          label="Logout"
          onPress={() =>
            Alert.alert("Logout?", "Do you want to log out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Logout", style: "destructive", onPress: logout },
            ])
          }
        />
      </Card>

      <SmallText>
        Tip: Settings live inside tabs so your bottom bar stays consistent.
      </SmallText>
    </ScreenShell>
  );
}

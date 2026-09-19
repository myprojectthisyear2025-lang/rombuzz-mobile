/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/account.tsx
 * 🎯 Purpose: Account settings (name + email update, like web)
 * ============================================================================
 */
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { SettingsButton, SettingsField, SettingsNotice } from "@/src/components/settings/SettingsControls";
import { useSettingsAlert } from "@/src/components/settings/SettingsDialog";
import { Card, ScreenShell, SectionTitle, SmallText } from "../../../src/components/settings/_ui";
import { rbzFetch } from "../../../src/lib/_rbzApi";

export default function AccountSettings() {
  const { colors } = useRomBuzzTheme();
  const alert = useSettingsAlert();
  const [loadError, setLoadError] = useState("");
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailStep, setEmailStep] = useState<"idle" | "code">("idle");

  const nameCooldownText = useMemo(() => {
    const last = me?.nameChangedAt ? new Date(me.nameChangedAt).getTime() : 0;
    if (!last) return "";
    const days = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
    if (days >= 30) return "";
    return `You can change your name again in ${30 - days} day(s).`;
  }, [me]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      // web uses /users/me for account info :contentReference[oaicite:7]{index=7}
      const j = await rbzFetch<any>("/users/me");
      setMe(j?.user || j);
      setFirstName(j?.user?.firstName || j?.firstName || "");
      setLastName(j?.user?.lastName || j?.lastName || "");
    } catch (e: any) {
      setLoadError(e.message || "Could not load account");
      alert("Failed", e.message || "Could not load account");
    } finally {
      setLoading(false);
    }
  }, [alert]);

  useEffect(() => {
    load();
  }, [load]);

  const saveName = async () => {
    try {
      const j = await rbzFetch<any>("/users/me", {
        method: "PUT",
        body: { firstName, lastName },
      });
      const updated = j?.user || j;
      setMe(updated);
      await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(updated));
      alert("Saved", "Your name was updated.");
    } catch (e: any) {
      alert("Failed", e.message || "Failed to update name");
    }
  };

  const requestEmailChange = async () => {
    try {
      if (!newEmail.trim()) return alert("Missing", "Enter a new email");
      // backend route name matches your web account page logic (request/confirm flow) :contentReference[oaicite:8]{index=8}
      await rbzFetch("/account/request-email-change", {
        method: "POST",
        body: { newEmail: newEmail.trim() },
      });
      setEmailStep("code");
      alert("Check your email", "We sent a code to confirm the new email.");
    } catch (e: any) {
      alert("Failed", e.message || "Failed to request email change");
    }
  };

  const confirmEmailChange = async () => {
    try {
      if (!code.trim()) return alert("Missing", "Enter the code");
      const j = await rbzFetch<any>("/account/confirm-email-change", {
        method: "POST",
        body: { newEmail: newEmail.trim(), code: code.trim() },
      });
      const updated = j?.user || j;
      setMe(updated);
      await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(updated));
      setCode("");
      setNewEmail("");
      setEmailStep("idle");
      alert("Done", "Email updated ✔");
    } catch (e: any) {
      alert("Failed", e.message || "Failed to confirm email change");
    }
  };

  return (
    <ScreenShell title="Account">
      {loading ? <SettingsNotice loading>Loading your account…</SettingsNotice> : null}
      {loadError ? (
        <>
          <SettingsNotice error>{loadError}</SettingsNotice>
          <SettingsButton label="Try again" variant="secondary" onPress={load} />
        </>
      ) : null}
      <SectionTitle>Your details</SectionTitle>
      <Card>
        <View style={[styles.currentEmail, { borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Current email</Text>
          <Text selectable style={[styles.value, { color: colors.text }]}>
            {me?.email || "—"}
          </Text>
        </View>
        <SettingsField
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
        />
        <SettingsField
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
        />
        {!!nameCooldownText && <SmallText>{nameCooldownText}</SmallText>}
        <SettingsButton label={loading ? "Loading…" : "Save name"} onPress={saveName} disabled={loading} />
      </Card>
      <SectionTitle>Change email</SectionTitle>
      <Card>
        <SettingsField
          label="New email"
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="new@email.com"
        />
        {emailStep === "code" && (
          <SettingsField
            label="Verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            placeholder="6-digit code"
          />
        )}
        <SettingsButton
          label={emailStep === "idle" ? "Send code" : "Confirm email"}
          onPress={emailStep === "idle" ? requestEmailChange : confirmEmailChange}
        />
        <SmallText>We’ll email you a code to confirm the new address.</SmallText>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  currentEmail: { paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 12.5, fontFamily: RBZFont.semiBold, marginBottom: 6 },
  value: { fontSize: 14, fontFamily: RBZFont.medium },
});

/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/account.tsx
 * 🎯 Purpose: Account settings (name + email update, like web)
 * ============================================================================
 */
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { rbzFetch } from "./_rbzApi";
import { Card, RBZ, ScreenShell, SectionTitle, SmallText } from "./_ui";

export default function AccountSettings() {
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

  const load = async () => {
    setLoading(true);
    try {
      // web uses /users/me for account info :contentReference[oaicite:7]{index=7}
      const j = await rbzFetch<any>("/users/me");
      setMe(j?.user || j);
      setFirstName(j?.user?.firstName || j?.firstName || "");
      setLastName(j?.user?.lastName || j?.lastName || "");
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Could not load account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveName = async () => {
    try {
      const j = await rbzFetch<any>("/users/me", {
        method: "PUT",
        body: { firstName, lastName },
      });
      const updated = j?.user || j;
      setMe(updated);
      await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(updated));
      Alert.alert("Saved", "Your name was updated.");
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to update name");
    }
  };

  const requestEmailChange = async () => {
    try {
      if (!newEmail.trim()) return Alert.alert("Missing", "Enter a new email");
      // backend route name matches your web account page logic (request/confirm flow) :contentReference[oaicite:8]{index=8}
      await rbzFetch("/account/request-email-change", {
        method: "POST",
        body: { newEmail: newEmail.trim() },
      });
      setEmailStep("code");
      Alert.alert("Check your email", "We sent a code to confirm the new email.");
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to request email change");
    }
  };

  const confirmEmailChange = async () => {
    try {
      if (!code.trim()) return Alert.alert("Missing", "Enter the code");
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
      Alert.alert("Done", "Email updated ✔");
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to confirm email change");
    }
  };

  return (
    <ScreenShell title="Account">
      <SectionTitle>Your details</SectionTitle>
      <Card>
        <Text style={styles.label}>Current email</Text>
        <Text style={styles.value}>{me?.email || "—"}</Text>

        <View style={{ height: 10 }} />

        <Text style={styles.label}>First name</Text>
        <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />

        <Text style={[styles.label, { marginTop: 10 }]}>Last name</Text>
        <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />

        {!!nameCooldownText && <SmallText>{nameCooldownText}</SmallText>}

        <Pressable onPress={saveName} style={styles.primaryBtn} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? "Loading..." : "Save name"}</Text>
        </Pressable>
      </Card>

      <SectionTitle>Change email</SectionTitle>
      <Card>
        <Text style={styles.label}>New email</Text>
        <TextInput
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="new@email.com"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
        />

        {emailStep === "code" && (
          <>
            <Text style={[styles.label, { marginTop: 10 }]}>Verification code</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="6-digit code"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
            />
          </>
        )}

        <Pressable
          onPress={emailStep === "idle" ? requestEmailChange : confirmEmailChange}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryText}>
            {emailStep === "idle" ? "Send code" : "Confirm email"}
          </Text>
        </Pressable>

        <SmallText>
          We’ll email you a code to confirm the new address.
        </SmallText>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  label: {
    color: RBZ.muted,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },

  value: {
    color: RBZ.text,
    fontSize: 14,
    fontWeight: "800",
  },

  input: {
    borderWidth: 1,
    borderColor: RBZ.line,      // RomBuzz pink border
    backgroundColor: "#ffffff", // ✅ PURE WHITE
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: RBZ.text,
    fontWeight: "700",
  },

  primaryBtn: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: RBZ.c2,
    borderWidth: 1,
    borderColor: RBZ.c3,
  },
  primaryText: { color: RBZ.text, fontWeight: "900" },
});

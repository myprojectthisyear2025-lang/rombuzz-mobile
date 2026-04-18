/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/security.tsx
 * 🎯 Purpose: Security & login (change password like web)
 * ============================================================================
 */
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { Card, RBZ, ScreenShell, SectionTitle, SmallText } from "../../../src/components/settings/_ui";
import { rbzFetch } from "../../../src/lib/_rbzApi";

export default function SecuritySettings() {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false);

  const changePw = async () => {
    if (!newPw.trim()) return Alert.alert("Missing", "Enter a new password");
    setSaving(true);
    try {
      await rbzFetch("/auth/change-password", {
        method: "POST",
        body: { oldPassword: oldPw, newPassword: newPw },
      });
      setOldPw("");
      setNewPw("");
      Alert.alert("Done", "Password updated ✔");
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell title="Security & Login">
      <SectionTitle>Change password</SectionTitle>
      <Card>
        <Text style={styles.label}>Current password</Text>
        <TextInput
          value={oldPw}
          onChangeText={setOldPw}
          secureTextEntry
          placeholder="Current password"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 10 }]}>New password</Text>
        <TextInput
          value={newPw}
          onChangeText={setNewPw}
          secureTextEntry
          placeholder="New password"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
        />

        <Pressable onPress={changePw} style={styles.primaryBtn} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? "Saving..." : "Update password"}</Text>
        </Pressable>

        <SmallText>
          Tip: Use a strong password you don’t reuse anywhere else.
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

  input: {
    borderWidth: 1,
    borderColor: RBZ.line,      // RomBuzz border
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

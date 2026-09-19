/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/security.tsx
 * 🎯 Purpose: Security & Login
 *
 * What this screen does:
 * - Lets a logged-in user change their password using a 6-digit email code
 * - Reuses the same backend reset-password flow as the login forgot-password page
 * - Sends code to the current account email
 * - Verifies code before allowing the final password update
 * - Links to the existing account deletion flow
 *
 * Backend endpoints used:
 * - POST /auth/forgot-password
 * - POST /auth/verify-reset-code
 * - POST /auth/reset-password
 * ============================================================================
 */

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { SettingsButton, SettingsField, SettingsNotice } from "@/src/components/settings/SettingsControls";
import { useSettingsAlert } from "@/src/components/settings/SettingsDialog";

import { Card, NavRow, ScreenShell, SectionTitle, SmallText } from "../../../src/components/settings/_ui";
import { API_BASE } from "../../../src/config/api";
import { rbzFetch } from "../../../src/lib/_rbzApi";

type PasswordStep = "idle" | "code_sent" | "verified";

function normalizeEmail(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export default function SecuritySettings() {
  const router = useRouter();
  const { colors } = useRomBuzzTheme();
  const alert = useSettingsAlert();
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(true);

  const [step, setStep] = useState<PasswordStep>("idle");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [message, setMessage] = useState("");

  const maskedEmail = useMemo(() => {
    const clean = normalizeEmail(email);
    if (!clean || !clean.includes("@")) return clean || "your account email";

    const [name, domain] = clean.split("@");
    const safeName = name.length <= 2 ? `${name[0] || "*"}***` : `${name.slice(0, 2)}***${name.slice(-1)}`;

    return `${safeName}@${domain}`;
  }, [email]);

  useEffect(() => {
    const loadEmail = async () => {
      setLoadingEmail(true);

      try {
        const storedUserRaw = await SecureStore.getItemAsync("RBZ_USER");
        if (storedUserRaw) {
          const storedUser = JSON.parse(storedUserRaw);
          const storedEmail = normalizeEmail(storedUser?.email);
          if (storedEmail) {
            setEmail(storedEmail);
          }
        }

        const me = await rbzFetch<any>("/users/me");
        const serverUser = me?.user || me;
        const serverEmail = normalizeEmail(serverUser?.email);

        if (serverEmail) {
          setEmail(serverEmail);
          await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(serverUser));
        }
      } catch (e: any) {
        console.log("Security email load failed:", e?.message || e);
      } finally {
        setLoadingEmail(false);
      }
    };

    loadEmail();
  }, []);

  const sendPasswordCode = async () => {
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      alert("Email not found", "RomBuzz could not find your account email. Please log out and log back in.");
      return;
    }

    setMessage("");
    setSendingCode(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert("Failed", data?.error || "Failed to send verification code.");
        return;
      }

      setStep("code_sent");
      setCode("");
      setNewPw("");
      setConfirmPw("");
      setMessage("A 6-digit verification code was sent to your email.");
    } catch (e: any) {
      console.log("Send password code error:", e?.message || e);
      alert("Network error", "Please check your connection and try again.");
    } finally {
      setSendingCode(false);
    }
  };

  const verifyPasswordCode = async () => {
    const cleanEmail = normalizeEmail(email);
    const cleanCode = code.trim();

    if (!cleanEmail) {
      alert("Email not found", "Your account email could not be loaded.");
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      alert("Invalid code", "Enter the 6-digit verification code.");
      return;
    }

    setMessage("");
    setVerifyingCode(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          code: cleanCode,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        alert("Failed", data?.error || "Invalid or expired code.");
        return;
      }

      setStep("verified");
      setMessage("Code verified. Now choose your new password.");
    } catch (e: any) {
      console.log("Verify password code error:", e?.message || e);
      alert("Network error", "Please check your connection and try again.");
    } finally {
      setVerifyingCode(false);
    }
  };

  const updatePassword = async () => {
    const cleanEmail = normalizeEmail(email);
    const cleanCode = code.trim();

    if (!cleanEmail) {
      alert("Email not found", "Your account email could not be loaded.");
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      alert("Invalid code", "Enter the 6-digit verification code.");
      setStep("code_sent");
      return;
    }

    if (newPw.length < 6) {
      alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    if (newPw !== confirmPw) {
      alert("Password mismatch", "New password and confirm password do not match.");
      return;
    }

    setMessage("");
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          code: cleanCode,
          password: newPw,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        alert("Failed", data?.error || "Failed to update password.");
        return;
      }

      setStep("idle");
      setCode("");
      setNewPw("");
      setConfirmPw("");
      setMessage("");

      alert("Password updated", "Your RomBuzz password was updated successfully.");
    } catch (e: any) {
      console.log("Update password error:", e?.message || e);
      alert("Network error", "Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell title="Security & Login">
      <SectionTitle>Change password</SectionTitle>
      <Card>
        <Text style={[styles.title, { color: colors.text }]}>Verify by email code</Text>
        <SmallText>
          We’ll send a 6-digit code to your RomBuzz account email before changing your password.
        </SmallText>
        <View style={[styles.email, { borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Account email</Text>
          {loadingEmail ? (
            <SettingsNotice loading>Loading email…</SettingsNotice>
          ) : (
            <Text style={[styles.emailText, { color: colors.text }]}>{maskedEmail}</Text>
          )}
        </View>
        {!!message && <SettingsNotice>{message}</SettingsNotice>}
        {step === "idle" && (
          <SettingsButton
            label={sendingCode ? "Sending code…" : "Send 6-digit code"}
            onPress={sendPasswordCode}
            busy={sendingCode}
            disabled={loadingEmail}
          />
        )}
        {step !== "idle" && (
          <>
            <SettingsField
              label="Verification code"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              placeholder="Enter 6-digit code"
            />
            <View style={styles.actions}>
              <View style={styles.action}>
                <SettingsButton
                  label={sendingCode ? "Sending…" : "Resend"}
                  variant="secondary"
                  onPress={sendPasswordCode}
                  busy={sendingCode}
                />
              </View>
              <View style={styles.action}>
                <SettingsButton
                  label={verifyingCode ? "Checking…" : "Verify code"}
                  variant="secondary"
                  onPress={verifyPasswordCode}
                  busy={verifyingCode}
                />
              </View>
            </View>
          </>
        )}
        {step === "verified" && (
          <>
            <SettingsField
              label="New password"
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry={!showNewPw}
              passwordVisible={showNewPw}
              onTogglePassword={() => setShowNewPw((v) => !v)}
              placeholder="New password"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <SettingsField
              label="Confirm password"
              value={confirmPw}
              onChangeText={setConfirmPw}
              secureTextEntry={!showConfirmPw}
              passwordVisible={showConfirmPw}
              onTogglePassword={() => setShowConfirmPw((v) => !v)}
              placeholder="Confirm new password"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <SettingsButton
              label={saving ? "Updating password…" : "Update password"}
              onPress={updatePassword}
              busy={saving}
            />
          </>
        )}
        <SmallText>Your code expires after 10 minutes. Never share it with anyone.</SmallText>
      </Card>
      <SectionTitle>Account actions</SectionTitle>
      <Card>
        <NavRow
          icon="trash-outline"
          label="Delete account"
          danger
          onPress={() => router.push("/(tabs)/settings/manage-account")}
        />
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontFamily: RBZFont.bold },
  email: { marginTop: 18, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 12.5, fontFamily: RBZFont.semiBold, marginBottom: 6 },
  emailText: { fontSize: 14, fontFamily: RBZFont.medium },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  action: { flex: 1, minWidth: 112 },
});

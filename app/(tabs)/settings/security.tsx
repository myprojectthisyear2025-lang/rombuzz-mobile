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
 *
 * Backend endpoints used:
 * - POST /auth/forgot-password
 * - POST /auth/verify-reset-code
 * - POST /auth/reset-password
 * ============================================================================
 */

import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Card,
  RBZ,
  ScreenShell,
  SectionTitle,
  SmallText,
} from "../../../src/components/settings/_ui";
import { API_BASE } from "../../../src/config/api";
import { rbzFetch } from "../../../src/lib/_rbzApi";

type PasswordStep = "idle" | "code_sent" | "verified";

function normalizeEmail(value: any) {
  return String(value || "").trim().toLowerCase();
}

export default function SecuritySettings() {
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
    const safeName =
      name.length <= 2
        ? `${name[0] || "*"}***`
        : `${name.slice(0, 2)}***${name.slice(-1)}`;

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
      Alert.alert(
        "Email not found",
        "RomBuzz could not find your account email. Please log out and log back in.",
      );
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
        Alert.alert("Failed", data?.error || "Failed to send verification code.");
        return;
      }

      setStep("code_sent");
      setCode("");
      setNewPw("");
      setConfirmPw("");
      setMessage("A 6-digit verification code was sent to your email.");
    } catch (e: any) {
      console.log("Send password code error:", e?.message || e);
      Alert.alert("Network error", "Please check your connection and try again.");
    } finally {
      setSendingCode(false);
    }
  };

  const verifyPasswordCode = async () => {
    const cleanEmail = normalizeEmail(email);
    const cleanCode = code.trim();

    if (!cleanEmail) {
      Alert.alert("Email not found", "Your account email could not be loaded.");
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      Alert.alert("Invalid code", "Enter the 6-digit verification code.");
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
        Alert.alert("Failed", data?.error || "Invalid or expired code.");
        return;
      }

      setStep("verified");
      setMessage("Code verified. Now choose your new password.");
    } catch (e: any) {
      console.log("Verify password code error:", e?.message || e);
      Alert.alert("Network error", "Please check your connection and try again.");
    } finally {
      setVerifyingCode(false);
    }
  };

  const updatePassword = async () => {
    const cleanEmail = normalizeEmail(email);
    const cleanCode = code.trim();

    if (!cleanEmail) {
      Alert.alert("Email not found", "Your account email could not be loaded.");
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      Alert.alert("Invalid code", "Enter the 6-digit verification code.");
      setStep("code_sent");
      return;
    }

    if (newPw.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    if (newPw !== confirmPw) {
      Alert.alert("Password mismatch", "New password and confirm password do not match.");
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
        Alert.alert("Failed", data?.error || "Failed to update password.");
        return;
      }

      setStep("idle");
      setCode("");
      setNewPw("");
      setConfirmPw("");
      setMessage("");

      Alert.alert("Password updated", "Your RomBuzz password was updated successfully.");
      } catch (e: any) {
      console.log("Update password error:", e?.message || e);
      Alert.alert("Network error", "Please check your connection and try again.");
      } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell title="Security & Login">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <SectionTitle>Change password</SectionTitle>

          <Card>
            <View style={styles.headerRow}>
              <View style={styles.lockBadge}>
                <Text style={styles.lockIcon}>🔐</Text>
              </View>

              <View style={styles.headerCopy}>
                <Text style={styles.cardTitle}>Verify by email code</Text>
                <SmallText>
                  We’ll send a 6-digit code to your RomBuzz account email before
                  changing your password.
                </SmallText>
              </View>
            </View>

            <View style={styles.emailBox}>
              <Text style={styles.emailLabel}>Account email</Text>

              {loadingEmail ? (
                <View style={styles.loadingEmailRow}>
                  <ActivityIndicator size="small" color={RBZ.c2} />
                  <Text style={styles.loadingEmailText}>Loading email...</Text>
                </View>
              ) : (
                <Text style={styles.emailText}>{maskedEmail}</Text>
              )}
            </View>

            {!!message && <Text style={styles.successText}>{message}</Text>}

            {step === "idle" && (
              <Pressable
                onPress={sendPasswordCode}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.pressed,
                  (sendingCode || loadingEmail) && styles.disabledBtn,
                ]}
                disabled={sendingCode || loadingEmail}
              >
                {sendingCode ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Send 6-digit code</Text>
                )}
              </Pressable>
            )}

            {step !== "idle" && (
              <>
                <Text style={styles.label}>Verification code</Text>
                <TextInput
                  value={code}
                  onChangeText={(value) =>
                    setCode(value.replace(/\D/g, "").slice(0, 6))
                  }
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="rgba(17,24,39,0.35)"
                  style={styles.input}
                />

                <View style={styles.rowButtons}>
                  <Pressable
                    onPress={sendPasswordCode}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && styles.pressed,
                      sendingCode && styles.disabledBtn,
                    ]}
                    disabled={sendingCode}
                  >
                    <Text style={styles.secondaryText}>
                      {sendingCode ? "Sending..." : "Resend"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={verifyPasswordCode}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && styles.pressed,
                      verifyingCode && styles.disabledBtn,
                    ]}
                    disabled={verifyingCode}
                  >
                    <Text style={styles.secondaryText}>
                      {verifyingCode ? "Checking..." : "Verify code"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {step === "verified" && (
              <>
                <Text style={[styles.label, { marginTop: 14 }]}>New password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    value={newPw}
                    onChangeText={setNewPw}
                    secureTextEntry={!showNewPw}
                    placeholder="New password"
                    placeholderTextColor="rgba(17,24,39,0.35)"
                    style={styles.passwordInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Pressable
                    onPress={() => setShowNewPw((v) => !v)}
                    style={styles.eyeBtn}
                  >
                    <Text style={styles.eyeText}>
                      {showNewPw ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                </View>

                <Text style={[styles.label, { marginTop: 10 }]}>
                  Confirm password
                </Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    value={confirmPw}
                    onChangeText={setConfirmPw}
                    secureTextEntry={!showConfirmPw}
                    placeholder="Confirm new password"
                    placeholderTextColor="rgba(17,24,39,0.35)"
                    style={styles.passwordInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Pressable
                    onPress={() => setShowConfirmPw((v) => !v)}
                    style={styles.eyeBtn}
                  >
                    <Text style={styles.eyeText}>
                      {showConfirmPw ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={updatePassword}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.pressed,
                    saving && styles.disabledBtn,
                  ]}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryText}>Update password</Text>
                  )}
                </Pressable>
              </>
            )}

              <SmallText>
              Your code expires after 10 minutes. Never share it with anyone.
            </SmallText>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },

  content: {
    paddingBottom: 28,
  },

  headerRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },

  lockBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216,52,95,0.12)",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.24)",
  },

  lockIcon: {
    fontSize: 22,
  },

  headerCopy: {
    flex: 1,
  },

  cardTitle: {
    color: RBZ.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },

  emailBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  emailLabel: {
    color: RBZ.muted,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  emailText: {
    color: RBZ.text,
    fontSize: 14,
    fontWeight: "900",
  },

  loadingEmailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  loadingEmailText: {
    color: RBZ.muted,
    fontSize: 13,
    fontWeight: "700",
  },

  successText: {
    marginTop: 12,
    color: "#15803d",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },

  label: {
    color: RBZ.muted,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: RBZ.text,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: RBZ.text,
    fontWeight: "800",
  },

  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  eyeText: {
    color: RBZ.c2,
    fontSize: 12,
    fontWeight: "900",
  },

  primaryBtn: {
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
    borderWidth: 1,
    borderColor: RBZ.c3,
    minHeight: 48,
  },

  primaryText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
  },

  rowButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  secondaryBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216,52,95,0.08)",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.18)",
  },

  secondaryText: {
    color: RBZ.c2,
    fontWeight: "900",
    fontSize: 13,
  },

  pressed: {
    opacity: 0.78,
  },
  
  disabledBtn: {
    opacity: 0.65,
  },
});
// ===========================================================
// 📁 File: app/auth/reset-password.tsx
// 🎯 Purpose: Verify reset code → set new password (enhanced UX)
// ===========================================================

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE } from "../../src/config/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
const [barWidth, setBarWidth] = useState(0);

  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===========================================================
  // 🔁 Resend code cooldown
  // ===========================================================
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    setError(null);
    setCooldown(60);

    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error("Resend code error:", err);
    }
  };

  // ===========================================================
  // STEP 1: VERIFY CODE
  // ===========================================================
  const handleVerifyCode = async () => {
    setError(null);

    if (!code || code.length !== 6) {
      setError("Enter the 6-digit reset code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Invalid reset code.");
        return;
      }

      setVerified(true);
    } catch (err) {
      console.error("Verify code error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================
  // STEP 2: SET NEW PASSWORD
  // ===========================================================
  const handleSetPassword = async () => {
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to reset password.");
        return;
      }

      router.replace("/auth/login");
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================
  // 🔐 Password strength meter
  // ===========================================================
 const strength = useMemo(() => {
  let score = 0;
  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = [
    { label: "Weak", color: "#ff4d4f", level: 1 },
    { label: "Fair", color: "#faad14", level: 2 },
    { label: "Good", color: "#52c41a", level: 3 },
    { label: "Strong", color: "#1890ff", level: 4 },
  ];

  return map[Math.min(score, 3)];
}, [password]);


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Reset Password</Text>

      {!verified ? (
        <>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to your email.
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResendCode}
            disabled={cooldown > 0}
          >
            <Text style={styles.link}>
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Resend code"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Set your new password.</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="New password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <Text style={styles.toggle}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

         <View
              style={styles.strengthBar}
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
            >
              <View
                style={[
                  styles.strengthFill,
                  {
                    width: barWidth * (strength.level / 4),
                    backgroundColor: strength.color,
                  },
                ]}
              />
            </View>

          <Text style={[styles.strengthText, { color: strength.color }]}>
            {strength.label}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            secureTextEntry={!showPassword}
            value={confirm}
            onChangeText={setConfirm}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

// ===========================================================
// 🎨 Styles (RomBuzz)
// ===========================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 90,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
    paddingHorizontal: 32,
    textAlign: "center",
  },
  input: {
    width: "85%",
    backgroundColor: "#f3f3f3",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 14,
  },
  passwordRow: {
    width: "85%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f3f3",
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  toggle: {
    color: "#ff005c",
    fontWeight: "600",
    marginLeft: 10,
  },
  strengthBar: {
    width: "85%",
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  strengthFill: {
    height: "100%",
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 12,
    marginBottom: 12,
  },
  button: {
    width: "85%",
    backgroundColor: "#ff005c",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  link: {
    color: "#555",
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: "#ff0044",
    marginBottom: 12,
    paddingHorizontal: 24,
    textAlign: "center",
  },
});

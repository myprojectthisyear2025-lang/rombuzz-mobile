// ===========================================================
// 📁 File: app/auth/forgot-password.tsx
// 🎯 Purpose: RomBuzz Mobile Forgot Password Screen (send code)
// ===========================================================

import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";
import { API_BASE } from "../../src/config/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSendReset = async () => {
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          data?.error || "Failed to send reset code. Please try again.";
        setError(message);
        return;
      }

      setInfo(
        "If an account exists with that email, a reset code has been sent."
      );
    } catch (err) {
      console.error("forgot-password error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive a password reset code.
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {info && <Text style={styles.infoText}>{info}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleSendReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/login")}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// ===========================================================
// 🎨 Styles
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
  button: {
    width: "85%",
    backgroundColor: "#ff005c",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  link: {
    color: "#555",
    marginTop: 6,
    fontSize: 15,
  },
  errorText: {
    color: "#ff0044",
    marginBottom: 12,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  infoText: {
    color: "#0c9248",
    marginBottom: 12,
    paddingHorizontal: 24,
    textAlign: "center",
  },
});

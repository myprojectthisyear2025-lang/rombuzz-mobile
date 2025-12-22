/**
 * ============================================================================
 * 📁 File: app/auth/signup.tsx
 * 🎯 Purpose: Mobile Signup Screen (Same behavior as Web Signup.jsx)
 *
 * FLOWS:
 *   1) Email + OTP:
 *      - POST /auth/send-code → send verification email
 *      - Accept any 6-digit code (same as web mock) → go to /auth/register-full
 *
 *   2) Google Signup:
 *      - Expo Google AuthSession → get idToken
 *      - POST /auth/google with { token: idToken }
 *      - Save token + user in SecureStore
 *      - If status === "incomplete_profile" or !user.profileComplete → /auth/register-full
 *      - Else → /(tabs)
 * ============================================================================
 */

import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
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

// Expo Google Auth
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";


import { API_BASE } from "../../src/config/api";

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();

  // Email/OTP state
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(0);

  // UI flags
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const codeRef = useRef<TextInput | null>(null);

  /**
   * --------------------------------------------------------------------------
   * 🚀 Google Signup Configuration (MOBILE)
   * Uses Expo AuthSession → exchanges token with backend /auth/google
   * --------------------------------------------------------------------------
   */
  const redirectUri = AuthSession.makeRedirectUri({
  scheme: "rombuzzmobile",
});

const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId,
  iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
  webClientId: Constants.expoConfig?.extra?.googleWebClientId,
  redirectUri,
});



  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken;
      handleGoogleSignup(idToken);
    }
  }, [response]);

  /**
   * --------------------------------------------------------------------------
   * 📌 Send OTP to email
   * Matches EXACT behavior of web Signup.jsx
   * --------------------------------------------------------------------------
   */
  const sendCode = async () => {
    setError("");
    setSuccess("");

const trimmed = email.trim().toLowerCase();
    if (
      !trimmed ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    ) {
      return setError("Please enter a valid email.");
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/send-code`, {
  email: trimmed,
});

      if (res.data?.success) {
        setSuccess("Verification code sent! Check inbox/spam.");
        setStep(2);
        setCountdown(60);

        setTimeout(() => codeRef.current?.focus(), 250);
      } else {
        setError(res.data?.error || "Failed to send code.");
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Error sending code.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * --------------------------------------------------------------------------
   * 📌 Verify OTP (real backend check)
   * --------------------------------------------------------------------------
   */
  const verifyCode = async () => {
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedCode || trimmedCode.length !== 6) {
      return setError("Please enter a 6-digit code.");
    }

    setLoading(true);
    try {
     const res = await axios.post(`${API_BASE}/auth/verify-code`, {
  email: trimmedEmail,
  code: trimmedCode,
});

if (!res.data?.success) {
  throw new Error("Invalid verification code.");
}

setSuccess("Email verified! Redirecting...");
setTimeout(() => {
  router.replace({
    pathname: "/auth/register-full",
    params: { verifiedEmail: trimmedEmail },
  });
}, 600);

    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        "Invalid or expired verification code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  /**
   * --------------------------------------------------------------------------
   * 🔥 Google Signup → Exchange ID token with backend
   * backend: POST /auth/google
   * --------------------------------------------------------------------------
   */
  const handleGoogleSignup = async (idToken?: string | null) => {
    if (!idToken) {
      setError("Google signup failed. No token received.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(`${API_BASE}/auth/google`, {
        token: idToken,
      });

      const { status, token, user } = res.data || {};
      if (!token || !user) {
        throw new Error("Invalid Google response from server.");
      }

      // Save auth to SecureStore
      await SecureStore.setItemAsync("RBZ_TOKEN", token);
      await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(user));

      // If profile incomplete → go to onboarding (same as web → Register.jsx)
      if (status === "incomplete_profile" || !user.profileComplete) {
        router.replace("/auth/register-full");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error("Google signup error:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Google signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * --------------------------------------------------------------------------
   * ⏱️ OTP resend timer
   * --------------------------------------------------------------------------
   */
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // ------------------------------- UI ----------------------------------------

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create Your RomBuzz Account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        {/* STEP 1 — Enter Email */}
        {step === 1 && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#888"
              value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setError("");
                  setSuccess("");
                  setCode("");
                }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={sendCode}
              disabled={loading || countdown > 0}
            >

              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {countdown > 0
                    ? `Resend in ${countdown}s`
                    : "Send Verification Code"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google button */}
            <TouchableOpacity
              style={styles.googleButton}
              disabled={!request || loading}
              onPress={() => promptAsync()}
            >
              <Text style={styles.googleText}>Sign up with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.link}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2 — Verify Code */}
        {step === 2 && (
          <>
            <TextInput
              ref={codeRef}
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#888"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={verifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.link}>Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// -----------------------------------------------------------------------------
// 🎨 Styles
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff2f6e",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 18,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ff2f6e",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f3f3f3",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#ff2f6e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  googleButton: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  googleText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "500",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 13,
    color: "#666",
  },
  error: {
    color: "#d10000",
    marginBottom: 10,
    textAlign: "center",
  },
  success: {
    color: "#009b4e",
    marginBottom: 10,
    textAlign: "center",
  },
  link: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 14,
    color: "#555",
  },
});

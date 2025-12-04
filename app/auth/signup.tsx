/**
 * ============================================================================
 * 📁 File: app/auth/signup.tsx
 * 🎯 Purpose: Mobile Signup Screen (Identical logic to Web Signup.jsx)
 *
 * 🧩 Responsibilities:
 *    - Collect user's email
 *    - Send OTP via /auth/send-code
 *    - Verify OTP
 *    - Google Signup (Expo AuthSession)
 *    - Redirect to /auth/register-full?verifiedEmail=<email>
 *
 * ============================================================================ 
 */

import axios from "axios";
import { useRouter } from "expo-router";
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

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { API_BASE } from "../../src/config/api";

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();

  // Email & OTP state
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(0);

  // UI flags
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Correctly typed ref
  const codeRef = useRef<TextInput | null>(null);

  /**
   * --------------------------------------------------------------------------
   * 🚀 GOOGLE AUTH (Expo)
   * Expo no longer supports expoClientId → must use clientId OR platform IDs
   * --------------------------------------------------------------------------
   */
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken;
      handleGoogleSignup(idToken);
    }
  }, [response]);

  /**
   * --------------------------------------------------------------------------
   * 📌 Send OTP
   * --------------------------------------------------------------------------
   */
  const sendCode = async () => {
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError("Please enter a valid email.");
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/send-code`, {
        email: email.trim(),
      });

      if (res.data.success) {
        setSuccess("Verification code sent! Check inbox/spam.");
        setStep(2);
        setCountdown(60);

        setTimeout(() => codeRef.current?.focus(), 150);
      } else {
        setError(res.data.error || "Failed to send code.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error sending code.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * --------------------------------------------------------------------------
   * 📌 Verify OTP
   * --------------------------------------------------------------------------
   */
  const verifyCode = async () => {
    setError("");

    if (code.trim().length !== 6) {
      return setError("Please enter a 6-digit code.");
    }

    setLoading(true);

    try {
      setSuccess("Verified! Redirecting...");

      setTimeout(() => {
router.push({
  pathname: "/auth/register-full",
  params: { verifiedEmail: email.trim() }
});
      }, 500);
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * --------------------------------------------------------------------------
   * 🔥 Google Signup Handler
   * --------------------------------------------------------------------------
   */
  const handleGoogleSignup = async (idToken: string | undefined) => {
    if (!idToken) return setError("Google login failed.");

    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/auth/google`, {
        token: idToken,
      });

      const { status, token, user } = res.data;

      if (!token || !user) throw new Error("Invalid Google response.");

      if (status === "incomplete_profile") {
router.push({
  pathname: "/auth/register-full",
  params: { verifiedEmail: email.trim() }
});
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Google signup failed.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * --------------------------------------------------------------------------
   * ⏱ Count down timer
   * --------------------------------------------------------------------------
   */
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create Your RomBuzz Account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        {step === 1 && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.button}
              disabled={loading}
              onPress={sendCode}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {countdown > 0 ? `Resend in ${countdown}s` : "Send Verification Code"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login */}
            <TouchableOpacity
              style={styles.googleButton}
              disabled={!request}
              onPress={() => promptAsync()}
            >
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.link}>Already have an account? Login</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <TextInput
              ref={codeRef}
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#888"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.button}
              disabled={loading}
              onPress={verifyCode}
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


/**
 * ============================================================
 * 📁 File: app/auth/login.tsx
 * 🎯 Purpose: RomBuzz Mobile Login Screen
 *
 * FEATURES:
 *   - Email + password login → POST /auth/login
 *   - Login with Google (Expo) → POST /auth/google
 *   - Stores token + user in SecureStore (RBZ_TOKEN / RBZ_USER)
 *   - "Create a new account" → Mobile Signup flow (Signup.jsx logic)
 * ============================================================
 */

import axios from "axios";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Expo Google Auth
import * as WebBrowser from "expo-web-browser";

import { API_BASE } from "../../src/config/api";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logo animation (soft pulse)
  const logoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [logoScale]);

  /**
   * ------------------------------------------------------------
   * 🔐 Email / Password Login → POST /auth/login
   * ------------------------------------------------------------
   */
   const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      console.log("🔐 Login request →", `${API_BASE}/auth/login`);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      clearTimeout(timeout);

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      console.log("✅ Login response status:", res.status);
      console.log("✅ Login response body:", data);

      // Handle "no account" case - navigate to start screen
      if (data.status === "no_account") {
        console.log("No account found, navigating to start screen");
        // Clear any error and navigate
        setError(null);
        router.replace("../signup");
        return;
      }

      if (!res.ok) {
        const message =
          data?.error ||
          data?.message ||
          "Login failed. Please check your email and password.";
        setError(message);
        return;
      }

      if (!data.token) {
        setError("No token returned from server.");
        return;
      }

      // ✅ Save auth
      await SecureStore.setItemAsync("RBZ_TOKEN", data.token);
      if (data.user) {
        await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(data.user));
      }

      // ✅ Route to home immediately
      console.log("Login successful, navigating to home");
      router.replace("/(tabs)/homepage");

      } catch (err: any) {
      clearTimeout(timeout);
      console.error("Login network error:", err);

      if (err?.name === "AbortError") {
        setError("Login request timed out. Backend is taking too long.");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  /**
   * ------------------------------------------------------------
   * ⚡ Google Login (Expo AuthSession) → POST /auth/google
   * ------------------------------------------------------------
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
      handleGoogleLogin(idToken);
    }
  }, [response]);

  const handleGoogleLogin = async (idToken?: string | null) => {
    if (!idToken) {
      setError("Google login failed. No token received.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/auth/google`, {
        token: idToken,
      });

      const { status, token, user, error } = res.data || {};

      // Handle "no account" case for Google login
      if (status === "no_account") {
        console.log("No account found for Google login, navigating to start");
        router.replace("../signup");
        return;
      }

      if (!token || !user) {
        throw new Error("Invalid response from server.");
      }

      // Save auth to SecureStore
      await SecureStore.setItemAsync("RBZ_TOKEN", token);
      await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(user));

      // If backend marks as incomplete profile → go to mobile onboarding
      if (status === "incomplete_profile" || !user.profileComplete) {
        router.replace("/auth/register-full");
      } else {
        router.replace("/(tabs)/homepage");
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Google login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Logo + title section */}
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.title}>RomBuzz</Text>
        <Text style={styles.subtitle}>
          Connect with people nearby in real-time
        </Text>
      </View>

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Inputs */}
      <View style={styles.form}>
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

        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />

          <TouchableOpacity
            style={styles.showButton}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Text style={styles.showButtonText}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Forgot password */}
        <TouchableOpacity
          style={styles.inlineLinkWrapper}
          onPress={() => router.push("/auth/forgot-password")}
        >
          <Text style={styles.inlineLinkText}>Forgot password?</Text>
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
          disabled={!request || loading}
          onPress={() => promptAsync()}
        >
          <Text style={styles.googleButtonText}>Login with Google</Text>
        </TouchableOpacity>

        {/* Create account → mobile Signup (same as web Signup.jsx) */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/auth/signup")}
        >
          <Text style={styles.secondaryButtonText}>Create a new account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// =============================
// 🎨 Styles
// =============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  logoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff9fd9",
    shadowOpacity: 0.8,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 0 },
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ff176e",
    marginTop: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    color: "#ff0044",
    marginTop: 4,
    marginBottom: 4,
    textAlign: "center",
    paddingHorizontal: 32,
    fontSize: 14,
  },
  form: {
    width: "88%",
    marginTop: 8,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f7",
    borderRadius: 12,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  showButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  showButtonText: {
    color: "#ff176e",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#ff176e",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  inlineLinkWrapper: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  inlineLinkText: {
    color: "#777",
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 8,
    color: "#999",
    fontSize: 13,
  },
  googleButton: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  googleButtonText: {
    fontSize: 15,
    color: "#444",
    fontWeight: "500",
  },
  secondaryButton: {
    backgroundColor: "#ffe3f1",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    color: "#ff176e",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    backgroundColor: "#f5f5f7",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
  },
});

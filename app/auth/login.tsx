/**
 * ============================================================
 * 📁 File: app/auth/login.tsx
 * 🎯 Purpose: RomBuzz Mobile Login Screen
 *      - Smaller animated logo (soft pulse)
 *      - Email + password login (real backend)
 *      - Buttons: Login, Create Account, Login with Google, Forgot Password
 * ============================================================
 */

import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
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
import { API_BASE } from "../../src/config/api";

// Required once for Expo AuthSession
WebBrowser.maybeCompleteAuthSession();


export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 🔐 Google Auth request (fill these client IDs from your Google Console)
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // same as web CLIENT_ID
  });

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

  // 🎯 Handle Google auth response → call /auth/google (same as web)
  useEffect(() => {
    const run = async () => {
      if (!response || response.type !== "success") return;

      try {
        setGoogleLoading(true);
        setError(null);

        const idToken = response.authentication?.idToken;
        if (!idToken) {
          setError("Google login failed. Missing token.");
          return;
        }

        const res = await fetch(`${API_BASE}/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: idToken }),
        });

        const data = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          const msg =
            (data as any)?.error ||
            (data as any)?.message ||
            "Google login failed. Please try again.";
          setError(msg);
          return;
        }

        const { token, user, status } = (data as any) || {};
        if (!token || !user) {
          setError("Invalid response from server for Google login.");
          return;
        }

        await SecureStore.setItemAsync("RBZ_TOKEN", token);
        await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(user));

        // 🔀 Basic routing (later we can send incomplete_profile → mobile onboarding)
        if (status === "incomplete_profile") {
          // TODO: route to mobile CompleteProfile wizard when we build it
          router.replace("/(tabs)");
        } else {
          router.replace("/(tabs)");
        }
      } catch (err) {
        console.error("Google login error:", err);
        setError("Google login failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    };

    run();
  }, [response, router, API_BASE]);
  // ^ API_BASE is imported constant; TS will ignore the dep warning

  const handleLogin = async () => {

    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
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

      await SecureStore.setItemAsync("RBZ_TOKEN", data.token);
      if (data.user) {
        await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(data.user));
      }

      // Go to main app tabs (we'll refine later)
      router.replace("/(tabs)");
    } catch (err) {
      console.error("Login network error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
 const handleGoogleLogin = async () => {
    setError(null);

    if (!request) {
      setError("Google login is not ready. Please try again in a moment.");
      return;
    }

    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (e) {
      console.error("Prompt Google error:", e);
      setError("Could not start Google login.");
      setGoogleLoading(false);
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
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.title}>RomBuzz</Text>
        <Text style={styles.subtitle}>Connect with people nearby in real-time</Text>
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

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

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

             {/* Google Login (real) */}
        <TouchableOpacity
          style={[styles.googleButton, googleLoading && { opacity: 0.7 }]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#444" />
          ) : (
            <Text style={styles.googleButtonText}>Login with Google</Text>
          )}
        </TouchableOpacity>

        {/* Create account */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/auth/register")}
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
  },
  form: {
    width: "88%",
    marginTop: 8,
  },
  input: {
    width: "100%",
    backgroundColor: "#f5f5f7",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
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
});

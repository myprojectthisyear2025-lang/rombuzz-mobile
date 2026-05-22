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
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE } from "../../src/config/api";

export default function LoginScreen() {
  const router = useRouter();

  const googleWebClientId =
    Constants.expoConfig?.extra?.googleWebClientId || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logo animation (soft pulse)
  const logoScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: googleWebClientId,
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
  }, [googleWebClientId]);

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
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
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.9,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.45,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, [glowOpacity, logoScale]);

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

      // Handle "no account" case - stay on login and show error
      if (data.status === "no_account") {
        console.log("No account found for email:", email.trim());
        setError("Account doesn't exist. Please create a new account first.");
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
        setError("Login request timed out. Please try again.");
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
   * ⚡ Google Login (Native Google Sign-In) → POST /auth/google
   * ------------------------------------------------------------
   */
  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      if (!googleWebClientId) {
        setError("Google login is not configured.");
        return;
      }

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      await GoogleSignin.signOut().catch(() => {});

      const signInResult: any = await GoogleSignin.signIn();

      // User pressed back/cancelled the Google picker.
      // This is not an error, so do not show a red message.
      if (
        signInResult?.type === "cancelled" ||
        signInResult?.type === "cancelled"
      ) {
        return;
      }

      const currentGoogleUser = GoogleSignin.getCurrentUser();

      if (!currentGoogleUser) {
        return;
      }

      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens?.idToken || "";

      if (!idToken) {
        setError("Google login failed. No Google token received.");
        return;
      }

      const res = await axios.post(
        `${API_BASE}/auth/google`,
        {
          token: idToken,
          mode: "login",
        },
        {
          validateStatus: (status) => status >= 200 && status < 500,
        },
      );

      const { status, token, user, error: serverError } = res.data || {};

      if (status === "no_account" || res.status === 404) {
        setError("No account associated with this email. Sign up to continue.");
        return;
      }

      if (!res.status || res.status >= 400) {
        setError(serverError || "Google login failed. Please try again.");
        return;
      }

      if (!token || !user) {
        throw new Error("Invalid Google login response from server.");
      }

      await SecureStore.setItemAsync("RBZ_TOKEN", token);
      await SecureStore.setItemAsync("RBZ_USER", JSON.stringify(user));

      if (status === "incomplete_profile" || !user.profileComplete) {
        router.replace("/auth/register-full");
        return;
      }

      router.replace("/(tabs)/homepage");
    } catch (err: any) {
      const message = String(err?.message || "");

      if (
        err?.code === statusCodes.SIGN_IN_CANCELLED ||
        message.includes("cancel") ||
        message.includes("getTokens requires a user to be signed in")
      ) {
        return;
      }

      console.error("Unexpected Google login error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Google login failed. Please try again.",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backgroundLayer}>
            <View style={[styles.orb, styles.orbTop]} />
            <View style={[styles.orb, styles.orbMiddle]} />
            <View style={[styles.orb, styles.orbBottom]} />
            <View style={styles.gridLineOne} />
            <View style={styles.gridLineTwo} />
            <View style={styles.gridLineThree} />
          </View>

          {/* Logo + title section */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  opacity: glowOpacity.interpolate({
                    inputRange: [0.45, 0.9],
                    outputRange: [0.96, 1],
                  }),
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

          <View style={styles.formCard}>
            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>!</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

                      {/* Inputs */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <View style={styles.inputShell}>
                    <Text style={styles.inputIcon}>✉</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#aa8b99"
                      value={email}
                      onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
               </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.passwordWrapper}>
                  <Text style={styles.inputIcon}>⌁</Text>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    placeholderTextColor="#aa8b99"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />

                  <TouchableOpacity
                    style={styles.showButton}
                    onPress={() => setShowPassword((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.showButtonText}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.86}
              >
                <View style={styles.primaryButtonShine} />
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
                activeOpacity={0.75}
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
                style={[
                  styles.googleButton,
                  (loading || googleLoading) && styles.disabledButton,
                ]}
                disabled={loading || googleLoading}
                onPress={handleGoogleLogin}
                activeOpacity={0.85}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#ff176e" />
                ) : (
                              <View style={styles.googleButtonContent}>
                    <View style={styles.googleIconCircle}>
                      <Image
                        source={{
                          uri: "https://developers.google.com/identity/images/g-logo.png",
                        }}
                        style={styles.googleLogoImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.googleButtonText}>
                      Login with Google
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Create account → mobile Signup (same as web Signup.jsx) */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push("/auth/signup")}
                activeOpacity={0.82}
              >
                <Text style={styles.secondaryButtonText}>
                  Create a new account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =============================
// 🎨 Styles
// =============================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
    justifyContent: "center",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbTop: {
    width: 230,
    height: 230,
    top: -72,
    right: -84,
    backgroundColor: "#ffe3f1",
    opacity: 0.92,
  },
  orbMiddle: {
    width: 150,
    height: 150,
    top: 245,
    left: -88,
    backgroundColor: "#ffb7d8",
    opacity: 0.32,
  },
  orbBottom: {
    width: 260,
    height: 260,
    bottom: -132,
    right: -92,
    backgroundColor: "#fff0f8",
    opacity: 1,
  },
  gridLineOne: {
    position: "absolute",
    top: 82,
    left: -40,
    width: 460,
    height: 1,
    backgroundColor: "#ffe0ef",
    transform: [{ rotate: "-18deg" }],
  },
  gridLineTwo: {
    position: "absolute",
    top: 150,
    left: -90,
    width: 520,
    height: 1,
    backgroundColor: "#fff0f7",
    transform: [{ rotate: "-18deg" }],
  },
  gridLineThree: {
    position: "absolute",
    bottom: 96,
    left: -70,
    width: 520,
    height: 1,
    backgroundColor: "#ffe6f2",
    transform: [{ rotate: "16deg" }],
  },
   header: {
    alignItems: "center",
    marginBottom: 14,
    minHeight: 138,
    justifyContent: "center",
  },
  logoWrapper: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    shadowColor: "#ff176e",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  logo: {
    width: 78,
    height: 78,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#ff176e",
    marginTop: 14,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 14,
    color: "#725161",
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 22,
    lineHeight: 20,
    fontWeight: "600",
  },
  formCard: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 24,
    padding: 14,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: "#ffe1ef",
    shadowColor: "#ff9fd9",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#fff0f4",
    borderWidth: 1,
    borderColor: "#ffc3d4",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
  },
  errorIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
    textAlign: "center",
    color: "#fff",
    backgroundColor: "#ff0044",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 20,
  },
  errorText: {
    flex: 1,
    color: "#b0002f",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
   form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    color: "#4f2d3c",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
    marginLeft: 3,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff7fb",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ffd8ea",
    minHeight: 55,
    paddingHorizontal: 14,
  },
  inputIcon: {
    width: 24,
    color: "#ff176e",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#25101a",
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: Platform.OS === "ios" ? 15 : 11,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7fb",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ffd8ea",
    minHeight: 55,
    paddingLeft: 14,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    color: "#25101a",
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: Platform.OS === "ios" ? 15 : 11,
  },
  showButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#ffe3f1",
  },
  showButtonText: {
    color: "#ff176e",
    fontSize: 13,
    fontWeight: "900",
  },
  primaryButton: {
    minHeight: 55,
    backgroundColor: "#ff176e",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    overflow: "hidden",
    shadowColor: "#ff176e",
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  primaryButtonShine: {
    position: "absolute",
    top: -28,
    left: -40,
    width: 96,
    height: 120,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    transform: [{ rotate: "22deg" }],
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  inlineLinkWrapper: {
    marginTop: 11,
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  inlineLinkText: {
    color: "#7b5d6a",
    fontSize: 13,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 17,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#f2d5e2",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#9a7c89",
    fontSize: 13,
    fontWeight: "800",
  },
  googleButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ead7df",
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  googleButtonContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  googleIconCircle: {
    position: "absolute",
    left: 16,
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLogoImage: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 15,
    color: "#202124",
    fontWeight: "900",
  },
  secondaryButton: {
    backgroundColor: "#ffe3f1",
    borderRadius: 20,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffc8e2",
  },
  secondaryButtonText: {
    fontSize: 15,
    color: "#ff176e",
    fontWeight: "900",
  },
});

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
 *      - Native Google Sign-In → get idToken
 *      - POST /auth/google with { token: idToken, mode: "signup" }
 *      - If account exists → redirect to login
 *      - Else → /auth/register-full with Google profile params
 * ============================================================================
 */

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
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
import AppleSignupButton from "../../src/features/auth/signup/AppleSignupButton";
import { signupWithApple } from "../../src/features/auth/signup/appleSignup";

export default function SignupScreen() {
  const router = useRouter();

  const googleWebClientId =
    Constants.expoConfig?.extra?.googleWebClientId || "";

  // Email/OTP state
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(0);

  // UI flags
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const codeRef = useRef<TextInput | null>(null);

  // Logo animation (same setup as login page)
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
      ])
    ).start();
  }, [glowOpacity, logoScale]);

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
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
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
   * 🔥 Google Signup → Check Gmail with backend
   * backend: POST /auth/google with mode: "signup"
   * --------------------------------------------------------------------------
   */
  const handleGoogleSignup = async () => {
    setLoading(true);
    setGoogleLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!googleWebClientId) {
        setError("Google signup is not configured.");
        return;
      }

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      await GoogleSignin.signOut().catch(() => {});

      const signInResult: any = await GoogleSignin.signIn();

      if (signInResult?.type === "cancelled") {
        return;
      }

      const currentGoogleUser = GoogleSignin.getCurrentUser();

      if (!currentGoogleUser) {
        return;
      }

      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens?.idToken || "";

      if (!idToken) {
        setError("Google signup failed. No Google token received.");
        return;
      }

      const res = await axios.post(
        `${API_BASE}/auth/google`,
        {
          token: idToken,
          mode: "signup",
        },
        {
          validateStatus: (status) => status >= 200 && status < 500,
        }
      );

      const { status, googleProfile, error: serverError } = res.data || {};

      if (status === "account_exists" || res.status === 409) {
        setError("An account already exists with this Gmail. Try logging in.");

        setTimeout(() => {
          router.replace("/auth/login");
        }, 900);

        return;
      }

      if (!res.status || res.status >= 400) {
        setError(serverError || "Google signup failed. Please try again.");
        return;
      }

      if (status !== "google_signup_ready" || !googleProfile?.email) {
        setError("Google signup failed. Invalid response from server.");
        return;
      }

      router.replace({
        pathname: "/auth/register-full",
        params: {
          verifiedEmail: googleProfile.email,
          googleFirstName: googleProfile.firstName || "",
          googleLastName: googleProfile.lastName || "",
          googleAvatar: googleProfile.avatar || "",
          authProvider: "google",
        },
      });
    } catch (err: any) {
      const message = String(err?.message || "");

      if (
        err?.code === statusCodes.SIGN_IN_CANCELLED ||
        message.includes("cancel") ||
        message.includes("getTokens requires a user to be signed in")
      ) {
        return;
      }

      console.error("Unexpected Google signup error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Google signup failed. Please try again."
      );
    } finally {
      setLoading(false);
      setGoogleLoading(false);
    }
  };

  /**
   * --------------------------------------------------------------------------
   * 🍎 Apple Signup
   * Native iOS Apple auth → verified backend signup ticket
   * → continue through the existing register-full onboarding.
   * --------------------------------------------------------------------------
   */
  const handleAppleSignup = async () => {
    setLoading(true);
    setAppleLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await signupWithApple();

      if (result.kind === "cancelled") {
        return;
      }

      if (result.kind === "account_exists") {
        setError(result.message);

        setTimeout(() => {
          router.replace("/auth/login");
        }, 900);

        return;
      }

      if (result.kind === "error") {
        setError(result.message);
        return;
      }

      router.replace({
        pathname: "/auth/register-full",
        params: {
          verifiedEmail: result.profile.email,
          appleFirstName:
            result.profile.firstName || "",
          appleLastName:
            result.profile.lastName || "",
          authProvider: "apple",
          appleSignupTicket:
            result.appleSignupTicket,
        },
      });
    } catch (err: any) {
      console.error(
        "Unexpected Apple signup error:",
        err
      );

      setError(
        err?.message ||
          "Apple signup failed. Please try again."
      );
    } finally {
      setLoading(false);
      setAppleLoading(false);
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

  const isBusy =
    loading || googleLoading || appleLoading;

  // ------------------------------- UI ----------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backgroundOrbTop} />
          <View style={styles.backgroundOrbBottom} />

                  <View style={styles.heroWrap}>
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

                  <Text style={styles.brand}>RomBuzz</Text>
            <Text style={styles.subtitle}>
              Create your account and start your real connection.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.caption}>
              {step === 1
                ? "Use your email or continue with Google to begin."
                : `We sent a 6-digit code to ${email.trim().toLowerCase()}.`}
            </Text>

            {error ? (
              <View style={styles.messageBoxError}>
                <Text style={styles.messageTextError}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.messageBoxSuccess}>
                <Text style={styles.messageTextSuccess}>{success}</Text>
              </View>
            ) : null}

            {/* STEP 1 — Enter Email */}
            {step === 1 && (
              <>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Email address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#a3a3a3"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      setError("");
                      setSuccess("");
                      setCode("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={sendCode}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    (loading || countdown > 0) && styles.buttonDisabled,
                  ]}
                  onPress={sendCode}
                  disabled={loading || countdown > 0}
                  activeOpacity={0.86}
                >
                  {loading &&
                  !googleLoading &&
                  !appleLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {countdown > 0
                        ? `Resend in ${countdown}s`
                        : "Send Verification Code"}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                               <TouchableOpacity
                  style={[
                    styles.googleButton,
                    isBusy && styles.googleButtonDisabled,
                  ]}
                  disabled={isBusy}
                  onPress={handleGoogleSignup}
                  activeOpacity={0.86}
                >
                          {googleLoading ? (
                    <ActivityIndicator color="#202124" />
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
                      <Text style={styles.googleText}>Signup with Google</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <AppleSignupButton
                  disabled={isBusy}
                  onPress={handleAppleSignup}
                />

                <TouchableOpacity
                  onPress={() => router.push("/auth/login")}
                  activeOpacity={0.8}
                  disabled={isBusy}
                  style={styles.bottomLinkButton}
                >
                  <Text style={styles.linkMuted}>Already have an account?</Text>
                  <Text style={styles.linkStrong}> Login</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2 — Verify Code */}
            {step === 2 && (
              <>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Verification code</Text>
                  <TextInput
                    ref={codeRef}
                    style={[styles.input, styles.codeInput]}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={(val) => {
                      setCode(val);
                      setError("");
                      setSuccess("");
                    }}
                    returnKeyType="done"
                    onSubmitEditing={verifyCode}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={verifyCode}
                  disabled={loading}
                  activeOpacity={0.86}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.resendButton,
                    (loading || countdown > 0) && styles.resendButtonDisabled,
                  ]}
                  onPress={sendCode}
                  disabled={loading || countdown > 0}
                  activeOpacity={0.82}
                >
                  <Text
                    style={[
                      styles.resendText,
                      countdown > 0 && styles.resendTextDisabled,
                    ]}
                  >
                    {countdown > 0
                      ? `Resend code in ${countdown}s`
                      : "Resend verification code"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStep(1);
                    setError("");
                    setSuccess("");
                  }}
                  activeOpacity={0.8}
                  disabled={loading}
                  style={styles.backButton}
                >
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.footerText}>
            By continuing, you are joining the RomBuzz community.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// 🎨 Styles
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ff2f6e",
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 26,
    overflow: "hidden",
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -110,
    right: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: -130,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
    heroWrap: {
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
  brand: {
    marginTop: 14,
    color: "#fff",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 310,
  },
  card: {
    width: "100%",
    maxWidth: 390,
    alignSelf: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f3f3f3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  stepDotActive: {
    backgroundColor: "#ff2f6e",
    borderColor: "#ff2f6e",
  },
  stepDotText: {
    color: "#9b9b9b",
    fontSize: 13,
    fontWeight: "900",
  },
  stepDotTextActive: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  stepLine: {
    width: 44,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#eeeeee",
    marginHorizontal: 7,
  },
  stepLineActive: {
    backgroundColor: "#ff2f6e",
  },
   title: {
    fontSize: 23,
    fontWeight: "900",
    color: "#191919",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  caption: {
    marginTop: 6,
    marginBottom: 14,
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    lineHeight: 19,
    fontWeight: "600",
  },
  messageBoxError: {
    backgroundColor: "#fff0f3",
    borderWidth: 1,
    borderColor: "#ffc9d6",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  messageTextError: {
    color: "#c90033",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
  messageBoxSuccess: {
    backgroundColor: "#ecfff5",
    borderWidth: 1,
    borderColor: "#baf2d3",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  messageTextSuccess: {
    color: "#00864a",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
   inputWrap: {
    marginBottom: 10,
  },
  inputLabel: {
    marginBottom: 6,
    color: "#2b2b2b",
    fontSize: 12,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#f7f7f8",
    color: "#151515",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    borderRadius: 14,
    fontSize: 15,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#ececef",
  },
  codeInput: {
    textAlign: "center",
    letterSpacing: 7,
    fontSize: 20,
    fontWeight: "900",
  },
  button: {
    backgroundColor: "#ff2f6e",
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    shadowColor: "#ff2f6e",
    shadowOpacity: 0.34,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.1,
  },
   dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 13,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e9e9e9",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#858585",
    fontWeight: "800",
  },
   googleButton: {
    backgroundColor: "#fff",
    borderColor: "#e2e3e7",
    borderWidth: 1,
    minHeight: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  googleButtonDisabled: {
    opacity: 0.7,
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
  googleText: {
    color: "#202124",
    fontSize: 15,
    fontWeight: "900",
  },
  bottomLinkButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 5,
  },
  linkMuted: {
    color: "#777",
    fontSize: 14,
    fontWeight: "700",
  },
  linkStrong: {
    color: "#ff2f6e",
    fontSize: 14,
    fontWeight: "900",
  },
  resendButton: {
    marginTop: 12,
    backgroundColor: "#fff4f7",
    borderWidth: 1,
    borderColor: "#ffd2de",
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
  },
  resendButtonDisabled: {
    opacity: 0.75,
  },
  resendText: {
    color: "#ff2f6e",
    fontSize: 14,
    fontWeight: "900",
  },
  resendTextDisabled: {
    color: "#a0a0a0",
  },
  backButton: {
    alignSelf: "center",
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 7,
  },
  backText: {
    color: "#555",
    fontSize: 14,
    fontWeight: "900",
  },
  footerText: {
    marginTop: 18,
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 17,
  },
});
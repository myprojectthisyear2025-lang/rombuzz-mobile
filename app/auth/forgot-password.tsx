/**
 * Path: app/auth/forgot-password.tsx
 * Purpose: Theme-aware RomBuzz forgot-password screen that sends the reset code.
 * Behavior: Existing API call and reset-password navigation are preserved.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, {
  useState,
} from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  API_BASE,
} from "../../src/config/api";

import {
  useRomBuzzTheme,
} from "../../src/design/RomBuzzThemeProvider";

import {
  useRomBuzzTypography,
} from "../../src/design/rombuzzTypography";

import {
  recoveryStyles as styles,
} from "../../src/features/auth/passwordRecovery/passwordRecoveryStyles";

import {
  usePasswordRecoveryThemeStyles,
} from "../../src/features/auth/passwordRecovery/usePasswordRecoveryThemeStyles";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const fontsLoaded =
    useRomBuzzTypography();

  const {
    colors,
    statusBarStyle,
  } = useRomBuzzTheme();

  const theme =
    usePasswordRecoveryThemeStyles();

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [info, setInfo] =
    useState<string | null>(null);

  const handleSendReset =
    async () => {
      setError(null);
      setInfo(null);

      if (!email.trim()) {
        setError(
          "Email is required."
        );
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(
          `${API_BASE}/auth/forgot-password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: email.trim(),
            }),
          }
        );

        const data =
          await res
            .json()
            .catch(() => ({}));

        if (!res.ok) {
          setError(
            data?.error ||
              "Failed to send reset code."
          );

          return;
        }

        router.push({
          pathname:
            "../auth/reset-password",

          params: {
            email: email.trim(),
          },
        });
      } catch (err) {
        console.error(
          "Forgot password error:",
          err
        );

        setError(
          "Network error. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  if (!fontsLoaded) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          theme.safeArea,
        ]}
      />
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        theme.safeArea,
      ]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={
          colors.background
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            theme.scrollContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.content}
          >
            <Text
              style={[
                styles.brand,
                theme.brand,
              ]}
            >
              Rom
              <Text
                style={
                  theme.brandAccent
                }
              >
                Buzz
              </Text>
            </Text>

            <View
              style={[
                styles.card,
                theme.card,
              ]}
            >
              <Text
                style={[
                  styles.title,
                  theme.title,
                ]}
              >
                Reset Password
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  theme.subtitle,
                ]}
              >
                Enter your email to
                receive a password reset
                code.
              </Text>

              {error ? (
                <View
                  style={[
                    styles.statusBox,
                    theme.errorBox,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      theme.errorText,
                    ]}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              {info ? (
                <View
                  style={[
                    styles.statusBox,
                    theme.infoBox,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      theme.infoText,
                    ]}
                  >
                    {info}
                  </Text>
                </View>
              ) : null}

              <View
                style={[
                  styles.inputShell,
                  theme.inputShell,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  style={
                    theme.inputIcon
                  }
                />

                <TextInput
                  style={[
                    styles.input,
                    theme.input,
                  ]}
                  placeholder="Email"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  value={email}
                  onChangeText={
                    setEmail
                  }
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  theme.primaryButton,
                  loading &&
                    styles.disabledButton,
                ]}
                onPress={
                  handleSendReset
                }
                disabled={loading}
                activeOpacity={0.82}
              >
                {loading ? (
                  <ActivityIndicator
                    color={
                      colors.white
                    }
                  />
                ) : (
                  <Text
                    style={[
                      styles.primaryButtonText,
                      theme.primaryButtonText,
                    ]}
                  >
                    Send Reset Code
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.linkButton
                }
                onPress={() =>
                  router.replace(
                    "/auth/login"
                  )
                }
                activeOpacity={0.72}
              >
                <Text
                  style={[
                    styles.link,
                    theme.link,
                  ]}
                >
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
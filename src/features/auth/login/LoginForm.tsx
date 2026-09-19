/**
 * Path: src/features/auth/login/LoginForm.tsx
 * Purpose: Render theme-aware RomBuzz login controls and provider buttons.
 * Used by: LoginScreenView.tsx.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

import AppleLoginButton from "./AppleLoginButton";
import { loginFormStyles as styles } from "./loginFormStyles";
import { useLoginThemeStyles } from "./useLoginThemeStyles";

type LoginController = ReturnType<
  typeof import("./useLoginController").useLoginController
>;

type Props = {
  controller: LoginController;
};

export default function LoginForm({ controller }: Props) {
  const {
    router,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    googleLoading,
    appleLoading,
    error,
    handleLogin,
    handleGoogleLogin,
    handleAppleLogin,
  } = controller;

  const { colors } = useRomBuzzTheme();
  const theme = useLoginThemeStyles();
  const socialBusy = loading || googleLoading || appleLoading;

  return (
    <>
      {error ? (
        <View style={[styles.errorBox, theme.errorBox]}>
          <Text style={[styles.errorIcon, theme.errorIcon]}>!</Text>
          <Text style={[styles.errorText, theme.errorText]}>
            {error}
          </Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <View style={[styles.inputShell, theme.inputShell]}>
            <Ionicons
              name="mail-outline"
              size={18}
              style={[styles.inputIcon, theme.inputIcon]}
            />

            <TextInput
              style={[styles.input, theme.input]}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={[styles.inputShell, theme.inputShell]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              style={[styles.inputIcon, theme.inputIcon]}
            />

            <TextInput
              style={[styles.passwordInput, theme.input]}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              style={[styles.showButton, theme.showButton]}
              onPress={() =>
                setShowPassword((value) => !value)
              }
              activeOpacity={0.75}
              accessibilityLabel={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={19}
                style={theme.showButtonIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            theme.primaryButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.82}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text
              style={[
                styles.primaryButtonText,
                theme.primaryButtonText,
              ]}
            >
              Login
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inlineLinkWrapper}
          onPress={() =>
            router.push("/auth/forgot-password")
          }
          activeOpacity={0.72}
        >
          <Text
            style={[
              styles.inlineLinkText,
              theme.inlineLinkText,
            ]}
          >
            Forgot password?
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View
            style={[
              styles.dividerLine,
              theme.dividerLine,
            ]}
          />

          <Text
            style={[
              styles.dividerText,
              theme.dividerText,
            ]}
          >
            or
          </Text>

          <View
            style={[
              styles.dividerLine,
              theme.dividerLine,
            ]}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.socialButton,
            theme.socialButton,
            socialBusy && styles.disabledButton,
          ]}
          disabled={socialBusy}
          onPress={handleGoogleLogin}
          activeOpacity={0.82}
        >
          {googleLoading ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <View style={styles.socialButtonContent}>
              <View
                style={[
                  styles.googleIconCircle,
                  theme.googleIconCircle,
                ]}
              >
                <Image
                  source={{
                    uri: "https://developers.google.com/identity/images/g-logo.png",
                  }}
                  style={styles.googleLogoImage}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={[
                  styles.socialButtonText,
                  theme.socialButtonText,
                ]}
              >
                Login with Google
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <AppleLoginButton
          disabled={socialBusy}
          onPress={handleAppleLogin}
        />

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            theme.secondaryButton,
          ]}
          onPress={() =>
            router.push("/auth/signup")
          }
          activeOpacity={0.78}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              theme.secondaryButtonText,
            ]}
          >
            Create a new account
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
/**
 * ============================================================
 * 📁 File: src/features/auth/login/LoginForm.tsx
 * 🎯 Purpose: Render RomBuzz login controls and provider buttons.
 *
 * LOCATION:
 *   src/features/auth/login/LoginForm.tsx
 *
 * USED BY:
 *   LoginScreenView.tsx
 *
 * RESPONSIBILITIES:
 *   - Email/password controls.
 *   - Google login button.
 *   - iOS-only Apple login button.
 *   - Forgot-password and signup navigation.
 * ============================================================
 */

import React from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AppleLoginButton from "./AppleLoginButton";
import { styles } from "./loginStyles";

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

  const socialBusy = loading || googleLoading || appleLoading;

  return (
    <View style={styles.formCard}>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

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
              onPress={() => setShowPassword((value) => !value)}
              activeOpacity={0.8}
            >
              <Text style={styles.showButtonText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.86}
        >
          <View style={styles.primaryButtonShine} />

          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Login
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inlineLinkWrapper}
          onPress={() =>
            router.push("/auth/forgot-password")
          }
          activeOpacity={0.75}
        >
          <Text style={styles.inlineLinkText}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[
            styles.googleButton,
            socialBusy && styles.disabledButton,
          ]}
          disabled={socialBusy}
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

        <AppleLoginButton
          disabled={socialBusy}
          onPress={handleAppleLogin}
        />

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
  );
}
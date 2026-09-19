/**
 * Path: src/features/auth/login/LoginScreenView.tsx
 * Purpose: Render the theme-aware visual shell of the RomBuzz login screen.
 * Used by: app/auth/login.tsx.
 */

import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { useRomBuzzTypography } from "@/src/design/rombuzzTypography";

import LoginForm from "./LoginForm";
import { loginStyles as styles } from "./loginStyles";
import { useLoginThemeStyles } from "./useLoginThemeStyles";

type LoginController = ReturnType<
  typeof import("./useLoginController").useLoginController
>;

type Props = {
  controller: LoginController;
};

export default function LoginScreenView({ controller }: Props) {
  const fontsLoaded = useRomBuzzTypography();
  const { colors, statusBarStyle } = useRomBuzzTheme();
  const theme = useLoginThemeStyles();

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={[styles.safeArea, theme.safeArea]}>
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={colors.background}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, theme.safeArea]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={colors.background}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            theme.scrollContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.brandBlock}>
              <View style={[styles.logoTile, theme.logoTile]}>
                <Image
                  source={require("../../../../assets/images/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <Text style={[styles.wordmark, theme.wordmark]}>
                Rom
                <Text style={theme.wordmarkAccent}>Buzz</Text>
              </Text>

              <Text style={[styles.subtitle, theme.subtitle]}>
                Connect with people nearby in real-time
              </Text>
            </View>

            <View style={[styles.formCard, theme.formCard]}>
              <LoginForm controller={controller} />
            </View>

            <Text
              style={[
                styles.footerText,
                theme.footerText,
              ]}
            >
              By continuing, you agree
              to the RomBuzz{" "}
              <Text
                accessibilityRole="link"
                style={{
                  textDecorationLine: "underline",
                }}
                onPress={() => {
                  void Linking.openURL(
                    "https://www.rombuzz.com/terms"
                  );
                }}
              >
                Terms & Conditions
              </Text>{" "}
              and{" "}
              <Text
                accessibilityRole="link"
                style={{
                  textDecorationLine: "underline",
                }}
                onPress={() => {
                  void Linking.openURL(
                    "https://www.rombuzz.com/privacy"
                  );
                }}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
/**
 * Path: src/features/auth/passwordRecovery/ResetPasswordView.tsx
 * Purpose: Theme-aware shell for reset-code verification and new password entry.
 * Used by: app/auth/reset-password.tsx.
 */

import React, {
    useState,
} from "react";

import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    View,
} from "react-native";

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    useRomBuzzTypography,
} from "@/src/design/rombuzzTypography";

import {
    recoveryStyles as styles,
} from "./passwordRecoveryStyles";

import {
    NewPasswordStep,
    VerifyCodeStep,
} from "./ResetPasswordSteps";

import type {
    ResetPasswordViewProps,
} from "./resetPasswordTypes";

import {
    usePasswordRecoveryThemeStyles,
} from "./usePasswordRecoveryThemeStyles";

export default function ResetPasswordView(
  props: ResetPasswordViewProps
) {
  const [
    barWidth,
    setBarWidth,
  ] = useState(0);

  const fontsLoaded =
    useRomBuzzTypography();

  const {
    colors,
    statusBarStyle,
  } = useRomBuzzTheme();

  const theme =
    usePasswordRecoveryThemeStyles();

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
        barStyle={
          statusBarStyle
        }
        backgroundColor={
          colors.background
        }
      />

      <KeyboardAvoidingView
        style={
          styles.keyboardView
        }
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
            style={
              styles.content
            }
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

              {!props.verified ? (
                <VerifyCodeStep
                  {...props}
                  colors={colors}
                  theme={theme}
                />
              ) : (
                <NewPasswordStep
                  {...props}
                  colors={colors}
                  theme={theme}
                  barWidth={
                    barWidth
                  }
                  setBarWidth={
                    setBarWidth
                  }
                />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
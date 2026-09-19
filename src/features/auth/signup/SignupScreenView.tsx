/**
 * Path: src/features/auth/signup/SignupScreenView.tsx
 * Purpose: Theme-aware shell for the RomBuzz signup experience.
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

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  useRomBuzzTypography,
} from "@/src/design/rombuzzTypography";

import SignupForm from "./SignupForm";

import {
  signupStyles as styles,
} from "./signupStyles";

import {
  useSignupThemeStyles,
} from "./useSignupThemeStyles";

type SignupController =
  ReturnType<
    typeof import(
      "./useSignupController"
    ).useSignupController
  >;

type Props = {
  controller:
    SignupController;
};

export default function SignupScreenView({
  controller,
}: Props) {
  const fontsLoaded =
    useRomBuzzTypography();

  const {
    colors,
    statusBarStyle,
  } = useRomBuzzTheme();

  const theme =
    useSignupThemeStyles();

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
            style={styles.content}
          >
            <View
              style={
                styles.brandBlock
              }
            >
              <View
                style={[
                  styles.logoTile,
                  theme.logoTile,
                ]}
              >
                <Image
                  source={require(
                    "../../../../assets/images/logo.png"
                  )}
                  style={
                    styles.logo
                  }
                  resizeMode="contain"
                />
              </View>

              <Text
                style={[
                  styles.wordmark,
                  theme.wordmark,
                ]}
              >
                Rom
                <Text
                  style={
                    theme.wordmarkAccent
                  }
                >
                  Buzz
                </Text>
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  theme.subtitle,
                ]}
              >
                Create your account
                and start making real
                connections.
              </Text>
            </View>

            <View
              style={[
                styles.card,
                theme.card,
              ]}
            >
              <SignupForm
                controller={
                  controller
                }
              />
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
                style={{
                  textDecorationLine:
                    "underline",
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
                style={{
                  textDecorationLine:
                    "underline",
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
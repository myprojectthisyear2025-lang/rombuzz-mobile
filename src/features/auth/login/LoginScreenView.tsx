/**
 * ============================================================
 * 📁 File: src/features/auth/login/LoginScreenView.tsx
 * 🎯 Purpose: Render the visual shell of the RomBuzz login screen.
 *
 * LOCATION:
 *   src/features/auth/login/LoginScreenView.tsx
 *
 * USED BY:
 *   app/auth/login.tsx
 *
 * RESPONSIBILITIES:
 *   - Preserve the existing login background and branding.
 *   - Run the existing soft logo pulse animation.
 *   - Render the modular LoginForm.
 * ============================================================
 */

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import LoginForm from "./LoginForm";
import { styles } from "./loginStyles";

type LoginController = ReturnType<
  typeof import("./useLoginController").useLoginController
>;

type Props = {
  controller: LoginController;
};

export default function LoginScreenView({
  controller,
}: Props) {
  const logoScale =
    useRef(new Animated.Value(1)).current;

  const glowOpacity =
    useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [glowOpacity, logoScale]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backgroundLayer}>
            <View
              style={[styles.orb, styles.orbTop]}
            />
            <View
              style={[
                styles.orb,
                styles.orbMiddle,
              ]}
            />
            <View
              style={[
                styles.orb,
                styles.orbBottom,
              ]}
            />
            <View style={styles.gridLineOne} />
            <View style={styles.gridLineTwo} />
            <View
              style={styles.gridLineThree}
            />
          </View>

          <View style={styles.header}>
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  opacity:
                    glowOpacity.interpolate({
                      inputRange: [0.45, 0.9],
                      outputRange: [0.96, 1],
                    }),
                  transform: [
                    { scale: logoScale },
                  ],
                },
              ]}
            >
              <Image
                source={require(
                  "../../../../assets/images/logo.png"
                )}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

            <Text style={styles.title}>
              RomBuzz
            </Text>

            <Text style={styles.subtitle}>
              Connect with people nearby in
              real-time
            </Text>
          </View>

          <LoginForm controller={controller} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
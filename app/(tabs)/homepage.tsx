/**
 * Path: app/(tabs)/homepage.tsx
 * Purpose: RomBuzz Home shell with global light/dark theme support.
 * Used by: Home tab; routes, storage, refresh, animations, and interactions are preserved.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";

import {
  Animated,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { useRomBuzzTypography } from "@/src/design/rombuzzTypography";
import HomeDashboard from "@/src/features/home/HomeDashboard";
import { homeStyles as styles } from "@/src/features/home/homeStyles";
import { useHomeThemeStyles } from "@/src/features/home/useHomeThemeStyles";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fontsLoaded = useRomBuzzTypography();

  const {
    colors,
    statusBarStyle,
  } = useRomBuzzTheme();

  const theme = useHomeThemeStyles();

  const [firstName, setFirstName] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [fadeAnim] = useState(
    new Animated.Value(0)
  );

  const [slideAnim] = useState(
    new Animated.Value(12)
  );

  const loadUser = async () => {
    try {
      const raw =
        await SecureStore.getItemAsync(
          "RBZ_USER"
        );

      if (!raw) return;

      const user = JSON.parse(raw);

      if (user?.firstName) {
        setFirstName(user.firstName);
      }
    } catch {
      console.warn(
        "Failed to load user for home greeting"
      );
    }
  };

  const refreshHome = async () => {
    try {
      setRefreshing(true);
      await loadUser();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUser();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!fontsLoaded) {
    return (
      <View
        style={[
          styles.screen,
          theme.screen,
        ]}
      >
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={
            colors.background
          }
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        theme.screen,
      ]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={
          colors.background
        }
      />

      <View
        style={[
          styles.header,
          theme.header,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Let’sBuzz"
            onPress={() =>
              router.push("/letsbuzz")
            }
            style={({ pressed }) => [
              styles.letsBuzzButton,
              pressed &&
                styles.topActionPressed,
            ]}
          >
            <View
              style={[
                styles.letsBuzzIconWrap,
                theme.letsBuzzIconWrap,
              ]}
            >
              <Ionicons
                name="heart"
                size={18}
                color={colors.brand}
              />
            </View>

            <View
              style={styles.letsBuzzCopy}
            >
              <Text
                style={[
                  styles.letsBuzzTitle,
                  theme.letsBuzzTitle,
                ]}
              >
                Let’sBuzz
              </Text>

              <Text
                style={styles.letsBuzzMeta}
              >
                Live feed
              </Text>
            </View>
          </Pressable>

          <View
            style={styles.brandWrap}
          >
            <Text
              style={[
                styles.brand,
                theme.brand,
              ]}
              accessibilityRole="header"
            >
              Rom
              <Text
                style={[
                  styles.brandAccent,
                  theme.brandAccent,
                ]}
              >
                Buzz
              </Text>
            </Text>

            <Text
              style={[
                styles.brandTagline,
                theme.brandTagline,
              ]}
            >
              Romance & Buzz
            </Text>
          </View>

          <View
            style={styles.topBarSpacer}
            pointerEvents="none"
          />
        </View>

        <Animated.View
          style={[
            styles.greeting,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim,
                },
              ],
            },
          ]}
        >
          <View
            style={styles.greetingWrap}
          >
            <View
              style={styles.greetingCopy}
            >
              <View
                style={styles.greetingRow}
              >
                <Text
                  style={[
                    styles.greetingTitle,
                    theme.greetingTitle,
                  ]}
                >
                  Hey
                  {firstName
                    ? ` ${firstName}`
                    : ""}
                </Text>

                <Text
                  style={
                    styles.greetingEmoji
                  }
                >
                  👋
                </Text>
              </View>

             
            </View>

            <View
              style={styles.sideNote}
              pointerEvents="none"
            >
              <Text
                style={[
                  styles.sideNoteText,
                  theme.sideNoteText,
                ]}
              >
                Good       {"\n"}
                People,     {"\n"}
                Brighter Days.
              </Text>

              <Ionicons
                name="heart-outline"
                size={16}
                color={colors.brand}
                style={
                  styles.sideNoteHeart
                }
              />
            </View>
          </View>
        </Animated.View>
      </View>

      <HomeDashboard
        refreshing={refreshing}
        onRefresh={refreshHome}
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
      />
    </View>
  );
}
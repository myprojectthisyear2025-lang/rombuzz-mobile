/**
 * Path: src/features/home/HomeDashboard.tsx
 * Purpose: Theme-aware Home content below the greeting.
 * Used by: homepage.tsx for hero cards, pulse shortcuts, and safety copy.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";

import {
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import HomeFeatureCard from "@/src/features/home/HomeFeatureCard";
import HomePulseTile from "@/src/features/home/HomePulseTile";
import { homeStyles as styles } from "@/src/features/home/homeStyles";
import { useHomeThemeStyles } from "@/src/features/home/useHomeThemeStyles";

type Props = {
  refreshing: boolean;
  onRefresh: () => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
};

export default function HomeDashboard({
  refreshing,
  onRefresh,
  fadeAnim,
  slideAnim,
}: Props) {
  const router = useRouter();

  const {
    width,
    height,
  } = useWindowDimensions();

  const { colors } =
    useRomBuzzTheme();

  const theme =
    useHomeThemeStyles();

  const compact =
    width < 390 ||
    height < 780;

  const entranceStyle = {
    opacity: fadeAnim,
    transform: [
      {
        translateY: slideAnim,
      },
    ],
  };

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator={
        false
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.brand}
          colors={[colors.brand]}
        />
      }
    >
      <Animated.View
        style={[
          styles.featureSection,
          entranceStyle,
        ]}
      >
        <View
          style={styles.featureRow}
        >
          <HomeFeatureCard
            title="MicroBuzz"
            description="Vibes nearby."
            badge="Instant"
            cta="Go live"
            scene="microbuzz"
            compact={compact}
            onPress={() =>
              router.push(
                "/(tabs)/microbuzz"
              )
            }
          />

          <HomeFeatureCard
            title="Discover"
            description="Curated matches around."
            badge="Tuned"
            cta="Find match"
            scene="discover"
            compact={compact}
            onPress={() =>
              router.push(
                "/(tabs)/discover"
              )
            }
          />
        </View>
      </Animated.View>

      <View style={styles.section}>
        <View
          style={styles.sectionHeader}
        >
          <Text
            style={[
              styles.sectionTitle,
              theme.sectionTitle,
            ]}
          >
            Your RomBuzz pulse
          </Text>
        </View>

        <View
          style={styles.pulseGrid}
        >
          <HomePulseTile
            title="Nearby Energy"
            subtitle="Who’s around"
            icon="location-outline"
            onPress={() =>
              router.push(
                "/(tabs)/microbuzz"
              )
            }
          />

          <HomePulseTile
            title="Curated Matches"
            subtitle="Find your vibe"
            icon="people-outline"
            onPress={() =>
              router.push(
                "/(tabs)/discover"
              )
            }
          />

          <HomePulseTile
            title="Chats"
            subtitle="Keep it going"
            icon="chatbubble-outline"
            onPress={() =>
              router.push(
                "/(tabs)/chat"
              )
            }
          />

          <HomePulseTile
            title="My Profile"
            subtitle="Best self"
            icon="person-outline"
            onPress={() =>
              router.push(
                "/(tabs)/profile"
              )
            }
          />
        </View>
      </View>

      <View
        style={[
          styles.safety,
          theme.safety,
        ]}
      >
        <View
          style={[
            styles.safetyIcon,
            theme.safetyIcon,
          ]}
        >
          <Ionicons
            name="shield-checkmark"
            size={18}
            color={colors.brand}
          />
        </View>

        <View
          style={styles.safetyCopy}
        >
          <Text
            style={[
              styles.safetyTitle,
              theme.safetyTitle,
            ]}
          >
            Romance without the chaos
          </Text>

          <Text
            style={[
              styles.safetyText,
              theme.safetyText,
            ]}
            numberOfLines={2}
          >
            Verified profiles, reporting
            and blocking keep RomBuzz
            calmer.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
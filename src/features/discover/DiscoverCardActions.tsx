/**
 * Path: src/features/discover/DiscoverCardActions.tsx
 * Purpose: Render the redesigned Skip, Buzz, and View Profile actions on Discover cards.
 * Used by: app/(tabs)/discover.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import type { RomBuzzColors } from "@/src/design/rombuzzTheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
} from "react-native";

type Props = {
  buzzing: boolean;
  onSkip: () => void;
  onBuzz: () => void;
  onViewProfile: () => void;
};

export default function DiscoverCardActions({
  buzzing,
  onSkip,
  onBuzz,
  onViewProfile,
}: Props) {
  const { colors } = useRomBuzzTheme();

  const styles = useMemo(
    () => createStyles(colors),
    [colors]
  );

  return (
    <View style={styles.actions}>
      <Pressable
        onPress={onSkip}
        style={[styles.button, styles.skipButton]}
        android_ripple={{
          color: "rgba(255,255,255,0.14)",
          borderless: true,
        }}
      >
        <Ionicons
          name="close"
          size={28}
          color={colors.white}
        />
      </Pressable>

      <Pressable
        onPress={onBuzz}
        disabled={buzzing}
        style={[
          styles.button,
          styles.buzzButton,
          buzzing && styles.disabled,
        ]}
        android_ripple={{
          color: "rgba(255,255,255,0.18)",
          borderless: true,
        }}
      >
        {buzzing ? (
          <ActivityIndicator
            size="small"
            color={colors.white}
          />
        ) : (
          <Ionicons
            name="heart"
            size={29}
            color={colors.white}
          />
        )}
      </Pressable>

      <Pressable
        onPress={onViewProfile}
        style={[
          styles.button,
          styles.profileButton,
        ]}
        android_ripple={{
          color: colors.brandSoft,
          borderless: false,
        }}
      >
        <Ionicons
          name="person"
          size={24}
          color={colors.text}
        />
      </Pressable>
    </View>
  );
}

function createStyles(colors: RomBuzzColors) {
  return StyleSheet.create({
    actions: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
    },

    button: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    skipButton: {
      width: 58,
      height: 58,
      borderRadius: 29,

      backgroundColor: colors.overlay,

      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.32)",

      shadowColor: "#000000",
      shadowOpacity: 0.28,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 6,
      },

      elevation: 7,
    },

    buzzButton: {
      width: 70,
      height: 70,
      borderRadius: 35,

      backgroundColor: colors.brand,

      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.92)",

      shadowColor: colors.brand,
      shadowOpacity: 0.52,
      shadowRadius: 13,
      shadowOffset: {
        width: 0,
        height: 6,
      },

      elevation: 10,
    },

    profileButton: {
      width: 58,
      height: 58,
      borderRadius: 19,

      backgroundColor: colors.surfaceMuted,

      borderWidth: 2,
      borderColor: colors.borderStrong,

      shadowColor: "#000000",
      shadowOpacity: 0.18,
      shadowRadius: 9,
      shadowOffset: {
        width: 0,
        height: 6,
      },

      elevation: 6,
    },

    disabled: {
      opacity: 0.68,
    },
  });
}
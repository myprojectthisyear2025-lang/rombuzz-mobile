/**
 * Path: src/features/microbuzz/MicroBuzzHeader.tsx
 * Purpose: Compact themed MicroBuzz header with location and camera status controls.
 * Used by: app/(tabs)/microbuzz.tsx
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  RBZFont,
} from "@/src/design/rombuzzTypography";

import MicroBuzzGenderSelector from "./MicroBuzzGenderSelector";

import type {
  MicroBuzzGender,
} from "./microBuzzTypes";

type Props = {
  topInset: number;
  statusMessage: string;
  locationGranted: boolean;
  radarGender: MicroBuzzGender;
  isActive: boolean;
  onBack: () => void;
  onLocationPress: () => void;
  onRadarGenderChange: (
    value: MicroBuzzGender
  ) => void;
};

export default function MicroBuzzHeader({
  topInset,
  statusMessage,
  locationGranted,
  radarGender,
  isActive,
  onBack,
  onLocationPress,
  onRadarGenderChange,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: topInset + 6,
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor:
                colors.surface,
              borderColor:
                colors.border,
            },
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={colors.icon}
          />
        </Pressable>

        <View
          style={styles.titleCopy}
        >
          <Text
            style={[
              styles.title,
              {
                color:
                  colors.text,
              },
            ]}
          >
            MicroBuzz
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.subtitle,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {statusMessage}
          </Text>
        </View>

        <View
          style={
            styles.headerSpacer
          }
        />
      </View>

      <View
        style={styles.statusRow}
      >
        <StatusControl
          icon={
            isActive
              ? "radio"
              : "location"
          }
          title={
            locationGranted
              ? "Location On"
              : "Location Off"
          }
          subtitle={
            locationGranted
              ? "Finding people nearby"
              : "Location permission required"
          }
          onPress={
            onLocationPress
          }
        />

        <MicroBuzzGenderSelector
          value={
            radarGender
          }
          onChange={
            onRadarGenderChange
          }
        />
      </View>
    </View>
  );
}

function StatusControl({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<
    typeof Ionicons
  >["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statusControl,
        {
          backgroundColor:
            colors.surface,
          borderColor:
            colors.border,
        },
        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconBubble,
          {
            backgroundColor:
              colors.brandSoft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={colors.brand}
        />
      </View>

      <View
        style={styles.statusCopy}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.statusTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          numberOfLines={1}
          style={[
            styles.statusSubtitle,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={14}
        color={colors.iconMuted}
      />
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },

    titleRow: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
    },

    backButton: {
      width: 38,
      height: 38,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    pressed: {
      opacity: 0.62,
    },

    titleCopy: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 8,
    },

    title: {
      fontSize: 21,
      fontFamily:
        RBZFont.extraBold,
      letterSpacing: -0.45,
    },

    subtitle: {
      marginTop: 1,
      fontSize: 11.5,
      fontFamily:
        RBZFont.medium,
    },

    headerSpacer: {
      width: 38,
    },

    statusRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 6,
    },

    statusControl: {
      flex: 1,
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    iconBubble: {
      width: 30,
      height: 30,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },

    statusCopy: {
      flex: 1,
      minWidth: 0,
    },

    statusTitle: {
      fontSize: 11.5,
      fontFamily:
        RBZFont.bold,
    },

    statusSubtitle: {
      marginTop: 1,
      fontSize: 9.5,
      fontFamily:
        RBZFont.medium,
    },
  });
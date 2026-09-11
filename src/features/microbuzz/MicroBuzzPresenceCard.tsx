/**
 * Path: src/features/microbuzz/MicroBuzzPresenceCard.tsx
 * Purpose: Compact presence/selfie and Go Live/Stop control for the MicroBuzz redesign.
 * Used by: app/(tabs)/microbuzz.tsx
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
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

type Props = {
  selfieUri: string;
  firstName: string;
  isActive: boolean;
  liveDuration: number;
  radiusMeters: number;
  canGoLive: boolean;
  busy: boolean;
  onSelfiePress: () => void;
  onSelfieLongPress: () => void;
  onGoLive: () => void;
  onStop: () => void;
};

export default function MicroBuzzPresenceCard({
  selfieUri,
  firstName,
  isActive,
  liveDuration,
  radiusMeters,
  canGoLive,
  busy,
  onSelfiePress,
  onSelfieLongPress,
  onGoLive,
  onStop,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            colors.surface,
          borderColor:
            colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onSelfiePress}
        onLongPress={
          onSelfieLongPress
        }
        delayLongPress={300}
        style={({ pressed }) => [
          styles.avatarWrap,
          pressed &&
            styles.pressed,
        ]}
      >
        {selfieUri ? (
          <Image
            source={{
              uri: selfieUri,
            }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatarEmpty,
              {
                backgroundColor:
                  colors.surfaceMuted,
              },
            ]}
          >
            <Ionicons
              name="camera"
              size={20}
              color={colors.brand}
            />
          </View>
        )}

        <View
          style={[
            styles.liveDot,
            {
              backgroundColor:
                isActive
                  ? "#21C96B"
                  : colors.textMuted,

              borderColor:
                colors.surface,
            },
          ]}
        />
      </Pressable>

      <View style={styles.copy}>
        <View
          style={styles.titleRow}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {firstName || "You"}
          </Text>
        </View>

        <Text
          style={[
            styles.liveText,
            {
              color: isActive
                ? "#21C96B"
                : colors.textSecondary,
            },
          ]}
        >
          {isActive
            ? `● Live · ${liveDuration}m`
            : selfieUri
              ? "Ready to go live"
              : "Take a selfie, Go Live"}
        </Text>

        <Text
          style={[
            styles.radius,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          {radiusMeters}m radius
        </Text>
      </View>

      <Pressable
        disabled={
          !isActive &&
          !canGoLive
        }
        onPress={
          isActive
            ? onStop
            : onGoLive
        }
        style={({ pressed }) => [
          styles.action,
          {
            backgroundColor:
              colors.brand,
          },
          !isActive &&
            !canGoLive &&
            styles.disabled,
          pressed &&
            styles.pressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator
            size="small"
            color={colors.white}
          />
        ) : (
          <>
            <Ionicons
              name={
                isActive
                  ? "power"
                  : "flash"
              }
              size={15}
              color={
                colors.white
              }
            />

            <Text
              style={[
                styles.actionText,
                {
                  color:
                    colors.white,
                },
              ]}
            >
              {isActive
                ? "Stop MicroBuzz"
                : "Go Live"}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles =
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      minHeight: 84,
      borderRadius: 20,
      borderWidth: 1,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    avatarWrap: {
      width: 62,
      height: 62,
      borderRadius: 31,
    },

    avatar: {
      width: 62,
      height: 62,
      borderRadius: 31,
      transform: [
        { scaleX: -1 },
      ],
    },

    avatarEmpty: {
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems: "center",
      justifyContent: "center",
    },

    liveDot: {
      position: "absolute",
      right: 1,
      bottom: 3,
      width: 13,
      height: 13,
      borderRadius: 7,
      borderWidth: 2,
    },

    copy: {
      flex: 1,
      minWidth: 0,
    },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    title: {
      flexShrink: 1,
      fontSize: 13.5,
      fontFamily:
        RBZFont.bold,
    },

    liveText: {
      marginTop: 4,
      fontSize: 11.5,
      fontFamily:
        RBZFont.semiBold,
    },

    radius: {
      marginTop: 2,
      fontSize: 10.5,
      fontFamily:
        RBZFont.medium,
    },

    action: {
      minWidth: 118,
      minHeight: 40,
      borderRadius: 14,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    actionText: {
      fontSize: 11.5,
      fontFamily:
        RBZFont.semiBold,
    },

    disabled: {
      opacity: 0.42,
    },

    pressed: {
      opacity: 0.68,
    },
  });
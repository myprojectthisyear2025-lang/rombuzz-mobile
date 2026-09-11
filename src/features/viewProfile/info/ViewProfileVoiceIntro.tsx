/**
 * Path: src/features/viewProfile/info/ViewProfileVoiceIntro.tsx
 * Purpose: Compact waveform-style Voice Intro control for matched-user View Profile.
 * Used by: ViewProfileIntroInfo.tsx only.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

const BAR_HEIGHTS = [
  8, 13, 18, 11, 16,
  22, 14, 9, 18, 12,
  20, 15, 8, 13, 17,
  10, 14, 8, 12, 6,
];

function formatDuration(
  seconds: number
) {
  const safe = Math.max(
    0,
    Math.round(
      Number(seconds) || 0
    )
  );

  return `${Math.floor(
    safe / 60
  )}:${String(
    safe % 60
  ).padStart(2, "0")}`;
}

type Props = {
  durationSec: number;
  playing: boolean;
  onPress: () => void;
};

export default function ViewProfileVoiceIntro({
  durationSec,
  playing,
  onPress,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.playButton,
          {
            backgroundColor:
              colors.surfaceMuted,
          },
          pressed &&
            styles.pressed,
        ]}
      >
        <Ionicons
          name={
            playing
              ? "pause"
              : "play"
          }
          size={17}
          color={colors.icon}
        />
      </Pressable>

      <View
        style={styles.waveform}
        accessibilityElementsHidden
      >
        {BAR_HEIGHTS.map(
          (height, index) => (
            <View
              key={`${height}-${index}`}
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor:
                    playing
                      ? colors.brand
                      : colors.iconMuted,
                  opacity: playing
                    ? 0.8
                    : 0.52,
                },
              ]}
            />
          )
        )}
      </View>

      <Text
        style={[
          styles.duration,
          {
            color:
              colors.textMuted,
          },
        ]}
      >
        {durationSec > 0
          ? formatDuration(
              durationSec
            )
          : "0:00"}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    row: {
      minHeight: 58,
      paddingVertical: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },

    playButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },

    waveform: {
      flex: 1,
      minWidth: 0,
      height: 28,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },

    bar: {
      flex: 1,
      maxWidth: 3,
      minWidth: 1.5,
      borderRadius: 2,
    },

    duration: {
      flexShrink: 0,
      fontFamily:
        RBZFont.medium,
      fontSize: 12,
    },

    pressed: {
      opacity: 0.65,
    },
  });
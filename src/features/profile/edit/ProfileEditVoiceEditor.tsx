/**
 * Path: src/features/profile/edit/ProfileEditVoiceEditor.tsx
 * Purpose: Focused Voice Intro UI wired to the existing recording, upload, playback, and delete handlers.
 * Used by: ProfileEditScreen.
 */

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    RBZFont,
} from "@/src/design/rombuzzTypography";

import {
    Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

function formatDuration(
  seconds: number
) {
  const safe = Math.max(
    0,
    Math.floor(
      Number(seconds || 0)
    )
  );

  return `${String(
    Math.floor(safe / 60)
  ).padStart(
    2,
    "0"
  )}:${String(
    safe % 60
  ).padStart(2, "0")}`;
}

export default function ProfileEditVoiceEditor({
  recording,
  voiceUrl,
  voiceDurationSec,
  playing,
  startRecording,
  stopRecording,
  playVoice,
  deleteVoiceIntro,
}: {
  recording: boolean;
  voiceUrl: string;
  voiceDurationSec: number;
  playing: boolean;
  startRecording: () => void;

  stopRecording: (
    autoStop?: boolean
  ) => void;

  playVoice: () => void;
  deleteVoiceIntro: () => void;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View>
      <Text
        style={[
          styles.heading,
          {
            color: colors.text,
          },
        ]}
      >
        Let people hear your vibe.
      </Text>

      <Text
        style={[
          styles.copy,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        Record up to 60 seconds
        and give your profile a
        little more personality.
      </Text>

      {!!voiceUrl && (
        <Pressable
          onPress={playVoice}
          style={[
            styles.playRow,
            {
              borderColor:
                colors.border,

              backgroundColor:
                colors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.playIcon,
              {
                backgroundColor:
                  colors.brandSoft,
              },
            ]}
          >
            <Ionicons
              name={
                playing
                  ? "pause"
                  : "play"
              }
              size={18}
              color={colors.brand}
            />
          </View>

          <View
            style={styles.playText}
          >
            <Text
              style={[
                styles.saved,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Voice intro
            </Text>

            <Text
              style={[
                styles.duration,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              {formatDuration(
                voiceDurationSec
              )}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={17}
            color={colors.iconMuted}
          />
        </Pressable>
      )}

      <View
        style={styles.actions}
      >
        <Pressable
          onPress={
            recording
              ? () =>
                  stopRecording(
                    false
                  )
              : startRecording
          }
          style={[
            styles.primary,
            {
              backgroundColor:
                recording
                  ? colors.danger
                  : colors.brand,
            },
          ]}
        >
          <Ionicons
            name={
              recording
                ? "stop"
                : "mic"
            }
            size={18}
            color={colors.white}
          />

          <Text
            style={[
              styles.primaryText,
              {
                color:
                  colors.white,
              },
            ]}
          >
            {recording
              ? "Stop recording"
              : voiceUrl
                ? "Record again"
                : "Record intro"}
          </Text>
        </Pressable>

        {!!voiceUrl &&
          !recording && (
            <Pressable
              onPress={
                deleteVoiceIntro
              }
              style={[
                styles.delete,
                {
                  borderColor:
                    colors.borderStrong,
                },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={
                  colors.danger
                }
              />
            </Pressable>
          )}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    heading: {
      fontFamily: RBZFont.bold,
      fontSize: 18,
      letterSpacing: -0.3,
    },

    copy: {
      marginTop: 6,
      fontFamily:
        RBZFont.regular,
      fontSize: 13.5,
      lineHeight: 20,
    },

    playRow: {
      marginTop: 22,
      minHeight: 62,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      borderWidth:
        StyleSheet.hairlineWidth,
      borderRadius: 12,
    },

    playIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },

    playText: {
      flex: 1,
      marginLeft: 11,
    },

    saved: {
      fontFamily:
        RBZFont.semiBold,
      fontSize: 14,
    },

    duration: {
      marginTop: 2,
      fontFamily:
        RBZFont.medium,
      fontSize: 12,
    },

    actions: {
      marginTop: 18,
      flexDirection: "row",
      gap: 10,
    },

    primary: {
      flex: 1,
      minHeight: 48,
      borderRadius: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    primaryText: {
      fontFamily:
        RBZFont.semiBold,
      fontSize: 14,
    },

    delete: {
      width: 48,
      height: 48,
      borderRadius: 11,
      borderWidth:
        StyleSheet.hairlineWidth,
      alignItems: "center",
      justifyContent: "center",
    },
  });
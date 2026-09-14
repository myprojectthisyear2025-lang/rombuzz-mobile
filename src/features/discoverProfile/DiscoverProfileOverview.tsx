/**
 * Path: src/features/discoverProfile/DiscoverProfileOverview.tsx
 * Purpose: About, voice intro, and inline Discover relationship actions.
 * Used by: DiscoverProfileScreen.tsx only.
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

import {
  DiscoverProfileSection,
} from "./DiscoverProfileFields";

export default function DiscoverProfileOverview({
  user,
  voiceUrl,
  playing,
  onToggleVoice,
  actions,
}: {
  user: any;
  voiceUrl: string;
  playing: boolean;
  onToggleVoice: () => void;
  actions: React.ReactNode;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <>
      {(!!user?.bio ||
        !!voiceUrl) && (
        <DiscoverProfileSection title="About">
          {!!user?.bio && (
            <Text
              style={[
                styles.bio,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {user.bio}
            </Text>
          )}

          {!!voiceUrl && (
            <Pressable
              onPress={
                onToggleVoice
              }
              style={[
                styles.voice,
                {
                  backgroundColor:
                    colors.surfaceMuted,

                  borderColor:
                    colors.border,
                },
              ]}
            >
              <Ionicons
                name={
                  playing
                    ? "stop"
                    : "play"
                }
                size={16}
                color={
                  colors.brand
                }
              />

              <Text
                style={[
                  styles.voiceText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {playing
                  ? "Playing voice intro"
                  : "Play voice intro"}
              </Text>
            </Pressable>
          )}
        </DiscoverProfileSection>
      )}

      <View style={styles.actions}>
        {actions}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bio: {
    paddingVertical: 11,
    fontFamily:
      RBZFont.regular,
    fontSize: 14,
    lineHeight: 21,
  },

  voice: {
    alignSelf:
      "flex-start",

    marginBottom: 8,

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 999,

    borderWidth:
      StyleSheet.hairlineWidth,

    flexDirection: "row",
    alignItems: "center",

    gap: 7,
  },

  voiceText: {
    fontFamily:
      RBZFont.semiBold,

    fontSize: 12.5,
  },

  actions: {
    marginTop: 2,
    marginBottom: 4,
  },
});
/**
 * Path: src/features/viewProfile/info/ViewProfileIntroInfo.tsx
 * Purpose: Theme-aware read-only About and Voice Intro presentation for View Profile.
 * Used by: app/(tabs)/view-profile.tsx only.
 */

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  RBZFont,
} from "@/src/design/rombuzzTypography";

import React from "react";

import {
  StyleSheet,
  Text,
} from "react-native";

import ViewProfileInfoSection from "./ViewProfileInfoSection";
import ViewProfileVoiceIntro from "./ViewProfileVoiceIntro";

type Props = {
  bio?: string;
  voiceUrl?: string;

  voiceDurationSec: number;
  playing: boolean;

  onPressVoice: () => void;
};

export default function ViewProfileIntroInfo({
  bio,
  voiceUrl,
  voiceDurationSec,
  playing,
  onPressVoice,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const cleanBio =
    String(
      bio ?? ""
    ).trim();

  return (
    <>
      {!!cleanBio && (
        <ViewProfileInfoSection
          title="About"
        >
          <Text
            style={[
              styles.bio,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {cleanBio}
          </Text>
        </ViewProfileInfoSection>
      )}

      {!!voiceUrl && (
        <ViewProfileInfoSection
          title="Voice Intro"
        >
          <ViewProfileVoiceIntro
            durationSec={
              voiceDurationSec
            }
            playing={playing}
            onPress={
              onPressVoice
            }
          />
        </ViewProfileInfoSection>
      )}
    </>
  );
}

const styles =
  StyleSheet.create({
    bio: {
      paddingVertical: 10,

      fontFamily:
        RBZFont.medium,

      fontSize: 15,
      lineHeight: 22,
    },
  });
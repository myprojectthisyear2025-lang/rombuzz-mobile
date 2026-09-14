/**
 * Path: src/features/profile/preview/ProfilePreviewBar.tsx
 * Purpose: Compact before-match / after-match switcher for owner profile preview.
 * Used by: Discover Profile and View Profile preview modes.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import type {
    ProfilePreviewMode,
} from "./profilePreviewTypes";

type Props = {
  mode: ProfilePreviewMode;
  onSelectBefore: () => void;
  onSelectAfter: () => void;
};

export default function ProfilePreviewBar({
  mode,
  onSelectBefore,
  onSelectAfter,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.segment,
          {
            backgroundColor:
              colors.surfaceMuted,
          },
        ]}
      >
        <SegmentButton
          label="Before Match"
          active={mode === "before"}
          onPress={onSelectBefore}
        />

        <SegmentButton
          label="After Match"
          active={mode === "after"}
          onPress={onSelectAfter}
        />
      </View>
    </View>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        active && {
          backgroundColor:
            colors.surface,
          borderColor:
            colors.borderStrong,
        },
        pressed &&
          !active &&
          styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.segmentText,
          {
            color: active
              ? colors.text
              : colors.textMuted,
          },
          active &&
            styles.segmentTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    wrap: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
    },

    segment: {
      borderRadius: 12,
      padding: 3,
      flexDirection: "row",
      gap: 3,
    },

    segmentButton: {
      flex: 1,
      minHeight: 34,
      borderRadius: 9,
      borderWidth: 1,
      borderColor:
        "transparent",
      alignItems: "center",
      justifyContent: "center",
    },

    segmentText: {
      fontFamily:
        RBZFont.medium,
      fontSize: 12,
    },

    segmentTextActive: {
      fontFamily:
        RBZFont.semiBold,
    },

    pressed: {
      opacity: 0.68,
    },
  });
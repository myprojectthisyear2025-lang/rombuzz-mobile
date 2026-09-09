/**
 * Path: src/features/microbuzz/MicroBuzzBottomControls.tsx
 * Purpose: Bottom MicroBuzz row containing Refresh, rotating tip, and nearby count.
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

type Props = {
  tip: string;
  nearbyCount: number;
  isActive: boolean;
  onRefresh: () => void;
};

export default function MicroBuzzBottomControls({
  tip,
  nearbyCount,
  isActive,
  onRefresh,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onRefresh}
        style={({ pressed }) => [
          styles.sideButton,
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
          name="refresh"
          size={19}
          color={colors.icon}
        />

        <Text
          style={[
            styles.sideText,
            {
              color:
                colors.text,
            },
          ]}
        >
          Refresh
        </Text>
      </Pressable>

      <View
        style={styles.tipWrap}
      >
        <Ionicons
          name="bulb-outline"
          size={15}
          color={colors.brand}
        />

        <Text
          numberOfLines={2}
          style={[
            styles.tipText,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          {tip}
        </Text>
      </View>

      <View
        style={[
          styles.sideButton,
          {
            backgroundColor:
              colors.brandSoft,

            borderColor:
              colors.brandSoft,
          },
        ]}
      >
        <Ionicons
          name="people"
          size={18}
          color={colors.brand}
        />

        <Text
          style={[
            styles.nearbyText,
            {
              color:
                colors.brand,
            },
          ]}
        >
          {isActive
            ? nearbyCount
            : "-"}{" "}
          Nearby
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    row: {
      marginTop: 10,
      marginHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    sideButton: {
      minHeight: 44,
      borderRadius: 17,
      borderWidth: 1,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    sideText: {
      fontSize: 11.5,
      fontFamily:
        RBZFont.semiBold,
    },

    nearbyText: {
      fontSize: 11.5,
      fontFamily:
        RBZFont.bold,
    },

    tipWrap: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingHorizontal: 2,
    },

    tipText: {
      flex: 1,
      textAlign: "center",
      fontSize: 9.5,
      lineHeight: 12.5,
      fontFamily:
        RBZFont.medium,
    },

    pressed: {
      opacity: 0.62,
    },
  });
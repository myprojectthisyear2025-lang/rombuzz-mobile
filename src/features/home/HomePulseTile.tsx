/**
 * Path: src/features/home/HomePulseTile.tsx
 * Purpose: Theme-aware compact shortcut tile for the Home pulse grid.
 * Used by: HomeDashboard for all four RomBuzz pulse shortcuts.
 */

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

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

import {
  RBZFont,
} from "@/src/design/rombuzzTypography";

import { useHomeThemeStyles } from "@/src/features/home/useHomeThemeStyles";

type IoniconName =
  React.ComponentProps<
    typeof Ionicons
  >["name"];

type Props = {
  title: string;
  subtitle: string;
  icon: IoniconName;
  onPress: () => void;
};

export default function HomePulseTile({
  title,
  subtitle,
  icon,
  onPress,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const theme =
    useHomeThemeStyles();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        theme.pulseTile,

        pressed &&
          styles.pressed,

        pressed &&
          theme.pulseTilePressed,
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrap,
            theme.pulseIconWrap,
          ]}
        >
          <Ionicons
            name={icon}
            size={16}
            color={colors.icon}
          />
        </View>

        <Ionicons
          name="chevron-forward"
          size={13}
          color={colors.iconMuted}
        />
      </View>

      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            theme.pulseTitle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.subtitle,
            theme.pulseSubtitle,
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "48.4%",
    minHeight: 70,
    flexGrow: 1,
    padding: 9,
    borderRadius: 15,

    borderWidth:
      StyleSheet.hairlineWidth,

    justifyContent:
      "space-between",
  },

  pressed: {},

  topRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",
  },

  iconWrap: {
    width: 29,
    height: 29,

    borderRadius: 10,

    alignItems: "center",

    justifyContent: "center",
  },

  copy: {
    marginTop: 5,
  },

  title: {
    fontSize: 12,

    fontFamily:
      RBZFont.bold,
  },

  subtitle: {
    fontSize: 10.5,

    lineHeight: 13,

    fontFamily:
      RBZFont.medium,

    marginTop: 1,
  },
});
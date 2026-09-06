/**
 * Path: src/features/profile/ProfileTabBar.tsx
 * Purpose: Premium theme-aware navigation for Profile Gallery, About, and Private Notes.
 * Used by: app/(tabs)/profile.tsx.
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

export type ProfileTab =
  | "gallery"
  | "info"
  | "notes";

type Props = {
  active: ProfileTab;
  onChange: (
    tab: ProfileTab
  ) => void;
};

const ITEMS = [
  {
    key: "gallery" as const,
    label: "Gallery",
    icon: "images-outline" as const,
  },
  {
    key: "info" as const,
    label: "About",
    icon: "person-outline" as const,
  },
  {
    key: "notes" as const,
    label: "Private Notes",
    icon: "lock-closed-outline" as const,
  },
];

export default function ProfileTabBar({
  active,
  onChange,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View
      style={[
        styles.outer,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        {ITEMS.map((item) => {
          const selected =
            active === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() =>
                onChange(item.key)
              }
              style={({ pressed }) => [
                styles.item,
                pressed && {
                  opacity: 0.58,
                },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={17}
                color={
                  selected
                    ? colors.brand
                    : colors.iconMuted
                }
              />

              <Text
                style={[
                  styles.label,
                  {
                    color: selected
                      ? colors.text
                      : colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>

              <View
                style={[
                  styles.indicator,
                  {
                    backgroundColor:
                      selected
                        ? colors.brand
                        : "transparent",
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },

  row: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    flexDirection: "row",
  },

  item: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    position: "relative",
    paddingHorizontal: 4,
  },

  label: {
    fontFamily: RBZFont.semiBold,
    fontSize: 12.5,
  },

  indicator: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: -1,
    height: 2,
    borderRadius: 2,
  },
});
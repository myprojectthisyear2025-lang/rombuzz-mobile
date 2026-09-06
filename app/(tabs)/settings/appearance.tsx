/**
 * Path: app/(tabs)/settings/appearance.tsx
 * Purpose: Lets users choose System, Light, or Dark RomBuzz appearance.
 * Used by: Settings > Preferences > Appearance.
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

import {
    ScreenShell,
    SectionTitle,
    SmallText,
} from "@/src/components/settings/_ui";

import type {
    RomBuzzThemeMode,
} from "@/src/design/rombuzzTheme";

type Option = {
  value: RomBuzzThemeMode;
  title: string;
  description: string;
  icon: React.ComponentProps<
    typeof Ionicons
  >["name"];
};

const OPTIONS: Option[] = [
  {
    value: "system",
    title: "System",
    description:
      "Match your phone’s appearance automatically.",
    icon: "phone-portrait-outline",
  },
  {
    value: "light",
    title: "Light",
    description:
      "Always use RomBuzz in light mode.",
    icon: "sunny-outline",
  },
  {
    value: "dark",
    title: "Dark",
    description:
      "Always use RomBuzz in dark mode.",
    icon: "moon-outline",
  },
];

export default function AppearanceSettings() {
  const {
    mode,
    colors,
    setMode,
  } = useRomBuzzTheme();

  return (
    <ScreenShell title="Appearance">
      <SectionTitle>
        Theme
      </SectionTitle>

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
        {OPTIONS.map(
          (option, index) => {
            const selected =
              mode === option.value;

            return (
              <React.Fragment
                key={option.value}
              >
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected,
                  }}
                  onPress={() => {
                    void setMode(
                      option.value
                    );
                  }}
                  style={({ pressed }) => [
                    styles.option,

                    pressed && {
                      backgroundColor:
                        colors.surfaceMuted,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor:
                          selected
                            ? colors.brandSoft
                            : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={
                        selected
                          ? colors.brand
                          : colors.icon
                      }
                    />
                  </View>

                  <View
                    style={styles.copy}
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
                      {option.title}
                    </Text>

                    <Text
                      style={[
                        styles.description,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>

                  <Ionicons
                    name={
                      selected
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={22}
                    color={
                      selected
                        ? colors.brand
                        : colors.iconMuted
                    }
                  />
                </Pressable>

                {index <
                OPTIONS.length - 1 ? (
                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor:
                          colors.border,
                      },
                    ]}
                  />
                ) : null}
              </React.Fragment>
            );
          }
        )}
      </View>

      <SmallText>
        System follows your phone’s appearance and changes automatically when your device switches between light and dark mode.
      </SmallText>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,

    borderRadius: 20,

    borderWidth:
      StyleSheet.hairlineWidth,

    overflow: "hidden",
  },

  option: {
    minHeight: 72,

    paddingHorizontal: 16,
    paddingVertical: 12,

    flexDirection: "row",

    alignItems: "center",

    gap: 12,
  },

  iconWrap: {
    width: 38,
    height: 38,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",
  },

  copy: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 15,

    fontFamily:
      RBZFont.bold,
  },

  description: {
    marginTop: 2,

    fontSize: 11.5,

    lineHeight: 16,

    fontFamily:
      RBZFont.regular,
  },

  divider: {
    height:
      StyleSheet.hairlineWidth,

    marginLeft: 66,
  },
});
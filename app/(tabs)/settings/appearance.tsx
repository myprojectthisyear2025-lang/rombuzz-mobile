/**
 * Path: app/(tabs)/settings/appearance.tsx
 * Purpose: Select the existing System, Light, or Dark appearance in a flat Settings list.
 */
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { ScreenShell, SectionTitle, SmallText } from "@/src/components/settings/_ui";
import type { RomBuzzThemeMode } from "@/src/design/rombuzzTheme";

type Option = {
  value: RomBuzzThemeMode;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const OPTIONS: Option[] = [
  {
    value: "system",
    title: "System",
    description: "Match your phone’s appearance automatically.",
    icon: "phone-portrait-outline",
  },
  { value: "light", title: "Light", description: "Always use RomBuzz in light mode.", icon: "sunny-outline" },
  { value: "dark", title: "Dark", description: "Always use RomBuzz in dark mode.", icon: "moon-outline" },
];

export default function AppearanceSettings() {
  const { mode, colors, setMode } = useRomBuzzTheme();
  return (
    <ScreenShell title="Appearance">
      <SectionTitle>Theme</SectionTitle>
      <View accessibilityRole="radiogroup">
        {OPTIONS.map((option) => {
          const selected = mode === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              onPress={() => {
                void setMode(option.value);
              }}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.surfaceMuted : colors.background,
                },
              ]}
            >
              <Ionicons name={option.icon} size={20} color={selected ? colors.brand : colors.iconMuted} />
              <View style={styles.copy}>
                <Text style={[styles.title, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              <Ionicons
                name={selected ? "radio-button-on" : "radio-button-off"}
                size={21}
                color={selected ? colors.brand : colors.iconMuted}
              />
            </Pressable>
          );
        })}
      </View>
      <SmallText>
        System follows your phone’s appearance and changes automatically when your device switches between
        light and dark mode.
      </SmallText>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 76,
    paddingVertical: 16,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 14.5, fontFamily: RBZFont.semiBold },
  description: { marginTop: 4, fontSize: 12, lineHeight: 18, fontFamily: RBZFont.regular },
});

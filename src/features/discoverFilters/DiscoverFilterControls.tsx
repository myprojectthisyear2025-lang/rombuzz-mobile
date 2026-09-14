/**
 * Path: src/features/discoverFilters/DiscoverFilterControls.tsx
 * Purpose: Reusable compact controls for the RomBuzz Discover Filters screen.
 */

import {
    Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
    Pressable,
    ScrollView,
    Switch,
    Text,
    View,
} from "react-native";

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    filterStyles as styles,
} from "./discoverFilterStyles";

import type {
    FilterOption,
} from "./discoverFilterOptions";

type ChipSelectorProps = {
  options: FilterOption[];
  selected: string[];

  onToggle: (
    value: string
  ) => void;

  allowAny?: boolean;
  horizontal?: boolean;
};

export function ChipSelector({
  options,
  selected,
  onToggle,
  allowAny = false,
  horizontal = false,
}: ChipSelectorProps) {
  const chips = (
    <View
      style={
        styles.chipsWrap
      }
    >
      {allowAny ? (
        <FilterChip
          label="Any"
          active={
            selected.length ===
            0
          }
          onPress={() =>
            onToggle("")
          }
        />
      ) : null}

      {options.map(
        (option) => (
          <FilterChip
            key={
              option.value ||
              option.label
            }
            label={
              option.label
            }
            active={selected.includes(
              option.value
            )}
            onPress={() =>
              onToggle(
                option.value
              )
            }
          />
        )
      )}
    </View>
  );

  if (!horizontal) {
    return chips;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={
        false
      }
      contentContainerStyle={
        styles.horizontalChips
      }
    >
      {chips}
    </ScrollView>
  );
}

function FilterChip({
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
      style={({
        pressed,
      }) => [
        styles.chip,

        {
          backgroundColor:
            active
              ? colors.brandSoft
              : colors.surfaceMuted,

          borderColor:
            active
              ? colors.brand
              : colors.border,

          opacity:
            pressed
              ? 0.72
              : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,

          {
            color:
              active
                ? colors.brand
                : colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function PreferenceRow({
  icon,
  label,
  options,
  selected,
  onToggle,
  isLast = false,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  label: string;

  options:
    FilterOption[];

  selected: string[];

  onToggle: (
    value: string
  ) => void;

  isLast?: boolean;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View>
      <View
        style={
          styles.preferenceRow
        }
      >
        <View
          style={
            styles.preferenceHeader
          }
        >
          <Ionicons
            name={icon}
            size={17}
            color={
              colors.icon
            }
          />

          <Text
            style={[
              styles.preferenceLabel,

              {
                color:
                  colors.text,
              },
            ]}
          >
            {label}
          </Text>
        </View>

        <ChipSelector
          options={options}
          selected={selected}
          onToggle={onToggle}
          allowAny
          horizontal
        />
      </View>

      {!isLast ? (
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
    </View>
  );
}

export function FilterToggleRow({
  icon,
  label,
  hint,
  value,
  onChange,
  isLast = false,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  label: string;
  hint: string;
  value: boolean;

  onChange: (
    value: boolean
  ) => void;

  isLast?: boolean;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View>
      <View
        style={
          styles.toggleRow
        }
      >
        <Ionicons
          name={icon}
          size={18}
          color={colors.icon}
        />

        <View
          style={
            styles.toggleCopy
          }
        >
          <Text
            style={[
              styles.toggleLabel,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {label}
          </Text>

          <Text
            style={[
              styles.toggleHint,

              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            {hint}
          </Text>
        </View>

        <Switch
          value={value}
          onValueChange={
            onChange
          }
          trackColor={{
            false:
              colors.borderStrong,

            true:
              colors.brand,
          }}
          thumbColor={
            colors.white
          }
        />
      </View>

      {!isLast ? (
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
    </View>
  );
}
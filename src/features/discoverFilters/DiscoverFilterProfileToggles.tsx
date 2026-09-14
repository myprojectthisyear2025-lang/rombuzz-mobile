/**
 * Path: src/features/discoverFilters/DiscoverFilterProfileToggles.tsx
 * Purpose: Profile availability toggles for Discover Filters.
 */

import React from "react";

import {
    View,
} from "react-native";

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    FilterToggleRow,
} from "./DiscoverFilterControls";

import {
    filterStyles as styles,
} from "./discoverFilterStyles";

import type {
    DiscoverFilters,
} from "./discoverFilterModel";

type Props = {
  filters:
    DiscoverFilters;

  setFilters:
    React.Dispatch<
      React.SetStateAction<
        DiscoverFilters
      >
    >;
};

export default function DiscoverFilterProfileToggles({
  filters,
  setFilters,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View
      style={[
        styles.profileCard,

        {
          backgroundColor:
            colors.surface,

          borderColor:
            colors.border,
        },
      ]}
    >
      <FilterToggleRow
        icon="radio-button-on-outline"
        label="Online now"
        hint="Show only people who are online now"
        value={
          filters.onlineOnly
        }
        onChange={(
          onlineOnly
        ) =>
          setFilters(
            (prev) => ({
              ...prev,
              onlineOnly,
            })
          )
        }
      />

      <FilterToggleRow
        icon="checkmark-circle-outline"
        label="Verified profiles only"
        hint="Show only verified profiles"
        value={
          filters.verifiedOnly
        }
        onChange={(
          verifiedOnly
        ) =>
          setFilters(
            (prev) => ({
              ...prev,
              verifiedOnly,
            })
          )
        }
      />

      <FilterToggleRow
        icon="images-outline"
        label="Has photos"
        hint="Show only profiles with photos"
        value={
          filters.photosOnly
        }
        onChange={(
          photosOnly
        ) =>
          setFilters(
            (prev) => ({
              ...prev,
              photosOnly,
            })
          )
        }
        isLast
      />
    </View>
  );
}
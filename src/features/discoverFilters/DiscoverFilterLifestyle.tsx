/**
 * Path: src/features/discoverFilters/DiscoverFilterLifestyle.tsx
 * Purpose: Compact lifestyle/preference rows for every live secondary filter.
 */

import React from "react";

import {
    View,
} from "react-native";

import {
    RELATIONSHIP_STYLE_FILTER_OPTIONS,
} from "@/src/constants/relationshipStyles";

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    PreferenceRow,
} from "./DiscoverFilterControls";

import {
    BODY_TYPE_OPTIONS,
    DIET_OPTIONS,
    DRINKING_OPTIONS,
    EDUCATION_OPTIONS,
    FITNESS_OPTIONS,
    INTEREST_OPTIONS,
    LOVE_OPTIONS,
    PET_OPTIONS,
    SLEEP_OPTIONS,
    SMOKING_OPTIONS,
    VIBE_OPTIONS,
    WORKOUT_OPTIONS,
    ZODIAC_OPTIONS,
    type FilterOption,
} from "./discoverFilterOptions";

import {
    filterStyles as styles,
} from "./discoverFilterStyles";

import type {
    DiscoverFilters,
} from "./discoverFilterModel";

import {
    toggleInArray,
} from "./discoverFilterModel";

type ArrayKey =
  | "vibe"
  | "bodyType"
  | "fitnessLevel"
  | "smoking"
  | "drinking"
  | "workoutFrequency"
  | "diet"
  | "sleepSchedule"
  | "educationLevel"
  | "petsPreference"
  | "zodiac"
  | "loveLanguage"
  | "interest";

type RowConfig = {
  key: ArrayKey;

  label: string;

  icon: any;

  options:
    FilterOption[];
};

const ROWS:
  RowConfig[] = [
    {
      key: "vibe",
      label: "Vibe",
      icon:
        "sparkles-outline",
      options:
        VIBE_OPTIONS,
    },

    {
      key: "bodyType",
      label: "Body type",
      icon: "body-outline",
      options:
        BODY_TYPE_OPTIONS,
    },

    {
      key: "fitnessLevel",
      label:
        "Fitness level",
      icon:
        "barbell-outline",
      options:
        FITNESS_OPTIONS,
    },

    {
      key: "smoking",
      label: "Smoking",
      icon: "cloud-outline",
      options:
        SMOKING_OPTIONS,
    },

    {
      key: "drinking",
      label: "Drinking",
      icon: "wine-outline",
      options:
        DRINKING_OPTIONS,
    },

    {
      key:
        "workoutFrequency",
      label:
        "Workout frequency",
      icon:
        "fitness-outline",
      options:
        WORKOUT_OPTIONS,
    },

    {
      key: "diet",
      label: "Diet",
      icon:
        "restaurant-outline",
      options:
        DIET_OPTIONS,
    },

    {
      key: "sleepSchedule",
      label:
        "Sleep schedule",
      icon: "moon-outline",
      options:
        SLEEP_OPTIONS,
    },

    {
      key:
        "educationLevel",
      label: "Education",
      icon:
        "school-outline",
      options:
        EDUCATION_OPTIONS,
    },

    {
      key:
        "petsPreference",
      label: "Pets",
      icon: "paw-outline",
      options:
        PET_OPTIONS,
    },

    {
      key: "zodiac",
      label: "Zodiac",
      icon: "star-outline",
      options:
        ZODIAC_OPTIONS,
    },

    {
      key:
        "loveLanguage",
      label:
        "Love language",
      icon:
        "heart-circle-outline",
      options:
        LOVE_OPTIONS,
    },

    {
      key: "interest",
      label: "Interests",
      icon:
        "pricetags-outline",
      options:
        INTEREST_OPTIONS,
    },
  ];

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

export default function DiscoverFilterLifestyle({
  filters,
  setFilters,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const updateMulti = (
    key: ArrayKey,
    value: string
  ) => {
    setFilters(
      (prev) => ({
        ...prev,

        [key]:
          value
            ? toggleInArray(
                prev[key],
                value
              )
            : [],
      })
    );
  };

  return (
    <View
      style={[
        styles.lifestyleCard,

        {
          backgroundColor:
            colors.surface,

          borderColor:
            colors.border,
        },
      ]}
    >
      <PreferenceRow
        icon="heart-outline"
        label="Relationship style"
        options={
          RELATIONSHIP_STYLE_FILTER_OPTIONS
        }
        selected={
          filters.relationshipStyle
        }
        onToggle={(
          value
        ) =>
          setFilters(
            (prev) => ({
              ...prev,

              relationshipStyle:
                value
                  ? [value]
                  : [],
            })
          )
        }
      />

      {ROWS.map(
        (
          row,
          index
        ) => (
          <PreferenceRow
            key={row.key}
            icon={row.icon}
            label={
              row.label
            }
            options={
              row.options
            }
            selected={
              filters[
                row.key
              ]
            }
            onToggle={(
              value
            ) =>
              updateMulti(
                row.key,
                value
              )
            }
            isLast={
              index ===
              ROWS.length -
                1
            }
          />
        )
      )}
    </View>
  );
}
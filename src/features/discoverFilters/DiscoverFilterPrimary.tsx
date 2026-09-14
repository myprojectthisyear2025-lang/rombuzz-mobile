/**
 * Path: src/features/discoverFilters/DiscoverFilterPrimary.tsx
 * Purpose: Primary Discover filters: distance, age, gender, and Looking For.
 */

import {
    Ionicons,
} from "@expo/vector-icons";

import MultiSlider from "@ptomasroos/react-native-multi-slider";

import React, {
    useMemo,
    useState,
} from "react";

import {
    Pressable,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

import {
    LOOKING_FOR_FILTER_OPTIONS,
} from "@/src/constants/lookingFor";

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    ChipSelector,
} from "./DiscoverFilterControls";

import {
    GENDER_OPTIONS,
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

export default function DiscoverFilterPrimary({
  filters,
  setFilters,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const { width } =
    useWindowDimensions();

  const [
    expanded,
    setExpanded,
  ] =
    useState<
      | "gender"
      | "lookingFor"
      | null
    >(null);

  const sliderLength =
    Math.max(
      220,
      width - 64
    );

  const genderSummary =
    GENDER_OPTIONS.find(
      (item) =>
        item.value ===
        filters.gender
    )?.label || "All";

  const lookingForSummary =
    useMemo(() => {
      if (
        !filters
          .lookingFor
          .length
      ) {
        return "Any";
      }

      if (
        filters
          .lookingFor
          .length > 1
      ) {
        return `${filters.lookingFor.length} selected`;
      }

      return (
        LOOKING_FOR_FILTER_OPTIONS.find(
          (item) =>
            item.value ===
            filters
              .lookingFor[0]
        )?.label ||
        "Selected"
      );
    }, [
      filters.lookingFor,
    ]);

  return (
    <>
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
        <CardHeader
          icon="location-outline"
          title="Distance"
          value={`Within ${filters.rangeMiles} miles`}
        />

        <View
          style={{
            alignItems:
              "center",
          }}
        >
          <MultiSlider
            values={[
              filters.rangeMiles,
            ]}
            min={1}
            max={100}
            step={1}
            sliderLength={
              sliderLength
            }
            onValuesChange={(
              [
                rangeMiles,
              ]
            ) =>
              setFilters(
                (prev) => ({
                  ...prev,
                  rangeMiles,
                })
              )
            }
            selectedStyle={{
              backgroundColor:
                colors.brand,
            }}
            unselectedStyle={{
              backgroundColor:
                colors.borderStrong,
            }}
            markerStyle={{
              backgroundColor:
                colors.white,

              borderWidth: 1,

              borderColor:
                colors.borderStrong,
            }}
          />
        </View>

        <View
          style={
            styles.sliderLabels
          }
        >
          <Text
            style={[
              styles.sliderLabel,

              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            1 mi
          </Text>

          <Text
            style={[
              styles.sliderLabel,

              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            100 mi
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          styles.cardGap,

          {
            backgroundColor:
              colors.surface,

            borderColor:
              colors.border,
          },
        ]}
      >
        <CardHeader
          icon="calendar-outline"
          title="Age range"
          value={`${filters.ageMin} – ${filters.ageMax}`}
        />

        <View
          style={{
            alignItems:
              "center",
          }}
        >
          <MultiSlider
            values={[
              filters.ageMin,
              filters.ageMax,
            ]}
            min={18}
            max={60}
            step={1}
            sliderLength={
              sliderLength
            }
            onValuesChange={(
              [
                ageMin,
                ageMax,
              ]
            ) =>
              setFilters(
                (prev) => ({
                  ...prev,
                  ageMin,
                  ageMax,
                })
              )
            }
            selectedStyle={{
              backgroundColor:
                colors.brand,
            }}
            unselectedStyle={{
              backgroundColor:
                colors.borderStrong,
            }}
            markerStyle={{
              backgroundColor:
                colors.white,

              borderWidth: 1,

              borderColor:
                colors.borderStrong,
            }}
          />
        </View>

        <View
          style={
            styles.sliderLabels
          }
        >
          <Text
            style={[
              styles.sliderLabel,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            18
          </Text>

          <Text
            style={[
              styles.sliderLabel,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            60
          </Text>
        </View>
      </View>

      <View
        style={
          styles.primaryChoiceRow
        }
      >
        <PrimaryChoiceCard
          icon="person-outline"
          label="Gender"
          value={
            genderSummary
          }
          onPress={() =>
            setExpanded(
              (current) =>
                current ===
                "gender"
                  ? null
                  : "gender"
            )
          }
        />

        <PrimaryChoiceCard
          icon="heart-outline"
          label="Looking for"
          value={
            lookingForSummary
          }
          onPress={() =>
            setExpanded(
              (current) =>
                current ===
                "lookingFor"
                  ? null
                  : "lookingFor"
            )
          }
        />
      </View>

      {expanded ===
      "gender" ? (
        <ExpandedPanel>
          <ChipSelector
            options={
              GENDER_OPTIONS
            }
            selected={[
              filters.gender,
            ]}
            onToggle={(
              gender
            ) =>
              setFilters(
                (prev) => ({
                  ...prev,
                  gender,
                })
              )
            }
          />
        </ExpandedPanel>
      ) : null}

      {expanded ===
      "lookingFor" ? (
        <ExpandedPanel>
          <ChipSelector
            options={
              LOOKING_FOR_FILTER_OPTIONS
            }
            selected={
              filters.lookingFor
            }
            allowAny
            onToggle={(
              value
            ) =>
              setFilters(
                (prev) => ({
                  ...prev,

                  lookingFor:
                    value
                      ? toggleInArray(
                          prev.lookingFor,
                          value
                        )
                      : [],
                })
              )
            }
          />
        </ExpandedPanel>
      ) : null}
    </>
  );
}

function CardHeader({
  icon,
  title,
  value,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  title: string;
  value: string;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View
      style={
        styles.cardHeader
      }
    >
      <View
        style={
          styles.titleRow
        }
      >
        <Ionicons
          name={icon}
          size={19}
          color={colors.icon}
        />

        <Text
          style={[
            styles.cardTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          {title}
        </Text>
      </View>

      <Text
        style={[
          styles.cardValue,

          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function PrimaryChoiceCard({
  icon,
  label,
  value,
  onPress,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  label: string;
  value: string;
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
        styles.primaryChoice,

        {
          backgroundColor:
            colors.surface,

          borderColor:
            colors.border,

          opacity:
            pressed
              ? 0.72
              : 1,
        },
      ]}
    >
      <View
        style={
          styles.primaryChoiceTop
        }
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.icon}
        />

        <Text
          style={[
            styles.primaryChoiceLabel,

            {
              color:
                colors.text,
            },
          ]}
        >
          {label}
        </Text>

        <Ionicons
          name="chevron-down"
          size={16}
          color={
            colors.iconMuted
          }
        />
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.primaryChoiceValue,

          {
            color:
              colors.textMuted,
          },
        ]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

function ExpandedPanel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View
      style={[
        styles.expandedPanel,

        {
          backgroundColor:
            colors.surface,

          borderColor:
            colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}
/**
 * Path: src/features/discoverFilters/DiscoverFilterScreen.tsx
 * Purpose: Theme-aware 2026 RomBuzz Discover Filters presentation shell.
 */

import {
  Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import DiscoverFilterLifestyle from "./DiscoverFilterLifestyle";

import DiscoverFilterPrimary from "./DiscoverFilterPrimary";

import DiscoverFilterProfileToggles from "./DiscoverFilterProfileToggles";

import {
  filterStyles as styles,
} from "./discoverFilterStyles";

import type {
  DiscoverFilters,
} from "./discoverFilterModel";

import {
  countActiveFilters,
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

  onBack: () => void;
  onReset: () => void;
  onApply: () => void;
};

export default function DiscoverFilterScreen({
  filters,
  setFilters,
  onBack,
  onReset,
  onApply,
}: Props) {
  const insets =
    useSafeAreaInsets();

  const { colors } =
    useRomBuzzTheme();

  const activeCount =
    countActiveFilters(
      filters
    );

  // The persistent RootBottomBar already owns the device bottom safe area.
  // Keep only compact visual spacing inside the Filter footer.
  const footerBottom = 8;

  const footerHeight =
    72 +
    footerBottom;

  return (
    <View
      style={[
        styles.screen,

        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.header,

          {
            paddingTop:
              Math.max(
                insets.top +
                  4,
                12
              ),

            backgroundColor:
              colors.background,
          },
        ]}
      >
        <View
          style={
            styles.headerSide
          }
        >
          <Pressable
            onPress={onBack}
            style={({
              pressed,
            }) => [
              styles.backButton,

              {
                backgroundColor:
                  pressed
                    ? colors.surfaceMuted
                    : "transparent",
              },
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={
                colors.icon
              }
            />
          </Pressable>
        </View>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={[
              styles.headerTitle,

              {
                color:
                  colors.text,
              },
            ]}
          >
            Filters
          </Text>

          <Text
            style={[
              styles.headerSubtitle,

              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            Find people who
            match your vibe
          </Text>
        </View>

        <View
          style={[
            styles.headerSide,
            styles.headerSideRight,
          ]}
        >
          <Pressable
            onPress={onReset}
            hitSlop={10}
          >
            <Text
              style={[
                styles.resetText,

                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Reset
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.content,

          {
            paddingBottom:
              footerHeight +
              22,
          },
        ]}
      >
        <DiscoverFilterPrimary
          filters={filters}
          setFilters={
            setFilters
          }
        />

        <SectionHeader
          title="Lifestyle & preferences"
          meta="Swipe options"
        />

        <DiscoverFilterLifestyle
          filters={filters}
          setFilters={
            setFilters
          }
        />

        <SectionHeader
          title="Profile filters"
          meta="Quick filters"
        />

        <DiscoverFilterProfileToggles
          filters={filters}
          setFilters={
            setFilters
          }
        />
      </ScrollView>

      <View
        style={[
          styles.footer,

          {
            paddingBottom:
              footerBottom,

            backgroundColor:
              colors.surface,

            borderTopColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.footerRow
          }
        >
          <View
            style={
              styles.countWrap
            }
          >
            <Text
              style={[
                styles.countText,

                {
                  color:
                    colors.text,
                },
              ]}
            >
              {activeCount ||
                "No"}{" "}
              {activeCount === 1
                ? "filter"
                : "filters"}
            </Text>

            <Text
              style={[
                styles.countSubtext,

                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              active
            </Text>
          </View>

          <Pressable
            onPress={onApply}
            style={({
              pressed,
            }) => [
              styles.applyButton,

              {
                backgroundColor:
                  colors.brand,
              },

              pressed &&
                styles.applyPressed,
            ]}
          >
            <Text
              style={[
                styles.applyText,

                {
                  color:
                    colors.white,
                },
              ]}
            >
              Apply Filters
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  meta,
}: {
  title: string;
  meta: string;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <Text
        style={[
          styles.sectionTitle,

          {
            color:
              colors.text,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.sectionMeta,

          {
            color:
              colors.textMuted,
          },
        ]}
      >
        {meta}
      </Text>
    </View>
  );
}
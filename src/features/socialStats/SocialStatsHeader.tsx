/**
 * Path: src/features/socialStats/SocialStatsHeader.tsx
 * Purpose: Homepage-aligned Social Stats header with preserved back and refresh actions.
 */

import {
  Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  socialOverviewStyles as styles,
} from "./socialStatsOverviewStyles";

export default function SocialStatsHeader({
  topInset,
  onBack,
  onRefresh,
}: {
  topInset: number;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const {
    colors,
  } = useRomBuzzTheme();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop:
            topInset,
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <View
        style={styles.topBar}
      >
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.topAction,
            {
              backgroundColor:
                colors.surfaceMuted,
              borderColor:
                colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={colors.icon}
          />
        </TouchableOpacity>

        <View
          style={
            styles.brandWrap
          }
        >
          <Text
            style={[
              styles.brand,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Rom
            <Text
              style={{
                color:
                  colors.brand,
              }}
            >
              Buzz
            </Text>
          </Text>

          <Text
            style={[
              styles.brandTagline,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Romance & Buzz
          </Text>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          style={[
            styles.topAction,
            {
              backgroundColor:
                colors.surfaceMuted,
              borderColor:
                colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh"
            size={19}
            color={colors.icon}
          />
        </TouchableOpacity>
      </View>

      <View
        style={
          styles.titleWrap
        }
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
          Social Stats
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Your likes, matches,
          and profile buzz.
        </Text>
      </View>
    </View>
  );
}
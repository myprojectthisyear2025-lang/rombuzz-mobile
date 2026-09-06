/**
 * Path: src/features/profile/buzzStreak/ProfileBuzzStreakCard.tsx
 * Purpose: Low-profile BuzzStreak status strip for owner Profile.
 * Used by: app/(tabs)/profile.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  Text,
  View,
} from "react-native";

import { styles } from "./ProfileBuzzStreakCard.styles";
import useBuzzStreak from "./useBuzzStreak";

export default function ProfileBuzzStreakCard() {
  const { colors } = useRomBuzzTheme();
  const streak = useBuzzStreak();

  const totalDays = Math.max(
    1,
    streak.rewardEveryDays
  );

  const currentDay = Math.min(
    streak.cycleDay || 0,
    totalDays
  );

  return (
    <View
      style={[
        styles.section,
        {
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.mainRow}>
        <View style={styles.infoArea}>
          <View style={styles.titleRow}>
            <Ionicons
              name="flame"
              size={16}
              color={colors.brand}
            />

            <Text
              style={[
                styles.title,
                { color: colors.text },
              ]}
            >
              BuzzStreak
            </Text>

            <Text
              style={[
                styles.dayCount,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {currentDay}/{totalDays} days
            </Text>
          </View>

          <View style={styles.progressRow}>
            {Array.from({
              length: totalDays,
            }).map((_, index) => {
              const complete =
                index < currentDay;

              return (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        complete
                          ? colors.brand
                          : colors.surfaceMuted,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.rightArea}>
          <View style={styles.rewardRow}>
            <Ionicons
              name="gift-outline"
              size={13}
              color={colors.brand}
            />

            <Text
              style={[
                styles.rewardText,
                { color: colors.brand },
              ]}
            >
              Earn {streak.rewardAmountBC} BC
            </Text>
          </View>

          <Pressable
            disabled={
              streak.checkedToday ||
              streak.checkingIn
            }
            onPress={streak.checkInToday}
            hitSlop={6}
            style={({ pressed }) => [
              styles.action,
              {
                backgroundColor:
                  streak.checkedToday
                    ? colors.surfaceMuted
                    : colors.brand,
              },
              pressed &&
                !streak.checkedToday && {
                  opacity: 0.7,
                },
            ]}
          >
            {streak.checkedToday && (
              <Ionicons
                name="checkmark"
                size={13}
                color={
                  colors.textSecondary
                }
              />
            )}

            <Text
              style={[
                styles.actionText,
                {
                  color:
                    streak.checkedToday
                      ? colors.textSecondary
                      : "#FFFFFF",
                },
              ]}
            >
              {streak.checkingIn
                ? "Checking…"
                : streak.checkedToday
                  ? "Checked in today"
                  : "Check in"}
            </Text>
          </Pressable>
        </View>
      </View>

      {streak.rewardFlashBC > 0 && (
        <Text
          style={[
            styles.rewardFlash,
            { color: colors.brand },
          ]}
        >
          🎉 +{streak.rewardFlashBC} BC earned
        </Text>
      )}
    </View>
  );
}
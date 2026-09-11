/**
 * Path: src/components/match/MatchCelebrateCard.tsx
 * Purpose: RomBuzz-themed visual card for a successful match.
 */

import {
    Ionicons,
} from "@expo/vector-icons";

import {
    LinearGradient,
} from "expo-linear-gradient";

import React from "react";

import {
    Image,
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

type Props = {
  firstName?: string;
  matchAvatar: string;
  myAvatar?: string;
  pendingCount: number;
  onChat: () => void;
  onStay: () => void;
};

export default function MatchCelebrateCard({
  firstName,
  matchAvatar,
  myAvatar,
  pendingCount,
  onChat,
  onStay,
}: Props) {
  const {
    colors,
    isDark,
  } =
    useRomBuzzTheme();

  const name =
    firstName ||
    "your match";

  return (
    <LinearGradient
      colors={
        isDark
          ? [
              "#221018",
              "#17131F",
              "#111217",
            ]
          : [
              "#FFF4F7",
              "#FFF9FB",
              "#FFFFFF",
            ]
      }
      style={[
        styles.card,
        {
          borderColor:
            colors.borderStrong,
        },
      ]}
    >
      <Text
        style={[
          styles.eyebrow,
          {
            color:
              colors.brand,
          },
        ]}
      >
        ROMBUZZ MATCH
      </Text>

      <Text
        style={[
          styles.title,
          {
            color:
              colors.text,
          },
        ]}
      >
        It’s a Match 💞
      </Text>

      <Text
        style={[
          styles.sub,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        You and {name} chose
        each other.
      </Text>

      <View
        style={
          styles.avatarRow
        }
      >
        <View
          style={
            styles.avatarWrap
          }
        >
          {myAvatar ? (
            <Image
              source={{
                uri:
                  myAvatar,
              }}
              style={[
                styles.avatar,
                {
                  borderColor:
                    colors.brand,
                },
              ]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.fallback,
                {
                  borderColor:
                    colors.brand,

                  backgroundColor:
                    colors.brandSoft,
                },
              ]}
            >
              <Ionicons
                name="heart"
                size={26}
                color={
                  colors.brand
                }
              />
            </View>
          )}

          <Text
            style={[
              styles.avatarLabel,
              {
                color:
                  colors.text,
              },
            ]}
          >
            You
          </Text>
        </View>

        <View
          style={[
            styles.heartChip,
            {
              backgroundColor:
                colors.brand,
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={18}
            color={
              colors.white
            }
          />
        </View>

        <View
          style={
            styles.avatarWrap
          }
        >
          <Image
            source={{
              uri:
                matchAvatar,
            }}
            style={[
              styles.avatar,
              {
                borderColor:
                  colors.brand,
              },
            ]}
          />

          <Text
            numberOfLines={1}
            style={[
              styles.avatarLabel,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {name}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.notice,
          {
            backgroundColor:
              colors.surfaceMuted,

            borderColor:
              colors.border,
          },
        ]}
      >
        <Ionicons
          name="chatbubble-ellipses"
          size={15}
          color={
            colors.brand
          }
        />

        <Text
          style={[
            styles.noticeText,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Opening your chat
          automatically in a few
          seconds…
        </Text>
      </View>

      {pendingCount > 0 ? (
        <View
          style={[
            styles.pending,
            {
              backgroundColor:
                colors.brandSoft,
            },
          ]}
        >
          <Ionicons
            name="flash"
            size={14}
            color={
              colors.brand
            }
          />

          <Text
            style={[
              styles.pendingText,
              {
                color:
                  colors.brand,
              },
            ]}
          >
            {pendingCount} more
            Buzz
            {pendingCount === 1
              ? ""
              : "es"}{" "}
            waiting
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={onChat}
        style={({
          pressed,
        }) => [
          styles.primary,
          {
            backgroundColor:
              colors.brand,
          },

          pressed &&
            styles.pressed,
        ]}
      >
        <Ionicons
          name="chatbubble"
          size={16}
          color={
            colors.white
          }
        />

        <Text
          style={[
            styles.primaryText,
            {
              color:
                colors.white,
            },
          ]}
        >
          Open Chat Now
        </Text>
      </Pressable>

      {pendingCount > 0 ? (
        <Pressable
          onPress={onStay}
          style={({
            pressed,
          }) => [
            styles.secondary,
            {
              borderColor:
                colors.borderStrong,

              backgroundColor:
                colors.surface,
            },

            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="radio-outline"
            size={17}
            color={
              colors.text
            }
          />

          <Text
            style={[
              styles.secondaryText,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Stay in MicroBuzz
          </Text>
        </Pressable>
      ) : null}
    </LinearGradient>
  );
}

const styles =
  StyleSheet.create({
    card: {
      width: "100%",
      borderRadius: 30,
      borderWidth: 1,
      padding: 22,
      alignItems: "center",
      overflow: "hidden",
    },

    eyebrow: {
      fontSize: 10.5,
      letterSpacing: 1.6,
      fontFamily:
        RBZFont.extraBold,
    },

    title: {
      marginTop: 6,
      fontSize: 29,
      lineHeight: 34,
      fontFamily:
        RBZFont.extraBold,
      textAlign: "center",
    },

    sub: {
      marginTop: 6,
      fontSize: 12.5,
      lineHeight: 18,
      fontFamily:
        RBZFont.medium,
      textAlign: "center",
    },

    avatarRow: {
      marginTop: 19,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 10,
    },

    avatarWrap: {
      width: 94,
      alignItems: "center",
    },

    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 3,
    },

    fallback: {
      alignItems: "center",
      justifyContent:
        "center",
    },

    avatarLabel: {
      marginTop: 7,
      maxWidth: 92,
      fontSize: 11.5,
      fontFamily:
        RBZFont.semiBold,
    },

    heartChip: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent:
        "center",
      marginTop: -16,
    },

    notice: {
      marginTop: 18,
      width: "100%",
      minHeight: 44,
      borderRadius: 15,
      borderWidth: 1,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
    },

    noticeText: {
      flex: 1,
      fontSize: 10.5,
      lineHeight: 14,
      fontFamily:
        RBZFont.medium,
      textAlign: "center",
    },

    pending: {
      marginTop: 10,
      minHeight: 34,
      borderRadius: 13,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    pendingText: {
      fontSize: 10.5,
      fontFamily:
        RBZFont.bold,
    },

    primary: {
      marginTop: 16,
      width: "100%",
      minHeight: 50,
      borderRadius: 17,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
    },

    primaryText: {
      fontSize: 14,
      fontFamily:
        RBZFont.extraBold,
    },

    secondary: {
      marginTop: 9,
      width: "100%",
      minHeight: 48,
      borderRadius: 17,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
    },

    secondaryText: {
      fontSize: 13,
      fontFamily:
        RBZFont.bold,
    },

    pressed: {
      opacity: 0.7,
    },
  });
/**
 * File: src/navigation/RootBottomBar.tsx
 * Purpose: Persistent RomBuzz five-button bottom bar for the native root pager.
 * Keeps existing tab visuals, chat unread pulse, and profile avatar ring isolated.
 */

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  RBZFont,
} from "@/src/design/rombuzzTypography";

import {
  Ionicons,
} from "@expo/vector-icons";

import React from "react";

import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export type RootTabName =
  | "homepage"
  | "letsbuzz"
  | "social-stats"
  | "chat"
  | "profile";

type Props = {
  activeTab: string | null;
  chatUnreadTotal: number;
  chatPulse: Animated.Value;
  profilePhoto: string | null;
  profileCompletion: number;
  onNavigate: (
    tab: RootTabName
  ) => void;
};

const ITEMS = [
  {
    name: "homepage",
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
  },
  {
    name: "letsbuzz",
    label: "Let’sBuzz",
    icon: "radio-outline",
    activeIcon: "radio",
  },
  {
    name: "social-stats",
    label: "Social",
    icon: "flame-outline",
    activeIcon: "flame",
  },
  {
    name: "chat",
    label: "Chat",
    icon: "chatbubble-ellipses-outline",
    activeIcon: "chatbubble-ellipses",
  },
  {
    name: "profile",
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
  },
] as const;

export default function RootBottomBar({
  activeTab,
  chatUnreadTotal,
  chatPulse,
  profilePhoto,
  profileCompletion,
  onNavigate,
}: Props) {
  const insets =
    useSafeAreaInsets();

  const { colors } =
    useRomBuzzTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          height:
            62 + insets.bottom,

          paddingBottom:
            Math.max(
              insets.bottom,
              6
            ),

          backgroundColor:
            colors.tabBar,

          borderTopColor:
            colors.tabBarBorder,
        },
      ]}
    >
      {ITEMS.map((item) => {
        const focused =
          activeTab === item.name;

        const color =
          focused
            ? colors.brand
            : colors.iconMuted;

        return (
          <Pressable
            key={item.name}
            accessibilityRole="button"
            accessibilityState={{
              selected: focused,
            }}
            onPress={() =>
              onNavigate(
                item.name
              )
            }
            style={styles.item}
          >
            <View
              style={
                styles.iconWrap
              }
            >
              {item.name ===
              "profile" ? (
                <View
                  style={[
                    styles.avatarRing,
                    {
                      borderWidth:
                        focused ||
                        profileCompletion >=
                          0.85
                          ? 2
                          : 1,

                      borderColor:
                        focused
                          ? colors.brand
                          : colors.borderStrong,

                      backgroundColor:
                        colors.surfaceMuted,
                    },
                  ]}
                >
                  {profilePhoto ? (
                    <Image
                      source={{
                        uri:
                          profilePhoto,
                      }}
                      style={
                        styles.avatarImg
                      }
                    />
                  ) : (
                    <Ionicons
                      name={
                        focused
                          ? "person"
                          : "person-outline"
                      }
                      size={22}
                      color={color}
                    />
                  )}
                </View>
              ) : item.name ===
                "chat" ? (
                <View
                  style={
                    styles.chatIcon
                  }
                >
                  {chatUnreadTotal >
                    0 && (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.chatPulseRing,
                        {
                          borderColor:
                            colors.brand,

                          opacity:
                            chatPulse.interpolate(
                              {
                                inputRange:
                                  [0, 1],
                                outputRange:
                                  [0, 0.55],
                              }
                            ),

                          transform: [
                            {
                              scale:
                                chatPulse.interpolate(
                                  {
                                    inputRange:
                                      [0, 1],
                                    outputRange:
                                      [
                                        1,
                                        1.42,
                                      ],
                                  }
                                ),
                            },
                          ],
                        },
                      ]}
                    />
                  )}

                  <Animated.View
                    style={{
                      transform: [
                        {
                          scale:
                            chatUnreadTotal >
                            0
                              ? chatPulse.interpolate(
                                  {
                                    inputRange:
                                      [
                                        0,
                                        1,
                                      ],

                                    outputRange:
                                      [
                                        1,
                                        1.08,
                                      ],
                                  }
                                )
                              : 1,
                        },
                      ],
                    }}
                  >
                    <Ionicons
                      name={
                        focused
                          ? item.activeIcon
                          : item.icon
                      }
                      size={24}
                      color={color}
                    />
                  </Animated.View>

                  {chatUnreadTotal >
                    0 && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            colors.brand,

                          borderColor:
                            colors.tabBar,
                        },
                      ]}
                    >
                      <Text
                        style={
                          styles.badgeText
                        }
                      >
                        {chatUnreadTotal >
                        99
                          ? "99+"
                          : chatUnreadTotal}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Ionicons
                  name={
                    focused
                      ? item.activeIcon
                      : item.icon
                  }
                  size={24}
                  color={color}
                />
              )}
            </View>

            <Text
              style={[
                styles.label,
                { color },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles =
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      borderTopWidth:
        StyleSheet.hairlineWidth,
      paddingTop: 6,
      elevation: 0,
    },

    item: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      justifyContent:
        "flex-start",
      paddingVertical: 2,
    },

    iconWrap: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
    },

    label: {
      fontSize: 10,
      lineHeight: 13,
      fontFamily: RBZFont.bold,
      marginTop: 1,
      textAlign: "center",
      width: "100%",
    },

    chatIcon: {
      position: "relative",
    },

    chatPulseRing: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 40,
      height: 40,
      marginLeft: -20,
      marginTop: -20,
      borderRadius: 999,
      borderWidth: 2,
    },

    badge: {
      position: "absolute",
      right: -10,
      top: -8,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },

    badgeText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 11,
    },

    avatarRing: {
      width: 32,
      height: 32,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    avatarImg: {
      width: "100%",
      height: "100%",
    },
  });
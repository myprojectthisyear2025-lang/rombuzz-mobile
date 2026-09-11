/**
 * Path: src/features/microbuzz/MicroBuzzIncomingBuzz.tsx
 * Purpose: Swipeable incoming Buzz card with Accept / Reject controls.
 */

import {
  Ionicons,
} from "@expo/vector-icons";

import React, {
  useMemo,
  useRef,
} from "react";

import {
  Animated,
  Image,
  Modal,
  PanResponder,
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
  visible: boolean;
  selfieUrl?: string;
  name: string;
  age:
    | string
    | number;
  waitingCount: number;
  onAvatarPress:
    () => void;
  onAccept:
    () => void;
  onReject:
    () => void;
  onMenu:
    () => void;
};

const SWIPE_DISTANCE = 82;

export default function MicroBuzzIncomingBuzz({
  visible,
  selfieUrl,
  name,
  age,
  waitingCount,
  onAvatarPress,
  onAccept,
  onReject,
  onMenu,
}: Props) {
  const {
    colors,
    isDark,
  } =
    useRomBuzzTheme();

  const pan =
    useRef(
      new Animated.ValueXY()
    ).current;

  const responder =
    useMemo(
      () =>
        PanResponder.create({
          onMoveShouldSetPanResponder:
            (_, g) =>
              Math.abs(g.dx) >
                8 &&
              Math.abs(g.dx) >
                Math.abs(g.dy),

          onPanResponderMove:
            Animated.event(
              [
                null,
                {
                  dx:
                    pan.x,
                },
              ],
              {
                useNativeDriver:
                  false,
              }
            ),

          onPanResponderRelease:
            (_, g) => {
              const accept =
                g.dx >=
                SWIPE_DISTANCE;

              const reject =
                g.dx <=
                -SWIPE_DISTANCE;

              if (
                !accept &&
                !reject
              ) {
                Animated.spring(
                  pan,
                  {
                    toValue: {
                      x: 0,
                      y: 0,
                    },

                    useNativeDriver:
                      false,
                  }
                ).start();

                return;
              }

              Animated.timing(
                pan,
                {
                  toValue: {
                    x:
                      accept
                        ? 420
                        : -420,

                    y: 0,
                  },

                  duration: 180,

                  useNativeDriver:
                    false,
                }
              ).start(() => {
                pan.setValue({
                  x: 0,
                  y: 0,
                });

                accept
                  ? onAccept()
                  : onReject();
              });
            },
        }),
      [
        onAccept,
        onReject,
        pan,
      ]
    );

  const rotate =
    pan.x.interpolate({
      inputRange:
        [-180, 0, 180],

      outputRange:
        [
          "-7deg",
          "0deg",
          "7deg",
        ],

      extrapolate:
        "clamp",
    });

  const yesOpacity =
    pan.x.interpolate({
      inputRange:
        [20, 90],

      outputRange:
        [0, 1],

      extrapolate:
        "clamp",
    });

  const noOpacity =
    pan.x.interpolate({
      inputRange:
        [-90, -20],

      outputRange:
        [1, 0],

      extrapolate:
        "clamp",
    });

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor:
              isDark
                ? "rgba(5,5,8,0.34)"
                : "rgba(23,23,28,0.18)",
          },
        ]}
      >
        <Animated.View
          {...responder.panHandlers}
          style={[
            styles.card,
            {
              backgroundColor:
                colors.surfaceRaised,

              borderColor:
                colors.borderStrong,

              transform: [
                {
                  translateX:
                    pan.x,
                },
                {
                  rotate,
                },
              ],
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.acceptStamp,
              {
                opacity:
                  yesOpacity,

                color:
                  colors.brand,
              },
            ]}
          >
            ACCEPT
          </Animated.Text>

          <Animated.Text
            style={[
              styles.rejectStamp,
              {
                opacity:
                  noOpacity,
              },
            ]}
          >
            REJECT
          </Animated.Text>

          <Pressable
            onPress={onMenu}
            hitSlop={10}
            style={
              styles.menu
            }
          >
            <Ionicons
              name="ellipsis-vertical"
              size={19}
              color={
                colors.iconMuted
              }
            />
          </Pressable>

          <Pressable
            onPress={
              onAvatarPress
            }
            disabled={
              !selfieUrl
            }
          >
            {selfieUrl ? (
              <Image
                source={{
                  uri:
                    selfieUrl,
                }}
                style={
                  styles.avatar
                }
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.fallback,
                  {
                    backgroundColor:
                      colors.surfaceMuted,
                  },
                ]}
              >
                <Ionicons
                  name="person"
                  size={28}
                  color={
                    colors.iconMuted
                  }
                />
              </View>
            )}
          </Pressable>

          <Text
            style={[
              styles.eyebrow,
              {
                color:
                  colors.brand,
              },
            ]}
          >
            INCOMING BUZZ
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.name,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {name}
            {age !== ""
              ? `, ${age}`
              : ""}
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
            Wants to match nearby
          </Text>

          {waitingCount >
          0 ? (
            <Text
              style={[
                styles.waiting,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              {waitingCount} more
              Buzz
              {waitingCount === 1
                ? ""
                : "es"}{" "}
              waiting
            </Text>
          ) : null}

          <View
            style={
              styles.actions
            }
          >
            <Pressable
              onPress={
                onReject
              }
              style={[
                styles.secondary,
                {
                  borderColor:
                    colors.border,

                  backgroundColor:
                    colors.surfaceMuted,
                },
              ]}
            >
              <Ionicons
                name="close"
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
                Reject
              </Text>
            </Pressable>

            <Pressable
              onPress={
                onAccept
              }
              style={[
                styles.accept,
                {
                  backgroundColor:
                    colors.brand,
                },
              ]}
            >
              <Ionicons
                name="heart"
                size={16}
                color={
                  colors.white
                }
              />

              <Text
                style={[
                  styles.acceptText,
                  {
                    color:
                      colors.white,
                  },
                ]}
              >
                Accept
              </Text>
            </Pressable>
          </View>

          <Text
            style={[
              styles.swipeHint,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            Swipe left to reject ·
            right to accept
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 24,
      paddingTop: 64,
    },

    card: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 26,
      borderWidth: 1,
      padding: 16,
      alignItems: "center",
      overflow: "hidden",
    },

    menu: {
      position: "absolute",
      right: 12,
      top: 12,
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent:
        "center",
      zIndex: 5,
    },

    avatar: {
      width: 92,
      height: 112,
      borderRadius: 20,
    },

    fallback: {
      alignItems: "center",
      justifyContent:
        "center",
    },

    eyebrow: {
      marginTop: 11,
      fontSize: 10.5,
      letterSpacing: 1,
      fontFamily:
        RBZFont.bold,
    },

    name: {
      marginTop: 4,
      fontSize: 19,
      fontFamily:
        RBZFont.extraBold,
    },

    sub: {
      marginTop: 2,
      fontSize: 11,
      fontFamily:
        RBZFont.medium,
    },

    waiting: {
      marginTop: 7,
      fontSize: 10.5,
      fontFamily:
        RBZFont.semiBold,
    },

    actions: {
      marginTop: 15,
      width: "100%",
      flexDirection: "row",
      gap: 9,
    },

    accept: {
      flex: 1,
      minHeight: 44,
      borderRadius: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
    },

    secondary: {
      flex: 1,
      minHeight: 44,
      borderRadius: 15,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
    },

    acceptText: {
      fontSize: 12.5,
      fontFamily:
        RBZFont.bold,
    },

    secondaryText: {
      fontSize: 12.5,
      fontFamily:
        RBZFont.bold,
    },

    swipeHint: {
      marginTop: 10,
      fontSize: 9.5,
      fontFamily:
        RBZFont.medium,
    },

    acceptStamp: {
      position: "absolute",
      left: 18,
      top: 22,
      fontSize: 14,
      fontFamily:
        RBZFont.extraBold,
      transform: [
        {
          rotate:
            "-8deg",
        },
      ],
    },

    rejectStamp: {
      position: "absolute",
      right: 48,
      top: 22,
      fontSize: 14,
      color: "#E5484D",
      fontFamily:
        RBZFont.extraBold,
      transform: [
        {
          rotate:
            "8deg",
        },
      ],
    },
  });
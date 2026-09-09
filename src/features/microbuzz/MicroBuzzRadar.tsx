/**
 * Path: src/features/microbuzz/MicroBuzzRadar.tsx
 * Purpose: Theme-aware, people-first proximity radar for the MicroBuzz screen.
 * Used by: app/(tabs)/microbuzz.tsx
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, {
    useRef,
} from "react";

import {
    Animated,
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

type NearbyPerson = {
  id: string;
  name?: string;
  selfieUrl: string;
  distanceMeters?: number;
};

type Props = {
  size: number;
  nearby: NearbyPerson[];
  selfieUri: string;
  isActive: boolean;
  sweepRotate: any;
  pulseScale: any;
  glowOpacity: any;
  sweepValue: number;
  metersLabel: (
    meters?: number
  ) => string;
  onBuzz: (
    id: string
  ) => void;
  onPreview: (
    user: NearbyPerson
  ) => void;
};

export default function MicroBuzzRadar({
  size,
  nearby,
  selfieUri,
  isActive,
  sweepRotate,
  pulseScale,
  glowOpacity,
  sweepValue,
  metersLabel,
  onBuzz,
  onPreview,
}: Props) {
  const {
    colors,
    isDark,
  } = useRomBuzzTheme();

  const orbitMemo =
    useRef<
      Record<
        string,
        {
          a0: number;
          r: number;
        }
      >
    >({}).current;

  function orbit(
    user: NearbyPerson,
    index: number,
    total: number
  ) {
    if (!orbitMemo[user.id]) {
      orbitMemo[user.id] = {
        a0:
          (index /
            Math.max(
              1,
              total
            )) *
          Math.PI *
          2,

        r:
          0.42 +
          (index % 4) *
            0.11,
      };
    }

    return orbitMemo[user.id];
  }

  return (
    <View
      style={[
        styles.shell,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <View
        style={[
          styles.radar,
          {
            backgroundColor:
              isDark
                ? "#131419"
                : "#FFF7F9",

            borderColor:
              colors.brandSoft,
          },
        ]}
      >
        {[
          0.94,
          0.72,
          0.5,
          0.28,
        ].map((scale) => (
          <View
            key={scale}
            style={[
              styles.ring,
              {
                width:
                  `${scale * 100}%`,

                height:
                  `${scale * 100}%`,

                borderColor:
                  isDark
                    ? "rgba(245,46,100,0.25)"
                    : "rgba(245,46,100,0.18)",
              },
            ]}
          />
        ))}

        <View
          style={[
            styles.axisVertical,
            {
              backgroundColor:
                colors.brandSoft,
            },
          ]}
        />

        <View
          style={[
            styles.axisHorizontal,
            {
              backgroundColor:
                colors.brandSoft,
            },
          ]}
        />

        <Animated.View
          style={[
            styles.sweep,
            {
              transform: [
                {
                  rotate:
                    sweepRotate,
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? [
                    "rgba(245,46,100,0.24)",
                    "rgba(245,46,100,0.00)",
                  ]
                : [
                    "rgba(245,46,100,0.12)",
                    "rgba(245,46,100,0.00)",
                  ]
            }
            style={
              styles.sweepBeam
            }
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.center,
            {
              transform: [
                {
                  scale:
                    pulseScale,
                },
              ],

              borderColor:
                colors.brand,

              backgroundColor:
                colors.surface,
            },
          ]}
        >
          {selfieUri ? (
            <Image
              source={{
                uri: selfieUri,
              }}
              style={
                styles.centerImage
              }
            />
          ) : (
            <Ionicons
              name="flash"
              size={24}
              color={colors.brand}
            />
          )}

          <View
            style={[
              styles.youBadge,
              {
                backgroundColor:
                  colors.surface,

                borderColor:
                  colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.youText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              You
            </Text>
          </View>
        </Animated.View>

        {nearby
          .slice(0, 8)
          .map(
            (
              user,
              index
            ) => {
              const {
                a0,
                r,
              } = orbit(
                user,
                index,
                nearby.length
              );

              const angle =
                a0 +
                sweepValue *
                  Math.PI *
                  2;

              const radius =
                (size / 2) *
                r;

              const x =
                size / 2 +
                Math.cos(
                  angle
                ) *
                  radius;

              const y =
                size / 2 +
                Math.sin(
                  angle
                ) *
                  radius;

              return (
                <Pressable
                  key={
                    user.id
                  }
                  onPress={() =>
                    onBuzz(
                      user.id
                    )
                  }
                  onLongPress={() =>
                    onPreview(
                      user
                    )
                  }
                  delayLongPress={
                    300
                  }
                  style={[
                    styles.person,
                    {
                      left:
                        x -
                        27,

                      top:
                        y -
                        27,
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.personGlow,
                      {
                        opacity:
                          glowOpacity,

                        backgroundColor:
                          colors.brandSoft,
                      },
                    ]}
                  >
                    <Image
                      source={{
                        uri:
                          user.selfieUrl,
                      }}
                      style={[
                        styles.personImage,
                        {
                          borderColor:
                            colors.surface,
                        },
                      ]}
                    />
                  </Animated.View>

                  {!!user.distanceMeters && (
                    <View
                      style={[
                        styles.distance,
                        {
                          backgroundColor:
                            colors.surface,

                          borderColor:
                            colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.distanceText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {metersLabel(
                          user.distanceMeters
                        )}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.activeDot,
                      {
                        backgroundColor:
                          colors.brand,

                        borderColor:
                          colors.surface,
                      },
                    ]}
                  />
                </Pressable>
              );
            }
          )}

        {!isActive && (
          <View
            style={[
              styles.lock,
              {
                backgroundColor:
                  isDark
                    ? "rgba(15,16,18,0.82)"
                    : "rgba(252,252,253,0.82)",
              },
            ]}
          >
            <View
              style={[
                styles.lockBadge,
                {
                  backgroundColor:
                    colors.surface,

                  borderColor:
                    colors.border,
                },
              ]}
            >
              <Ionicons
                name="lock-closed"
                size={15}
                color={
                  colors.brand
                }
              />

              <Text
                style={[
                  styles.lockText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Go Live to scan
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    shell: {
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
    },

    radar: {
      width: "100%",
      height: "100%",
      borderRadius: 999,
      borderWidth: 1,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },

    ring: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1,
    },

    axisVertical: {
      position: "absolute",
      width: 1,
      height: "94%",
    },

    axisHorizontal: {
      position: "absolute",
      height: 1,
      width: "94%",
    },

    sweep: {
      ...StyleSheet.absoluteFillObject,
    },

    sweepBeam: {
      position: "absolute",
      left: "50%",
      top: 0,
      width: "50%",
      height: "50%",
    },

    center: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 2.5,
      alignItems: "center",
      justifyContent: "center",
    },

    centerImage: {
      width: 68,
      height: 68,
      borderRadius: 34,
      transform: [
        { scaleX: -1 },
      ],
    },

    youBadge: {
      position: "absolute",
      bottom: -15,
      minWidth: 46,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },

    youText: {
      fontSize: 10.5,
      fontFamily:
        RBZFont.bold,
    },

    person: {
      position: "absolute",
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
    },

    personGlow: {
      width: 54,
      height: 54,
      borderRadius: 27,
      padding: 2,
    },

    personImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
    },

    distance: {
      position: "absolute",
      bottom: -16,
      minWidth: 42,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },

    distanceText: {
      fontSize: 9.5,
      fontFamily:
        RBZFont.bold,
    },

    activeDot: {
      position: "absolute",
      right: -1,
      bottom: 1,
      width: 11,
      height: 11,
      borderRadius: 6,
      borderWidth: 2,
    },

    lock: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },

    lockBadge: {
      minHeight: 40,
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    lockText: {
      fontSize: 11.5,
      fontFamily:
        RBZFont.semiBold,
    },
  });
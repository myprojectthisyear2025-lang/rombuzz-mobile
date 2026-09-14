/**
 * Path: src/features/discoverProfile/DiscoverProfileSwipeStamp.tsx
 * Purpose: Show LIKE/SKIP feedback only while the Discover Profile is being swiped.
 * Used by: DiscoverProfileScreen.tsx only.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import React from "react";
import {
    StyleSheet,
    Text,
} from "react-native";
import Animated, {
    type SharedValue,
    useAnimatedStyle,
} from "react-native-reanimated";

export default function DiscoverProfileSwipeStamp({
  translateX,
  threshold,
  topOffset,
  visible,
}: {
  translateX: SharedValue<number>;
  threshold: number;
  topOffset: number;
  visible: boolean;
}) {
  const { colors } =
    useRomBuzzTheme();

  const safeThreshold =
    Math.max(
      threshold,
      1
    );

  const likeStyle =
    useAnimatedStyle(() => {
      const progress =
        Math.min(
          Math.max(
            translateX.value /
              safeThreshold,
            0
          ),
          1
        );

      return {
        opacity: progress,

        transform: [
          {
            rotate: "-10deg",
          },
          {
            scale:
              0.9 +
              progress * 0.1,
          },
        ],
      };
    });

  const skipStyle =
    useAnimatedStyle(() => {
      const progress =
        Math.min(
          Math.max(
            -translateX.value /
              safeThreshold,
            0
          ),
          1
        );

      return {
        opacity: progress,

        transform: [
          {
            rotate: "10deg",
          },
          {
            scale:
              0.9 +
              progress * 0.1,
          },
        ],
      };
    });

  if (!visible) {
    return null;
  }

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stamp,
          styles.like,

          {
            top:
              topOffset,

            borderColor:
              colors.brand,

            backgroundColor:
              "rgba(10,10,12,0.46)",
          },

          likeStyle,
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color:
                colors.brand,
            },
          ]}
        >
          LIKE
        </Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.stamp,
          styles.skip,

          {
            top:
              topOffset,

            borderColor:
              "rgba(255,255,255,0.92)",

            backgroundColor:
              "rgba(10,10,12,0.46)",
          },

          skipStyle,
        ]}
      >
        <Text
          style={
            styles.skipText
          }
        >
          SKIP
        </Text>
      </Animated.View>
    </>
  );
}

const styles =
  StyleSheet.create({
    stamp: {
      position:
        "absolute",

      zIndex: 50,

      paddingHorizontal:
        14,

      paddingVertical:
        7,

      borderRadius:
        12,

      borderWidth:
        2.5,
    },

    like: {
      left: 24,
    },

    skip: {
      right: 24,
    },

    text: {
      fontFamily:
        RBZFont.extraBold,

      fontSize: 25,

      letterSpacing:
        1.1,
    },

    skipText: {
      color: "#FFFFFF",

      fontFamily:
        RBZFont.extraBold,

      fontSize: 25,

      letterSpacing:
        1.1,
    },
  });
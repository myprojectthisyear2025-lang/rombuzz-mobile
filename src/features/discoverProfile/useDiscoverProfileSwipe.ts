/**
 * Path: src/features/discoverProfile/useDiscoverProfileSwipe.ts
 * Purpose: Reuse the main Discover deck's Reanimated throw/spring swipe feel on the whole profile.
 * Used by: DiscoverProfileScreen.tsx.
 */

import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export function useDiscoverProfileSwipe({
  width,
  enabled,
  onSwipeLeft,
  onSwipeRight,
}: {
  width: number;
  enabled: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const translateX =
    useSharedValue(0);

  const translateY =
    useSharedValue(0);

  const rotateZ =
    useSharedValue(0);

  const threshold =
    width * 0.25;

  const animatedStyle =
    useAnimatedStyle(
      () => ({
        transform: [
          {
            translateX:
              translateX.value,
          },
          {
            translateY:
              translateY.value,
          },
          {
            rotateZ:
              `${rotateZ.value}deg`,
          },
        ],
      })
    );

  const gesture =
    useMemo(
      () =>
        Gesture.Pan()
          .enabled(
            enabled
          )
          .activeOffsetX([
            -14,
            14,
          ])
          .failOffsetY([
            -22,
            22,
          ])
          .onUpdate(
            (event) => {
              translateX.value =
                event.translationX;

              translateY.value =
                event.translationY;

              rotateZ.value =
                event.translationX *
                0.05;
            }
          )
          .onEnd(
            (event) => {
              const swipeRight =
                event.translationX >
                  threshold ||
                event.velocityX >
                  900;

              const swipeLeft =
                event.translationX <
                  -threshold ||
                event.velocityX <
                  -900;

              if (
                swipeRight ||
                swipeLeft
              ) {
                translateX.value =
                  withTiming(
                    swipeRight
                      ? width *
                          1.3
                      : -width *
                          1.3,

                    {
                      duration:
                        220,
                    },

                    () => {
                      if (
                        swipeRight
                      ) {
                        runOnJS(
                          onSwipeRight
                        )();
                      } else {
                        runOnJS(
                          onSwipeLeft
                        )();
                      }

                      translateX.value =
                        0;

                      translateY.value =
                        0;

                      rotateZ.value =
                        0;
                    }
                  );

                return;
              }

              translateX.value =
                withSpring(
                  0,
                  {
                    damping:
                      18,
                  }
                );

              translateY.value =
                withSpring(
                  0,
                  {
                    damping:
                      18,
                  }
                );

              rotateZ.value =
                withSpring(
                  0
                );
            }
          ),
      [
        enabled,
        onSwipeLeft,
        onSwipeRight,
        rotateZ,
        threshold,
        translateX,
        translateY,
        width,
      ]
    );

  return {
    animatedStyle,
    gesture,

    // Exposed only for visual swipe feedback.
    // This does not change the swipe behavior.
    translateX,
    threshold,
  };
}
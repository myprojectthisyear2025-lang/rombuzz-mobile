/**
 * File: src/navigation/useRootTabSwipe.ts
 * Purpose: Smooth finger-following swipe/tap transitions between RomBuzz root tabs.
 * Keeps navigation animation separate from screen and business logic.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";
import { State } from "react-native-gesture-handler";

type RootTabSwipeOptions = {
  currentIndex: number;
  tabCount: number;
  screenWidth: number;
  onSwipeNavigate: (nextIndex: number) => void;
};

type PendingEnter = {
  targetIndex: number;
  direction: -1 | 1;
};

export function useRootTabSwipe({
  currentIndex,
  tabCount,
  screenWidth,
  onSwipeNavigate,
}: RootTabSwipeOptions) {
  const translateX = useRef(new Animated.Value(0)).current;

  const pendingEnterRef = useRef<PendingEnter | null>(null);

  const [transitioning, setTransitioning] = useState(false);

  const settleHome = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      damping: 20,
      stiffness: 240,
      mass: 0.85,
      overshootClamping: true,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const transitionToIndex = useCallback(
    (targetIndex: number, commit: () => void) => {
      if (transitioning) return;

      if (targetIndex === currentIndex) {
        commit();
        return;
      }

      if (targetIndex < 0 || targetIndex >= tabCount) return;

      const direction: -1 | 1 =
        targetIndex > currentIndex ? -1 : 1;

      pendingEnterRef.current = {
        targetIndex,
        direction,
      };

      setTransitioning(true);

      Animated.timing(translateX, {
        toValue: direction * screenWidth,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          pendingEnterRef.current = null;
          setTransitioning(false);
          settleHome();
          return;
        }

        commit();
      });
    },
    [
      currentIndex,
      screenWidth,
      settleHome,
      tabCount,
      transitioning,
      translateX,
    ]
  );

  const onGestureEvent = useMemo(
    () =>
      Animated.event(
        [
          {
            nativeEvent: {
              translationX: translateX,
            },
          },
        ],
        {
          useNativeDriver: true,
        }
      ),
    [translateX]
  );

  const onHandlerStateChange = useCallback(
    ({ nativeEvent }: any) => {
      if (transitioning) return;

      const ended =
        nativeEvent.state === State.END ||
        nativeEvent.state === State.CANCELLED ||
        nativeEvent.state === State.FAILED;

      if (!ended) return;

      const translation = Number(
        nativeEvent.translationX || 0
      );

      const velocity = Number(
        nativeEvent.velocityX || 0
      );

      const swipeLeft = translation < 0;

      const distanceOK =
        Math.abs(translation) > screenWidth * 0.2;

      const velocityOK =
        Math.abs(velocity) > 850;

      if (!distanceOK && !velocityOK) {
        settleHome();
        return;
      }

      const targetIndex = swipeLeft
        ? currentIndex + 1
        : currentIndex - 1;

      if (
        targetIndex < 0 ||
        targetIndex >= tabCount
      ) {
        settleHome();
        return;
      }

      transitionToIndex(
        targetIndex,
        () => onSwipeNavigate(targetIndex)
      );
    },
    [
      currentIndex,
      onSwipeNavigate,
      screenWidth,
      settleHome,
      tabCount,
      transitionToIndex,
      transitioning,
    ]
  );

  useEffect(() => {
    const pending =
      pendingEnterRef.current;

    if (
      !pending ||
      currentIndex !== pending.targetIndex
    ) {
      return;
    }

    translateX.setValue(
      -pending.direction * screenWidth
    );

    requestAnimationFrame(() => {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        pendingEnterRef.current = null;
        setTransitioning(false);
      });
    });
  }, [
    currentIndex,
    screenWidth,
    translateX,
  ]);

  return {
    translateX,
    transitioning,
    transitionToIndex,
    onGestureEvent,
    onHandlerStateChange,
  };
}
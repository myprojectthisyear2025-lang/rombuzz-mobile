/**
 * Path: src/components/system/RomBuzzSystemStatusBar.tsx
 * Purpose: Global theme-aware native phone status-bar surface for RomBuzz.
 * Used by: app/_layout.tsx
 *
 * Behavior:
 *  - Light mode: subtle gray safe-area strip + dark native system icons.
 *  - Dark mode: RomBuzz dark background + light native system icons.
 *  - Uses the device's real safe-area height; no hard-coded phone dimensions.
 *  - Hides during LetsBuzz fullscreen reels.
 *  - Hides on the dedicated video-call route.
 */

import {
    useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
    useSegments,
} from "expo-router";

import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    DeviceEventEmitter,
    Platform,
    StatusBar,
    StyleSheet,
    View,
} from "react-native";

import {
    useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function RomBuzzSystemStatusBar() {
  const insets = useSafeAreaInsets();

  const {
    colors,
    isDark,
  } = useRomBuzzTheme();

  const segments = useSegments();

  const [letsBuzzFullscreen, setLetsBuzzFullscreen] =
    useState(false);

  const routeKey = useMemo(
    () => segments.join("/"),
    [segments]
  );

  const videoCallRoute =
    segments?.[0] === "video-call";

  const hidden =
    letsBuzzFullscreen ||
    videoCallRoute;

  const barStyle =
    isDark
      ? "light-content"
      : "dark-content";

  const backgroundColor =
    isDark
      ? colors.background
      : colors.surfaceMuted;

  useEffect(() => {
    const subscription =
      DeviceEventEmitter.addListener(
        "rbz:letsbuzz:fullscreen",
        (payload: any) => {
          setLetsBuzzFullscreen(
            !!payload?.active
          );
        }
      );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    StatusBar.setHidden(
      hidden,
      "fade"
    );

    if (hidden) {
      return;
    }

    StatusBar.setBarStyle(
      barStyle,
      true
    );

    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor(
        "transparent",
        true
      );

      StatusBar.setTranslucent(true);
    }
  }, [
    barStyle,
    hidden,
    routeKey,
  ]);

  if (hidden) {
    return (
      <StatusBar
        key={`hidden-${routeKey}`}
        hidden
      />
    );
  }

  return (
    <>
      <StatusBar
        key={`${routeKey}-${barStyle}`}
        hidden={false}
        barStyle={barStyle}
        translucent
        backgroundColor="transparent"
      />

      <View
        pointerEvents="none"
        style={[
          styles.safeAreaSurface,
          {
            height: insets.top,
            backgroundColor,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeAreaSurface: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,

    zIndex: 100000,
    elevation: 100000,
  },
});
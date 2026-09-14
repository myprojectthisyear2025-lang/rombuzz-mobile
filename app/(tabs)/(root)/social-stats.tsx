/**
 * Path: app/(tabs)/(root)/social-stats.tsx
 * Purpose: RomBuzz Social Stats shell using the shared Home typography/theme system.
 * Existing APIs, caching, refresh, list actions, reporting, and navigation are preserved.
 */

import { useRouter } from "expo-router";
import React, {
  useCallback,
  useRef,
} from "react";

import {
  ActivityIndicator,
  PanResponder,
  StatusBar,
  Text,
  View,
} from "react-native";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  RBZFont,
  useRomBuzzTypography,
} from "@/src/design/rombuzzTypography";

import SocialStatsHeader from "@/src/features/socialStats/SocialStatsHeader";
import SocialStatsListModal from "@/src/features/socialStats/SocialStatsListModal";
import SocialStatsOverview from "@/src/features/socialStats/SocialStatsOverview";

import {
  useSocialStatsData,
} from "@/src/features/socialStats/useSocialStatsData";

function safeNum(value: unknown) {
  return Number.isFinite(
    Number(value)
  )
    ? Number(value)
    : 0;
}

export default function SocialStatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fontsLoaded =
    useRomBuzzTypography();

  const {
    colors,
    statusBarStyle,
  } = useRomBuzzTheme();

  const data =
    useSocialStatsData();

  const safeBack =
    useCallback(() => {
      const canGoBack =
        typeof (router as any)
          ?.canGoBack === "function"
          ? (router as any)
              .canGoBack()
          : false;

      if (canGoBack) {
        router.back();
      } else {
        router.push("/profile");
      }
    }, [router]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder:
        (_, gesture) =>
          Math.abs(
            gesture.dx
          ) > 18 &&
          Math.abs(
            gesture.dy
          ) < 25,

      onPanResponderRelease:
        (_, gesture) => {
          if (
            gesture.dx > 80
          ) {
            safeBack();
          }
        },
    })
  ).current;

  const hasAnySocialData =
    safeNum(
      data.social.likedCount
    ) > 0 ||
    safeNum(
      data.social.likedYouCount
    ) > 0 ||
    safeNum(
      data.social.matchCount
    ) > 0 ||
    safeNum(
      data.social.viewsToday
    ) > 0 ||
    safeNum(
      data.social.viewsTotal
    ) > 0;

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            colors.background,
        }}
      />
    );
  }

  if (
    data.loading &&
    !hasAnySocialData
  ) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent:
            "center",
          backgroundColor:
            colors.background,
        }}
      >
        <StatusBar
          barStyle={
            statusBarStyle
          }
          backgroundColor={
            colors.background
          }
        />

        <ActivityIndicator
          size="large"
          color={colors.brand}
        />

        <Text
          style={{
            marginTop: 14,
            color:
              colors.textSecondary,
            fontSize: 13,
            fontFamily:
              RBZFont.medium,
          }}
        >
          Loading your social
          stats...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          colors.background,
      }}
      {...panResponder.panHandlers}
    >
      <StatusBar
        barStyle={
          statusBarStyle
        }
        backgroundColor={
          colors.background
        }
      />

      <SocialStatsHeader
        topInset={insets.top}
        onBack={safeBack}
        onRefresh={
          data.onRefresh
        }
      />

      <SocialStatsOverview
        social={data.social}
        preview={
          data.likedYouPreview
        }
        refreshing={
          data.refreshing
        }
        onRefresh={
          data.onRefresh
        }
        onOpenList={
          data.openList
        }
      />

      <SocialStatsListModal
        visible={
          !!data.activeTab
        }
        onClose={
          data.closeModal
        }
        activeTab={
          data.activeTab
        }
        list={data.list}
        listLoading={
          data.listLoading
        }
        onRefresh={
          data.onRefresh
        }
      />
    </View>
  );
}
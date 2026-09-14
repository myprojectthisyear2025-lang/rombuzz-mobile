/**
 * Path: src/features/discoverProfile/DiscoverProfileScreen.tsx
 * Purpose: Standalone modern Discover Profile composition; no View Profile coupling.
 * Used by: app/(tabs)/discover-profile.tsx only.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet,
  Text, View, useWindowDimensions,
} from "react-native";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProfilePreviewBar from "../profile/preview/ProfilePreviewBar";
import DiscoverProfileActionDock from "./DiscoverProfileActionDock";
import type { DiscoverProfilePreview } from "./discoverProfileApi";
import DiscoverProfileBasics from "./DiscoverProfileBasics";
import DiscoverProfileDetails from "./DiscoverProfileDetails";
import DiscoverProfileGallery from "./DiscoverProfileGallery";
import DiscoverProfileHero from "./DiscoverProfileHero";
import {
  getDiscoverHeroChips,
  getDiscoverHeroLocationText,
} from "./discoverProfileHeroData";
import {
  getDiscoverAge, getDiscoverDisplayName, getDiscoverDistanceText,
  getDiscoverPhotos, getDiscoverViewerPhotos, normalizeDiscoverImageUrl,
} from "./discoverProfileMedia";
import DiscoverProfileOverview from "./DiscoverProfileOverview";
import DiscoverProfilePhotoViewer from "./DiscoverProfilePhotoViewer";
import DiscoverProfileSwipeStamp from "./DiscoverProfileSwipeStamp";
import { useDiscoverProfileController } from "./useDiscoverProfileController";
import { useDiscoverProfileSwipe } from "./useDiscoverProfileSwipe";
import { useDiscoverVoiceIntro } from "./useDiscoverVoiceIntro";

export default function DiscoverProfileScreen({
  userId,
  returnTo,
  previewUser,
  profilePreviewMode,
}: {
  userId: string;
  returnTo: string;
  previewUser: DiscoverProfilePreview;
  profilePreviewMode?: "before";
}) {
  const { colors } = useRomBuzzTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isProfilePreview =
    profilePreviewMode === "before";

  const { width } = useWindowDimensions();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const controller = useDiscoverProfileController({
    userId,
    returnTo,
    previewUser,
    profilePreviewMode,
  });

  const { user } = controller;
  const { voiceUrl, playing, toggleVoice } =
    useDiscoverVoiceIntro(user);

  const age = useMemo(
    () => getDiscoverAge(user?.dob),
    [user?.dob]
  );

  const displayName = useMemo(
    () => getDiscoverDisplayName(user),
    [user]
  );

  const distanceText = useMemo(
    () => getDiscoverDistanceText(user),
    [user]
  );

  const heroLocation = useMemo(
    () => getDiscoverHeroLocationText(user),
    [user]
  );

  const heroChips = useMemo(
    () => getDiscoverHeroChips(user),
    [user]
  );

  const photos = useMemo(
    () => getDiscoverPhotos(user),
    [user]
  );

  const viewerPhotos = useMemo(
    () => getDiscoverViewerPhotos(user, photos),
    [photos, user]
  );

  const heroImage =
    normalizeDiscoverImageUrl(user?.avatar) ||
    photos[0] ||
    "";

  const openPhoto = (url: string) => {
    const index = viewerPhotos.findIndex(
      (photo) => photo === url
    );

    setViewerIndex(
      index >= 0
        ? index
        : 0
    );

    setViewerOpen(true);
  };

  const swipe = useDiscoverProfileSwipe({
    width,
    enabled:
      !isProfilePreview &&
      !viewerOpen &&
      !controller.actionLoading &&
      controller.relationshipMode !== "loading",
    onSwipeLeft:
      controller.secondaryAction,
    onSwipeRight:
      controller.primaryAction,
  });

  if (controller.loading && !user) {
    return (
      <CenteredState
        color={colors.brand}
        background={colors.background}
      />
    );
  }

  if (!user) {
    return (
      <CenteredState
        color={colors.textMuted}
        background={colors.background}
        label="Profile unavailable"
      />
    );
  }

  const actions = isProfilePreview
    ? null
    : (
        <DiscoverProfileActionDock
          mode={controller.relationshipMode}
          firstName={user.firstName}
          loading={controller.actionLoading}
          onSkip={controller.goBack}
          onSend={controller.sendRequest}
          onDecline={() =>
            controller.respond("reject")
          }
          onAccept={() =>
            controller.respond("accept")
          }
          onBack={controller.goBack}
          onOpenMatched={
            controller.goToMatchedProfile
          }
        />
      );

  return (
    <GestureHandlerRootView
      style={[
        styles.root,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <GestureDetector gesture={swipe.gesture}>
        <Animated.View
          style={[
            styles.page,
            {
              backgroundColor:
                colors.background,
            },
            swipe.animatedStyle,
          ]}
        >
          <View
            style={[
              styles.header,
              {
                paddingTop: insets.top + 5,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={controller.goBack}
              style={styles.headerButton}
            >
              <Ionicons
                name="arrow-back"
                size={23}
                color={colors.icon}
              />
            </Pressable>

            <Text
              style={[
                styles.headerTitle,
                { color: colors.text },
              ]}
            >
              {isProfilePreview
                ? "Preview"
                : "Discover"}
            </Text>

            <View style={styles.headerButton} />
          </View>

          <DiscoverProfileSwipeStamp
            translateX={swipe.translateX}
            threshold={swipe.threshold}
            topOffset={insets.top + 82}
            visible={
              !isProfilePreview &&
              controller.relationshipMode === "discover"
            }
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={controller.refreshing}
                onRefresh={controller.refresh}
                tintColor={colors.brand}
                colors={[colors.brand]}
              />
            }
          >
            {isProfilePreview && (
              <ProfilePreviewBar
                mode="before"
                onSelectBefore={() => {}}
                onSelectAfter={() =>
                  router.replace({
                    pathname:
                      "/(tabs)/view-profile" as any,
                    params: {
                      userId,
                      profilePreviewMode:
                        "after",
                      returnTo,
                    },
                  })
                }
              />
            )}

            <DiscoverProfileHero
              imageUri={heroImage}
              displayName={displayName}
              age={age}
              locationText={heroLocation}
              distanceText={
                isProfilePreview
                  ? ""
                  : distanceText
              }
              chips={heroChips}
              online={!!user.isOnline}
              onPressPhoto={() =>
                heroImage &&
                openPhoto(heroImage)
              }
            />

            <DiscoverProfileOverview
              user={user}
              voiceUrl={voiceUrl}
              playing={playing}
              onToggleVoice={toggleVoice}
              actions={actions}
            />

            <DiscoverProfileBasics
              user={user}
            />

            <DiscoverProfileDetails
              user={user}
            />

            <DiscoverProfileGallery
              photos={photos}
              onOpen={openPhoto}
            />
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      <DiscoverProfilePhotoViewer
        visible={viewerOpen}
        photos={viewerPhotos}
        initialIndex={viewerIndex}
        title={displayName}
        onClose={() =>
          setViewerOpen(false)
        }
        onIndexChange={setViewerIndex}
      />
    </GestureHandlerRootView>
  );
}

function CenteredState({
  color,
  background,
  label,
}: {
  color: string;
  background: string;
  label?: string;
}) {
  return (
    <View
      style={[
        styles.center,
        {
          backgroundColor:
            background,
        },
      ]}
    >
      {label ? (
        <Text
          style={[
            styles.stateText,
            { color },
          ]}
        >
          {label}
        </Text>
      ) : (
        <ActivityIndicator
          size="large"
          color={color}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { flex: 1 },

  header: {
    minHeight: 56,
    paddingHorizontal: 10,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontFamily: RBZFont.bold,
    fontSize: 16,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 18,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  stateText: {
    fontFamily: RBZFont.medium,
    fontSize: 14,
  },
});
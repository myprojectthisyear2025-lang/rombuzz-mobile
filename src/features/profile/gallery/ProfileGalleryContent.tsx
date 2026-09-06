/**
 * Path: src/features/profile/gallery/ProfileGalleryContent.tsx
 * Purpose: Theme-aware visual shell for the Profile Gallery tab.
 * Used by: src/components/profile/Gallery/GallerySection.tsx.
 */

import PhotoGrid from "@/src/components/profile/Gallery/PhotoGrid";
import ReelGrid from "@/src/components/profile/Gallery/ReelGrid";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  Text,
  View,
} from "react-native";
import type { ProfileGalleryMediaItem } from "./profileGalleryTypes";

import { styles } from "./profileGalleryContent.styles";

type Props = {
  active: "photos" | "reels";

  photos: ProfileGalleryMediaItem[];
  reels: ProfileGalleryMediaItem[];

  onChange: (
    value: "photos" | "reels"
  ) => void;

  onAddPhoto: () => void;
  onAddReel: () => void;

  onOpen: (
    item: ProfileGalleryMediaItem
  ) => void;
};

const GRID_GAP = 5;
const COLUMNS = 3;

export default function ProfileGalleryContent({
  active,
  photos,
  reels,
  onChange,
  onAddPhoto,
  onAddReel,
  onOpen,
}: Props) {
  const { colors } =
    useRomBuzzTheme();

  const [gridWidth, setGridWidth] =
    useState(0);

  const activeItems =
    active === "photos"
      ? photos
      : reels;

  const itemSize =
    gridWidth > 0
      ? (
          gridWidth -
          GRID_GAP * (COLUMNS - 1)
        ) / COLUMNS
      : 0;

  return (
    <View style={styles.section}>
      <View style={styles.toolbar}>
        <View style={styles.tabs}>
          <GalleryTab
            label="Photos"
            count={photos.length}
            active={active === "photos"}
            onPress={() =>
              onChange("photos")
            }
          />

          <GalleryTab
            label="Reels"
            count={reels.length}
            active={active === "reels"}
            onPress={() =>
              onChange("reels")
            }
          />
        </View>

        <View style={styles.actions}>
          <MediaAction
            icon="image-outline"
            label="Add photo"
            onPress={onAddPhoto}
          />

          <MediaAction
            icon="videocam-outline"
            label="Add reel"
            onPress={onAddReel}
          />
        </View>
      </View>

      <View
        style={styles.gridArea}
        onLayout={(event) => {
          const nextWidth =
            event.nativeEvent.layout.width;

          setGridWidth((prev) =>
            Math.abs(
              prev - nextWidth
            ) < 1
              ? prev
              : nextWidth
          );
        }}
      >
        {itemSize > 0 &&
        activeItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={
                active === "photos"
                  ? "images-outline"
                  : "videocam-outline"
              }
              size={24}
              color={colors.iconMuted}
            />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {active === "photos"
                ? "No photos yet"
                : "No reels yet"}
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {active === "photos"
                ? "Add a photo when you're ready."
                : "Add a reel to show more personality."}
            </Text>
          </View>
        ) : itemSize > 0 &&
          active === "photos" ? (
          <PhotoGrid
            items={photos}
            size={itemSize}
            onOpen={onOpen}
          />
        ) : itemSize > 0 ? (
          <ReelGrid
            items={reels}
            size={itemSize}
            onOpen={onOpen}
          />
        ) : null}
      </View>
    </View>
  );
}

function GalleryTab({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      hitSlop={6}
    >
      <Text
        style={[
          styles.tabText,
          {
            color: active
              ? colors.text
              : colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.count,
          {
            color: active
              ? colors.brand
              : colors.textMuted,
          },
        ]}
      >
        {count}
      </Text>

      <View
        style={[
          styles.indicator,
          {
            backgroundColor: active
              ? colors.brand
              : "transparent",
          },
        ]}
      />
    </Pressable>
  );
}

function MediaAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<
    typeof Ionicons
  >["name"];

  label: string;
  onPress: () => void;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.mediaAction,
        {
          backgroundColor:
            colors.surfaceMuted,
          borderColor:
            colors.border,
        },
        pressed && {
          opacity: 0.62,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={colors.icon}
      />

      <View
        style={[
          styles.plusBadge,
          {
            backgroundColor:
              colors.brand,
          },
        ]}
      >
        <Ionicons
          name="add"
          size={9}
          color={colors.white}
        />
      </View>
    </Pressable>
  );
}
/**
 * Path: src/components/profile/Gallery/ReelGrid.tsx
 * Purpose: Compact 3-column Profile reel grid with play and privacy indicators.
 * Used by: ProfileGalleryContent.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";

import React from "react";

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const GRID_GAP = 5;

function getReelThumbnailUrl(
  item: any
) {
  return String(
    item?.thumbnailUrl ||
      item?.thumbnail ||
      item?.poster ||
      item?.previewUrl ||
      item?.cloudflareStream
        ?.thumbnailUrl ||
      ""
  ).trim();
}

function isCloudflareStreamReel(
  item: any
) {
  return (
    String(
      item?.provider ||
        item?.storage ||
        ""
    ).toLowerCase() ===
      "cloudflare_stream" ||
    !!item?.streamUid ||
    !!item?.cloudflareStream?.uid
  );
}

function getPrivacyIcon(
  item: any
) {
  const caption = String(
    item?.caption || ""
  );

  if (
    caption.includes("scope:matches") ||
    item?.privacy === "matches"
  ) {
    return "people" as const;
  }

  if (
    caption.includes("scope:private") ||
    item?.privacy === "private"
  ) {
    return "lock-closed" as const;
  }

  return "globe" as const;
}

export default function ReelGrid({
  items,
  onOpen,
  size,
}: {
  items: any[];
  onOpen: (m: any) => void;
  size: number;
}) {
  const { colors } =
    useRomBuzzTheme();

  return (
    <View style={styles.grid}>
      {items.map(
        (item, index) => {
          const thumbnailUrl =
            getReelThumbnailUrl(
              item
            );

          const isStream =
            isCloudflareStreamReel(
              item
            );

          return (
            <Pressable
              key={
                item.id ??
                item.streamUid ??
                item
                  .cloudflareStream
                  ?.uid ??
                index
              }
              onPress={() =>
                onOpen(item)
              }
              style={[
                styles.item,
                {
                  width: size,

                  backgroundColor:
                    colors.surfaceMuted,

                  marginRight:
                    (index + 1) %
                      3 ===
                    0
                      ? 0
                      : GRID_GAP,
                },
              ]}
            >
              {thumbnailUrl ? (
                <Image
                  source={{
                    uri: thumbnailUrl,
                  }}
                  style={
                    styles.image
                  }
                  resizeMode="cover"
                  fadeDuration={0}
                />
              ) : (
                <View
                  style={
                    styles.placeholder
                  }
                >
                  <Ionicons
                    name="videocam-outline"
                    size={22}
                    color={
                      colors.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.placeholderText,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    {isStream
                      ? "Processing"
                      : "Reel"}
                  </Text>
                </View>
              )}

              <View
                style={
                  styles.playBadge
                }
              >
                <Ionicons
                  name="play"
                  size={11}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={
                  styles.privacyBadge
                }
              >
                <Ionicons
                  name={getPrivacyIcon(
                    item
                  )}
                  size={11}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>
          );
        }
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    item: {
      aspectRatio: 1,
      borderRadius: 9,
      overflow: "hidden",

      marginBottom:
        GRID_GAP,
    },

    image: {
      width: "100%",
      height: "100%",
    },

    placeholder: {
      width: "100%",
      height: "100%",

      alignItems: "center",
      justifyContent: "center",
    },

    placeholderText: {
      marginTop: 5,

      fontFamily:
        RBZFont.semiBold,

      fontSize: 10.5,
    },

    playBadge: {
      position: "absolute",
      left: 5,
      top: 5,

      width: 22,
      height: 22,
      borderRadius: 11,

      backgroundColor:
        "rgba(8,8,11,0.58)",

      alignItems: "center",
      justifyContent: "center",
    },

    privacyBadge: {
      position: "absolute",
      right: 5,
      bottom: 5,

      width: 22,
      height: 22,
      borderRadius: 11,

      backgroundColor:
        "rgba(8,8,11,0.58)",

      alignItems: "center",
      justifyContent: "center",
    },
  });
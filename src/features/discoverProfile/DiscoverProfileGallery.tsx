/**
 * Path: src/features/discoverProfile/DiscoverProfileGallery.tsx
 * Purpose: Compact public-photo strip for Discover Profile.
 * Used by: DiscoverProfileScreen.tsx only.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import React from "react";
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function DiscoverProfileGallery({
  photos,
  onOpen,
}: {
  photos: string[];
  onOpen: (url: string) => void;
}) {
  const { colors } =
    useRomBuzzTheme();

  if (!photos.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text
          style={[
            styles.title,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          GALLERY
        </Text>

        <Text
          style={[
            styles.count,
            {
              color:
                colors.textMuted,
            },
          ]}
        >
          {photos.length} photos
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {photos.map(
          (url, index) => (
            <Pressable
              key={`${url}-${index}`}
              onPress={() =>
                onOpen(url)
              }
              style={[
                styles.item,
                {
                  backgroundColor:
                    colors.surfaceMuted,
                },
              ]}
            >
              <Image
                source={{
                  uri: url,
                }}
                style={
                  styles.image
                }
                resizeMode="cover"
              />
            </Pressable>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    section: {
      marginTop: 7,
      marginBottom: 8,
    },

    headingRow: {
      marginHorizontal: 16,
      marginBottom: 7,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    title: {
      fontFamily:
        RBZFont.bold,

      fontSize: 11,
      letterSpacing: 0.65,
    },

    count: {
      fontFamily:
        RBZFont.medium,

      fontSize: 11.5,
    },

    strip: {
      paddingHorizontal: 16,
      gap: 8,
    },

    item: {
      width: 92,
      height: 92,

      borderRadius: 14,
      overflow: "hidden",
    },

    image: {
      width: "100%",
      height: "100%",
    },
  });
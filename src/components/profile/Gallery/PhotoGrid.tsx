/**
 * Path: src/components/profile/Gallery/PhotoGrid.tsx
 * Purpose: Compact 3-column Profile photo grid with privacy indicators.
 * Used by: ProfileGalleryContent.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { Ionicons } from "@expo/vector-icons";

import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

const GRID_GAP = 5;

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

export default function PhotoGrid({
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
    <FlatList
      data={items}
      keyExtractor={(
        item,
        index
      ) =>
        String(
          item?.id ??
            item?.url ??
            index
        )
      }
      numColumns={3}
      scrollEnabled={false}
      showsVerticalScrollIndicator={
        false
      }
      columnWrapperStyle={{
        gap: GRID_GAP,
      }}
      contentContainerStyle={{
        gap: GRID_GAP,
      }}
      removeClippedSubviews
      initialNumToRender={12}
      windowSize={7}
      maxToRenderPerBatch={12}
      updateCellsBatchingPeriod={
        50
      }
      getItemLayout={(
        _,
        index
      ) => {
        const row =
          Math.floor(index / 3);

        const length =
          size + GRID_GAP;

        return {
          length,
          offset:
            row * length,
          index,
        };
      }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            onOpen(item)
          }
          style={[
            styles.item,
            {
              width: size,
              height: size,

              backgroundColor:
                colors.surfaceMuted,
            },
          ]}
        >
          <Image
            source={{
              uri: item.url,
            }}
            style={styles.image}
            resizeMode="cover"
            fadeDuration={0}
          />

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
      )}
    />
  );
}

const styles =
  StyleSheet.create({
    item: {
      aspectRatio: 1,
      borderRadius: 9,
      overflow: "hidden",
    },

    image: {
      width: "100%",
      height: "100%",
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
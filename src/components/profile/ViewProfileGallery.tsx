/**
 * ============================================================================
 * 📁 File: src/components/profile/ViewProfileGallery.tsx
 * 🎯 Purpose: ViewProfile gallery section for matched profiles
 *
 * Owns:
 *  - Photos/Reels tabs
 *  - Photo/Reel counts
 *  - Photo/Reel grid rendering
 *  - Empty states
 *  - Gallery-only styling
 *
 * Does NOT own:
 *  - Media parsing/fetching logic from view-profile.tsx
 *  - Fullscreen image/video viewer state
 * ============================================================================
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { getDirectStreamThumbnailUrl } from "@/src/features/performance/viewProfile/rbzViewProfileCache";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const GRID_COLUMNS = 3;
const GRID_GAP = 7;

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  line: "rgba(17,24,39,0.10)",
  cardBg: "#ffffff",
} as const;

type ViewProfileGalleryTab = "photos" | "reels";

type ViewProfileMediaItem = {
  id?: string;
  url?: string;
  mediaUrl?: string;
  fileUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  secureUrl?: string;
  secure_url?: string;
  type?: "image" | "reel" | "video" | string;
  caption?: string;
  privacy?: string;

  // Cloudflare Stream profile_reel support
  provider?: string;
  storage?: string;
  streamUid?: string;
  playback?: any;
  thumbnailUrl?: string;
  thumbnail?: string;
  poster?: string;
  previewUrl?: string;
  cloudflareStream?: any;

  [key: string]: any;
};

type Props = {
  tab: ViewProfileGalleryTab;
  onTabChange: (nextTab: ViewProfileGalleryTab) => void;
  photos: ViewProfileMediaItem[];
  reels: ViewProfileMediaItem[];
  gridSize: number;
  onOpenPhoto: (item: ViewProfileMediaItem, index: number) => void;
  onOpenReel: (item: ViewProfileMediaItem, index: number) => void;
};

function getStreamUid(item: ViewProfileMediaItem) {
  return String(
    item?.streamUid ||
      item?.uid ||
      item?.cloudflareStream?.uid ||
      ""
  ).trim();
}

function isCloudflareStreamReel(item: ViewProfileMediaItem) {
  return (
    String(item?.provider || item?.storage || "").toLowerCase() === "cloudflare_stream" ||
    !!getStreamUid(item)
  );
}

function getUrl(item: ViewProfileMediaItem) {
  return String(
    item?.url ||
      item?.mediaUrl ||
      item?.fileUrl ||
      item?.imageUrl ||
      item?.videoUrl ||
      item?.secureUrl ||
      item?.secure_url ||
      item?.playback?.hls ||
      item?.playback?.dash ||
      ""
  ).trim();
}

function getThumbnailUrl(item: ViewProfileMediaItem) {
  return String(
    item?.thumbnailUrl ||
      item?.thumbnail ||
      item?.poster ||
      item?.previewUrl ||
      item?.cloudflareStream?.thumbnailUrl ||
      ""
  ).trim();
}

function getKey(item: ViewProfileMediaItem, index: number, prefix: string) {
  return String(
    item?.id ||
      item?.mediaId ||
      item?._id ||
      getStreamUid(item) ||
      `${prefix}-${index}-${getUrl(item)}`
  );
}

function MediaTile({
  item,
  index,
  size,
  kind,
  onOpen,
}: {
  item: ViewProfileMediaItem;
  index: number;
  size: number;
  kind: "photo" | "reel";
  onOpen: (item: ViewProfileMediaItem, index: number) => void;
}) {
  const uri = getUrl(item);
  const streamUid = getStreamUid(item);
  const thumbnailUrl = getThumbnailUrl(item);
  const isStream = isCloudflareStreamReel(item);

  const reelPoster =
    thumbnailUrl ||
    (streamUid ? getDirectStreamThumbnailUrl(streamUid) : "");

  const imageUri = kind === "reel" ? reelPoster : uri;

  return (
    <View
      style={[
        styles.gridItem,
        {
          width: size,
          marginRight: (index + 1) % GRID_COLUMNS === 0 ? 0 : GRID_GAP,
        },
      ]}
    >
      <Pressable onPress={() => onOpen(item, index)} style={styles.mediaPressable}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.media} resizeMode="cover" />
        ) : (
          <View style={styles.streamPlaceholder}>
            <Ionicons
              name={kind === "reel" ? "videocam" : "image"}
              size={24}
              color={RBZ.white}
            />
            <Text style={styles.streamPlaceholderText}>
              {kind === "reel" && isStream ? "Processing" : kind === "reel" ? "Reel" : "Photo"}
            </Text>
          </View>
        )}

        {kind === "reel" ? (
          <>
            <View style={styles.reelCenterPlay}>
              <Ionicons name="play" size={24} color={RBZ.white} />
            </View>

            <View style={styles.reelBadge}>
              <Ionicons name="play" size={10} color={RBZ.white} />
              <Text style={styles.reelBadgeText}>Reel</Text>
            </View>
          </>
        ) : null}
      </Pressable>
    </View>
  );
}

function MediaGrid({
  items,
  size,
  kind,
  onOpen,
}: {
  items: ViewProfileMediaItem[];
  size: number;
  kind: "photo" | "reel";
  onOpen: (item: ViewProfileMediaItem, index: number) => void;
}) {
  return (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <MediaTile
          key={getKey(item, index, kind)}
          item={item}
          index={index}
          size={size}
          kind={kind}
          onOpen={onOpen}
        />
      ))}
    </View>
  );
}

export default function ViewProfileGallery({
  tab,
  onTabChange,
  photos,
  reels,
  gridSize,
  onOpenPhoto,
  onOpenReel,
}: Props) {
  const { colors } = useRomBuzzTheme();
  const [gridWidth, setGridWidth] = React.useState(0);

  const measuredGridSize =
    gridWidth > 0
      ? Math.floor(
          (gridWidth - GRID_GAP * (GRID_COLUMNS - 1)) /
            GRID_COLUMNS
        )
      : Math.floor(gridSize * 0.72);

  return (
    <View
      style={[
        styles.galleryCard,
        {
          borderTopColor:
            colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.sectionTitle,
          {
            color:
              colors.textMuted,
          },
        ]}
      >
        Gallery
      </Text>

      <View
        style={[
          styles.galleryTabs,
          {
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() =>
            onTabChange("photos")
          }
          style={[
            styles.tab,
            tab === "photos" && {
              borderBottomColor:
                colors.brand,
            },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  tab === "photos"
                    ? colors.text
                    : colors.textMuted,
              },
            ]}
          >
            Photos ({photos.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            onTabChange("reels")
          }
          style={[
            styles.tab,
            tab === "reels" && {
              borderBottomColor:
                colors.brand,
            },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  tab === "reels"
                    ? colors.text
                    : colors.textMuted,
              },
            ]}
          >
            Reels ({reels.length})
          </Text>
        </Pressable>
      </View>

      {tab === "photos" ? (
        photos.length > 0 ? (
          <View
            style={styles.gridContainer}
            onLayout={(e) =>
              setGridWidth(e.nativeEvent.layout.width)
            }
          >
            <MediaGrid
              items={photos}
              size={measuredGridSize}
              kind="photo"
              onOpen={onOpenPhoto}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="images-outline"
              size={38}
              color={colors.iconMuted}
            />

            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              No photos shared yet
            </Text>
          </View>
        )
      ) : reels.length > 0 ? (
        <View
          style={styles.gridContainer}
          onLayout={(e) =>
            setGridWidth(e.nativeEvent.layout.width)
          }
        >
          <MediaGrid
            items={reels}
            size={measuredGridSize}
            kind="reel"
            onOpen={onOpenReel}
          />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="videocam-outline"
            size={38}
            color={colors.iconMuted}
          />

          <Text
            style={[
              styles.emptyText,
              {
                color:
                  colors.textMuted,
                },
              ]}
            >
              No reels shared yet
            </Text>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  galleryCard: {
    marginHorizontal: 16,
    marginBottom: 6,
    paddingTop: 7,
    borderTopWidth:
      StyleSheet.hairlineWidth,
  },

  sectionTitle: {
    marginBottom: 6,
    fontFamily:
      RBZFont.bold,
    fontSize: 11,
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },

  galleryTabs: {
    flexDirection: "row",
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    marginBottom: 7,
  },

  tab: {
    minWidth: 88,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor:
      "transparent",
  },

  tabText: {
    fontFamily:
      RBZFont.semiBold,
    fontSize: 12.5,
  },
   gridContainer: {
    width: "100%",
    alignSelf: "stretch",
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  gridItem: {
    aspectRatio: 1,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: GRID_GAP,
    position: "relative",
  },
  mediaPressable: {
    width: "100%",
    height: "100%",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  streamPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  streamPlaceholderText: {
    color: RBZ.white,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
  },
  reelCenterPlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 46,
    height: 46,
    marginTop: -23,
    marginLeft: -23,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  reelBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.68)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  reelBadgeText: {
    color: RBZ.white,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyText: {
    marginTop: 9,
    fontFamily:
      RBZFont.medium,
    fontSize: 13,
  },
});

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

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
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
  type?: "image" | "reel" | "video" | string;
  caption?: string;
  privacy?: string;
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

function getUrl(item: ViewProfileMediaItem) {
  return String(item?.url || item?.mediaUrl || item?.fileUrl || item?.imageUrl || item?.videoUrl || "").trim();
}

function getKey(item: ViewProfileMediaItem, index: number, prefix: string) {
  return String(item?.id || item?.mediaId || item?._id || `${prefix}-${index}-${getUrl(item)}`);
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
        {kind === "reel" ? (
          <Video
            source={{ uri }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted
            isLooping={false}
          />
        ) : (
          <Image source={{ uri }} style={styles.media} resizeMode="cover" />
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
  const [gridWidth, setGridWidth] = React.useState(0);

  const measuredGridSize =
    gridWidth > 0
      ? Math.floor((gridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS)
      : Math.floor(gridSize * 0.72);

  return (
    <View style={styles.galleryCard}>
      <View style={styles.galleryHeader}>
        <View style={styles.galleryTitleRow}>
          <Ionicons name="images" size={20} color={RBZ.c2} />
          <Text style={styles.cardTitle}>Gallery</Text>
        </View>

        <View style={styles.galleryTabs}>
          <Pressable
            onPress={() => onTabChange("photos")}
            style={[styles.tab, tab === "photos" && styles.activeTab]}
          >
            <Text style={[styles.tabText, tab === "photos" && styles.activeTabText]}>
              Photos ({photos.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onTabChange("reels")}
            style={[styles.tab, tab === "reels" && styles.activeTab]}
          >
            <Text style={[styles.tabText, tab === "reels" && styles.activeTabText]}>
              Reels ({reels.length})
            </Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.galleryHint}>
        {tab === "photos"
          ? "Shared photos for vibes and moments"
          : "Reels showing personality and interests"}
      </Text>

         {tab === "photos" ? (
        photos.length > 0 ? (
          <View
            style={styles.gridContainer}
            onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
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
            <Ionicons name="images-outline" size={48} color={RBZ.line} />
            <Text style={styles.emptyText}>No photos shared yet</Text>
          </View>
        )
       ) : reels.length > 0 ? (
        <View
          style={styles.gridContainer}
          onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
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
          <Ionicons name="videocam-outline" size={48} color={RBZ.line} />
          <Text style={styles.emptyText}>No reels shared yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  galleryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: RBZ.cardBg,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },
  galleryHeader: {
    marginBottom: 12,
  },
  galleryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: RBZ.ink,
  },
  galleryTabs: {
    flexDirection: "row",
    backgroundColor: "rgba(17,24,39,0.04)",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: RBZ.c2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: RBZ.muted,
  },
  activeTabText: {
    color: RBZ.white,
  },
  galleryHint: {
    fontSize: 13,
    color: RBZ.muted,
    marginBottom: 16,
    lineHeight: 18,
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
    borderRadius: 12,
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
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: RBZ.muted,
    fontWeight: "600",
    marginTop: 12,
  },
});

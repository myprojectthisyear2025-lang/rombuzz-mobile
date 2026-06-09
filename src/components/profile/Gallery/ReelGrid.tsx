import { Ionicons } from "@expo/vector-icons";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import React, { useRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  items: any[];
  onOpen: (m: any) => void;
  size: number;
};

function getReelPlayableUrl(item: any) {
  return String(
    item?.url ||
      item?.mediaUrl ||
      item?.videoUrl ||
      item?.secureUrl ||
      item?.secure_url ||
      item?.playback?.hls ||
      item?.playback?.dash ||
      ""
  ).trim();
}

function getReelThumbnailUrl(item: any) {
  return String(
    item?.thumbnailUrl ||
      item?.thumbnail ||
      item?.poster ||
      item?.previewUrl ||
      item?.cloudflareStream?.thumbnailUrl ||
      ""
  ).trim();
}

function isCloudflareStreamReel(item: any) {
  return (
    String(item?.provider || item?.storage || "").toLowerCase() === "cloudflare_stream" ||
    !!item?.streamUid ||
    !!item?.cloudflareStream?.uid
  );
}

export default function ReelGrid({ items, onOpen, size }: Props) {
  // one ref per reel (indexed)
  const videoRefs = useRef<(Video | null)[]>([]);

  return (
    <View style={styles.grid}>
      {items.map((m, i) => {
        const playableUrl = getReelPlayableUrl(m);
        const thumbnailUrl = getReelThumbnailUrl(m);
        const isStream = isCloudflareStreamReel(m);

        return (
          <Pressable
            key={m.id ?? m.streamUid ?? m.cloudflareStream?.uid ?? i}
            onPress={() => onOpen(m)}
            style={[
              styles.item,
              {
                width: size,
                marginRight: (i + 1) % 3 === 0 ? 0 : 8,
              },
            ]}
          >
            {playableUrl ? (
              <Video
                ref={(ref) => {
                  videoRefs.current[i] = ref;
                }}
                source={{ uri: playableUrl }}
                style={styles.img}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isMuted
                isLooping={false}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                  if (!status.isLoaded) return;

                  // 🔁 loop ONLY first 5 seconds forever
                  if (status.positionMillis >= 5000) {
                    videoRefs.current[i]?.setPositionAsync(0);
                  }
                }}
              />
            ) : thumbnailUrl ? (
              <Image source={{ uri: thumbnailUrl }} style={styles.img} resizeMode="cover" />
            ) : (
              <View style={styles.streamPlaceholder}>
                <Ionicons name="videocam" size={24} color="#fff" />
                <Text style={styles.streamText}>
                  {isStream ? "Processing" : "Reel"}
                </Text>
              </View>
            )}

            <View style={styles.badge}>
              <Ionicons name="play" size={12} color="#fff" />
              <Text style={styles.badgeText}>Reel</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  item: {
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 8,
  },
  img: {
    width: "100%",
    height: "100%",
  },
  streamPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  streamText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
  },
  badge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },
});

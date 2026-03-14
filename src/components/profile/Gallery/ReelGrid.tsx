import { Ionicons } from "@expo/vector-icons";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  items: any[];
  onOpen: (m: any) => void;
  size: number;
};

export default function ReelGrid({ items, onOpen, size }: Props) {
  // one ref per reel (indexed)
  const videoRefs = useRef<(Video | null)[]>([]);

  return (
    <View style={styles.grid}>
      {items.map((m, i) => (
        <Pressable
          key={m.id ?? i}
          onPress={() => onOpen(m)}
          style={[
            styles.item,
            {
              width: size,
              marginRight: (i + 1) % 3 === 0 ? 0 : 8,
            },
          ]}
        >
          <Video
            ref={(ref) => {
              videoRefs.current[i] = ref;
            }}
            source={{ uri: m.url }}
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

          <View style={styles.badge}>
            <Ionicons name="play" size={12} color="#fff" />
            <Text style={styles.badgeText}>Reel</Text>
          </View>
        </Pressable>
      ))}
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

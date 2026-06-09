/**
 * ============================================================
 *  File: GalleryVideoViewer.tsx
 *  Purpose: Fullscreen video viewer used by the gallery modal.
 *
 * Features:
 *   - Owns video fullscreen paging/navigation
 *   - Supports vertical slide up/down for previous/next media
 *   - Plays the active gallery video only
 *   - Tap anywhere on video to pause/play
 *   - Shows paused play overlay
 *   - Shows custom progress scrubber and duration labels
 *   - Auto-advances to the next media item when video finishes
 *   - Keeps mixed gallery paging stable when the next item is a photo
 *
 * Used By:
 *   - FullscreenViewer.tsx
 * ============================================================
 */
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue } from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";

const RBZ = {
  c3: "#e9486a",
  white: "#ffffff",
};

type GalleryVideoViewerProps = {
  items: any[];
  index: number;
  activeIndex: number;
  onChangeIndex: (i: number) => void;
  onClose: () => void;
  mediaWidth: number;
  mediaHeight: number;
  screenWidth: number;
  screenHeight: number;
  insets: EdgeInsets;
  apiFetch?: (path: string, init?: RequestInit) => Promise<any>;
};

function getStreamUid(item: any) {
  return String(
    item?.streamUid ||
      item?.uid ||
      item?.cloudflareStream?.uid ||
      ""
  ).trim();
}

function getVideoPlayableUrl(item: any) {
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

function isCloudflareStreamVideo(item: any) {
  return (
    String(item?.provider || item?.storage || "").toLowerCase() === "cloudflare_stream" ||
    !!getStreamUid(item)
  );
}

function isVideoItem(item: any) {
  const type = String(item?.type || "").toLowerCase();
  const url = getVideoPlayableUrl(item).toLowerCase();
  return (
    isCloudflareStreamVideo(item) ||
    type === "video" ||
    type === "reel" ||
    /\.(mp4|mov|m4v|webm|m3u8)(\?|#|$)/i.test(url)
  );
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function ActiveVideoItem({
  item,
  rowIndex,
  activeIndex,
  isActive,
  mediaWidth,
  mediaHeight,
  insets,
  itemsLength,
  onChangeIndex,
  listRef,
  screenHeight,
  apiFetch,
}: {
  item: any;
  rowIndex: number;
  activeIndex: number;
  isActive: boolean;
  mediaWidth: number;
  mediaHeight: number;
  insets: EdgeInsets;
  itemsLength: number;
  onChangeIndex: (i: number) => void;
  listRef: React.RefObject<Animated.FlatList<any> | null>;
  screenHeight: number;
  apiFetch?: (path: string, init?: RequestInit) => Promise<any>;
}) {
  const videoRef = useRef<Video | null>(null);
  const videoLoaded = useRef(false);

  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [resolvedUrl, setResolvedUrl] = useState(() => getVideoPlayableUrl(item));
  const [resolving, setResolving] = useState(false);
  const seeking = useSharedValue(false);

  useEffect(() => {
    let alive = true;

    async function resolveStreamPlayback() {
      const existing = getVideoPlayableUrl(item);
      if (existing) {
        setResolvedUrl(existing);
        return;
      }

      const uid = getStreamUid(item);
      if (!uid || !apiFetch) {
        setResolvedUrl("");
        return;
      }

      try {
        setResolving(true);
        const data = await apiFetch(`/stream/${uid}/playback`);
        const nextUrl = String(
          data?.playback?.hls ||
            data?.playback?.dash ||
            ""
        ).trim();

        if (alive) setResolvedUrl(nextUrl);
      } catch (err) {
        console.log("Stream playback resolve failed:", err);
        if (alive) setResolvedUrl("");
      } finally {
        if (alive) setResolving(false);
      }
    }

    resolveStreamPlayback();

    return () => {
      alive = false;
    };
  }, [item?.id, item?.streamUid, item?.cloudflareStream?.uid, apiFetch]);

  useEffect(() => {
    if (!videoRef.current || !videoLoaded.current) return;

    if (isActive) {
      if (!paused) videoRef.current.playAsync?.();
      return;
    }

    videoRef.current.pauseAsync?.();
    videoRef.current.setPositionAsync?.(0);
    setPaused(false);
    setPosition(0);
  }, [activeIndex, isActive, paused]);

  const scrubGesture = useMemo(() => {
    return Gesture.Pan()
      .runOnJS(true)
      .hitSlop({ vertical: 20 })
      .onBegin(() => {
        seeking.value = true;
      })
      .onUpdate((e) => {
        if (!duration) return;
        if (!videoRef.current) return;
        if (!videoLoaded.current) return;

        const barWidth = mediaWidth || 1;
        const ratio = Math.min(Math.max(e.x / barWidth, 0), 1);
        const nextPosition = ratio * duration;

        videoRef.current.setPositionAsync(nextPosition);
        setPosition(nextPosition);
      })
      .onEnd(() => {
        seeking.value = false;
      });
  }, [duration, mediaWidth, seeking]);

  return (
    <Pressable
      style={styles.pressArea}
      android_disableSound
      pressRetentionOffset={{ top: 80, bottom: 120, left: 0, right: 0 }}
      onPress={() => {
        if (!isActive) return;
        if (!resolvedUrl) return;
        setPaused((p) => !p);
      }}
    >
      {!resolvedUrl ? (
        <View style={[styles.streamLoading, { width: mediaWidth, height: mediaHeight }]}>
          <Ionicons name="videocam" size={34} color={RBZ.white} />
          <Text style={styles.streamLoadingText}>
            {resolving ? "Preparing reel…" : "Reel is processing"}
          </Text>
        </View>
      ) : (
      <Video
        ref={(ref) => {
          videoRef.current = ref;
          if (ref) videoLoaded.current = false;
        }}
        key={`video-${item?.id || item?.streamUid || item?.url}-${rowIndex}`}
        source={{ uri: resolvedUrl }}
        onLoad={() => {
          videoLoaded.current = true;
          if (isActive && !paused) videoRef.current?.playAsync?.();
        }}
        style={{ width: mediaWidth, height: mediaHeight, alignSelf: "center" }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={isActive && !paused}
        isLooping={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={(s: any) => {
          if (!s.isLoaded) return;
          if (!isActive) return;

          setPosition(s.positionMillis || 0);
          setDuration(s.durationMillis || 0);

          if (s.didJustFinish && activeIndex < itemsLength - 1) {
            const nextIndex = activeIndex + 1;
            onChangeIndex(nextIndex);
            setTimeout(() => {
              listRef.current?.scrollToOffset({
                offset: nextIndex * screenHeight,
                animated: true,
              });
            }, 80);
          }
        }}
        onError={(e) => console.log("Video error:", e)}
      />
      )}

      {paused && isActive ? (
        <View style={styles.pausedOverlay} pointerEvents="none">
          <Ionicons name="play" size={32} color={RBZ.white} />
        </View>
      ) : null}

      {isActive && duration > 0 ? (
        <GestureDetector gesture={scrubGesture}>
          <View style={[styles.scrubberWrap, { bottom: insets.bottom + 12, width: mediaWidth }]}> 
            <View style={styles.scrubberTouchArea}>
              <View style={styles.scrubberTrack}>
                <View
                  style={[
                    styles.scrubberFill,
                    { width: `${Math.max(0, Math.min((position / duration) * 100, 100))}%` },
                  ]}
                />
              </View>

              <View
                style={[
                  styles.scrubberHandle,
                  { left: `${Math.max(0, Math.min((position / duration) * 100, 100))}%` },
                ]}
              />
            </View>

            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        </GestureDetector>
      ) : null}
    </Pressable>
  );
}

function PassivePhotoItem({ item, mediaWidth, mediaHeight }: { item: any; mediaWidth: number; mediaHeight: number }) {
  return (
    <Animated.Image
      source={{ uri: item?.url }}
      style={[styles.media, { width: mediaWidth, height: mediaHeight }]}
      resizeMode="contain"
    />
  );
}

export default function GalleryVideoViewer({
  items,
  index,
  activeIndex,
  onChangeIndex,
  mediaWidth,
  mediaHeight,
  screenWidth,
  screenHeight,
  insets,
  apiFetch,
}: GalleryVideoViewerProps) {
  const listRef = useRef<Animated.FlatList<any>>(null);

  useEffect(() => {
    if (!screenHeight) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: index * screenHeight,
        animated: false,
      });
    }, 0);
    return () => clearTimeout(t);
  }, [index, screenHeight]);

  return (
    <Animated.FlatList
      ref={listRef}
      data={items}
      extraData={activeIndex}
      horizontal={false}
      pagingEnabled
      snapToInterval={screenHeight}
      decelerationRate="fast"
      keyExtractor={(rowItem, rowIndex) => String(rowItem?.id || rowItem?.url || rowIndex)}
      showsVerticalScrollIndicator={false}
      bounces={false}
      getItemLayout={(_, rowIndex) => ({ length: screenHeight, offset: screenHeight * rowIndex, index: rowIndex })}
      onMomentumScrollEnd={(e) => {
        const nextIndex = Math.max(
          0,
          Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / screenHeight))
        );
        if (nextIndex !== activeIndex) onChangeIndex(nextIndex);
      }}
      renderItem={({ item: rowItem, index: rowIndex }) => {
        const isActive = rowIndex === activeIndex;

        return (
          <View
            style={[
              styles.page,
              {
                width: screenWidth,
                height: screenHeight,
                paddingTop: 16 + insets.top,
              },
            ]}
          >
            {isVideoItem(rowItem) ? (
                <ActiveVideoItem
                item={rowItem}
                rowIndex={rowIndex}
                activeIndex={activeIndex}
                isActive={isActive}
                mediaWidth={mediaWidth}
                mediaHeight={mediaHeight}
                insets={insets}
                itemsLength={items.length}
                onChangeIndex={onChangeIndex}
                listRef={listRef}
                screenHeight={screenHeight}
                apiFetch={apiFetch}
              />
            ) : (
              <PassivePhotoItem item={rowItem} mediaWidth={mediaWidth} mediaHeight={mediaHeight} />
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },

  media: {
    alignSelf: "center",
  },

  pressArea: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
  },

  streamLoading: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderRadius: 18,
  },

  streamLoadingText: {
    marginTop: 10,
    color: RBZ.white,
    fontSize: 13,
    fontWeight: "800",
  },

  pausedOverlay: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 18,
    borderRadius: 50,
    zIndex: 20,
  },

  scrubberWrap: {
    position: "absolute",
    alignSelf: "center",
    paddingVertical: 10,
    zIndex: 25,
  },

  scrubberTouchArea: {
    height: 30,
    justifyContent: "center",
  },

  scrubberTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    overflow: "hidden",
  },

  scrubberFill: {
    height: "100%",
    backgroundColor: RBZ.c3,
  },

  scrubberHandle: {
    position: "absolute",
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: RBZ.c3,
    borderWidth: 3,
    borderColor: RBZ.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },

  timeRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  timeText: {
    color: RBZ.white,
    fontSize: 12,
    fontWeight: "700",
  },
});

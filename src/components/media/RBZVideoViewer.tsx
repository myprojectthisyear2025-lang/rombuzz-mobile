/**
 * ============================================================
 * 📁 File: src/components/media/RBZVideoViewer.tsx
 * 🎯 Purpose: Universal fullscreen video viewer for RomBuzz
 *
 * Standalone shared fullscreen video viewer.
 * This file is NOT wired yet.
 *
 * Features:
 *  - Fullscreen modal video viewer
 *  - Horizontal swipe left/right between videos
 *  - Swipe down to close
 *  - Tap anywhere to show/hide controls
 *  - Tap center play/pause
 *  - Double tap left/right seek backward/forward
 *  - Progress bar + seek
 *  - Current time / total duration
 *  - Mute / unmute
 *  - Replay when ended
 *  - Loading / buffering / error states
 *  - Header title + count
 *  - Solid black background with no transparent bleed-through
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export type RBZVideoViewerItem = {
  id: string | number;
  url: string;
  title?: string;
  poster?: string;
  thumbnail?: string;
};

type RBZVideoViewerProps = {
  visible: boolean;
  items: RBZVideoViewerItem[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  FooterComponent?: (props: { item: RBZVideoViewerItem; index: number }) => React.ReactNode;
};

type VideoRefsMap = Record<number, Video | null>;

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

function msToClock(ms?: number) {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function RBZVideoViewer({
  visible,
  items,
  initialIndex = 0,
  title,
  onClose,
  onIndexChange,
  FooterComponent,
}: RBZVideoViewerProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<RBZVideoViewerItem>>(null);
  const videoRefs = useRef<VideoRefsMap>({});
  const openHandledRef = useRef(false);
  const controlsHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sessionMuted, setSessionMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const [playbackByIndex, setPlaybackByIndex] = useState<
    Record<
      number,
      {
        isLoaded: boolean;
        isPlaying: boolean;
        isBuffering: boolean;
        durationMillis: number;
        positionMillis: number;
        didJustFinish: boolean;
        hasError: boolean;
        errorText?: string;
      }
    >
  >({});

  const normalizedItems = useMemo(() => {
    const seen = new Set<string>();

    return items.filter((item) => {
      const url = String(item?.url || "").trim();
      if (!url) return false;
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }, [items]);

  const safeInitialIndex = useMemo(() => {
    if (!normalizedItems.length) return 0;

    const originalSafeIndex = clampIndex(initialIndex, items.length);
    const originalTarget = items[originalSafeIndex];
    const targetUrl = String(originalTarget?.url || "").trim();

    if (!targetUrl) return 0;

    const normalizedIndex = normalizedItems.findIndex(
      (item) => String(item?.url || "").trim() === targetUrl
    );

    return normalizedIndex >= 0 ? normalizedIndex : 0;
  }, [initialIndex, items, normalizedItems]);

  useEffect(() => {
    if (visible && !openHandledRef.current) {
      openHandledRef.current = true;
      setActiveIndex(safeInitialIndex);
      setControlsVisible(true);

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index: safeInitialIndex,
          animated: false,
        });
      });
    }

    if (!visible && openHandledRef.current) {
      openHandledRef.current = false;
      clearControlsTimer();

      Object.values(videoRefs.current).forEach((ref) => {
        ref?.pauseAsync?.().catch(() => {});
      });
    }
  }, [visible, safeInitialIndex]);

  useEffect(() => {
    if (!visible) return;
    pauseAllExcept(activeIndex);
    playActive(activeIndex);
    startControlsAutoHide();
  }, [activeIndex, visible]);

  const clearControlsTimer = useCallback(() => {
    if (controlsHideTimerRef.current) {
      clearTimeout(controlsHideTimerRef.current);
      controlsHideTimerRef.current = null;
    }
  }, []);

  const startControlsAutoHide = useCallback(() => {
    clearControlsTimer();
    controlsHideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2500);
  }, [clearControlsTimer]);

  const handleClose = useCallback(() => {
    clearControlsTimer();
    Object.values(videoRefs.current).forEach((ref) => {
      ref?.pauseAsync?.().catch(() => {});
    });
    onClose();
  }, [clearControlsTimer, onClose]);

  const pauseAllExcept = useCallback((keepIndex: number) => {
    Object.entries(videoRefs.current).forEach(([key, ref]) => {
      const index = Number(key);
      if (index !== keepIndex) {
        ref?.pauseAsync?.().catch(() => {});
      }
    });
  }, []);

  const playActive = useCallback(async (index: number) => {
    const ref = videoRefs.current[index];
    if (!ref) return;
    try {
      await ref.playAsync();
    } catch {
      // ignore playback race errors
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    const ref = videoRefs.current[activeIndex];
    if (!ref) return;

    const state = playbackByIndex[activeIndex];
    if (!state?.isLoaded) return;

    try {
      if (state.didJustFinish) {
        await ref.replayAsync();
      } else if (state.isPlaying) {
        await ref.pauseAsync();
      } else {
        await ref.playAsync();
      }
    } catch {
      // ignore
    }

    setControlsVisible(true);
    startControlsAutoHide();
  }, [activeIndex, playbackByIndex, startControlsAutoHide]);

  const toggleMute = useCallback(async () => {
    const nextMuted = !sessionMuted;
    setSessionMuted(nextMuted);

    await Promise.all(
      Object.values(videoRefs.current).map(async (ref) => {
        if (!ref) return;
        try {
          await ref.setIsMutedAsync(nextMuted);
        } catch {
          // ignore
        }
      })
    );

    setControlsVisible(true);
    startControlsAutoHide();
  }, [sessionMuted, startControlsAutoHide]);

  const seekBy = useCallback(
    async (deltaMs: number) => {
      const ref = videoRefs.current[activeIndex];
      const state = playbackByIndex[activeIndex];
      if (!ref || !state?.isLoaded) return;

      const nextPos = Math.max(
        0,
        Math.min(
          (state.positionMillis || 0) + deltaMs,
          state.durationMillis || 0
        )
      );

      try {
        await ref.setPositionAsync(nextPos);
      } catch {
        // ignore
      }

      setControlsVisible(true);
      startControlsAutoHide();
    },
    [activeIndex, playbackByIndex, startControlsAutoHide]
  );

  const retryActive = useCallback(async () => {
    const ref = videoRefs.current[activeIndex];
    if (!ref) return;

    try {
      await ref.unloadAsync();
      await ref.loadAsync(
        {
          uri: normalizedItems[activeIndex]?.url || "",
        },
        {
          shouldPlay: true,
          isMuted: sessionMuted,
          progressUpdateIntervalMillis: 250,
        },
        true
      );
    } catch {
      // ignore
    }
  }, [activeIndex, normalizedItems, sessionMuted]);

  const updatePlaybackState = useCallback(
    (index: number, status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        setPlaybackByIndex((prev) => ({
          ...prev,
          [index]: {
            isLoaded: false,
            isPlaying: false,
            isBuffering: false,
            durationMillis: 0,
            positionMillis: 0,
            didJustFinish: false,
            hasError: true,
            errorText:
              "error" in status && status.error ? String(status.error) : "Video failed to load",
          },
        }));
        return;
      }

      setPlaybackByIndex((prev) => ({
        ...prev,
        [index]: {
          isLoaded: true,
          isPlaying: !!status.isPlaying,
          isBuffering: !!status.isBuffering,
          durationMillis: status.durationMillis || 0,
          positionMillis: status.positionMillis || 0,
          didJustFinish: !!status.didJustFinish,
          hasError: false,
          errorText: undefined,
        },
      }));
    },
    []
  );

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const nextIndex = clampIndex(
        Math.round(y / SCREEN_HEIGHT),
        normalizedItems.length
      );

      setActiveIndex(nextIndex);
      onIndexChange?.(nextIndex);
    },
    [normalizedItems.length, onIndexChange]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const nextIndex = clampIndex(index, normalizedItems.length);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
      onIndexChange?.(nextIndex);
    },
    [normalizedItems.length, onIndexChange]
  );

  const progress = useMemo(() => {
    const state = playbackByIndex[activeIndex];
    if (!state?.durationMillis) return 0;
    return Math.max(
      0,
      Math.min(1, state.positionMillis / state.durationMillis)
    );
  }, [activeIndex, playbackByIndex]);

  const progressBarWidthRef = useRef(1);

  const onProgressTrackLayout = useCallback((e: LayoutChangeEvent) => {
    progressBarWidthRef.current = Math.max(1, e.nativeEvent.layout.width);
  }, []);

  const onPressProgressTrack = useCallback(
    async (pageX: number, trackX: number) => {
      const state = playbackByIndex[activeIndex];
      const ref = videoRefs.current[activeIndex];
      if (!ref || !state?.isLoaded || !state.durationMillis) return;

      const relativeX = Math.max(
        0,
        Math.min(progressBarWidthRef.current, pageX - trackX)
      );
      const ratio = relativeX / progressBarWidthRef.current;
      const nextPos = Math.floor(state.durationMillis * ratio);

      try {
        await ref.setPositionAsync(nextPos);
      } catch {
        // ignore
      }

      setControlsVisible(true);
      startControlsAutoHide();
    },
    [activeIndex, playbackByIndex, startControlsAutoHide]
  );

  const lastTapRef = useRef(0);

  const createTapHandler = useCallback(
    (index: number) => async (pageX: number) => {
      const now = Date.now();
      const isDoubleTap = now - lastTapRef.current < 260;
      lastTapRef.current = now;

      if (index !== activeIndex) return;

      const leftZone = SCREEN_WIDTH * 0.3;
      const rightZone = SCREEN_WIDTH * 0.7;

      if (isDoubleTap) {
        if (pageX < leftZone) {
          await seekBy(-10000);
          return;
        }
        if (pageX > rightZone) {
          await seekBy(10000);
          return;
        }
      }

      if (controlsVisible) {
        setControlsVisible(false);
        clearControlsTimer();
      } else {
        setControlsVisible(true);
        startControlsAutoHide();
      }
    },
    [activeIndex, clearControlsTimer, controlsVisible, seekBy, startControlsAutoHide]
  );

   const renderItem = useCallback(
    ({ item, index }: { item: RBZVideoViewerItem; index: number }) => {
      const state = playbackByIndex[index];
      const active = index === activeIndex;
      const resolvedTitle = title || item?.title || "Video";
      const posterUri = item?.poster || item?.thumbnail;

      return (
        <View style={styles.page}>
          <View style={styles.videoFrame}>
            <Pressable
              style={styles.tapSurface}
              onPress={(e) => {
                createTapHandler(index)(e.nativeEvent.pageX);
              }}
            >
              <Video
                ref={(ref) => {
                  videoRefs.current[index] = ref;
                }}
                style={styles.video}
                source={{ uri: item.url }}
                usePoster={!!posterUri}
                posterSource={posterUri ? { uri: posterUri } : undefined}
                posterStyle={styles.poster}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={visible && active}
                isLooping={false}
                isMuted={sessionMuted}
                progressUpdateIntervalMillis={250}
                onPlaybackStatusUpdate={(status) =>
                  updatePlaybackState(index, status)
                }
              />

              {active && controlsVisible && (
                <>
                  <View
                    pointerEvents="none"
                    style={[
                      styles.topGradientMask,
                      { paddingTop: insets.top + 8 },
                    ]}
                  >
                    <View style={styles.headerRow}>
                      <Pressable
                        onPress={handleClose}
                        style={styles.headerButton}
                      >
                        <Ionicons name="close" size={24} color="#fff" />
                      </Pressable>

                      <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                          {resolvedTitle}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                          {activeIndex + 1} of {normalizedItems.length}
                        </Text>
                      </View>

                      <View style={styles.headerSpacer} />
                    </View>
                  </View>

                  <View style={styles.middleControlsWrap} pointerEvents="box-none">
                    <Pressable
                      style={styles.middleIconButton}
                      onPress={() => seekBy(-10000)}
                    >
                      <Ionicons name="play-back" size={24} color="#fff" />
                    </Pressable>

                    <Pressable
                      style={styles.playPauseButton}
                      onPress={togglePlayPause}
                    >
                      <Ionicons
                        name={
                          state?.didJustFinish
                            ? "refresh"
                            : state?.isPlaying
                            ? "pause"
                            : "play"
                        }
                        size={34}
                        color="#fff"
                      />
                    </Pressable>

                    <Pressable
                      style={styles.middleIconButton}
                      onPress={() => seekBy(10000)}
                    >
                      <Ionicons name="play-forward" size={24} color="#fff" />
                    </Pressable>
                  </View>

                  <View
                    style={[
                      styles.bottomControlsWrap,
                      { paddingBottom: Math.max(insets.bottom, 14) },
                    ]}
                  >
                    <View style={styles.timeRow}>
                      <Text style={styles.timeText}>
                        {msToClock(state?.positionMillis)}
                      </Text>
                      <Text style={styles.timeText}>
                        {msToClock(state?.durationMillis)}
                      </Text>
                    </View>

                    <View
                      style={styles.progressTrackWrap}
                      onLayout={onProgressTrackLayout}
                    >
                      <Pressable
                        style={styles.progressTrack}
                        onPress={(e) => {
                          const { pageX, locationX } = e.nativeEvent;
                          const trackX = pageX - locationX;
                          onPressProgressTrack(pageX, trackX);
                        }}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress * 100}%` },
                          ]}
                        />
                      </Pressable>
                    </View>

                    <View style={styles.bottomButtonsRow}>
                      <Pressable
                        style={styles.bottomButton}
                        onPress={toggleMute}
                      >
                        <Ionicons
                          name={sessionMuted ? "volume-mute" : "volume-high"}
                          size={22}
                          color="#fff"
                        />
                        <Text style={styles.bottomButtonText}>
                          {sessionMuted ? "Muted" : "Sound"}
                        </Text>
                      </Pressable>

                                   <Pressable
                        style={styles.bottomButton}
                        onPress={() => scrollToIndex(activeIndex - 1)}
                        disabled={activeIndex <= 0}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={22}
                          color={activeIndex <= 0 ? "rgba(255,255,255,0.35)" : "#fff"}
                        />
                        <Text
                          style={[
                            styles.bottomButtonText,
                            activeIndex <= 0 && styles.bottomButtonTextDisabled,
                          ]}
                        >
                          Prev
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.bottomButton}
                        onPress={() => scrollToIndex(activeIndex + 1)}
                        disabled={activeIndex >= normalizedItems.length - 1}
                      >
                        <Text
                          style={[
                            styles.bottomButtonText,
                            activeIndex >= normalizedItems.length - 1 &&
                              styles.bottomButtonTextDisabled,
                          ]}
                        >
                          Next
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={22}
                          color={
                            activeIndex >= normalizedItems.length - 1
                              ? "rgba(255,255,255,0.35)"
                              : "#fff"
                          }
                        />
                      </Pressable>
                    </View>
                  </View>
                </>
              )}

              {active && state?.isBuffering && (
                <View style={styles.centerStatusOverlay} pointerEvents="none">
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.statusText}>Buffering…</Text>
                </View>
              )}

              {active && !state?.isLoaded && !state?.hasError && (
                <View style={styles.centerStatusOverlay} pointerEvents="none">
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.statusText}>Loading…</Text>
                </View>
              )}

              {active && state?.hasError && (
                <View style={styles.centerStatusOverlay}>
                  <Ionicons name="alert-circle-outline" size={34} color="#fff" />
                  <Text style={styles.statusText}>Video failed to load</Text>
                  <Pressable style={styles.retryButton} onPress={retryActive}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>

            {active && FooterComponent ? (
              <View pointerEvents="box-none" style={styles.footerOverlay}>
                <FooterComponent item={item} index={index} />
              </View>
            ) : null}
          </View>
        </View>
      );
    },
    [
      FooterComponent,
      activeIndex,
      controlsVisible,
      createTapHandler,
      handleClose,
      insets.bottom,
      insets.top,
         normalizedItems.length,
      onPressProgressTrack,
      playbackByIndex,
      progress,
      retryActive,
      scrollToIndex,
      seekBy,
      sessionMuted,
      title,
      toggleMute,
      togglePlayPause,
      updatePlaybackState,
      visible,
    ]
  );

  if (!normalizedItems.length) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      hardwareAccelerated
      statusBarTranslucent={Platform.OS === "android"}
      onRequestClose={handleClose}
      transparent={false}
    >
      <View style={styles.root}>
            <FlatList
          ref={flatListRef}
          data={normalizedItems}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          initialNumToRender={1}
          windowSize={3}
          maxToRenderPerBatch={2}
          removeClippedSubviews={false}
          onMomentumScrollEnd={handleMomentumEnd}
          getItemLayout={(_, index) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          })}
          extraData={{
            activeIndex,
            controlsVisible,
            sessionMuted,
            playbackByIndex,
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },

  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  videoFrame: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000",
  },

  tapSurface: {
    flex: 1,
    backgroundColor: "#000",
  },

  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  poster: {
    resizeMode: "contain",
    backgroundColor: "#000",
  },

  topGradientMask: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  headerRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    pointerEvents: "auto",
  },

  headerCenter: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  headerSpacer: {
    width: 44,
    height: 44,
  },

  middleControlsWrap: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    marginTop: -34,
    zIndex: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },

  middleIconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  playPauseButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.52)",
  },

  footerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 35,
  },

  bottomControlsWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
    paddingHorizontal: 14,
    paddingTop: 14,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  timeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  progressTrackWrap: {
    marginBottom: 14,
  },

  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#fff",
  },

  bottomButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bottomButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  bottomButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  bottomButtonTextDisabled: {
    color: "rgba(255,255,255,0.35)",
  },

  centerStatusOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingHorizontal: 24,
  },

  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 14,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
/**
 * 📁 File: src/components/chat/MediaViewer.tsx
 * 🎯 Purpose: Safe-area-aware fullscreen photo and video viewer for chat.
 * Used by: ChatMediaViewerController.tsx for ephemeral photos and chat videos.
 * Controls: Custom play, seek, mute, close, and view-limit badge; no downloads.
 */

import { Ionicons } from "@expo/vector-icons";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chatMediaViewerStyles as styles } from "./chatMediaViewerStyles";

type Props = {
  visible: boolean;
  onClose: () => void;
  uri: string;
  mediaType: "image" | "video";
  muted?: boolean;
  maxViews?: 1 | 2;
  /** Retained for older call sites. Chat media downloads are removed. */
  allowDownload?: boolean;
  onViewed?: () => void;
};

function formatTime(milliseconds: number) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function MediaViewer({
  visible,
  onClose,
  uri,
  mediaType,
  muted = false,
  maxViews,
  onViewed,
}: Props) {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(muted);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [progressWidth, setProgressWidth] = useState(1);
  const [didView, setDidView] = useState(false);
  const loaded = status?.isLoaded ? status : null;
  const duration = loaded?.durationMillis || 0;
  const position = loaded?.positionMillis || 0;

  useEffect(() => {
    if (!visible) {
      setDidView(false);
      setStatus(null);
      setIsPlaying(true);
      setControlsVisible(true);
      return;
    }
    setIsMuted(muted);
    if (!didView) {
      setDidView(true);
      onViewed?.();
    }
  }, [visible, uri, muted, didView, onViewed]);

  const togglePlayback = async () => {
    if (!loaded) return;
    try {
      if (loaded.didJustFinish) await videoRef.current?.replayAsync();
      else if (isPlaying) await videoRef.current?.pauseAsync();
      else await videoRef.current?.playAsync();
      setIsPlaying(!isPlaying || !!loaded.didJustFinish);
    } catch {
      setIsPlaying((playing) => !playing);
    }
  };

  const seekBy = async (offset: number) => {
    if (!loaded) return;
    const nextPosition = Math.max(0, Math.min(duration, position + offset));
    await videoRef.current?.setPositionAsync(nextPosition).catch(() => {});
  };

  const seekTo = async (locationX: number) => {
    if (!duration) return;
    const nextPosition =
      Math.max(0, Math.min(1, locationX / progressWidth)) * duration;
    await videoRef.current?.setPositionAsync(nextPosition).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        {mediaType === "video" ? (
          <Video
            ref={videoRef}
            source={{ uri }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={visible && isPlaying}
            isMuted={isMuted}
            useNativeControls={false}
            onPlaybackStatusUpdate={setStatus}
          />
        ) : (
          <Image source={{ uri }} style={styles.media} resizeMode="contain" />
        )}

        {mediaType === "video" ? (
          <Pressable
            accessibilityLabel="Show video controls"
            style={styles.tapSurface}
            onPress={() => setControlsVisible((shown) => !shown)}
          />
        ) : null}

        {controlsVisible ? (
          <>
            <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close media viewer"
                onPress={onClose}
                style={styles.iconButton}
                hitSlop={8}
              >
                <Ionicons name="close" size={23} color="#fff" />
              </Pressable>
              {maxViews ? (
                <View style={styles.viewBadge}>
                  <Ionicons name="eye-outline" size={15} color="#fff" />
                  <Text style={styles.viewBadgeText}>
                    {maxViews === 1 ? "View once" : "View twice"}
                  </Text>
                </View>
              ) : (
                <View style={styles.headerSpacer} />
              )}
            </View>

            {mediaType === "video" ? (
              <View style={styles.videoControls} pointerEvents="box-none">
                <View style={styles.centerControls} pointerEvents="box-none">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
                    onPress={togglePlayback}
                    style={styles.playButton}
                  >
                    {loaded ? (
                      <Ionicons
                        name={
                          loaded.didJustFinish
                            ? "refresh"
                            : isPlaying
                              ? "pause"
                              : "play"
                        }
                        size={31}
                        color="#fff"
                      />
                    ) : (
                      <ActivityIndicator color="#fff" size="small" />
                    )}
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.bottomPanel,
                    { paddingBottom: Math.max(insets.bottom, 12) + 10 },
                  ]}
                >
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>
                  <View
                    style={styles.progressHitArea}
                    onLayout={(event) =>
                      setProgressWidth(
                        Math.max(1, event.nativeEvent.layout.width),
                      )
                    }
                  >
                    <Pressable
                      accessibilityRole="adjustable"
                      accessibilityLabel="Video progress"
                      style={styles.progressTrack}
                      onPress={(event) =>
                        seekTo(event.nativeEvent.locationX)
                      }
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${
                              duration ? (position / duration) * 100 : 0
                            }%`,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.progressThumb,
                          {
                            left: `${
                              duration ? (position / duration) * 100 : 0
                            }%`,
                          },
                        ]}
                      />
                    </Pressable>
                  </View>
                  <View style={styles.actionsRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Back ten seconds"
                      onPress={() => seekBy(-10000)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="play-back" size={19} color="#fff" />
                      <Text style={styles.actionText}>10</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        isMuted ? "Unmute video" : "Mute video"
                      }
                      onPress={() => setIsMuted((value) => !value)}
                      style={styles.actionButton}
                    >
                      <Ionicons
                        name={isMuted ? "volume-mute" : "volume-high"}
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.actionText}>
                        {isMuted ? "Muted" : "Sound on"}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Forward ten seconds"
                      onPress={() => seekBy(10000)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="play-forward" size={19} color="#fff" />
                      <Text style={styles.actionText}>10</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </Modal>
  );
}
/** Voice messages using the shared 3D chat surface and theme-aware playback colors. */

import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, useWindowDimensions, View } from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import ChatBubbleSurface from "@/src/features/chat/window/components/ChatBubbleSurface";
import { styles } from "./audioBubbleStyles";

function formatMs(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function AudioBubble({
  uri,
  isMine,
}: {
  uri: string;
  isMine: boolean;
}) {
  const { isDark, colors } = useRomBuzzTheme();
  const { width } = useWindowDimensions();
  const foreground = isMine ? "#ffffff" : colors.text;
  const accent = isMine ? "#ffffff" : colors.brand;
  const track = isMine || isDark
    ? "rgba(255,255,255,0.22)"
    : "rgba(17,24,39,0.12)";
  const iconBackground = isMine || isDark
    ? "rgba(255,255,255,0.14)"
    : "rgba(245,46,100,0.10)";

  const soundRef = useRef<Audio.Sound | null>(null);

  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);

  useEffect(() => {
    return () => {
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setPlaying(status.isPlaying);
    setPositionMs(status.positionMillis ?? 0);
    setDurationMs(status.durationMillis ?? 0);

    if (status.didJustFinish) {
      setPlaying(false);
      setPositionMs(0);

      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  };

  const ensureLoaded = async () => {
    if (soundRef.current) return soundRef.current;

    const { sound, status } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false, progressUpdateIntervalMillis: 250 },
      onPlaybackStatusUpdate
    );

    soundRef.current = sound;

    if (status.isLoaded) {
      setDurationMs(status.durationMillis ?? 0);
      setPositionMs(status.positionMillis ?? 0);
      setPlaying(status.isPlaying ?? false);
    }

    return sound;
  };

  const toggle = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const sound = await ensureLoaded();
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        setLoading(false);
        return;
      }

      const finished =
        !!status.didJustFinish ||
        ((status.durationMillis ?? 0) > 0 &&
          (status.positionMillis ?? 0) >= (status.durationMillis ?? 0));

      if (finished) {
        await sound.setPositionAsync(0);
      }

      if (status.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const progress =
    durationMs > 0 ? Math.min(1, Math.max(0, positionMs / durationMs)) : 0;

  return (
    <ChatBubbleSurface
      isMine={isMine}
      maxWidth={Math.min(260, width * 0.72)}
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={playing ? "Pause voice message" : "Play voice message"}
      style={styles.surface}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
            {loading ? (
              <ActivityIndicator color={accent} size="small" />
            ) : (
              <Ionicons
                name={playing ? "pause" : "play"}
                size={20}
                color={accent}
              />
            )}
          </View>
        </View>

        <View style={styles.right}>
          <View style={[styles.progressTrack, { backgroundColor: track }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: accent },
              ]}
            />
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: foreground }]}>
              {playing ? "Playing" : "Voice message"}
            </Text>

            <Text style={[styles.metaText, { color: foreground }]}>
              {formatMs(positionMs)} / {formatMs(durationMs)}
            </Text>
          </View>
        </View>
      </View>
    </ChatBubbleSurface>
  );
}
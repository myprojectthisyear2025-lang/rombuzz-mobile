/**
 * ============================================================
 * 📁 File: src/components/chat/AudioBubble.tsx
 * 🎯 Purpose: Voice message bubble with play/pause + duration + progress
 *
 * FEATURES:
 *  - sender and receiver both see audio duration
 *  - play / pause toggle
 *  - progress bar
 *  - current time / total duration
 *  - resets cleanly when playback finishes
 *  - unloads safely on unmount
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const RBZ = {
  c2: "#d8345f",
  white: "#ffffff",
  ink: "#111827",
  lineLight: "rgba(255,255,255,0.22)",
  lineDark: "rgba(255,255,255,0.18)",
  trackMine: "rgba(255,255,255,0.22)",
  trackPeer: "rgba(255,255,255,0.18)",
  fillMine: "#ffffff",
  fillPeer: "#ffffff",
};

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
    <Pressable
      onPress={toggle}
      style={[
        styles.wrap,
        isMine ? styles.mine : styles.peer,
      ]}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          {loading ? (
            <ActivityIndicator color={RBZ.white} size="small" />
          ) : (
            <Ionicons
              name={playing ? "pause" : "play"}
              size={20}
              color={RBZ.white}
            />
          )}
        </View>
      </View>

      <View style={styles.right}>
        <View
          style={[
            styles.progressTrack,
            isMine ? styles.progressTrackMine : styles.progressTrackPeer,
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {playing ? "Playing" : "Voice message"}
          </Text>

          <Text style={styles.metaText}>
            {formatMs(positionMs)} / {formatMs(durationMs)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: 260,
    maxWidth: 260,
  },
  mine: {
    backgroundColor: RBZ.c2,
    alignSelf: "flex-end",
  },
  peer: {
    backgroundColor: "#111111",
    alignSelf: "flex-start",
  },
  left: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  right: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    width: "100%",
  },
  progressTrackMine: {
    backgroundColor: RBZ.trackMine,
  },
  progressTrackPeer: {
    backgroundColor: RBZ.trackPeer,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: RBZ.fillMine,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  metaText: {
    color: RBZ.white,
    fontWeight: "800",
    fontSize: 12,
  },
});
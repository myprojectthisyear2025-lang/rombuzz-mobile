/**
 * ============================================================
 * 📁 File: src/components/chat/AudioBubble.tsx
 * 🎯 Purpose: Tap-to-play / tap-to-pause voice message
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

const RBZ = {
  c2: "#d8345f",
  white: "#ffffff",
  ink: "#111827",
};

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

  useEffect(() => {
    return () => {
      // cleanup on unmount
      try {
        soundRef.current?.unloadAsync();
      } catch {}
    };
  }, []);

  const toggle = async () => {
    try {
      if (loading) return;

      // first play → load sound
      if (!soundRef.current) {
        setLoading(true);

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );

        soundRef.current = sound;
        setPlaying(true);

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (!status?.isLoaded) return;
          setPlaying(status.isPlaying);

          if (status.didJustFinish) {
            setPlaying(false);
            soundRef.current?.setPositionAsync(0);
          }
        });

        setLoading(false);
        return;
      }

      // toggle play / pause
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={toggle}
      style={[
        styles.wrap,
        isMine ? styles.mine : styles.peer,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={RBZ.white} />
      ) : (
        <Ionicons
          name={playing ? "pause" : "play"}
          size={22}
          color={RBZ.white}
        />
      )}
      <Text style={styles.label}>
        {playing ? "Playing…" : "Voice message"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 260,
  },
  mine: {
    backgroundColor: RBZ.c2,
    alignSelf: "flex-end",
  },
  peer: {
    backgroundColor: "#111",
    alignSelf: "flex-start",
  },
  label: {
    color: RBZ.white,
    fontWeight: "800",
    fontSize: 13,
  },
});

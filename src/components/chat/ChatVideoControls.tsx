/** Custom chat video playback, progress, mute, and retry controls. */
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { chatMediaViewerStyles as styles } from "./chatMediaViewerStyles";
import type { useChatVideoPlayback } from "./useChatVideoPlayback";

function formatTime(milliseconds: number) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
type Props = { player: ReturnType<typeof useChatVideoPlayback>; muted: boolean;
  onToggleMute: () => void; bottomInset: number };

export default function ChatVideoControls({ player, muted, onToggleMute, bottomInset }: Props) {
  const [width, setWidth] = useState(1);
  const percent = Math.min(100, player.duration ? player.position / player.duration * 100 : 0);
  return <View style={styles.videoControls} pointerEvents="box-none">
    <View style={styles.centerControls} pointerEvents="box-none">
      {player.error ? <View style={styles.errorPanel}>
        <Text accessibilityRole="alert" style={styles.errorText}>{player.error}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Retry video" onPress={player.retry} style={styles.retryButton}>
          <Ionicons name="refresh" size={22} color="#fff" /><Text style={styles.actionText}>Try again</Text>
        </Pressable>
      </View> : <Pressable accessibilityRole="button"
        accessibilityLabel={player.playing ? "Pause video" : "Play video"}
        onPress={player.toggle} style={styles.playButton}>
        {player.buffering ? <ActivityIndicator color="#fff" size="small" /> :
          <Ionicons name={player.loaded?.didJustFinish ? "refresh" : player.playing ? "pause" : "play"} size={31} color="#fff" />}
      </Pressable>}
    </View>
    <View style={[styles.bottomPanel, { paddingBottom: Math.max(bottomInset, 12) + 10 }]}>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(player.position)}</Text>
        <Text style={styles.timeText}>{formatTime(player.duration)}</Text>
      </View>
      <View style={styles.progressHitArea} onLayout={event => setWidth(Math.max(1, event.nativeEvent.layout.width))}>
        <Pressable accessibilityRole="adjustable" accessibilityLabel="Video progress" style={styles.progressTrack}
          onPress={event => player.seek(Math.max(0, Math.min(1, event.nativeEvent.locationX / width)) * player.duration)}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
          <View style={[styles.progressThumb, { left: `${percent}%` }]} />
        </Pressable>
      </View>
      <View style={styles.actionsRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back ten seconds" onPress={() => player.seek(player.position - 10000)} style={styles.actionButton}>
          <Ionicons name="play-back" size={19} color="#fff" /><Text style={styles.actionText}>10</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={muted ? "Unmute video" : "Mute video"} onPress={onToggleMute} style={styles.actionButton}>
          <Ionicons name={muted ? "volume-mute" : "volume-high"} size={20} color="#fff" />
          <Text style={styles.actionText}>{muted ? "Muted" : "Sound on"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Forward ten seconds" onPress={() => player.seek(player.position + 10000)} style={styles.actionButton}>
          <Ionicons name="play-forward" size={19} color="#fff" /><Text style={styles.actionText}>10</Text>
        </Pressable>
      </View>
    </View>
  </View>;
}
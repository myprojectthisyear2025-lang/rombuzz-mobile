/**
 * 📁 File: src/components/chat/ChatCameraControls.tsx
 * 🎯 Purpose: Instagram-inspired live camera controls for RomBuzz chat media.
 * Used by: ChatCameraModal.tsx.
 * Includes: flash, torch, timer, grid, zoom, gallery, photo and video capture.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  topInset: number;
  bottomInset: number;
  captureTab: "picture" | "video";
  recording: boolean;
  recordLabel: string;
  flashIcon: string;
  flashLabel: string;
  torchOn: boolean;
  torchAvailable: boolean;
  timerSeconds: 0 | 3 | 10;
  gridOn: boolean;
  zoom: number;
  camReady: boolean;
  busy: boolean;
  countdown: number | null;
  onClose: () => void;
  onFlip: () => void;
  onFlash: () => void;
  onTorch: () => void;
  onTimer: () => void;
  onGrid: () => void;
  onZoom: (value: number) => void;
  onPickMedia: () => void;
  onMode: (mode: "picture" | "video") => void;
  onPhoto: () => void;
  onVideo: () => void;
};

export default function ChatCameraControls(props: Props) {
  const {
    topInset, bottomInset, captureTab, recording, recordLabel, flashIcon,
    flashLabel, torchOn, torchAvailable, timerSeconds, gridOn, zoom,
    camReady, busy, countdown, onClose, onFlip, onFlash, onTorch, onTimer,
    onGrid, onZoom, onPickMedia, onMode, onPhoto, onVideo,
  } = props;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {gridOn ? (
        <View pointerEvents="none" style={styles.grid}>
          <View style={styles.gridV} /><View style={[styles.gridV, styles.gridV2]} />
          <View style={styles.gridH} /><View style={[styles.gridH, styles.gridH2]} />
        </View>
      ) : null}

      <View style={[styles.top, { top: Math.max(topInset + 8, 18) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close camera" onPress={onClose} style={styles.circle}>
          <Ionicons name="close" size={23} color="#fff" />
        </Pressable>
        <View style={styles.status}>
          {recording ? <View style={styles.recDot} /> : null}
          <Text style={styles.statusText}>{recording ? recordLabel : "ROMBUZZ CAMERA"}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Switch camera" onPress={onFlip} disabled={busy} style={styles.circle}>
          <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.tools, { top: Math.max(topInset + 76, 92) }]}>
        <Tool icon={flashIcon} label={flashLabel} onPress={onFlash} />
        <Tool icon="timer-outline" label={timerSeconds ? `${timerSeconds}s` : "Timer"} onPress={onTimer} active={timerSeconds > 0} />
        <Tool icon={torchOn ? "sunny" : "sunny-outline"} label="Torch" onPress={onTorch} disabled={!torchAvailable} active={torchOn} />
        <Tool icon="grid-outline" label="Grid" onPress={onGrid} active={gridOn} />
      </View>

      <View style={[styles.zoomRow, { bottom: Math.max(bottomInset + 174, 184) }]}>
        {[0, 0.15, 0.35].map((value, index) => (
          <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Zoom ${index + 1}x`} onPress={() => onZoom(value)} style={[styles.zoomChip, Math.abs(zoom - value) < 0.06 && styles.zoomActive]}>
            <Text style={[styles.zoomText, Math.abs(zoom - value) < 0.06 && styles.zoomTextActive]}>{index + 1}x</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" onPress={() => onZoom(Math.min(1, zoom + 0.08))} style={styles.zoomChip}><Ionicons name="add" size={17} color="#fff" /></Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(bottomInset + 14, 20) }]}>
        <View style={styles.modes}>
          <Mode label="PHOTO" active={captureTab === "picture"} onPress={() => onMode("picture")} disabled={recording} />
          <Mode label="VIDEO" active={captureTab === "video"} onPress={() => onMode("video")} disabled={recording} />
        </View>
        <View style={styles.captureRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose photo or video" onPress={onPickMedia} disabled={busy} style={styles.sideAction}>
            <Ionicons name="images-outline" size={25} color="#fff" /><Text style={styles.sideLabel}>Gallery</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={captureTab === "picture" ? "Take photo" : recording ? "Stop recording" : "Start recording"} onPress={captureTab === "picture" ? onPhoto : onVideo} disabled={!camReady || busy} style={styles.shutter}>
            <View style={[styles.shutterRing, recording && styles.shutterRecording]}>
              <View style={[styles.shutterCore, captureTab === "video" && styles.videoCore, recording && styles.stopCore]} />
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Switch camera" onPress={onFlip} disabled={busy} style={styles.sideAction}>
            <Ionicons name="camera-reverse-outline" size={25} color="#fff" /><Text style={styles.sideLabel}>Flip</Text>
          </Pressable>
        </View>
      </View>

      {countdown !== null ? <View pointerEvents="none" style={styles.countdown}><Text style={styles.countdownText}>{countdown}</Text></View> : null}
    </View>
  );
}

function Tool({ icon, label, onPress, active, disabled }: { icon: string; label: string; onPress: () => void; active?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={[styles.tool, active && styles.toolActive, disabled && styles.disabled]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={19} color="#fff" /><Text style={styles.toolLabel}>{label}</Text></Pressable>;
}

function Mode({ label, active, onPress, disabled }: { label: string; active: boolean; onPress: () => void; disabled: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={[styles.mode, active && styles.modeActive]}><Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  top: { position: "absolute", left: 16, right: 16, zIndex: 5, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(12,12,16,0.55)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  status: { height: 34, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "rgba(12,12,16,0.55)", flexDirection: "row", alignItems: "center", gap: 7 },
  statusText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#ff365f" },
  tools: { position: "absolute", left: 14, zIndex: 4, gap: 13 },
  tool: { minWidth: 54, alignItems: "center", gap: 5, opacity: 0.92 }, toolActive: { opacity: 1 }, disabled: { opacity: 0.42 },
  toolLabel: { color: "#fff", fontSize: 10, fontWeight: "700", textShadowColor: "rgba(0,0,0,0.75)", textShadowRadius: 4 },
  zoomRow: { position: "absolute", left: 0, right: 0, zIndex: 4, flexDirection: "row", justifyContent: "center", gap: 8 },
  zoomChip: { minWidth: 38, height: 38, borderRadius: 20, backgroundColor: "rgba(12,12,16,0.56)", alignItems: "center", justifyContent: "center", paddingHorizontal: 9 }, zoomActive: { backgroundColor: "rgba(255,255,255,0.92)" },
  zoomText: { color: "#fff", fontSize: 12, fontWeight: "800" }, zoomTextActive: { color: "#17171d" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 4, paddingTop: 10, backgroundColor: "rgba(8,8,12,0.42)" },
  modes: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20, marginBottom: 14 }, mode: { paddingHorizontal: 12, paddingVertical: 7 }, modeActive: { borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)" },
  modeText: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "800", letterSpacing: 1 }, modeTextActive: { color: "#fff" },
  captureRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-evenly" }, sideAction: { width: 64, alignItems: "center", gap: 4 }, sideLabel: { color: "#fff", fontSize: 10, fontWeight: "700" },
  shutter: { width: 82, height: 82, borderRadius: 41, alignItems: "center", justifyContent: "center" }, shutterRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: "#fff", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.2)" },
  shutterRecording: { borderColor: "#ff365f" }, shutterCore: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" }, videoCore: { backgroundColor: "#ff365f" }, stopCore: { width: 28, height: 28, borderRadius: 7 },
  grid: { ...StyleSheet.absoluteFillObject, zIndex: 2 }, gridV: { position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.4)" }, gridV2: { left: "66.66%" }, gridH: { position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.4)" }, gridH2: { top: "66.66%" },
  countdown: { ...StyleSheet.absoluteFillObject, zIndex: 8, alignItems: "center", justifyContent: "center" }, countdownText: { color: "#fff", fontSize: 96, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 15 },
});

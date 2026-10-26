/**
 * 📁 File: src/components/chat/ChatCameraControls.tsx
 * 🎯 Purpose: Render RomBuzz chat camera controls and camera gestures.
 * Used by: ChatCameraModal.tsx.
 * Includes: Pinch zoom, swipe-to-switch camera, flash, timer, grid,
 * gallery, photo capture and video capture controls.
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  runOnJS,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

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
  cameraDragY: SharedValue<number>;
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
    topInset,
    bottomInset,
    captureTab,
    recording,
    recordLabel,
    flashIcon,
    flashLabel,
    torchOn,
    torchAvailable,
    timerSeconds,
    gridOn,
    zoom,
    cameraDragY,
    camReady,
    busy,
    countdown,
    onClose,
    onFlip,
    onFlash,
    onTorch,
    onTimer,
    onGrid,
    onZoom,
    onPickMedia,
    onMode,
    onPhoto,
    onVideo,
  } = props;

  const currentZoom = useSharedValue(zoom);
  const pinchStartZoom = useSharedValue(zoom);
  const pinchSmoothedZoom = useSharedValue(zoom);
  const onZoomRef = useRef(onZoom);
  const onFlipRef = useRef(onFlip);

  useEffect(() => {
    currentZoom.value = zoom;
  }, [currentZoom, zoom]);

  useEffect(() => {
    onZoomRef.current = onZoom;
    onFlipRef.current = onFlip;
  }, [onFlip, onZoom]);

  const applyZoom = useCallback((value: number) => {
    onZoomRef.current(value);
  }, []);

  const applyFlip = useCallback(() => {
    onFlipRef.current();
  }, []);

  const cameraGestures = useMemo(() => {
    const pinch = Gesture.Pinch()
      .onBegin(() => {
        pinchStartZoom.value = currentZoom.value;
        pinchSmoothedZoom.value = currentZoom.value;
      })
      .onUpdate((event) => {
        const targetZoom = Math.max(
          0,
          Math.min(1, pinchStartZoom.value + (event.scale - 1) * 0.35),
        );
        // Dampen tiny finger tremors while still following the pinch live.
        pinchSmoothedZoom.value +=
          (targetZoom - pinchSmoothedZoom.value) * 0.42;
        runOnJS(applyZoom)(pinchSmoothedZoom.value);
      });

    const swipeDown = Gesture.Pan()
      .maxPointers(1)
      .activeOffsetY(12)
      .failOffsetX([-50, 50])
      .onUpdate((event) => {
        // Move the camera preview with the user's finger, up to 120 px.
        cameraDragY.value = Math.max(0, Math.min(event.translationY, 120));
      })
      .onEnd((event) => {
        if (event.translationY > 80 && !busy) {
          runOnJS(applyFlip)();
        }
        cameraDragY.value = withSpring(0, {
          damping: 20,
          stiffness: 190,
          mass: 0.8,
        });
      })
      .onFinalize(() => {
        cameraDragY.value = withSpring(0, {
          damping: 20,
          stiffness: 190,
          mass: 0.8,
        });
      });

    return Gesture.Simultaneous(pinch, swipeDown);
  }, [
    applyFlip,
    applyZoom,
    busy,
    cameraDragY,
    currentZoom,
    pinchSmoothedZoom,
    pinchStartZoom,
  ]);

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={cameraGestures}>
        <View style={StyleSheet.absoluteFill}>
        {gridOn ? (
          <View pointerEvents="none" style={styles.grid}>
            <View style={styles.gridV} />
            <View style={[styles.gridV, styles.gridV2]} />
            <View style={styles.gridH} />
            <View style={[styles.gridH, styles.gridH2]} />
          </View>
        ) : null}

        {!torchAvailable && torchOn ? (
          <View pointerEvents="none" style={styles.frontScreenLight}>
            <View style={styles.frontScreenWash} />
            <LinearGradient
              colors={["rgba(255,255,255,0.98)", "rgba(255,255,255,0)"]}
              style={[styles.screenLightEdge, styles.screenLightTop]}
            />
            <LinearGradient
              colors={["rgba(255,255,255,0.98)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={[styles.screenLightEdge, styles.screenLightBottom]}
            />
            <LinearGradient
              colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.screenLightEdge, styles.screenLightLeft]}
            />
            <LinearGradient
              colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0)"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={[styles.screenLightEdge, styles.screenLightRight]}
            />
          </View>
        ) : null}

        <View style={[styles.top, { top: Math.max(topInset + 8, 18) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            onPress={onClose}
            style={styles.circle}
          >
            <Ionicons name="close" size={23} color="#fff" />
          </Pressable>

          <View style={styles.status}>
            {recording ? <View style={styles.recDot} /> : null}
            <Text style={styles.statusText}>
              {recording ? recordLabel : "ROMBUZZ CAMERA"}
            </Text>
          </View>

          <View style={styles.circleSpacer} />
        </View>

        <View style={[styles.tools, { top: Math.max(topInset + 76, 92) }]}>
          <Tool icon={flashIcon} label={flashLabel} onPress={onFlash} />
          <Tool
            icon="timer-outline"
            label={timerSeconds ? `${timerSeconds}s` : "Timer"}
            onPress={onTimer}
            active={timerSeconds > 0}
          />
          <Tool
            icon={torchOn ? "sunny" : "sunny-outline"}
            label={torchAvailable ? "Torch" : "Screen light"}
            onPress={onTorch}
            active={torchOn}
          />
          <Tool
            icon="grid-outline"
            label="Grid"
            onPress={onGrid}
            active={gridOn}
          />
        </View>

        <View
          style={[
            styles.bottom,
            { paddingBottom: Math.max(bottomInset + 14, 20) },
          ]}
        >
          <View style={styles.modes}>
            <Mode
              label="PHOTO"
              active={captureTab === "picture"}
              onPress={() => onMode("picture")}
              disabled={recording}
            />
            <Mode
              label="VIDEO"
              active={captureTab === "video"}
              onPress={() => onMode("video")}
              disabled={recording}
            />
          </View>

          <View style={styles.captureRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose photo or video"
              onPress={onPickMedia}
              disabled={busy}
              style={styles.sideAction}
            >
              <Ionicons name="images-outline" size={25} color="#fff" />
              <Text style={styles.sideLabel}>Gallery</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                captureTab === "picture"
                  ? "Take photo"
                  : recording
                    ? "Stop recording"
                    : "Start recording"
              }
              onPress={captureTab === "picture" ? onPhoto : onVideo}
              disabled={!camReady || busy}
              style={styles.shutter}
            >
              <View
                style={[
                  styles.shutterRing,
                  recording && styles.shutterRecording,
                ]}
              >
                <View
                  style={[
                    styles.shutterCore,
                    captureTab === "video" && styles.videoCore,
                    recording && styles.stopCore,
                  ]}
                />
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch camera"
              accessibilityHint="You can also swipe down to switch cameras"
              onPress={onFlip}
              disabled={busy}
              style={styles.sideAction}
            >
              <Ionicons
                name="camera-reverse-outline"
                size={25}
                color="#fff"
              />
              <Text style={styles.sideLabel}>Flip</Text>
            </Pressable>
          </View>
        </View>

        {countdown !== null ? (
          <View pointerEvents="none" style={styles.countdown}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        ) : null}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

function Tool({
  icon,
  label,
  onPress,
  active,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.tool,
        active && styles.toolActive,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={19}
        color="#fff"
      />
      <Text style={styles.toolLabel}>{label}</Text>
    </Pressable>
  );
}

function Mode({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.mode, active && styles.modeActive]}
    >
      <Text style={[styles.modeText, active && styles.modeTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(12,12,16,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  circleSpacer: { width: 44, height: 44 },
  status: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(12,12,16,0.55)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#ff365f" },
  tools: { position: "absolute", left: 14, zIndex: 4, gap: 13 },
  tool: { minWidth: 54, alignItems: "center", gap: 5, opacity: 0.92 },
  toolActive: { opacity: 1 },
  disabled: { opacity: 0.42 },
  toolLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowRadius: 4,
  },
  frontScreenLight: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  frontScreenWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  screenLightEdge: { position: "absolute" },
  screenLightTop: { top: 0, left: 0, right: 0, height: 132 },
  screenLightBottom: { bottom: 0, left: 0, right: 0, height: 132 },
  screenLightLeft: { left: 0, top: 0, bottom: 0, width: 84 },
  screenLightRight: { right: 0, top: 0, bottom: 0, width: 84 },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    paddingTop: 10,
    backgroundColor: "rgba(8,8,12,0.42)",
  },
  modes: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginBottom: 14,
  },
  mode: { paddingHorizontal: 12, paddingVertical: 7 },
  modeActive: { borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)" },
  modeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  modeTextActive: { color: "#fff" },
  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  sideAction: { width: 64, alignItems: "center", gap: 4 },
  sideLabel: { color: "#fff", fontSize: 10, fontWeight: "700" },
  shutter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  shutterRecording: { borderColor: "#ff365f" },
  shutterCore: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" },
  videoCore: { backgroundColor: "#ff365f" },
  stopCore: { width: 28, height: 28, borderRadius: 7 },
  grid: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  gridV: {
    position: "absolute",
    left: "33.33%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  gridV2: { left: "66.66%" },
  gridH: {
    position: "absolute",
    top: "33.33%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  gridH2: { top: "66.66%" },
  countdown: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: {
    color: "#fff",
    fontSize: 96,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 15,
  },
});

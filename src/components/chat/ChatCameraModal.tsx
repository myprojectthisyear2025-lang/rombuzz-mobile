/**
 * ============================================================
 * 📁 File: src/components/chat/ChatCameraModal.tsx
 * 🎯 Purpose: Standalone chat camera (replaces camera inside + modal)
 *
 * Used by:
 *  - app/chat/[peerId].tsx
 *
 * What it does:
 *  - Photo capture (button)
 *  - Video record (button, auto-stops at 60s)
 *  - Preview before sending
 *  - Visibility modes: keep / view once / view twice
 *  - Text overlay
 *  - Draw canvas (no extra deps)
 *  - Video trim (REAL preview trim: start/end + loop segment)
 *
 * Returns:
 *  - onCaptured([{ uri, mediaType, visibility, overlayText, drawing, trim }])
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video, } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
};

type Visibility = "keep" | "once" | "twice";

type DrawPoint = { x: number; y: number };
type Stroke = { id: string; points: DrawPoint[] };

export type ChatCameraCapturedItem = {
  uri: string;
  mediaType: "image" | "video";
  visibility: Visibility;
  overlayText?: string;
  drawing?: {
    strokes: Stroke[];
  };

};

export default function ChatCameraModal({
  visible,
  onClose,
  onCaptured,
}: {
  visible: boolean;
  onClose: () => void;
  onCaptured: (items: ChatCameraCapturedItem[]) => void;
}) {
  const [perm, requestPerm] = useCameraPermissions();
  const camRef = useRef<CameraView | null>(null);

  const [facing, setFacing] = useState<"back" | "front">("back");
  const [busy, setBusy] = useState(false);

 // 🎥 video recording
  const [recording, setRecording] = useState(false);
  const recordingRef = useRef(false);
  const [videoPendingPreview, setVideoPendingPreview] = useState(false);
  const videoPromiseRef = useRef<Promise<any> | null>(null);
  const [recordingReady, setRecordingReady] = useState(false); // 🆕 Track if camera is ready
  const [camReady, setCamReady] = useState(false); // 🆕 Track CameraView readiness
  const startTimeRef = useRef<number | null>(null); // 🆕 Timestamp when recording started

  //photo
  const [cameraMode, setCameraMode] = useState<"picture" | "video">("picture");
// ⏱ recording timer (seconds)
const [recordSecs, setRecordSecs] = useState(0);
const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // preview
  const [preview, setPreview] = useState<{ uri: string; mediaType: "image" | "video" } | null>(
    null
  );

  //gift picker
  const [showGiftPicker, setShowGiftPicker] = useState(false);

  // preview controls
  const [visibility, setVisibility] = useState<Visibility>("keep");
  const cycleVisibility = () => {
  setVisibility((prev) => {
    if (prev === "keep") return "once";
    if (prev === "once") return "twice";
    return "keep";
  });
};

const visibilityLabel = () => {
  if (visibility === "keep") return "Keep in Chat";
  if (visibility === "once") return "View Once";
  return "View Twice";
};

  const [overlayText, setOverlayText] = useState("");
  const [showTextBox, setShowTextBox] = useState(false);

  // draw canvas
  const [drawMode, setDrawMode] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);

  
  const ensurePerm = async () => {
    if (perm?.granted) return true;
    const p = await requestPerm();
    return !!p?.granted;
  };

 const resetAll = () => {
      setCameraMode("picture"); // 🔁 safe reset
      setVideoPendingPreview(false);
    setBusy(false);
    setRecording(false);
    recordingRef.current = false;
    setRecordingReady(false); // 🆕 Reset ready state
    setCamReady(false);
    startTimeRef.current = null;

    setPreview(null);
    setVisibility("keep");
    setOverlayText("");
    setShowTextBox(false);

    setDrawMode(false);
    setStrokes([]);
    activeStrokeRef.current = null;

  };

  const closeAll = () => {
    // safety: stop recording if open is closed
    try {
      if (recordingRef.current) (camRef.current as any)?.stopRecording?.();
    } catch {}
    resetAll();
    onClose();
  };
const snap = async () => {
  const ok = await ensurePerm();
  if (!ok) return;

  setCameraMode("picture"); // 🔒 lock pipeline

  try {
    setBusy(true);
    const photo: any = await camRef.current?.takePictureAsync({
      quality: 0.9,
      skipProcessing: true,
    });

    if (!photo?.uri) throw new Error("No photo URI");
    setPreview({ uri: photo.uri, mediaType: "image" });
  } catch (e: any) {
    Alert.alert("Camera failed", e?.message || "Try again");
  } finally {
    setBusy(false);
  }
};

const startVideo = async () => {
  if (recordingRef.current) return;

  const ok = await ensurePerm();
  if (!ok) return;

  setCameraMode("video");
  recordingRef.current = true;
  setRecording(true);
  startTimeRef.current = Date.now();
  setRecordingReady(false);
  setRecordSecs(0);

  recordTimerRef.current = setInterval(() => {
    setRecordSecs((s) => Math.min(s + 1, 60));
  }, 1000);

  try {
    // Wait for CameraView to report ready (up to ~2s)
    await new Promise<void>((resolve) => {
      if (camReady) return resolve();
      let settled = false;
      const check = setInterval(() => {
        if (camReady && !settled) {
          settled = true;
          clearInterval(check);
          clearTimeout(to);
          resolve();
        }
      }, 100);
      const to = setTimeout(() => {
        if (!settled) {
          settled = true;
          clearInterval(check);
          resolve();
        }
      }, 2000);
    });

    // 🔑 Start recording and store the promise
    const recordPromise = camRef.current?.recordAsync({ maxDuration: 60 });
    if (!recordPromise) {
      throw new Error("Camera not ready");
    }
    videoPromiseRef.current = recordPromise;

    // Small safety delay to ensure native recorder has begun producing data
    await new Promise((r) => setTimeout(r, 700));

    // ✅ Now it's safe to allow stopping
    if (recordingRef.current) {
      setRecordingReady(true);
    }
  } catch (err) {
    console.error("Failed to start recording:", err);
    recordingRef.current = false;
    setRecording(false);
    startTimeRef.current = null;
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    Alert.alert("Camera error", "Could not start recording. Try again.");
  }
};

// optional manual stop (in case user wants earlier stop)
const stopVideo = async () => {
  if (!recordingRef.current) return;
  
  // 🚫 Prevent stopping if recording hasn't actually started yet
  if (!recordingReady) {
    Alert.alert("Please wait", "Camera is starting... Wait a moment before stopping.");
    return;
  }

  // Ensure minimum recording duration to avoid native error
  const minMs = 900; // safe minimum duration
  const started = startTimeRef.current ?? 0;
  const elapsed = Date.now() - started;
  if (elapsed < minMs) {
    await new Promise((r) => setTimeout(r, minMs - elapsed));
  }

  // 🔒 Lock the ref immediately so user can't press stop twice
  recordingRef.current = false;
  setRecording(false);
  setRecordingReady(false);

  // ⏱ Clear the timer immediately
  if (recordTimerRef.current) {
    clearInterval(recordTimerRef.current);
    recordTimerRef.current = null;
  }

  // 🎬 Show loading state while video is being saved
  setBusy(true);

  try {
    // 🛑 Stop the camera recording
    (camRef.current as any)?.stopRecording?.();

    // ⏳ Wait for the video file to be saved
    let vid: any = null;
    const waitForVideoPromise = async () => {
      const maxRetries = 4;
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          const p = videoPromiseRef.current;
          if (!p) throw new Error("no-promise");
          const res = await p;
          return res;
        } catch (e: any) {
          // if native error indicates "stopped before any data" then retry a short time
          const msg = e?.message || "";
          if (msg.includes("stopped before any data" ) || msg.includes("Recording was stopped before any data")) {
            // small backoff and retry
            await new Promise((r) => setTimeout(r, 250));
            attempt++;
            continue;
          }
          // for other errors, bail
          throw e;
        }
      }
      // final attempt: await whatever current promise is
      return await videoPromiseRef.current;
    };

    vid = await waitForVideoPromise();

    if (vid?.uri) {
      // ✅ Video saved successfully, show preview
      setPreview({
        uri: vid.uri,
        mediaType: "video",
      });
    } else {
      // ❌ No video file received
      Alert.alert("Recording failed", "Could not save video. Try again.");
    }
  } catch (err: any) {
    // ❌ Recording failed or was cancelled
    console.error("Video recording error:", err);
    Alert.alert("Recording failed", "Please try recording again.");
  } finally {
    // 🧹 Clean up
    videoPromiseRef.current = null;
    startTimeRef.current = null;
    setBusy(false);
  }
};

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};


  // draw: capture points inside the preview area
  const pan = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !!preview && drawMode,
      onMoveShouldSetPanResponder: () => !!preview && drawMode,
      onPanResponderGrant: (evt) => {
        if (!preview || !drawMode) return;
        const { locationX, locationY } = evt.nativeEvent;

        const st: Stroke = {
          id: `st_${Date.now()}`,
          points: [{ x: locationX, y: locationY }],
        };
        activeStrokeRef.current = st;
        setStrokes((p) => [...p, st]);
      },
      onPanResponderMove: (evt) => {
        if (!preview || !drawMode) return;
        const st = activeStrokeRef.current;
        if (!st) return;

        const { locationX, locationY } = evt.nativeEvent;

        setStrokes((prev) => {
          const next = [...prev];
          const idx = next.findIndex((s) => s.id === st.id);
          if (idx === -1) return prev;

          const cur = next[idx];
          const updated: Stroke = {
            ...cur,
            points: [...cur.points, { x: locationX, y: locationY }],
          };
          next[idx] = updated;
          activeStrokeRef.current = updated;
          return next;
        });
      },
      onPanResponderRelease: () => {
        activeStrokeRef.current = null;
      },
      onPanResponderTerminate: () => {
        activeStrokeRef.current = null;
      },
    });
  }, [preview, drawMode]);


  const send = () => {
    if (!preview?.uri) return;

    const item: ChatCameraCapturedItem = {
      uri: preview.uri,
      mediaType: preview.mediaType,
      visibility,
      overlayText: overlayText?.trim() ? overlayText.trim() : undefined,
      drawing: strokes.length ? { strokes } : undefined,
    };

    onCaptured([item]);
    closeAll();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={closeAll}>
      <View style={styles.wrap}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={closeAll} style={styles.topBtn}>
            <Ionicons name="close" size={22} color={RBZ.white} />
          </Pressable>

          <Text style={styles.title}>
            {!preview ? "Camera" : preview.mediaType === "video" ? "Preview video" : "Preview photo"}
          </Text>

          {!preview ? (
            <Pressable
              onPress={() => {
                if (recordingRef.current) return;
                setFacing((p) => (p === "back" ? "front" : "back"));
              }}
              style={styles.topBtn}
              disabled={recording}
            >
              <Ionicons name="camera-reverse" size={22} color={RBZ.white} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                if (drawMode && strokes.length) setStrokes((p) => p.slice(0, -1));
              }}
              style={styles.topBtn}
            >
              <Ionicons name="arrow-undo" size={20} color={RBZ.white} />
            </Pressable>
          )}
        </View>

        {/* Camera / Preview */}
        <View style={styles.cameraWrap} {...(preview && drawMode ? pan.panHandlers : {})}>
          {!preview ? (
               <CameraView
                ref={camRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                mode={cameraMode}
                onCameraReady={() => setCamReady(true)}
              />
              ) : (
            <View style={StyleSheet.absoluteFill}>
              {preview.mediaType === "video" ? (
              <Video
                    source={{ uri: preview.uri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    isLooping
                    useNativeControls={false}
                  />
                   ) : (
                <Image
                  source={{ uri: preview.uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                  onError={() => {
                    Alert.alert(
                      "Preview failed",
                      "Could not load the captured image preview. Retake and try again."
                    );
                  }}
                />
              )}
        
              {/* Drawing layer */}
              {drawMode && strokes.length ? (
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  {strokes.map((s) =>
                    s.points.map((pt, idx) => (
                      <View
                        key={`${s.id}_${idx}`}
                        style={[
                          styles.dot,
                          {
                            left: pt.x - 3,
                            top: pt.y - 3,
                          },
                        ]}
                      />
                    ))
                  )}
                </View>
              ) : null}

              {/* Overlay text */}
              {overlayText?.trim() ? (
                <View pointerEvents="none" style={styles.overlayTextWrap}>
                  <Text style={styles.overlayText}>{overlayText.trim()}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
{/* Right-side vertical edit tools */}
<View style={styles.rightTools}>
  <Pressable
    onPress={() => setShowTextBox((p) => !p)}
    style={[
      styles.verticalToolBtn,
      showTextBox && { backgroundColor: "rgba(181,23,158,0.35)" },
    ]}
  >
    <Ionicons name="text" size={20} color={RBZ.white} />
    <Text style={styles.verticalToolText}>Text</Text>
  </Pressable>

  <Pressable
    onPress={() => setDrawMode((p) => !p)}
    style={[
      styles.verticalToolBtn,
      drawMode && { backgroundColor: "rgba(216,52,95,0.35)" },
    ]}
  >
    <Ionicons name="brush" size={20} color={RBZ.white} />
    <Text style={styles.verticalToolText}>Draw</Text>
  </Pressable>

  <Pressable
    onPress={() =>
      Alert.alert("Crop", "Crop UI will be wired next (needs your preferred library).")
    }
    style={styles.verticalToolBtn}
  >
    <Ionicons name="crop" size={20} color={RBZ.white} />
    <Text style={styles.verticalToolText}>Crop</Text>
  </Pressable>

  <Pressable
    onPress={() =>
      Alert.alert("Filters", "Filters UI will be wired next (depends on library).")
    }
    style={styles.verticalToolBtn}
  >
    <Ionicons name="color-filter" size={20} color={RBZ.white} />
    <Text style={styles.verticalToolText}>Filters</Text>
  </Pressable>

  <Pressable
    onPress={() => {
      setPreview(null);
      setStrokes([]);
      setOverlayText("");
      setShowTextBox(false);
      setDrawMode(false);
    
    }}
    style={[styles.verticalToolBtn, { backgroundColor: RBZ.c1 }]}
  >
    <Ionicons name="refresh" size={20} color={RBZ.white} />
    <Text style={styles.verticalToolText}>Retake</Text>
  </Pressable>
</View>

        {/* Bottom controls */}
        {!preview ? (
          <View style={styles.bottomBar}>
        <Text style={styles.hint}>
{recording 
  ? `Recording ${formatTime(recordSecs)}${!recordingReady ? " (starting...)" : ""}` 
  : "Choose capture mode"}
            </Text>

            <View style={styles.captureRow}>
              {/* 📸 PHOTO */}
              <Pressable
                onPress={snap}
                disabled={busy || recording}
                style={[
                  styles.captureBtn,
                  (busy || recording) && { opacity: 0.6 },
                ]}
              >
                <Ionicons name="camera" size={18} color={RBZ.white} />
                <Text style={styles.captureText}>Photo</Text>
              </Pressable>

              {/* 🎥 VIDEO */}
              <Pressable
                onPress={recording ? stopVideo : startVideo}
                disabled={busy}
                style={[
                  styles.captureBtn,
                  recording ? { backgroundColor: RBZ.c1, borderColor: "rgba(255,255,255,0.18)" } : { backgroundColor: RBZ.c4 },
                  busy && { opacity: 0.6 },
                ]}
              >
          <Ionicons name={recording ? "stop" : "videocam"} size={18} color={RBZ.white} />
                <Text style={styles.captureText}>
                  {recording 
                    ? (recordingReady ? "Stop" : "Starting...") 
                    : "Video (60s)"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.previewBar}>
      

            {/* Text input */}
            {showTextBox ? (
              <View style={styles.textBox}>
                <TextInput
                  value={overlayText}
                  onChangeText={setOverlayText}
                  placeholder="Type text…"
                  placeholderTextColor="rgba(255,255,255,0.65)"
                  style={styles.textInput}
                />
                <Pressable onPress={() => setShowTextBox(false)} style={styles.smallBtn}>
                  <Ionicons name="checkmark" size={18} color={RBZ.white} />
                </Pressable>
              </View>
            ) : null}

         {/* Decision actions (in gap above Send) */}
<View style={styles.decisionRow}>
  <Pressable
    style={styles.decisionBtn}
    onPress={() => setShowGiftPicker(true)}
  >
    <Ionicons name="gift" size={18} color={RBZ.white} />
    <Text style={styles.decisionText}>Gift</Text>
  </Pressable>

  <Pressable
    style={styles.decisionBtn}
    onPress={cycleVisibility}
  >
    <Ionicons name="eye" size={18} color={RBZ.white} />
    <Text style={styles.decisionText}>{visibilityLabel()}</Text>
  </Pressable>
</View>

{/* Send */}
<Pressable onPress={send} style={styles.sendBtn}>
  <Ionicons name="send" size={18} color={RBZ.white} />
  <Text style={styles.sendText}>Send</Text>
</Pressable>

          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#000" },

  topBar: {
    height: 58,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  title: { color: RBZ.white, fontWeight: "900" },

  cameraWrap: { flex: 1 },

  bottomBar: {
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    gap: 12,
    paddingHorizontal: 12,
  },
  hint: { color: "rgba(255,255,255,0.82)", fontWeight: "800" },

  captureRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },

  captureBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  captureText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 13,
  },

  // preview UI
  previewBar: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pillText: { color: RBZ.white, fontWeight: "900", fontSize: 12 },

  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  toolText: { color: RBZ.white, fontWeight: "900", fontSize: 12 },

  retakeBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  retakeText: { color: RBZ.white, fontWeight: "900", fontSize: 12 },

  textBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    color: RBZ.white,
    fontWeight: "800",
  },
  smallBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c4,
  },

  trimBox: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    gap: 10,
  },
  trimTitle: { color: RBZ.white, fontWeight: "900" },
  trimRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trimBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 16,
    backgroundColor: RBZ.c2,
  },
  trimBtnText: { color: RBZ.white, fontWeight: "900", fontSize: 12 },
  trimMeta: { color: "rgba(255,255,255,0.85)", fontWeight: "900", fontSize: 12 },
  trimHint: { color: "rgba(255,255,255,0.75)", fontWeight: "700", fontSize: 12 },

  sendBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  sendText: { color: RBZ.white, fontWeight: "900" },

  overlayTextWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 18,
    alignItems: "center",
  },
  overlayText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 20,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
previewActionButton: {
  backgroundColor: "#1c1c1e",
  paddingVertical: 10,
  marginHorizontal: 24,
  borderRadius: 18,
  marginBottom: 8,
  alignItems: "center",
},

previewActionText: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "600",
},

rightTools: {
  position: "absolute",
  right: 12,
  top: "22%",
  gap: 14,
  alignItems: "center",
},
verticalToolBtn: {
  width: 58,
  height: 58,
  borderRadius: 18,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0,0,0,0.55)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.18)",
},
verticalToolText: {
  marginTop: 4,
  color: RBZ.white,
  fontSize: 11,
  fontWeight: "900",
},

leftActionsRow: {
  flexDirection: "row",
  gap: 10,
  alignSelf: "flex-start",
},
rightActionsRow: {
  flexDirection: "row",
  gap: 10,
  alignSelf: "flex-end",
},
smallToolBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 12,
  height: 38,
  borderRadius: 16,
  backgroundColor: "rgba(255,255,255,0.10)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.14)",
},
bottomOverlayActions: {
  position: "absolute",
  left: 12,
  right: 12,
  bottom: 82, // 👈 sits just above Send button
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

bottomOverlayBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  paddingHorizontal: 14,
  height: 40,
  borderRadius: 18,
  backgroundColor: "rgba(0,0,0,0.6)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.18)",
},

bottomOverlayText: {
  color: RBZ.white,
  fontWeight: "900",
  fontSize: 12,
},

decisionRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
},

decisionBtn: {
  flex: 1,
  height: 42,
  borderRadius: 18,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  backgroundColor: "rgba(255,255,255,0.12)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.18)",
},

decisionText: {
  color: RBZ.white,
  fontWeight: "900",
  fontSize: 12,
},

  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
    opacity: 0.95,
  },
});
/**
 * ============================================================
 * 📁 File: src/components/chat/ChatCameraModal.tsx
 * 🎯 Purpose: Modern chat camera modal for photo + video
 *
 * Features:
 *  - Photo capture
 *  - Video recording up to 60 seconds
 *  - Stop video anytime after recording starts
 *  - Reliable preview for both photo and video
 *  - Front/back camera switch
 *  - Flash mode: off / on / auto / screen
 *  - Torch toggle (back camera)
 *  - Zoom controls
 *  - View once / view twice / keep in chat
 *  - Text overlay + simple drawing overlay
 *  - Retake and send actions
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
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
  glass: "rgba(0,0,0,0.34)",
  glassSoft: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.16)",
};

type Visibility = "keep" | "once" | "twice";
type MediaType = "image" | "video";
type FlashMode = "off" | "on" | "auto";
type CaptureTab = "picture" | "video";

type DrawPoint = { x: number; y: number };
type Stroke = { id: string; points: DrawPoint[] };

type PreviewState = {
  uri: string;
  mediaType: MediaType;
} | null;

export type ChatCameraCapturedItem = {
  uri: string;
  mediaType: MediaType;
  visibility: Visibility;
  previewMuted?: boolean;
  overlayText?: string;
  drawing?: {
    strokes: Stroke[];
  };
};
const MAX_VIDEO_SECONDS = 60;
const MIN_RECORD_MS = 350;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ChatCameraModal({
  visible,
  onClose,
  onCaptured,
}: {
  visible: boolean;
  onClose: () => void;
  onCaptured: (items: ChatCameraCapturedItem[]) => void | Promise<void>;
}) {
  const [cameraPerm, requestCameraPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const camRef = useRef<CameraView | null>(null);
  const mountedRef = useRef(true);
  const recordPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const recordStartedAtRef = useRef<number | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRequestedRef = useRef(false);
  const stoppingRef = useRef(false);

    const [camReady, setCamReady] = useState(false);
  const [active, setActive] = useState(true);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [captureTab, setCaptureTab] = useState<CaptureTab>("picture");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [mirrorFront, setMirrorFront] = useState(true);

  const [takingPhoto, setTakingPhoto] = useState(false);
  const [startingVideo, setStartingVideo] = useState(false);
    const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [sending, setSending] = useState(false);

  const [preview, setPreview] = useState<PreviewState>(null);
  const [previewMuted, setPreviewMuted] = useState(false);
  const [visibilityMode, setVisibilityMode] = useState<Visibility>("keep");
  const [showTextBox, setShowTextBox] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [drawMode, setDrawMode] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearRecordTimer();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      hardReset();
      setActive(false);
      return;
    }
    setActive(true);
  }, [visible]);

  const clearRecordTimer = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const startRecordTimer = () => {
    clearRecordTimer();
    recordTimerRef.current = setInterval(() => {
      setRecordSecs((prev) => {
        if (prev >= MAX_VIDEO_SECONDS) return MAX_VIDEO_SECONDS;
        return prev + 1;
      });
    }, 1000);
  };

  const ensureCameraPermission = async () => {
    if (cameraPerm?.granted) return true;
    const next = await requestCameraPerm();
    return !!next?.granted;
  };

  const ensureVideoPermissions = async () => {
    const camOK = cameraPerm?.granted ? true : !!(await requestCameraPerm())?.granted;
    if (!camOK) {
      Alert.alert("Camera permission needed", "Please allow camera access first.");
      return false;
    }

    const micOK = micPerm?.granted ? true : !!(await requestMicPerm())?.granted;
    if (!micOK) {
      Alert.alert(
        "Microphone permission needed",
        "Please allow microphone access to record videos with sound."
      );
      return false;
    }

    return true;
  };

  const resetEditor = () => {
    setVisibilityMode("keep");
    setPreviewMuted(false);
    setShowTextBox(false);
    setOverlayText("");
    setDrawMode(false);
    setStrokes([]);
    activeStrokeRef.current = null;
  };
  const resetRecording = () => {
    clearRecordTimer();
    setStartingVideo(false);
    setRecording(false);
    setRecordSecs(0);
    recordPromiseRef.current = null;
    recordStartedAtRef.current = null;
    stopRequestedRef.current = false;
    stoppingRef.current = false;
  };

  const hardReset = () => {
    resetRecording();
    resetEditor();
    setPreview(null);
    setTakingPhoto(false);
    setSending(false);
    setCamReady(false);
    setTorchOn(false);
    setZoom(0);
    setCaptureTab("picture");
  };

  const closeModal = async () => {
    if (recording) {
      try {
        await stopVideo(true);
      } catch {}
    }
    hardReset();
    onClose();
  };

  const cycleVisibility = () => {
    setVisibilityMode((prev) => {
      if (prev === "keep") return "once";
      if (prev === "once") return "twice";
      return "keep";
    });
  };

  const visibilityLabel =
    visibilityMode === "keep"
      ? "Keep in chat"
      : visibilityMode === "once"
      ? "View once"
      : "View twice";

  const cycleFlash = () => {
    setFlash((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
  };

  const flashIcon =
    flash === "off"
      ? "flash-off"
      : flash === "auto"
      ? "flash-outline"
      : "flash";

  const flashLabel =
    flash === "off" ? "Off" : flash === "auto" ? "Auto" : "On";
  const setZoomStep = (next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    setZoom(clamped);
  };

  const toggleFacing = () => {
    if (recording || takingPhoto || startingVideo || sending) return;
    setFacing((prev) => (prev === "back" ? "front" : "back"));
    setTorchOn(false);
  };

  const takePhoto = async () => {
    const ok = await ensureCameraPermission();
    if (!ok) {
      Alert.alert("Camera permission needed", "Please allow camera access first.");
      return;
    }

    if (!camReady || takingPhoto || startingVideo || recording || sending) return;

    try {
      setTakingPhoto(true);
      const result: any = await camRef.current?.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
      });

      if (!result?.uri) {
        throw new Error("No photo URI returned from camera.");
      }

      if (!mountedRef.current) return;
      resetEditor();
      setPreview({ uri: result.uri, mediaType: "image" });
    } catch (e: any) {
      Alert.alert("Photo failed", e?.message || "Could not take photo.");
    } finally {
      if (mountedRef.current) setTakingPhoto(false);
    }
  };

  const startVideo = async () => {
    const ok = await ensureVideoPermissions();
    if (!ok) return;

    if (!camReady || takingPhoto || startingVideo || recording || sending) return;

    try {
      setCaptureTab("video");
      setStartingVideo(true);
      setPreview(null);
      resetEditor();
      setRecordSecs(0);
      stopRequestedRef.current = false;
      stoppingRef.current = false;

      await sleep(120);

      const promise = camRef.current?.recordAsync({
        maxDuration: MAX_VIDEO_SECONDS,
      });

      if (!promise) {
        throw new Error("Could not start recording.");
      }

      recordPromiseRef.current = promise;
      recordStartedAtRef.current = Date.now();
      setRecording(true);
      setStartingVideo(false);
      startRecordTimer();

      const result = await promise;

      if (!mountedRef.current) return;

      const uri = result?.uri;
      resetRecording();

      if (!uri) {
        Alert.alert("Recording failed", "No video file was returned from the camera.");
        return;
      }

      resetEditor();
      setPreview({ uri, mediaType: "video" });
    } catch (e: any) {
      if (!mountedRef.current) return;

      const message = String(e?.message || "");
      const stopLikeError =
        message.includes("stop") ||
        message.includes("Session") ||
        message.includes("cancel") ||
        message.includes("interrupted");

      resetRecording();

      if (!stopLikeError) {
        Alert.alert("Recording failed", message || "Could not record video.");
      }
    } finally {
      if (mountedRef.current) setStartingVideo(false);
    }
  };

  const stopVideo = async (silent = false) => {
    if (!recording) return;
    if (stoppingRef.current) return;

    try {
      stoppingRef.current = true;

      const startedAt = recordStartedAtRef.current ?? Date.now();
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_RECORD_MS) {
        await sleep(MIN_RECORD_MS - elapsed);
      }

      stopRequestedRef.current = true;
      camRef.current?.stopRecording();
    } catch (e: any) {
      stoppingRef.current = false;
      if (!silent) {
        Alert.alert("Stop failed", e?.message || "Could not stop recording cleanly.");
      }
    }
  };

  const retake = () => {
    setPreview(null);
    resetEditor();
    setSending(false);
    setCaptureTab("picture");
  };

  const send = async () => {
    if (!preview?.uri || sending) return;

    const item: ChatCameraCapturedItem = {
      uri: preview.uri,
      mediaType: preview.mediaType,
      visibility: visibilityMode,
      overlayText: overlayText.trim() ? overlayText.trim() : undefined,
      drawing: strokes.length ? { strokes } : undefined,
    };

    try {
      setSending(true);
      await Promise.resolve(onCaptured([item]));
      hardReset();
      onClose();
    } catch (e: any) {
      setSending(false);
      Alert.alert("Camera", e?.message || "Failed to send media.");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!preview && drawMode,
        onMoveShouldSetPanResponder: () => !!preview && drawMode,
        onPanResponderGrant: (evt) => {
          if (!preview || !drawMode) return;
          const { locationX, locationY } = evt.nativeEvent;
          const stroke: Stroke = {
            id: `stroke_${Date.now()}`,
            points: [{ x: locationX, y: locationY }],
          };
          activeStrokeRef.current = stroke;
          setStrokes((prev) => [...prev, stroke]);
        },
        onPanResponderMove: (evt) => {
          if (!preview || !drawMode) return;
          const current = activeStrokeRef.current;
          if (!current) return;
          const { locationX, locationY } = evt.nativeEvent;

          setStrokes((prev) => {
            const next = [...prev];
            const index = next.findIndex((s) => s.id === current.id);
            if (index === -1) return prev;
            const updated: Stroke = {
              ...next[index],
              points: [...next[index].points, { x: locationX, y: locationY }],
            };
            next[index] = updated;
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
      }),
    [preview, drawMode]
  );

  const noPreview = !preview;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={closeModal}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.root}>
          <View style={styles.previewShell} {...(preview && drawMode ? panResponder.panHandlers : {})}>
            {noPreview ? (
              <CameraView
                ref={camRef}
                style={StyleSheet.absoluteFill}
                active={active}
                facing={facing}
                flash={flash}
                enableTorch={facing === "back" ? torchOn : false}
                zoom={zoom}
                mirror={facing === "front" ? mirrorFront : false}
                autofocus="on"
                videoQuality="720p"
                mode={captureTab}
                animateShutter
                onCameraReady={() => setCamReady(true)}
              />
                    ) : preview.mediaType === "video" ? (
              <Video
                source={{ uri: preview.uri }}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted={previewMuted}
                useNativeControls={false}
              />
            ) : (
              <Image source={{ uri: preview.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}

            {preview && strokes.length ? (
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {strokes.map((stroke) =>
                  stroke.points.map((pt, idx) => (
                    <View
                      key={`${stroke.id}_${idx}`}
                      style={[styles.dot, { left: pt.x - 3, top: pt.y - 3 }]}
                    />
                  ))
                )}
              </View>
            ) : null}

            {preview && overlayText.trim() ? (
              <View pointerEvents="none" style={styles.overlayTextWrap}>
                <Text style={styles.overlayText}>{overlayText.trim()}</Text>
              </View>
            ) : null}

            <View style={styles.topBar}>
              <Pressable onPress={closeModal} style={styles.glassBtn}>
                <Ionicons name="close" size={22} color={RBZ.white} />
              </Pressable>

              <View style={styles.topPills}>
                {recording ? (
                  <View style={[styles.pill, styles.livePill]}>
                    <View style={styles.liveDot} />
                    <Text style={styles.pillText}>REC {formatTime(recordSecs)}</Text>
                  </View>
                ) : preview ? (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      {preview.mediaType === "video" ? "Video preview" : "Photo preview"}
                    </Text>
                  </View>
                  ) : (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{captureTab === "video" ? "Video" : "Photo"}</Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={toggleFacing}
                style={styles.glassBtn}
                disabled={recording || takingPhoto || startingVideo || sending}
              >
                <Ionicons name="camera-reverse" size={21} color={RBZ.white} />
              </Pressable>
            </View>

            {noPreview ? (
              <>
                <View style={styles.leftTools}>
                  <Pressable onPress={cycleFlash} style={styles.toolBtn}>
                    <Ionicons name={flashIcon as any} size={20} color={RBZ.white} />
                    <Text style={styles.toolText}>{flashLabel}</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => facing === "back" && setTorchOn((prev) => !prev)}
                    style={[styles.toolBtn, facing !== "back" && styles.toolDisabled]}
                    disabled={facing !== "back"}
                  >
                    <Ionicons name={torchOn ? "sunny" : "sunny-outline"} size={20} color={RBZ.white} />
                    <Text style={styles.toolText}>{torchOn ? "Torch" : "Torch"}</Text>
                  </Pressable>

                </View>

                <View style={styles.zoomRailWrap}>
                  <Pressable onPress={() => setZoomStep(0)} style={styles.zoomChip}>
                    <Text style={styles.zoomChipText}>1x</Text>
                  </Pressable>
                  <Pressable onPress={() => setZoomStep(0.15)} style={styles.zoomChip}>
                    <Text style={styles.zoomChipText}>2x</Text>
                  </Pressable>
                  <Pressable onPress={() => setZoomStep(0.35)} style={styles.zoomChip}>
                    <Text style={styles.zoomChipText}>3x</Text>
                  </Pressable>
                  <Pressable onPress={() => setZoomStep(Math.max(0, zoom - 0.08))} style={styles.zoomChip}>
                    <Ionicons name="remove" size={16} color={RBZ.white} />
                  </Pressable>
                  <Pressable onPress={() => setZoomStep(Math.min(1, zoom + 0.08))} style={styles.zoomChip}>
                    <Ionicons name="add" size={16} color={RBZ.white} />
                  </Pressable>
                </View>

                <View style={styles.bottomPanel}>
                      <View style={styles.modeTabs}>
                    <Pressable
                      onPress={() => !recording && setCaptureTab("picture")}
                      style={[styles.modeTab, captureTab === "picture" && styles.modeTabActive]}
                    >
                      <Ionicons name="camera" size={16} color={RBZ.white} />
                      <Text style={styles.modeTabText}>Photo</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => !recording && setCaptureTab("video")}
                      style={[styles.modeTab, captureTab === "video" && styles.modeTabActive]}
                    >
                      <Ionicons name="videocam" size={16} color={RBZ.white} />
                      <Text style={styles.modeTabText}>Video</Text>
                    </Pressable>
                  </View>

                  <View style={styles.captureRow}>
                    <View style={styles.captureSideSpacer} />

                    {captureTab === "picture" ? (
                      <Pressable
                        onPress={takePhoto}
                        disabled={!camReady || takingPhoto || startingVideo || recording || sending}
                        style={styles.captureMainBtn}
                      >
                        <View style={styles.captureOuterRing}>
                          <View style={styles.captureInnerPhoto} />
                        </View>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={recording ? () => stopVideo(false) : startVideo}
                        disabled={!camReady || takingPhoto || startingVideo || sending}
                        style={styles.captureMainBtn}
                      >
                        <View style={[styles.captureOuterRing, recording && styles.captureOuterRecording]}>
                          <View style={recording ? styles.captureInnerStop : styles.captureInnerVideo} />
                        </View>
                      </Pressable>
                    )}

                    <View style={styles.captureSideSpacer}>
                      <Text style={styles.captureHint}>
                        {takingPhoto
                          ? "Capturing..."
                          : startingVideo
                          ? "Starting..."
                          : recording
                          ? "Max 60sec"
                          : captureTab === "video"
                          }
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                          <View style={styles.editorToolsRight}>
                  <Pressable
                    onPress={() => setShowTextBox((prev) => !prev)}
                    style={[styles.toolBtn, showTextBox && styles.toolBtnActive]}
                  >
                    <Ionicons name="text" size={20} color={RBZ.white} />
                    <Text style={styles.toolText}>Text</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setDrawMode((prev) => !prev)}
                    style={[styles.toolBtn, drawMode && styles.toolBtnActive]}
                  >
                    <Ionicons name="brush" size={20} color={RBZ.white} />
                    <Text style={styles.toolText}>Draw</Text>
                  </Pressable>

                  <Pressable onPress={() => setStrokes((prev) => prev.slice(0, -1))} style={styles.toolBtn}>
                    <Ionicons name="arrow-undo" size={20} color={RBZ.white} />
                    <Text style={styles.toolText}>Undo</Text>
                  </Pressable>

                  {preview?.mediaType === "video" ? (
                    <Pressable
                      onPress={() => setPreviewMuted((prev) => !prev)}
                      style={[styles.toolBtn, styles.retakeBtn]}
                    >
                      <Ionicons
                        name={previewMuted ? "volume-mute" : "volume-high"}
                        size={20}
                        color={RBZ.white}
                      />
                      <Text style={styles.toolText}>{previewMuted ? "Muted" : "Sound"}</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={retake} style={[styles.toolBtn, styles.retakeBtn]}>
                      <Ionicons name="refresh" size={20} color={RBZ.white} />
                      <Text style={styles.toolText}>Retake</Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.previewBottom}>
                  {showTextBox ? (
                    <View style={styles.textEditorWrap}>
                      <TextInput
                        value={overlayText}
                        onChangeText={setOverlayText}
                        placeholder="Add text..."
                        placeholderTextColor="rgba(255,255,255,0.65)"
                        style={styles.textEditorInput}
                      />
                      <Pressable onPress={() => setShowTextBox(false)} style={styles.smallActionBtn}>
                        <Ionicons name="checkmark" size={18} color={RBZ.white} />
                      </Pressable>
                    </View>
                  ) : null}

                  <View style={styles.previewActionRow}>
                    <Pressable onPress={cycleVisibility} style={styles.previewChipWide}>
                      <Ionicons name="eye" size={17} color={RBZ.white} />
                      <Text style={styles.previewChipText}>{visibilityLabel}</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => Alert.alert("Gift", "Gift flow is not wired in this file yet.")}
                      style={styles.previewChip}
                    >
                      <Ionicons name="gift" size={17} color={RBZ.white} />
                      <Text style={styles.previewChipText}>Gift</Text>
                    </Pressable>
                  </View>

                  <View style={styles.sendRow}>
                    <Pressable onPress={retake} style={styles.secondaryPreviewBtn}>
                      <Ionicons name="refresh" size={18} color={RBZ.white} />
                      <Text style={styles.secondaryPreviewText}>Retake</Text>
                    </Pressable>

                    <Pressable onPress={send} disabled={sending} style={[styles.sendBtn, sending && styles.toolDisabled]}>
                      <Ionicons name="send" size={18} color={RBZ.white} />
                      <Text style={styles.sendBtnText}>{sending ? "Sending..." : "Send"}</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  root: { flex: 1, backgroundColor: "#000" },
  previewShell: {
    flex: 1,
    backgroundColor: "#000",
  },

  topBar: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 40,
  },
  topPills: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  pill: {
    minHeight: 34,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: RBZ.border,
    alignItems: "center",
    justifyContent: "center",
  },
  livePill: {
    flexDirection: "row",
    gap: 8,
  },
  pillText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff3b30",
    marginTop: 3,
  },

  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: RBZ.glass,
    borderWidth: 1,
    borderColor: RBZ.border,
    alignItems: "center",
    justifyContent: "center",
  },

  leftTools: {
    position: "absolute",
    top: 86,
    left: 12,
    gap: 10,
    zIndex: 30,
  },
  editorToolsRight: {
    position: "absolute",
    top: 90,
    right: 12,
    gap: 10,
    zIndex: 30,
  },
  toolBtn: {
    width: 64,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: RBZ.glass,
    borderWidth: 1,
    borderColor: RBZ.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  toolBtnActive: {
    backgroundColor: "rgba(181,23,158,0.38)",
  },
  retakeBtn: {
    backgroundColor: "rgba(177,18,60,0.55)",
  },
  toolText: {
    marginTop: 4,
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 11,
  },
  toolDisabled: {
    opacity: 0.55,
  },

  zoomRailWrap: {
    position: "absolute",
    bottom: 182,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    zIndex: 25,
  },
  zoomChip: {
    minWidth: 46,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: RBZ.border,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomChipText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 12,
  },

  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 12,
    backgroundColor: "transparent",
    zIndex: 25,
  },
  modeTabs: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  modeTab: {
    minWidth: 112,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modeTabActive: {
    backgroundColor: "rgba(181,23,158,0.85)",
  },
  modeTabText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 13,
  },

  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  captureSideSpacer: {
    width: 86,
    alignItems: "center",
    justifyContent: "center",
  },
  captureHint: {
    color: "rgba(255,255,255,0.86)",
    fontWeight: "800",
    fontSize: 11,
    textAlign: "center",
  },
  captureMainBtn: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  captureOuterRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  captureOuterRecording: {
    borderColor: "#ff453a",
    backgroundColor: "rgba(255,69,58,0.12)",
  },
  captureInnerPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: RBZ.white,
  },
  captureInnerVideo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ff3b30",
  },
  captureInnerStop: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#ff3b30",
  },

  previewBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: "rgba(0,0,0,0.42)",
    zIndex: 28,
    gap: 12,
  },
  textEditorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  textEditorInput: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    paddingHorizontal: 14,
    color: RBZ.white,
    backgroundColor: "rgba(255,255,255,0.11)",
    borderWidth: 1,
    borderColor: RBZ.border,
    fontWeight: "800",
  },
  smallActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: RBZ.c4,
    alignItems: "center",
    justifyContent: "center",
  },
  previewActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  previewChipWide: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.11)",
    borderWidth: 1,
    borderColor: RBZ.border,
  },
  previewChip: {
    width: 110,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.11)",
    borderWidth: 1,
    borderColor: RBZ.border,
  },
  previewChipText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 12,
  },
  sendRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryPreviewBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.11)",
    borderWidth: 1,
    borderColor: RBZ.border,
  },
  secondaryPreviewText: {
    color: RBZ.white,
    fontWeight: "900",
  },
  sendBtn: {
    flex: 1.2,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: RBZ.c2,
  },
  sendBtnText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 14,
  },

  overlayTextWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 84,
    alignItems: "center",
    zIndex: 15,
  },
  overlayText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 22,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: RBZ.white,
  },
});

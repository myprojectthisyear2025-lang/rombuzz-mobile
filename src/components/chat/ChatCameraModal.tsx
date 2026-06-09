/**
 * ============================================================
 * 📁 File: src/components/chat/ChatCameraModal.tsx
 * 🎯 Purpose: Modern chat camera modal for photo + video
 *
 * Owns only:
 *  - Camera permissions
 *  - Live camera UI
 *  - Photo capture
 *  - Video recording up to 60 seconds
 *  - Retake / close camera flow
 *
 * After capture:
 *  - Reuses ChatUploadPreview.tsx
 *  - Does NOT own send-preview UI anymore
 *  - Does NOT upload
 *  - Does NOT touch sockets
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatUploadPreview, {
  type ChatUploadPreviewSendPayload,
  type PickedChatMedia,
} from "@/src/components/chat/ChatUploadPreview";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  glass: "rgba(0,0,0,0.38)",
  glassSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
};

type Visibility = "keep" | "once" | "twice";
type MediaType = "image" | "video";
type FlashMode = "off" | "on" | "auto";
type CaptureTab = "picture" | "video";

export type ChatCameraCapturedItem = {
  uri: string;
  mediaType: MediaType;
  visibility: Visibility;
  previewMuted?: boolean;
  overlayText?: string;
  duration?: number;
  gift?: {
    locked: boolean;
    priceBC?: number;
    amount?: number;
    currency?: "BC";
  };
};

const MAX_VIDEO_SECONDS = 60;
const MIN_RECORD_MS = 350;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatRecordTime(secs: number) {
  const safe = Math.max(0, Math.floor(Number(secs || 0)));
  const mins = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${mins}:${String(rest).padStart(2, "0")}`;
}

export default function ChatCameraModal({
  visible,
  onClose,
  onCaptured,
}: {
  visible: boolean;
  onClose: () => void;
  onCaptured: (items: ChatCameraCapturedItem[]) => void | Promise<void>;
}) {
  const insets = useSafeAreaInsets();

  const [cameraPerm, requestCameraPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();

  const camRef = useRef<CameraView | null>(null);
  const mountedRef = useRef(true);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartedAtRef = useRef<number | null>(null);
  const stoppingRef = useRef(false);

  const [active, setActive] = useState(true);
  const [camReady, setCamReady] = useState(false);

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

  const [preview, setPreview] = useState<PickedChatMedia | null>(null);

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

  const resetRecording = () => {
    clearRecordTimer();
    setStartingVideo(false);
    setRecording(false);
    setRecordSecs(0);
    recordStartedAtRef.current = null;
    stoppingRef.current = false;
  };

  const hardReset = () => {
    resetRecording();
    setPreview(null);
    setTakingPhoto(false);
    setSending(false);
    setCamReady(false);
    setTorchOn(false);
    setZoom(0);
    setCaptureTab("picture");
  };

  const ensureCameraPermission = async () => {
    if (cameraPerm?.granted) return true;

    const next = await requestCameraPerm();
    return !!next?.granted;
  };

  const ensureVideoPermissions = async () => {
    const camOK = cameraPerm?.granted
      ? true
      : !!(await requestCameraPerm())?.granted;

    if (!camOK) {
      Alert.alert("Camera permission needed", "Please allow camera access first.");
      return false;
    }

    const micOK = micPerm?.granted
      ? true
      : !!(await requestMicPerm())?.granted;

    if (!micOK) {
      Alert.alert(
        "Microphone permission needed",
        "Please allow microphone access to record videos with sound."
      );
      return false;
    }

    return true;
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

  const retake = () => {
    setPreview(null);
    setSending(false);
    setCaptureTab("picture");
  };

  const toggleFacing = () => {
    if (recording || takingPhoto || startingVideo || sending) return;

    setFacing((prev) => (prev === "back" ? "front" : "back"));
    setTorchOn(false);
  };

  const cycleFlash = () => {
    setFlash((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
  };

  const flashIcon =
    flash === "off" ? "flash-off" : flash === "auto" ? "flash-outline" : "flash";

  const flashLabel = flash === "off" ? "Off" : flash === "auto" ? "Auto" : "On";

  const setZoomStep = (next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    setZoom(clamped);
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

      setPreview({
        uri: String(result.uri),
        mediaType: "image",
        width: result.width,
        height: result.height,
      });
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
      setRecordSecs(0);
      stoppingRef.current = false;

      await sleep(120);

      const startedAt = Date.now();
      recordStartedAtRef.current = startedAt;

      const promise = camRef.current?.recordAsync({
        maxDuration: MAX_VIDEO_SECONDS,
      });

      if (!promise) {
        throw new Error("Could not start recording.");
      }

      setRecording(true);
      setStartingVideo(false);
      startRecordTimer();

      const result = await promise;

      if (!mountedRef.current) return;

      const uri = result?.uri;
      const elapsedMs = Math.max(0, Date.now() - startedAt);

      resetRecording();

      if (!uri) {
        Alert.alert("Recording failed", "No video file was returned from the camera.");
        return;
      }

      setPreview({
        uri: String(uri),
        mediaType: "video",
        duration: elapsedMs,
      });
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

      camRef.current?.stopRecording();
    } catch (e: any) {
      stoppingRef.current = false;

      if (!silent) {
        Alert.alert("Stop failed", e?.message || "Could not stop recording cleanly.");
      }
    }
  };

  const sendPreview = async (payload: ChatUploadPreviewSendPayload) => {
    if (!payload?.localUri || sending) return;

    const visibility = payload?.ephemeral?.mode || "keep";

    const item: ChatCameraCapturedItem = {
      uri: payload.localUri,
      mediaType: payload.mediaType,
      visibility,
      previewMuted: payload.mediaType === "video" ? !!payload.previewMuted : false,
      overlayText: payload.overlayText || "",
      duration: payload.duration,
      gift:
        payload?.gift?.locked && Number(payload?.gift?.priceBC || payload?.gift?.amount || 0) > 0
          ? {
              locked: true,
              priceBC: Number(payload.gift.priceBC || payload.gift.amount || 0),
              amount: Number(payload.gift.priceBC || payload.gift.amount || 0),
              currency: "BC",
            }
          : undefined,
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

  const captureHint = takingPhoto
    ? "Capturing..."
    : startingVideo
    ? "Starting..."
    : recording
    ? "Tap stop"
    : captureTab === "video"
    ? "Hold steady"
    : "Tap shutter";

  return (
    <>
      <Modal visible={visible && !preview} animationType="slide" onRequestClose={closeModal}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.root}>
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

                    <View
              style={[
                styles.topBar,
                {
                  top: Math.max(insets.top + 8, Platform.OS === "ios" ? 18 : 16),
                },
              ]}
            >
              <Pressable onPress={closeModal} style={styles.glassBtn}>
                <Ionicons name="close" size={21} color={RBZ.white} />
              </Pressable>

              <View style={styles.topCenter}>
                {recording ? (
                  <View style={[styles.pill, styles.livePill]}>
                    <View style={styles.liveDot} />
                    <Text style={styles.pillText}>REC {formatRecordTime(recordSecs)}</Text>
                  </View>
                ) : (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      {captureTab === "video" ? "Video" : "Photo"}
                    </Text>
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

                    <View
              style={[
                styles.leftTools,
                {
                  top: Math.max(insets.top + 72, 86),
                },
              ]}
            >
              <Pressable onPress={cycleFlash} style={styles.toolBtn}>
                <Ionicons name={flashIcon as any} size={20} color={RBZ.white} />
                <Text style={styles.toolText}>{flashLabel}</Text>
              </Pressable>

              <Pressable
                onPress={() => facing === "back" && setTorchOn((prev) => !prev)}
                style={[styles.toolBtn, facing !== "back" ? styles.toolDisabled : null]}
                disabled={facing !== "back"}
              >
                <Ionicons
                  name={torchOn ? "sunny" : "sunny-outline"}
                  size={20}
                  color={RBZ.white}
                />
                <Text style={styles.toolText}>Torch</Text>
              </Pressable>
            </View>

                   <View
              style={[
                styles.zoomRailWrap,
                {
                  bottom: Math.max(insets.bottom + 176, 182),
                },
              ]}
            >
              <Pressable onPress={() => setZoomStep(0)} style={styles.zoomChip}>
                <Text style={styles.zoomChipText}>1x</Text>
              </Pressable>

              <Pressable onPress={() => setZoomStep(0.15)} style={styles.zoomChip}>
                <Text style={styles.zoomChipText}>2x</Text>
              </Pressable>

              <Pressable onPress={() => setZoomStep(0.35)} style={styles.zoomChip}>
                <Text style={styles.zoomChipText}>3x</Text>
              </Pressable>

              <Pressable
                onPress={() => setZoomStep(Math.max(0, zoom - 0.08))}
                style={styles.zoomChip}
              >
                <Ionicons name="remove" size={16} color={RBZ.white} />
              </Pressable>

              <Pressable
                onPress={() => setZoomStep(Math.min(1, zoom + 0.08))}
                style={styles.zoomChip}
              >
                <Ionicons name="add" size={16} color={RBZ.white} />
              </Pressable>
            </View>

            <View
              style={[
                styles.bottomPanel,
                {
                  paddingBottom: Math.max(insets.bottom + 14, 18),
                },
              ]}
            >
              <View style={styles.modeTabs}>
                <Pressable
                  onPress={() => !recording && setCaptureTab("picture")}
                  style={[
                    styles.modeTab,
                    captureTab === "picture" ? styles.modeTabActive : null,
                  ]}
                  disabled={recording}
                >
                  <Ionicons name="camera" size={16} color={RBZ.white} />
                  <Text style={styles.modeTabText}>Photo</Text>
                </Pressable>

                <Pressable
                  onPress={() => !recording && setCaptureTab("video")}
                  style={[
                    styles.modeTab,
                    captureTab === "video" ? styles.modeTabActive : null,
                  ]}
                  disabled={recording}
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
                    <View
                      style={[
                        styles.captureOuterRing,
                        recording ? styles.captureOuterRecording : null,
                      ]}
                    >
                      <View
                        style={recording ? styles.captureInnerStop : styles.captureInnerVideo}
                      />
                    </View>
                  </Pressable>
                )}

                <View style={styles.captureSideSpacer}>
                  <Text style={styles.captureHint}>{captureHint}</Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <ChatUploadPreview
        visible={visible && !!preview}
        selected={preview}
        sending={sending}
        onCancel={retake}
        onSend={sendPreview}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  root: {
    flex: 1,
    backgroundColor: "#000",
  },

   topBar: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
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

  leftTools: {
    position: "absolute",
    left: 12,
    gap: 10,
    zIndex: 30,
  },
  toolBtn: {
    width: 60,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: RBZ.glass,
    borderWidth: 1,
    borderColor: RBZ.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
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
    left: 0,
    right: 0,
    zIndex: 25,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  zoomChip: {
    minWidth: 44,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 11,
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
    zIndex: 25,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "transparent",
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
    backgroundColor: "rgba(216,52,95,0.86)",
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
});
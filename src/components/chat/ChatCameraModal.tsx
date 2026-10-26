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

import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatCameraControls from "@/src/components/chat/ChatCameraControls";
import ChatUploadPreview, {
  type ChatUploadPreviewSendPayload,
  type PickedChatMedia,
} from "@/src/components/chat/ChatUploadPreview";

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
  const countdownTokenRef = useRef(0);
  const cameraDragY = useSharedValue(0);
  const cameraDragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cameraDragY.value }],
  }));

  const [active, setActive] = useState(true);
  const [camReady, setCamReady] = useState(false);

  const [facing, setFacing] = useState<"front" | "back">("back");
  const [captureTab, setCaptureTab] = useState<CaptureTab>("picture");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [mirrorFront, setMirrorFront] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 10>(0);
  const [gridOn, setGridOn] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

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
      countdownTokenRef.current += 1;
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
    countdownTokenRef.current += 1;
    setCountdown(null);
    resetRecording();
    setPreview(null);
    setTakingPhoto(false);
    setSending(false);
    setCamReady(false);
    setTorchOn(false);
    setZoom(0);
    setTimerSeconds(0);
    setGridOn(false);
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

      const captureToken = ++countdownTokenRef.current;
      for (let remaining = timerSeconds; remaining > 0; remaining -= 1) {
        setCountdown(remaining);
        await sleep(1000);
        if (captureToken !== countdownTokenRef.current) return;
      }
      setCountdown(null);

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
      if (mountedRef.current) {
        setCountdown(null);
        setTakingPhoto(false);
      }
    }
  };

  const pickMedia = async () => {
    if (recording || takingPhoto || startingVideo || sending) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 0.92,
        videoMaxDuration: MAX_VIDEO_SECONDS,
      });
      const asset = result.canceled ? null : result.assets?.[0];
      if (!asset?.uri) return;

      const mediaType = asset.type === "video" ? "video" : "image";
      setPreview({
        uri: asset.uri,
        mediaType,
        width: asset.width,
        height: asset.height,
        duration: mediaType === "video" ? (asset.duration ?? undefined) : undefined,
      });
    } catch (error: any) {
      Alert.alert("Gallery", error?.message || "Could not open your gallery.");
    }
  };

  const cycleTimer = () => {
    setTimerSeconds((current) => (current === 0 ? 3 : current === 3 ? 10 : 0));
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

  return (
    <>
      <Modal
        visible={visible && !preview}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View style={styles.safe}>
          <Animated.View style={[styles.root, cameraDragStyle]}>
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
            <ChatCameraControls
              topInset={insets.top}
              bottomInset={insets.bottom}
              captureTab={captureTab}
              recording={recording}
              recordLabel={`REC ${Math.floor(recordSecs / 60)}:${String(recordSecs % 60).padStart(2, "0")}`}
              flashIcon={flashIcon}
              flashLabel={flashLabel}
              torchOn={torchOn}
              torchAvailable={facing === "back"}
              timerSeconds={timerSeconds}
              gridOn={gridOn}
              zoom={zoom}
              cameraDragY={cameraDragY}
              camReady={camReady}
              busy={takingPhoto || startingVideo || sending || countdown !== null}
              countdown={countdown}
              onClose={closeModal}
              onFlip={toggleFacing}
              onFlash={cycleFlash}
              onTorch={() => setTorchOn((previous) => !previous)}
              onTimer={cycleTimer}
              onGrid={() => setGridOn((previous) => !previous)}
              onZoom={setZoomStep}
              onPickMedia={pickMedia}
              onMode={setCaptureTab}
              onPhoto={takePhoto}
              onVideo={recording ? () => stopVideo(false) : startVideo}
            />
          </Animated.View>
        </View>
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
});

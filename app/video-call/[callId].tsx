/**
 * ============================================================
 * 📁 File: app/video-call/[callId].tsx
 * 🎥 Purpose: Agora-powered RomBuzz 1-to-1 video call screen.
 *
 * Used by:
 *   - IncomingCallOverlay after receiver accepts.
 *   - later: app/chat/[peerId].tsx after caller starts a call.
 *
 * What this file does:
 *   - Gets Agora token/channel/appId from route params or backend.
 *   - Initializes Agora native RTC engine.
 *   - Joins channel using userAccount token.
 *   - Renders local + remote video.
 *   - Supports mute, camera off, switch camera, end call.
 *
 * Requires:
 *   - react-native-agora
 *   - Expo dev client / EAS build
 *
 * Does NOT work inside plain Expo Go.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  PanResponder,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  type IRtcEngine,
  RtcSurfaceView,
  RtcTextureView,
} from "react-native-agora";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  acceptVideoCall,
  endVideoCall,
  getVideoCall,
  getVideoCallToken,
} from "@/src/features/videoCall/videoCallApi";
import {
  hideActiveVideoCallMini,
  setActiveVideoCallDetachedCleanup,
  showActiveVideoCallMini,
} from "@/src/features/videoCall/ActiveVideoCallMiniStore";
import type {
  AgoraJoinToken,
  VideoCallSession,
} from "@/src/features/videoCall/videoCallTypes";
import { useVideoCallSocket } from "@/src/features/videoCall/useVideoCallSocket";
import { useVideoCall } from "@/src/features/videoCall/VideoCallProvider";
import VideoCallGiftOverlay from "@/src/features/videoCallGifts/VideoCallGiftOverlay";
const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c4: "#b5179e",
  white: "#ffffff",
  dark: "#07070a",
  panel: "rgba(255,255,255,0.12)",
};

const LOCAL_PREVIEW_WIDTH = 118;
const LOCAL_PREVIEW_HEIGHT = 168;
const LOCAL_PREVIEW_EDGE = 16;

const MINIMIZED_CALL_WIDTH = 116;
const MINIMIZED_CALL_HEIGHT = 168;
const MINIMIZED_CALL_EDGE = 16;

async function requestAndroidPermissions() {
  if (Platform.OS !== "android") return true;

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ]);

  const cameraGranted =
    result[PermissionsAndroid.PERMISSIONS.CAMERA] ===
    PermissionsAndroid.RESULTS.GRANTED;

  const micGranted =
    result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
    PermissionsAndroid.RESULTS.GRANTED;

  return cameraGranted && micGranted;
}

function cleanParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  return String(value || "").trim();
}

async function getStoredUserId() {
  try {
    const raw = await SecureStore.getItemAsync("RBZ_USER");
    const user = raw ? JSON.parse(raw) : null;
    return String(user?.id || user?._id || "").trim();
  } catch {
    return "";
  }
}

function formatLiveCallDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds || 0)));

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function RomBuzzVideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const {
    startActiveCall,
    updateActiveCall,
    minimizeCallUi,
    showFullScreenCall,
    clearActiveCall,
    setMutedState,
    setCameraOffState,
    setSpeakerOnState,
  } = useVideoCall();

   const params = useLocalSearchParams<{
    callId?: string;
    channelName?: string;
    appId?: string;
    token?: string;
    uid?: string;
    role?: string;
    startedAtMs?: string;
  }>();

  const callId = cleanParam(params.callId);
  const routeChannelName = cleanParam(params.channelName);
  const routeAppId = cleanParam(params.appId);
  const routeToken = cleanParam(params.token);
  const routeUid = cleanParam(params.uid);
  const routeStartedAtMs = Number(cleanParam(params.startedAtMs) || 0);

    const engineRef = useRef<IRtcEngine | null>(null);
  const mountedRef = useRef(true);
  const leavingRef = useRef(false);

  // ✅ When X minimizes, this screen unmounts, but Agora must stay alive.
  // Red hang-up still performs real cleanup.
  const minimizedToGlobalRef = useRef(false);

  // ✅ Draggable local preview position.
  const previewPositionRef = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const previewPositionValueRef = useRef({ x: 0, y: 0 });
  const previewDragStartRef = useRef({ x: 0, y: 0 });
  const previewPositionInitializedRef = useRef(false);
  const previewDraggedRef = useRef(false);

  // ✅ Minimized in-call floating bubble.
  const minimizedPositionRef = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const minimizedPositionValueRef = useRef({ x: 0, y: 0 });
  const minimizedDragStartRef = useRef({ x: 0, y: 0 });
  const minimizedPositionInitializedRef = useRef(false);
  const minimizedDraggedRef = useRef(false);

  // ✅ Live in-call timer. Starts only after both users are connected.
  const connectedAtRef = useRef<number | null>(null);

  const [call, setCall] = useState<VideoCallSession | null>(null);
  const [joinToken, setJoinToken] = useState<AgoraJoinToken | null>(
    routeAppId && routeToken && routeChannelName && routeUid
      ? {
          appId: routeAppId,
          token: routeToken,
          channelName: routeChannelName,
          uid: routeUid,
        }
      : null
  );

  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [remoteUids, setRemoteUids] = useState<number[]>([]);
  const [error, setError] = useState("");

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  const [callConnected, setCallConnected] = useState(false);
  const [liveCallSeconds, setLiveCallSeconds] = useState(0);

  // ✅ X button minimizes only. Red end-call button is the only hang-up action.
  const [callMinimized, setCallMinimized] = useState(false);

  // ✅ Tap small preview to swap local/remote video placement.
  const [localOnBigScreen, setLocalOnBigScreen] = useState(false);

  // ✅ Force Agora local preview surface to repaint/remount.
  // Without this, the small self-preview can stay blank until camera is toggled.
  const [localPreviewReady, setLocalPreviewReady] = useState(false);
  const [localPreviewKey, setLocalPreviewKey] = useState(0);

  // ✅ Keep the real latest camera state outside React's delayed state updates.
  // This prevents camera ON from being blocked by stale `cameraOff === true`.
  const cameraOffRef = useRef(false);

  const refreshLocalPreview = (forceCameraOn = false) => {
    setLocalPreviewReady(false);

    setTimeout(() => {
      if (!mountedRef.current) return;
      if (cameraOffRef.current && !forceCameraOn) return;

      try {
        engineRef.current?.enableLocalVideo(true);
      } catch {}

      try {
        engineRef.current?.muteLocalVideoStream(false);
      } catch {}

      try {
        engineRef.current?.startPreview();
      } catch {}

      setLocalPreviewReady(true);
      setLocalPreviewKey((prev) => prev + 1);
    }, 180);
  };

  const getPreviewBounds = () => {
    const minX = LOCAL_PREVIEW_EDGE;
    const maxX = Math.max(
      LOCAL_PREVIEW_EDGE,
      screenWidth - LOCAL_PREVIEW_WIDTH - LOCAL_PREVIEW_EDGE
    );

    const minY = Math.max(insets.top + 74, LOCAL_PREVIEW_EDGE);
    const maxY = Math.max(
      minY,
      screenHeight - LOCAL_PREVIEW_HEIGHT - insets.bottom - 126
    );

    return { minX, maxX, minY, maxY };
  };

   const clampPreviewPosition = (x: number, y: number) => {
    const { minX, maxX, minY, maxY } = getPreviewBounds();

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

  const getMinimizedBounds = () => {
    const minX = MINIMIZED_CALL_EDGE;
    const maxX = Math.max(
      MINIMIZED_CALL_EDGE,
      screenWidth - MINIMIZED_CALL_WIDTH - MINIMIZED_CALL_EDGE
    );

    const minY = Math.max(insets.top + 18, MINIMIZED_CALL_EDGE);
    const maxY = Math.max(
      minY,
      screenHeight - MINIMIZED_CALL_HEIGHT - insets.bottom - MINIMIZED_CALL_EDGE
    );

    return { minX, maxX, minY, maxY };
  };

  const clampMinimizedPosition = (x: number, y: number) => {
    const { minX, maxX, minY, maxY } = getMinimizedBounds();

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

    const minimizeCall = () => {
    minimizedToGlobalRef.current = true;
    minimizeCallUi();

    const miniTitle =
      call?.status === "ringing"
        ? "Calling..."
        : call?.status === "ended"
          ? "Call ended"
          : call?.status === "declined"
            ? "Call declined"
            : call?.status === "missed"
              ? "Missed call"
              : "RomBuzz Video";

    const miniSubtitle = callConnected
      ? formatLiveCallDuration(liveCallSeconds)
      : "Live";

    setActiveVideoCallDetachedCleanup(cleanupAgora);

     showActiveVideoCallMini({
      callId,
      channelName: joinToken?.channelName || routeChannelName,
      appId: joinToken?.appId || routeAppId,
      token: joinToken?.token || routeToken,
      uid: joinToken?.uid || routeUid,
      role: cleanParam(params.role),
       title: miniTitle,
      subtitle: miniSubtitle,
      startedAtMs:
        connectedAtRef.current ||
        (Number.isFinite(routeStartedAtMs) && routeStartedAtMs > 0
          ? routeStartedAtMs
          : Date.now()),
      remoteUid: remoteUids[0] ? String(remoteUids[0]) : "",
      cameraOff,
      localPreviewReady,
      localPreviewKey,
    });

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/chat");
    }
  };

  const restoreCall = () => {
    setCallMinimized(false);
  };

  const snapPreviewToNearestCorner = () => {
    const { minX, maxX, minY, maxY } = getPreviewBounds();
    const current = previewPositionValueRef.current;

    const targetX = current.x < (minX + maxX) / 2 ? minX : maxX;
    const targetY = current.y < (minY + maxY) / 2 ? minY : maxY;

    previewPositionValueRef.current = { x: targetX, y: targetY };

    Animated.spring(previewPositionRef, {
      toValue: { x: targetX, y: targetY },
      useNativeDriver: false,
      friction: 8,
      tension: 80,
    }).start();
  };

  const previewPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,

               onPanResponderGrant: () => {
          previewDraggedRef.current = false;
          previewDragStartRef.current = previewPositionValueRef.current;
        },

        onPanResponderMove: (_event, gesture) => {
          if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
            previewDraggedRef.current = true;
          }

          const start = previewDragStartRef.current;
          const next = clampPreviewPosition(
            start.x + gesture.dx,
            start.y + gesture.dy
          );

          previewPositionValueRef.current = next;
          previewPositionRef.setValue(next);
        },

        onPanResponderRelease: () => {
          if (previewDraggedRef.current) {
            snapPreviewToNearestCorner();
            return;
          }

          if (remoteUids.length > 0) {
            setLocalOnBigScreen((prev) => !prev);
          }
        },

        onPanResponderTerminate: () => {
          snapPreviewToNearestCorner();
        },
      }),
       [screenWidth, screenHeight, insets.top, insets.bottom, remoteUids.length]
  );

  const minimizedPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,

        onPanResponderGrant: () => {
          minimizedDraggedRef.current = false;
          minimizedDragStartRef.current = minimizedPositionValueRef.current;
        },

        onPanResponderMove: (_event, gesture) => {
          if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
            minimizedDraggedRef.current = true;
          }

          const start = minimizedDragStartRef.current;
          const next = clampMinimizedPosition(
            start.x + gesture.dx,
            start.y + gesture.dy
          );

          minimizedPositionValueRef.current = next;
          minimizedPositionRef.setValue(next);
        },

        onPanResponderRelease: () => {
          if (!minimizedDraggedRef.current) {
            restoreCall();
          }
        },

        onPanResponderTerminate: () => {},
      }),
    [screenWidth, screenHeight, insets.top, insets.bottom]
  );

   useEffect(() => {
    const { minX, maxX, minY } = getPreviewBounds();

    if (!previewPositionInitializedRef.current) {
      const initial = {
        x: maxX,
        y: Math.max(minY, 120),
      };

      previewPositionInitializedRef.current = true;
      previewPositionValueRef.current = initial;
      previewPositionRef.setValue(initial);
      return;
    }

    const current = previewPositionValueRef.current;
    const clamped = clampPreviewPosition(current.x, current.y);

    previewPositionValueRef.current = clamped;
    previewPositionRef.setValue(clamped);
  }, [screenWidth, screenHeight, insets.top, insets.bottom]);

  useEffect(() => {
    const { maxX, minY } = getMinimizedBounds();

    if (!minimizedPositionInitializedRef.current) {
      const initial = {
        x: maxX,
        y: Math.max(minY, insets.top + 92),
      };

      minimizedPositionInitializedRef.current = true;
      minimizedPositionValueRef.current = initial;
      minimizedPositionRef.setValue(initial);
      return;
    }

    const current = minimizedPositionValueRef.current;
    const clamped = clampMinimizedPosition(current.x, current.y);

    minimizedPositionValueRef.current = clamped;
    minimizedPositionRef.setValue(clamped);
  }, [screenWidth, screenHeight, insets.top, insets.bottom]);

  const callTitle = useMemo(() => {
    if (!call) return "RomBuzz Video";
    if (call.status === "ringing") return "Calling...";
    if (call.status === "accepted") return "RomBuzz Video";
    if (call.status === "ended") return "Call ended";
    if (call.status === "declined") return "Call declined";
    if (call.status === "missed") return "Missed call";
    return "RomBuzz Video";
  }, [call]);

  const cleanupAgora = async () => {
    const engine = engineRef.current;
    engineRef.current = null;

    if (!engine) return;

    try {
      engine.leaveChannel();
    } catch {}

    try {
      engine.stopPreview();
    } catch {}

    try {
      engine.removeAllListeners();
    } catch {}

    try {
      engine.release();
    } catch {}
  };

  const leaveScreen = async (reason = "left_screen") => {
    if (leavingRef.current) return;
    leavingRef.current = true;

    // Red hang-up is the real call ending path.
    minimizedToGlobalRef.current = false;
    hideActiveVideoCallMini();
    setActiveVideoCallDetachedCleanup(null);
    clearActiveCall();

    try {
      if (callId) {
        await endVideoCall(callId, reason).catch(() => null);
      }
    } finally {
      await cleanupAgora();

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/chat");
      }
    }
  };


  useEffect(() => {
    if (!callId) return;

    const restoredStartedAt =
      Number.isFinite(routeStartedAtMs) && routeStartedAtMs > 0
        ? routeStartedAtMs
        : 0;

    const activeStartedAt = connectedAtRef.current || restoredStartedAt || 0;

    if (!call && !joinToken && !activeStartedAt) return;

    startActiveCall({
      callId,
      call,
      token: joinToken,
      startedAtMs: activeStartedAt || undefined,
    });
  }, [
    callId,
    call?.id,
    call?.status,
    joinToken?.appId,
    joinToken?.token,
    joinToken?.channelName,
    joinToken?.uid,
    routeStartedAtMs,
    startActiveCall,
  ]);

  useVideoCallSocket({
    onEnded: (payload) => {
      if (String(payload?.call?.id) !== String(callId)) return;
      Alert.alert("Call ended", "The call was ended.");
      leaveScreen("remote_ended");
    },
    onDeclined: (payload) => {
      if (String(payload?.call?.id) !== String(callId)) return;
      Alert.alert("Call declined", "The call was declined.");
      leaveScreen("remote_declined");
    },
    onCanceled: (payload) => {
      if (String(payload?.call?.id) !== String(callId)) return;
      Alert.alert("Call canceled", "The call was canceled.");
      leaveScreen("remote_canceled");
    },
    onMissed: (payload) => {
      if (String(payload?.call?.id) !== String(callId)) return;
      Alert.alert("Missed call", "The call expired.");
      leaveScreen("missed");
    },
  });

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // If X minimized the call, do NOT release Agora here.
      // The detached cleanup is stored globally and runs when the user restores
      // the full call screen or when the real hang-up path happens.
      if (minimizedToGlobalRef.current) return;

      cleanupAgora();
    };
  }, []);
    useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      minimizeCall();
      return true;
    });

    return () => sub.remove();
  }, [
    callId,
    joinToken?.channelName,
    joinToken?.appId,
    joinToken?.token,
    joinToken?.uid,
    routeChannelName,
    routeAppId,
    routeToken,
    routeUid,
    callTitle,
    callConnected,
    liveCallSeconds,
  ]);

   useEffect(() => {
    if (!callId) {
      setError("Missing call id");
      setLoading(false);
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const freshCall = await getVideoCall(callId);
        const myId = await getStoredUserId();

        if (!alive) return;

        const isIncomingReceiver =
          String(freshCall?.status || "") === "ringing" &&
          String(freshCall?.receiverId || "") === String(myId || "");

        // ✅ User tapped incoming call push from lock-screen/background.
        // If receiver opens a still-ringing call, accept it here and get Agora token.
        if (isIncomingReceiver) {
          const accepted = await acceptVideoCall(callId);

          if (!alive) return;

          setCall(accepted.call);
          setJoinToken(accepted.token || null);
          return;
        }

        setCall(freshCall);

        if (!joinToken?.token) {
          const result = await getVideoCallToken(callId);

          if (!alive) return;
          setCall(result.call);
          setJoinToken(result.token || null);
        }
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || "Could not load video call.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [callId]);

  useEffect(() => {
    if (!joinToken?.appId || !joinToken?.token || !joinToken?.channelName || !joinToken?.uid) {
      return;
    }

    let alive = true;

    (async () => {
      try {
         const permissionsOk = await requestAndroidPermissions();

        if (!permissionsOk) {
          throw new Error("Camera and microphone permissions are required.");
        }

        // ✅ Prevent Agora -17 on first accept/retry by clearing any stale native engine
        // before creating a new one. This is especially important after restore/minimize
        // or fast incoming-call accept flows.
        await cleanupAgora();
        await wait(260);

        if (!alive || !mountedRef.current) return;

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;

        engine.initialize({
          appId: joinToken.appId,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

             engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
        engine.enableVideo();
        engine.enableAudio();
        engine.setEnableSpeakerphone(true);
        engine.startPreview();

        // ✅ Mount the self-preview after native camera preview has actually started.
        refreshLocalPreview();

        engine.addListener("onJoinChannelSuccess", () => {
          if (!alive || !mountedRef.current) return;

          setJoined(true);
          showFullScreenCall();

          // ✅ Important: Agora SurfaceView sometimes stays blank until remounted.
          // This makes the small self-preview appear automatically after connect.
          refreshLocalPreview();
        });

        engine.addListener("onUserJoined", (_connection, remoteUid) => {
          if (!alive || !mountedRef.current) return;

          // ✅ Refresh again when peer joins, because Android SurfaceView can repaint late.
          refreshLocalPreview();

          setRemoteUids((prev) => {
            if (prev.includes(remoteUid)) return prev;
            return [...prev, remoteUid];
          });
        });

             engine.addListener("onUserOffline", (_connection, remoteUid) => {
          if (!alive || !mountedRef.current) return;

          setRemoteUids((prev) => prev.filter((uid) => uid !== remoteUid));
          setLocalOnBigScreen(false);
        });
        engine.addListener("onError", (err, msg) => {
          console.log("❌ Agora error", err, msg);
        });

        const joinResult = engine.joinChannelWithUserAccount(
          joinToken.token,
          joinToken.channelName,
          joinToken.uid,
          {
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            channelProfile: ChannelProfileType.ChannelProfileCommunication,
            publishMicrophoneTrack: true,
            publishCameraTrack: true,
            autoSubscribeAudio: true,
            autoSubscribeVideo: true,
          }
        );

        if (joinResult < 0) {
          throw new Error(`Call join failed: ${joinResult}`);
        }
      } catch (err: any) {
        console.log("❌ Call init failed", err);
        if (alive && mountedRef.current) {
          setError(err?.message || "Could not start video call.");
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [joinToken?.appId, joinToken?.token, joinToken?.channelName, joinToken?.uid]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);

    try {
      engineRef.current?.muteLocalAudioStream(next);
    } catch {}
  };

    const toggleCamera = () => {
    const next = !cameraOff;

    // ✅ Update ref immediately so preview refresh does not use stale React state.
    cameraOffRef.current = next;
    setCameraOff(next);
    setCameraOffState(next);

    if (next) {
      // ✅ Camera is being turned OFF.
      setLocalPreviewReady(false);

      try {
        engineRef.current?.muteLocalVideoStream(true);
      } catch {}

      try {
        engineRef.current?.enableLocalVideo(false);
      } catch {}

      try {
        engineRef.current?.stopPreview();
      } catch {}

      return;
    }

    // ✅ Camera is being turned back ON.
    // Re-enable capture, unmute publish, restart preview, then remount the view.
    try {
      engineRef.current?.enableLocalVideo(true);
    } catch {}

    try {
      engineRef.current?.muteLocalVideoStream(false);
    } catch {}

    try {
      engineRef.current?.startPreview();
    } catch {}

    setTimeout(() => {
      refreshLocalPreview(true);
    }, 120);
  };

   const switchCamera = () => {
    if (cameraOffRef.current) return;

    try {
      engineRef.current?.switchCamera();
    } catch {}

    // ✅ Switching camera can also blank the local SurfaceView on some Android devices.
    refreshLocalPreview(true);
  };

  const toggleSpeaker = () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    setSpeakerOnState(next);

    try {
      engineRef.current?.setEnableSpeakerphone(next);
    } catch {}
  };

   const retry = () => {
    router.replace({
      pathname: "../video-call/[callId]",
      params: {
        callId,
      },
    });
  };

   useEffect(() => {
    const restoredStartedAt =
      Number.isFinite(routeStartedAtMs) && routeStartedAtMs > 0
        ? routeStartedAtMs
        : 0;

    if (restoredStartedAt > 0) {
      connectedAtRef.current = restoredStartedAt;
      setCallConnected(true);
      setLiveCallSeconds(
        Math.max(0, Math.floor((Date.now() - restoredStartedAt) / 1000))
      );
      return;
    }

    connectedAtRef.current = null;
    setCallConnected(false);
    setLiveCallSeconds(0);
  }, [callId, routeStartedAtMs]);

  useEffect(() => {
    if (!joined || remoteUids.length <= 0) return;

    if (!connectedAtRef.current) {
      const restoredStartedAt =
        Number.isFinite(routeStartedAtMs) && routeStartedAtMs > 0
          ? routeStartedAtMs
          : 0;

      connectedAtRef.current = restoredStartedAt || Date.now();
      setCallConnected(true);
      updateActiveCall({ startedAtMs: connectedAtRef.current });
    }

    const tick = () => {
      if (!connectedAtRef.current) return;

      const seconds = Math.max(
        0,
        Math.floor((Date.now() - connectedAtRef.current) / 1000)
      );

      setLiveCallSeconds(seconds);
    };

    tick();

    const interval = setInterval(tick, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [joined, remoteUids.length, routeStartedAtMs]);

   const showRemote = remoteUids.length > 0;
  const remoteUid = remoteUids[0];
  const shouldShowLocalOnBigScreen = localOnBigScreen && showRemote && !cameraOff;
  const shouldShowRemoteInSmallBox = localOnBigScreen && showRemote;

   const liveDurationLabel = callConnected
    ? formatLiveCallDuration(liveCallSeconds)
    : "";

  // ✅ Gift button must appear for BOTH users once the Agora call is live.
  // Do not depend only on call.status because caller can still have stale "ringing"
  // state while the receiver already accepted and both users are connected.
  const giftOverlayVisible =
    !loading &&
    !error &&
    joined &&
    remoteUids.length > 0 &&
    callConnected;

     const giftOverlayBottomOffset = insets.bottom + 104;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.screen}>
        <LinearGradient
          colors={["#07070a", "#160810", "#260617"]}
          style={StyleSheet.absoluteFill}
        />

             <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View>
            <Text style={styles.headerTitle}>{callTitle}</Text>
            <Text style={styles.headerSub}>
              {liveDurationLabel
                ? liveDurationLabel
                : joined
                  ? showRemote
                    ? "00:00"
                    : "Waiting for camera..."
                  : "Connecting..."}
            </Text>
          </View>

        <Pressable onPress={minimizeCall} style={styles.headerClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.videoStage}>
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.centerText}>Preparing video call...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Ionicons name="warning" size={34} color="#fff" />
              <Text style={styles.centerText}>{error}</Text>

              <View style={styles.errorActions}>
                <Pressable onPress={retry} style={styles.retryButton}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>

                <Pressable onPress={() => leaveScreen("error_close")} style={styles.closeButton}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
              </View>
            </View>
          ) : (
                      <>
              {showRemote ? (
                shouldShowLocalOnBigScreen ? (
                  localPreviewReady ? (
                    <RtcTextureView
                      key={`big-local-${localPreviewKey}`}
                      style={styles.remoteVideo}
                      canvas={{ uid: 0 }}
                    />
                  ) : (
                    <View style={styles.waitingRemote}>
                      <Ionicons name="videocam" size={42} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.waitingText}>Preparing your camera...</Text>
                    </View>
                  )
                ) : (
                  <RtcSurfaceView
                    style={styles.remoteVideo}
                    canvas={{ uid: remoteUid }}
                  />
                )
              ) : (
                <View style={styles.waitingRemote}>
                  <Ionicons name="videocam" size={42} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.waitingText}>Waiting for the other person...</Text>
                </View>
              )}

              <Animated.View
                {...previewPanResponder.panHandlers}
                style={[styles.localPreview, previewPositionRef.getLayout()]}
              >
                {shouldShowRemoteInSmallBox ? (
                  <RtcTextureView
                    key={`small-remote-${remoteUid}`}
                    style={styles.localVideo}
                    canvas={{ uid: remoteUid }}
                  />
                ) : !cameraOff ? (
                  localPreviewReady ? (
                    <RtcTextureView
                      key={`small-local-${localPreviewKey}`}
                      style={styles.localVideo}
                      canvas={{ uid: 0 }}
                    />
                  ) : (
                    <View style={styles.localCameraLoading}>
                      <Ionicons name="videocam" size={24} color="#fff" />
                    </View>
                  )
                ) : (
                  <View style={styles.localCameraOff}>
                    <Ionicons name="videocam-off" size={24} color="#fff" />
                  </View>
                )}
              </Animated.View>
            </>
          )}
        </View>

        <View style={[styles.controlsWrap, { paddingBottom: insets.bottom + 18 }]}>
          <Pressable
            onPress={toggleCamera}
            style={[styles.controlButton, cameraOff ? styles.controlActive : null]}
          >
            <Ionicons name={cameraOff ? "videocam-off" : "videocam"} size={24} color="#fff" />
          </Pressable>

          <Pressable
            onPress={toggleMute}
            style={[styles.controlButton, muted ? styles.controlActive : null]}
          >
            <Ionicons name={muted ? "mic-off" : "mic"} size={23} color="#fff" />
          </Pressable>

          <VideoCallGiftOverlay
            callId={callId}
            visible={giftOverlayVisible}
            bottomOffset={giftOverlayBottomOffset}
            inline
          />

          <Pressable onPress={switchCamera} style={styles.controlButton}>
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </Pressable>

            <Pressable onPress={() => leaveScreen("end_button")} style={styles.endButton}>
            <Ionicons name="call" size={24} color="#fff" style={styles.endIcon} />
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: RBZ.dark,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  headerSub: {
    marginTop: 3,
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "700",
  },
  headerClose: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  videoStage: {
    flex: 1,
    overflow: "hidden",
  },
  remoteVideo: {
    flex: 1,
  },
  waitingRemote: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  waitingText: {
    marginTop: 12,
    color: "rgba(255,255,255,0.82)",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
   localPreview: {
    position: "absolute",
    width: LOCAL_PREVIEW_WIDTH,
    height: LOCAL_PREVIEW_HEIGHT,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    zIndex: 8,
  },
  localVideo: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    overflow: "hidden",
  },
  localCameraLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  localCameraOff: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  centerText: {
    marginTop: 14,
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  errorActions: {
    marginTop: 22,
    flexDirection: "row",
    gap: 12,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: RBZ.c1,
  },
  retryText: {
    color: "#fff",
    fontWeight: "900",
  },
  closeButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  closeText: {
    color: "#fff",
    fontWeight: "900",
  },
  controlsWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  controlButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  controlActive: {
    backgroundColor: "rgba(239,68,68,0.82)",
  },
   endButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#ef4444",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9,
  },
   endIcon: {
    transform: [{ rotate: "135deg" }],
  },
  minimizedOverlayRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  minimizedCallBubble: {
    position: "absolute",
    width: MINIMIZED_CALL_WIDTH,
    height: MINIMIZED_CALL_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(17,24,39,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18,
  },
  minimizedVideo: {
    width: "100%",
    height: "100%",
  },
  minimizedPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  minimizedTopShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 42,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  minimizedFooter: {
    position: "absolute",
    left: 9,
    right: 9,
    bottom: 8,
    minHeight: 25,
    borderRadius: 999,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.46)",
  },
  minimizedLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: "#22c55e",
  },
  minimizedText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
});
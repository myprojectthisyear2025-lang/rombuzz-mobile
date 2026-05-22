/**
 * ============================================================
 * 📁 File: src/features/videoCall/ActiveVideoCallMiniStore.tsx
 * 🎥 Purpose: Global minimized video-call bubble controller.
 *
 * Used by:
 *   - app/(tabs)/_layout.tsx
 *   - app/video-call/[callId].tsx
 *
 * What this file does:
 *   - Stores the currently minimized active video call globally.
 *   - Renders a draggable mini call bubble above every tab screen.
 *   - Lets user tap the mini bubble to reopen the full call screen.
 *
 * What this file does NOT do yet:
 *   - It does not own Agora engine yet.
 *   - Step 2 will move minimize behavior out of [callId].tsx into this global layer.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  DeviceEventEmitter,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { RtcTextureView } from "react-native-agora";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MINI_WIDTH = 116;
const MINI_HEIGHT = 168;
const MINI_EDGE = 16;

type MiniCallPayload = {
  callId: string;
  channelName?: string;
  appId?: string;
  token?: string;
  uid?: string;
  role?: string;
  title?: string;
  subtitle?: string;
  startedAtMs?: number;
  remoteUid?: string;
  cameraOff?: boolean;
  localPreviewReady?: boolean;
  localPreviewKey?: number;
};

type MiniStoreEvent =
  | {
      type: "show";
      payload: MiniCallPayload;
    }
  | {
      type: "hide";
    }
  | {
      type: "update";
      payload: Partial<MiniCallPayload>;
    };

let activeMiniCallSnapshot: MiniCallPayload | null = null;
let detachedVideoCallCleanup: null | (() => void | Promise<void>) = null;

export function getActiveVideoCallMiniSnapshot() {
  return activeMiniCallSnapshot;
}

export function setActiveVideoCallDetachedCleanup(
  cleanup?: null | (() => void | Promise<void>)
) {
  detachedVideoCallCleanup = cleanup || null;
}

export async function runActiveVideoCallDetachedCleanup() {
  const cleanup = detachedVideoCallCleanup;
  detachedVideoCallCleanup = null;

  if (!cleanup) return;

  try {
    await cleanup();
  } catch {}
}

export function showActiveVideoCallMini(payload: MiniCallPayload) {
  activeMiniCallSnapshot = payload;

  DeviceEventEmitter.emit("rbz:video-call:mini", {
    type: "show",
    payload,
  } satisfies MiniStoreEvent);
}

export function hideActiveVideoCallMini() {
  activeMiniCallSnapshot = null;

  DeviceEventEmitter.emit("rbz:video-call:mini", {
    type: "hide",
  } satisfies MiniStoreEvent);
}

export function updateActiveVideoCallMini(payload: Partial<MiniCallPayload>) {
  if (activeMiniCallSnapshot) {
    activeMiniCallSnapshot = {
      ...activeMiniCallSnapshot,
      ...payload,
    };
  }

  DeviceEventEmitter.emit("rbz:video-call:mini", {
    type: "update",
    payload,
  } satisfies MiniStoreEvent);
}

function clean(value: any) {
  return String(value || "").trim();
}

function formatMiniDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds || 0)));

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ActiveVideoCallMiniBubble() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

   const [miniCall, setMiniCall] = useState<MiniCallPayload | null>(() =>
    getActiveVideoCallMiniSnapshot()
  );
  const [clockTick, setClockTick] = useState(0);

  const positionRef = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const positionValueRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedRef = useRef(false);
  const initializedRef = useRef(false);

  const bounds = useMemo(() => {
    const minX = MINI_EDGE;
    const maxX = Math.max(MINI_EDGE, screenWidth - MINI_WIDTH - MINI_EDGE);

    const minY = Math.max(insets.top + MINI_EDGE, MINI_EDGE);
    const maxY = Math.max(
      minY,
      screenHeight - MINI_HEIGHT - insets.bottom - MINI_EDGE
    );

    return { minX, maxX, minY, maxY };
  }, [screenWidth, screenHeight, insets.top, insets.bottom]);

  const clamp = (x: number, y: number) => {
    return {
      x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
      y: Math.min(Math.max(y, bounds.minY), bounds.maxY),
    };
  };

   const restoreCall = async () => {
    if (!miniCall?.callId) return;

    const target = {
      callId: miniCall.callId,
      channelName: clean(miniCall.channelName),
      appId: clean(miniCall.appId),
      token: clean(miniCall.token),
      uid: clean(miniCall.uid),
      role: clean(miniCall.role),
      restore: "1",
      startedAtMs: miniCall.startedAtMs
        ? String(miniCall.startedAtMs)
        : "",
    };

    setMiniCall(null);

    // The minimized call kept the old Agora engine alive while user used the app.
    // Before reopening full call UI, release that detached engine so [callId].tsx
    // can safely create/rejoin a fresh full-screen engine.
    await runActiveVideoCallDetachedCleanup();

    router.push({
      pathname: "/video-call/[callId]",
      params: target,
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,

        onPanResponderGrant: () => {
          draggedRef.current = false;
          dragStartRef.current = positionValueRef.current;
        },

        onPanResponderMove: (_event, gesture) => {
          if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
            draggedRef.current = true;
          }

          const start = dragStartRef.current;
          const next = clamp(start.x + gesture.dx, start.y + gesture.dy);

          positionValueRef.current = next;
          positionRef.setValue(next);
        },

        onPanResponderRelease: () => {
          if (!draggedRef.current) {
            restoreCall();
          }
        },

        onPanResponderTerminate: () => {},
      }),
    [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, miniCall?.callId]
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "rbz:video-call:mini",
      (event: MiniStoreEvent) => {
        if (!event) return;

            if (event.type === "hide") {
          activeMiniCallSnapshot = null;
          setMiniCall(null);
          return;
        }

        if (event.type === "show") {
          const payload = event.payload;
          if (!payload?.callId) return;

          activeMiniCallSnapshot = payload;
          setMiniCall(payload);

          const initial = {
            x: bounds.maxX,
            y: Math.max(bounds.minY, insets.top + 92),
          };

          initializedRef.current = true;
          positionValueRef.current = initial;
          positionRef.setValue(initial);
          return;
        }

            if (event.type === "update") {
          setMiniCall((prev) => {
            if (!prev) return prev;

            const next = {
              ...prev,
              ...event.payload,
            };

            activeMiniCallSnapshot = next;
            return next;
          });
        }
      }
    );

    return () => sub.remove();
  }, [bounds.maxX, bounds.minY, insets.top]);

  useEffect(() => {
    if (!miniCall) return;

    if (!initializedRef.current) {
      const initial = {
        x: bounds.maxX,
        y: Math.max(bounds.minY, insets.top + 92),
      };

      initializedRef.current = true;
      positionValueRef.current = initial;
      positionRef.setValue(initial);
      return;
    }

    const current = positionValueRef.current;
    const next = clamp(current.x, current.y);

    positionValueRef.current = next;
    positionRef.setValue(next);
  }, [miniCall, bounds.maxX, bounds.minY, bounds.maxY, insets.top]);

   useEffect(() => {
    if (!miniCall?.startedAtMs) return;

    const interval = setInterval(() => {
      setClockTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [miniCall?.startedAtMs]);

  if (!miniCall) return null;

  const remoteUidNumber = Number(miniCall.remoteUid || 0);
  const showRemoteVideo = Number.isFinite(remoteUidNumber) && remoteUidNumber > 0;
  const showLocalVideo = !miniCall.cameraOff && miniCall.localPreviewReady;

  const elapsedSeconds = miniCall.startedAtMs
    ? Math.floor((Date.now() - Number(miniCall.startedAtMs)) / 1000)
    : 0;

  const timerLabel =
    miniCall.startedAtMs && elapsedSeconds >= 0
      ? formatMiniDuration(elapsedSeconds)
      : miniCall.subtitle || "Live";

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Animated.View
        {...panResponder.panHandlers}
        pointerEvents="auto"
        style={[styles.bubble, positionRef.getLayout()]}
      >
           <Pressable onPress={restoreCall} style={styles.pressable}>
          {showRemoteVideo ? (
            <RtcTextureView
              key={`mini-remote-${remoteUidNumber}`}
              style={styles.mainVideo}
              canvas={{ uid: remoteUidNumber }}
            />
          ) : showLocalVideo ? (
            <RtcTextureView
              key={`mini-local-main-${miniCall.localPreviewKey || 0}`}
              style={styles.mainVideo}
              canvas={{ uid: 0 }}
            />
          ) : (
            <View style={styles.fakeVideo}>
              <Ionicons
                name={miniCall.cameraOff ? "videocam-off" : "videocam"}
                size={30}
                color="#fff"
              />
            </View>
          )}

          {showRemoteVideo && showLocalVideo ? (
            <View pointerEvents="none" style={styles.localMiniWrap}>
              <RtcTextureView
                key={`mini-local-corner-${miniCall.localPreviewKey || 0}`}
                style={styles.localMiniVideo}
                canvas={{ uid: 0 }}
              />
            </View>
          ) : null}

          <View pointerEvents="none" style={styles.topShade} />

          <View pointerEvents="none" style={styles.footer}>
            <View style={styles.liveDot} />
            <Text numberOfLines={1} style={styles.footerText}>
              {timerLabel}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  bubble: {
    position: "absolute",
    width: MINI_WIDTH,
    height: MINI_HEIGHT,
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
  pressable: {
    flex: 1,
  },
  mainVideo: {
    width: "100%",
    height: "100%",
  },
  localMiniWrap: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 38,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  localMiniVideo: {
    width: "100%",
    height: "100%",
  },
  fakeVideo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(177,18,60,0.95)",
  },
  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 42,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  footer: {
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
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: "#22c55e",
  },
  footerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
});
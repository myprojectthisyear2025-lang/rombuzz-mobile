/**
 * ============================================================
 * 📁 File: src/features/videoCall/VideoCallProvider.tsx
 * 🎥 Purpose: Global RomBuzz video-call provider.
 *
 * Used by:
 *   - app/_layout.tsx
 *   - app/video-call/[callId].tsx
 *   - src/features/videoCall/ActiveVideoCallMiniStore.tsx
 *
 * What this file does right now:
 *   - Creates a global video-call context above the whole app.
 *   - Stores active call identity, timer, minimized state, camera/mic state.
 *   - Keeps call UI state alive across navigation.
 *
 * What moves here next:
 *   - Agora engineRef
 *   - join/leave channel
 *   - remoteUids
 *   - mute/camera/speaker/switch camera
 *   - cleanup/release engine
 *
 * Why this exists:
 *   - The call screen should not own the call.
 *   - The provider should own the call.
 *   - Full screen and mini bubble should only render provider state.
 * ============================================================
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  AgoraJoinToken,
  VideoCallSession,
} from "@/src/features/videoCall/videoCallTypes";

type VideoCallUiMode = "idle" | "fullscreen" | "minimized";

type StartActiveCallPayload = {
  callId: string;
  call?: VideoCallSession | null;
  token?: AgoraJoinToken | null;
  startedAtMs?: number;
};

type VideoCallContextValue = {
  mode: VideoCallUiMode;
  activeCallId: string;
  call: VideoCallSession | null;
  token: AgoraJoinToken | null;

  startedAtMs: number;
  liveCallSeconds: number;
  liveDurationLabel: string;

  muted: boolean;
  cameraOff: boolean;
  speakerOn: boolean;

  setMutedState: (value: boolean) => void;
  setCameraOffState: (value: boolean) => void;
  setSpeakerOnState: (value: boolean) => void;

  startActiveCall: (payload: StartActiveCallPayload) => void;
  updateActiveCall: (payload: Partial<StartActiveCallPayload>) => void;
  showFullScreenCall: () => void;
  minimizeCallUi: () => void;
  clearActiveCall: () => void;
};

const VideoCallContext = createContext<VideoCallContextValue | null>(null);

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

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<VideoCallUiMode>("idle");
  const [activeCallId, setActiveCallId] = useState("");
  const [call, setCall] = useState<VideoCallSession | null>(null);
  const [token, setToken] = useState<AgoraJoinToken | null>(null);

  const [startedAtMs, setStartedAtMs] = useState(0);
  const [liveCallSeconds, setLiveCallSeconds] = useState(0);

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  const startedAtRef = useRef(0);

  const startActiveCall = useCallback((payload: StartActiveCallPayload) => {
    const safeCallId = String(payload.callId || "").trim();
    if (!safeCallId) return;

    const nextStartedAt =
      Number(payload.startedAtMs || 0) > 0
        ? Number(payload.startedAtMs)
        : Date.now();

    startedAtRef.current = nextStartedAt;

    setActiveCallId(safeCallId);
    setCall(payload.call || null);
    setToken(payload.token || null);
    setStartedAtMs(nextStartedAt);
    setLiveCallSeconds(
      Math.max(0, Math.floor((Date.now() - nextStartedAt) / 1000))
    );
    setMode("fullscreen");
  }, []);

  const updateActiveCall = useCallback(
    (payload: Partial<StartActiveCallPayload>) => {
      if (payload.callId !== undefined) {
        setActiveCallId(String(payload.callId || "").trim());
      }

      if (payload.call !== undefined) {
        setCall(payload.call || null);
      }

      if (payload.token !== undefined) {
        setToken(payload.token || null);
      }

      if (payload.startedAtMs !== undefined) {
        const nextStartedAt = Number(payload.startedAtMs || 0);

        if (nextStartedAt > 0) {
          startedAtRef.current = nextStartedAt;
          setStartedAtMs(nextStartedAt);
          setLiveCallSeconds(
            Math.max(0, Math.floor((Date.now() - nextStartedAt) / 1000))
          );
        }
      }
    },
    []
  );

  const showFullScreenCall = useCallback(() => {
    setMode((prev) => {
      if (prev === "idle") return prev;
      return "fullscreen";
    });
  }, []);

  const minimizeCallUi = useCallback(() => {
    setMode((prev) => {
      if (prev === "idle") return prev;
      return "minimized";
    });
  }, []);

  const clearActiveCall = useCallback(() => {
    startedAtRef.current = 0;

    setMode("idle");
    setActiveCallId("");
    setCall(null);
    setToken(null);
    setStartedAtMs(0);
    setLiveCallSeconds(0);
    setMuted(false);
    setCameraOff(false);
    setSpeakerOn(true);
  }, []);

  useEffect(() => {
    if (!startedAtMs) return;

    const tick = () => {
      const base = startedAtRef.current || startedAtMs;

      setLiveCallSeconds(
        Math.max(0, Math.floor((Date.now() - base) / 1000))
      );
    };

    tick();

    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [startedAtMs]);

  const value = useMemo<VideoCallContextValue>(
    () => ({
      mode,
      activeCallId,
      call,
      token,

      startedAtMs,
      liveCallSeconds,
      liveDurationLabel: startedAtMs
        ? formatLiveCallDuration(liveCallSeconds)
        : "",

      muted,
      cameraOff,
      speakerOn,

      setMutedState: setMuted,
      setCameraOffState: setCameraOff,
      setSpeakerOnState: setSpeakerOn,

      startActiveCall,
      updateActiveCall,
      showFullScreenCall,
      minimizeCallUi,
      clearActiveCall,
    }),
    [
      mode,
      activeCallId,
      call,
      token,
      startedAtMs,
      liveCallSeconds,
      muted,
      cameraOff,
      speakerOn,
      startActiveCall,
      updateActiveCall,
      showFullScreenCall,
      minimizeCallUi,
      clearActiveCall,
    ]
  );

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
}

export function useVideoCall() {
  const ctx = useContext(VideoCallContext);

  if (!ctx) {
    throw new Error("useVideoCall must be used inside VideoCallProvider");
  }

  return ctx;
}
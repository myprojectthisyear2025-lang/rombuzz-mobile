/** Owns call-tone playback, cancels late loads, and keeps RTC effects local to the phone. */
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import type { IRtcEngine } from "react-native-agora";
import { CALL_SOUND_ASSETS, getCallSoundPath } from "./callSoundAssets";
import {
  activateNativeCallAudio,
  hasNativeCallAudio,
  releaseNativeCallAudio,
  startNativeCallTone, stopNativeCallTone,
} from "./nativeCallAudio";

const OUTGOING = 9301;
const CONNECTED = 9302;
type ToneState = {
  id: string; revision: number; accepted: boolean; connected: boolean; ended: boolean;
  kind?: "incoming" | "outgoing" | "connected" | "ended";
  sound?: Audio.Sound; engine?: IRtcEngine;
};
const states = new Map<string, ToneState>();
let currentId = "";

function stateFor(id: string) {
  let state = states.get(id);
  if (!state) {
    state = { id, revision: 0, accepted: false, connected: false, ended: false };
    states.set(id, state);
    if (states.size > 64) {
      const oldest = [...states.values()].find((s) => s.ended && s.id !== currentId);
      if (oldest) states.delete(oldest.id);
    }
  }
  if (currentId && currentId !== id) void stopCallSound(currentId);
  currentId = id;
  return state;
}

function warn(error: unknown) {
  console.warn("RomBuzz call sound:", error);
}

export async function stopCallSound(id: string) {
  const state = states.get(id);
  if (!state) return;

  if (
    hasNativeCallAudio &&
    (state.kind === "incoming" || state.kind === "outgoing")
  ) {
    stopNativeCallTone(id);
  }

  const wasOutgoing = state.kind === "outgoing";
  state.revision++;
  state.kind = undefined;
  const sound = state.sound;
  state.sound = undefined;
  try { if (wasOutgoing) state.engine?.stopAudioMixing(); } catch {}
  try { state.engine?.stopEffect(OUTGOING); } catch {}
  try { state.engine?.stopEffect(CONNECTED); } catch {}
  state.engine = undefined;
  if (sound) {
    try { await sound.unloadAsync(); } catch {}
  }
}

export async function stopRtcCallSound(id: string) {
  // Repeated screen cleanup must not cancel the end chime after RTC is gone.
  if (states.get(id)?.engine) await stopCallSound(id);
}

async function playStandalone(state: ToneState, kind: "incoming" | "ended") {
  const stopped = stopCallSound(state.id);
  const revision = state.revision;
  const current = () => currentId === state.id && state.revision === revision;
  await stopped;
  if (!current()) return;
  const sound = new Audio.Sound();
  state.kind = kind;
  state.sound = sound;
  try {
    if (!current()) return;
    // Standalone tones run before RTC starts or after RTC has been released.
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false, playsInSilentModeIOS: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true, playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    if (!current()) return;
    await sound.loadAsync(CALL_SOUND_ASSETS[kind], {
      shouldPlay: false, isLooping: kind === "incoming", volume: 0.8,
    });
    if (!current()) return;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (kind === "ended" && status.isLoaded && status.didJustFinish && current()) {
        void stopCallSound(state.id);
      }
    });
    await sound.playAsync();
  } catch (error) {
    if (current()) { warn(error); void stopCallSound(state.id); }
  } finally {
    if (!current()) {
      try { await sound.unloadAsync(); } catch {}
    }
  }
}

export async function playIncomingCallSound(
  id: string, remainingMs = 30_000,
) {
  if (!id) return;
  const state = stateFor(id);
  if (state.ended || state.accepted || state.kind === "incoming") return;

  if (hasNativeCallAudio) {
    const stopped = stopCallSound(id);
    const revision = state.revision;
    await stopped;

    if (
      state.revision !== revision ||
      state.accepted || state.ended || currentId !== id
    ) return;

    state.kind = "incoming";
    startNativeCallTone(id, "incoming", remainingMs);
  } else {
    await playStandalone(state, "incoming");
  }
}

async function playRtcSound(
  id: string,
  engine: IRtcEngine,
  connected: boolean,
  remainingMs = 30_000,
) {
  if (!id) return;
  const state = stateFor(id);
  if (state.ended || (connected ? state.connected : state.accepted || state.connected)) return;
  if (!connected && state.kind === "outgoing" && state.engine === engine) return;
  if (connected) { state.connected = true; state.accepted = true; }
  const stopped = stopCallSound(id);
  const revision = state.revision;
  await stopped;
  if (state.revision !== revision || currentId !== id || state.ended) return;
  state.engine = engine;
  state.kind = connected ? "connected" : "outgoing";
  try {
    if (!connected && hasNativeCallAudio) {
      startNativeCallTone(id, "outgoing", remainingMs);
      return;
    }

    const path = await getCallSoundPath(connected ? "connected" : "outgoing");
    if (state.revision !== revision || currentId !== id || state.ended) return;
    const result = connected
      ? engine.playEffect(CONNECTED, path, 0, 1, 0, 55, false)
      : engine.startAudioMixing(path, true, -1, 0);

    if (result < 0) {
      throw new Error(
        `${connected ? "Connected chime" : "Outgoing tone"} failed: ${result}`,
      );
    }
  } catch (error) { warn(error); }
}

export function playOutgoingCallSound(
  id: string, engine: IRtcEngine, remainingMs = 30_000,
) {
  return playRtcSound(id, engine, false, remainingMs);
}

export function playConnectedCallSound(id: string, engine: IRtcEngine, restored = false) {
  if (states.get(id)?.ended) return;
  activateNativeCallAudio(id);

  if (restored) {
    const state = stateFor(id);
    state.connected = true;
    state.accepted = true;
    return stopCallSound(id);
  }
  return playRtcSound(id, engine, true);
}

export function acceptCallSound(id: string) {
  if (!id) return;
  let state = states.get(id);
  if (!state) {
    state = { id, revision: 0, accepted: true, connected: false, ended: false };
    states.set(id, state);
  }
  state.accepted = true;
  // Do not cut off a connection chime if the accepted socket arrives late.
  if (!state.connected) void stopCallSound(id);
}

export async function finishCallSound(id: string, cleanup: Promise<unknown>) {
  if (!id) { await cleanup.catch(warn); return; }
  const state = states.get(id);
  if (!state) { await cleanup.catch(warn); return; }
  if (state.ended) { await cleanup.catch(warn); return; }
  state.ended = true;
  await Promise.all([stopCallSound(id), cleanup.catch(warn)]);
  releaseNativeCallAudio(id);
  if (currentId === id) await playStandalone(state, "ended");
}
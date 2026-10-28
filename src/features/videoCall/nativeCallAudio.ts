/** Android native ringtone streams and volume controls; Agora owns live audio. */
import { NativeEventEmitter, NativeModules, Platform } from "react-native";

export const hasNativeCallAudio = Platform.OS === "android";
const native = NativeModules.RomBuzzCallAudio;

function moduleOrThrow() {
  if (!native) {
    throw new Error("RomBuzz native call audio requires a new Android build");
  }
  return native;
}

export function startNativeCallTone(
  id: string, kind: string, remainingMs: number,
) {
  if (hasNativeCallAudio) {
    moduleOrThrow().startTone(id, kind, Math.max(0, remainingMs));
  }
}

export function stopNativeCallTone(id: string) {
  if (hasNativeCallAudio) moduleOrThrow().stopTone(id);
}

export function activateNativeCallAudio(id: string) {
  if (hasNativeCallAudio) moduleOrThrow().setCallActive(id);
}

export function releaseNativeCallAudio(id: string) {
  if (hasNativeCallAudio) moduleOrThrow().releaseCall(id);
}

export function subscribeNativeRingExpiry(callback: (id: string) => void) {
  if (!hasNativeCallAudio) return () => {};

  const sub = new NativeEventEmitter(moduleOrThrow()).addListener(
    "rbz:call:ringExpired",
    (event) => callback(String(event.callId || "")),
  );

  return () => sub.remove();
}
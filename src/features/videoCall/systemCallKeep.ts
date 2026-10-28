/**
 * File: src/features/videoCall/systemCallKeep.ts
 * Purpose: Bridge native CallKeep actions to RomBuzz video-call handling.
 */

import RNCallKeep from "react-native-callkeep";

export type SystemCallAction = "answer" | "end";

export type SystemCallEvent = {
  callId: string;
  callUUID: string;
};

type Listener = (action: SystemCallAction, event: SystemCallEvent) => void;

const callIdsByUUID = new Map<string, string>();
const listeners = new Set<Listener>();

let setupPromise: Promise<void> | null = null;
let eventsRegistered = false;

function createCallUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function emit(action: SystemCallAction, callUUID: string) {
  const callId = callIdsByUUID.get(callUUID) || "";
  const event = { callId, callUUID };

  listeners.forEach((listener) => listener(action, event));

  if (action === "end") callIdsByUUID.delete(callUUID);
}

export function setupSystemCallKeep() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await RNCallKeep.setup({
        ios: { appName: "RomBuzz" },
        android: {
          alertTitle: "Phone account permission required",
          alertDescription: "RomBuzz needs call access to show incoming calls.",
          cancelButton: "Cancel",
          okButton: "Continue",
          additionalPermissions: [],
        },
      });

      if (!eventsRegistered) {
        RNCallKeep.addEventListener("answerCall", ({ callUUID }) => {
          emit("answer", callUUID);
        });

        RNCallKeep.addEventListener("endCall", ({ callUUID }) => {
          emit("end", callUUID);
        });

        eventsRegistered = true;
      }
    })();
  }

  return setupPromise;
}

export function subscribeToSystemCallActions(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function showSystemIncomingCall(
  callId: string,
  callerName: string,
) {
  await setupSystemCallKeep();

  const callUUID = createCallUUID();
  callIdsByUUID.set(callUUID, callId);

  RNCallKeep.displayIncomingCall(
    callUUID,
    callId,
    callerName || "RomBuzz user",
    "generic",
    true,
  );

  return callUUID;
}

export function endSystemCall(callId: string) {
  for (const [callUUID, existingCallId] of callIdsByUUID) {
    if (existingCallId !== callId) continue;
    RNCallKeep.endCall(callUUID);
    callIdsByUUID.delete(callUUID);
  }
}

export function markSystemCallActive(callId: string) {
  for (const [callUUID, existingCallId] of callIdsByUUID) {
    if (existingCallId === callId) RNCallKeep.setCurrentCallActive(callUUID);
  }
}
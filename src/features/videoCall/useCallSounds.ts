/** Coordinates native ringing, a shared 30-second deadline, and connection chimes. */
import { useEffect, type RefObject } from "react";
import { AppState } from "react-native";
import type { IRtcEngine } from "react-native-agora";
import {
  acceptCallSound, playConnectedCallSound, playIncomingCallSound,
  playOutgoingCallSound, stopCallSound,
} from "./callSoundPlayer";
import { hasNativeCallAudio } from "./nativeCallAudio";
import {
  ringingRemainingMs, settleUnansweredCall,
  watchUnansweredCall,
} from "./unansweredCalls";
import { useVideoCallSocket } from "./useVideoCallSocket";

export function useIncomingCallSound(
  id: string, busy: boolean, expiresAt?: string | null,
) {
  useEffect(() => {
    if (!id || busy) return;
    watchUnansweredCall(id, expiresAt);

    const sync = () => {
      if (ringingRemainingMs(id) <= 0) return;

      if (hasNativeCallAudio || AppState.currentState === "active") {
        void playIncomingCallSound(id, ringingRemainingMs(id));
      } else {
        void stopCallSound(id);
      }
    };

    sync();
    const subscription = AppState.addEventListener("change", sync);

    return () => {
      subscription.remove();
      void stopCallSound(id);
    };
  }, [id, busy, expiresAt]);
}

type ActiveCallSoundOptions = {
  id: string; caller: boolean; ringing: boolean; joined: boolean;
  hasPeer: boolean; restored: boolean; error: string;
  expiresAt?: string | null;
  engine: RefObject<IRtcEngine | null>;
};

export function useActiveCallSounds(options: ActiveCallSoundOptions) {
  const {
    id, caller, ringing, joined, hasPeer,
    restored: restoreHint, error, engine, expiresAt,
  } = options;

  const restored = restoreHint && !ringing;

  useVideoCallSocket({
    onAccepted: (payload) => {
      if (String(payload.call.id) !== id) return;
      acceptCallSound(id);
      settleUnansweredCall(id);
    },
  });

  useEffect(() => {
    if (!id) return;
    if (hasPeer) settleUnansweredCall(id);
    else if (ringing) watchUnansweredCall(id, expiresAt);
  }, [id, ringing, hasPeer, expiresAt]);

  useEffect(() => {
    if (!id) return;
    if (error) { void stopCallSound(id); return; }
    const rtc = engine.current;
    if (!joined || !rtc) return;

    if (hasPeer) {
      void playConnectedCallSound(id, rtc, restored);
    } else if (
      caller && ringing && !restored && ringingRemainingMs(id) > 0
    ) {
      void playOutgoingCallSound(id, rtc, ringingRemainingMs(id));
    } else {
      void stopCallSound(id);
    }
  }, [id, caller, ringing, joined, hasPeer, restored, error, engine]);
}
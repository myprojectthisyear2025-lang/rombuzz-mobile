/**
 * ============================================================
 * 📁 File: src/features/onboarding/firstSignupTourReplay.ts
 * 🎯 Purpose: Let authenticated screens replay the existing
 *    RomBuzz first-signup tour without changing signup storage.
 *
 * Usage:
 *   Settings emits a replay request.
 *   useFirstSignupTour listens and reopens the existing tour.
 * ============================================================
 */

import { DeviceEventEmitter } from "react-native";

const REPLAY_EVENT =
  "RBZ_REPLAY_FIRST_SIGNUP_TOUR";

export function requestFirstSignupTourReplay() {
  DeviceEventEmitter.emit(REPLAY_EVENT);
}

export function subscribeToFirstSignupTourReplay(
  listener: () => void,
) {
  return DeviceEventEmitter.addListener(
    REPLAY_EVENT,
    listener,
  );
}
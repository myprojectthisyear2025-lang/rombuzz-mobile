/** Shared ringing deadlines, server verification and local UI expiry. */
import { getSocket } from "@/src/lib/socket";
import { DeviceEventEmitter } from "react-native";
import { acceptCallSound, stopCallSound } from "./callSoundPlayer";
import { subscribeNativeRingExpiry } from "./nativeCallAudio";
import { endVideoCall, getVideoCall } from "./videoCallApi";

type Watch = {
  deadline: number;
  timer: ReturnType<typeof setTimeout>;
  dispose: () => void;
  checking: boolean;
};

const watches = new Map<string, Watch>();
const settled = new Set<string>();
let nativeSubscribed = false;

export function settleUnansweredCall(id: string) {
  const watch = watches.get(id);

  if (watch) {
    clearTimeout(watch.timer);
    watch.dispose();
    watches.delete(id);
  }

  settled.add(id);
  if (settled.size > 128) {
    settled.delete(settled.values().next().value!);
  }
}

async function expire(id: string) {
  const watch = watches.get(id);
  if (!watch || watch.checking || settled.has(id)) return;

  watch.checking = true;
  void stopCallSound(id);
  let done = false;

  const close = (call?: unknown) => {
    if (done || settled.has(id)) return;
    done = true;
    settleUnansweredCall(id);

    DeviceEventEmitter.emit("rbz:video-call:expired", {
      call: call || { id, status: "missed", lastReason: "ring_timeout" },
    });
  };

  const offlineFallback = setTimeout(() => close(), 1000);

  try {
    const call = await getVideoCall(id);

    if (call.status === "accepted") {
      if (done) {
        void endVideoCall(id, "ring_timeout_sync").catch(() => {});
      }
      done = true;
      settleUnansweredCall(id);
      acceptCallSound(id);
    } else if (call.status !== "ringing") {
      close(call);
    } else {
      close();
    }
  } catch {
    close();
  } finally {
    clearTimeout(offlineFallback);
  }
}

export function watchUnansweredCall(
  id: string, expiresAt?: string | null,
) {
  if (!id || settled.has(id)) return;

  if (!nativeSubscribed) {
    subscribeNativeRingExpiry((callId) => { void expire(callId); });
    nativeSubscribed = true;
  }

  const parsed = new Date(expiresAt || "").getTime();
  const deadline = Math.min(
    Date.now() + 30_000,
    Number.isFinite(parsed) ? parsed : Infinity,
  );

  if (watches.has(id)) return;

  const watch: Watch = {
    deadline,
    timer: setTimeout(
      () => { void expire(id); },
      Math.max(0, deadline - Date.now()),
    ),
    dispose: () => {},
    checking: false,
  };

  watches.set(id, watch);

  void (async () => {
    const socket = await getSocket();
    if (!socket || watches.get(id) !== watch) return;

    const accepted = (payload: any) => {
      if (String(payload?.call?.id) !== id) return;
      acceptCallSound(id);
      settleUnansweredCall(id);
    };

    const ended = (payload: any) => {
      if (String(payload?.call?.id) !== id) return;
      void stopCallSound(id);
      settleUnansweredCall(id);
    };

    const terminal = ["ended", "declined", "canceled", "missed"];
    socket.on("video-call:accepted", accepted);
    terminal.forEach((event) => {
      socket.on(`video-call:${event}`, ended);
    });

    watch.dispose = () => {
      socket.off("video-call:accepted", accepted);
      terminal.forEach((event) => {
        socket.off(`video-call:${event}`, ended);
      });
    };
  })().catch((error) => {
    console.warn("Call expiry listener:", error);
  });
}

export function ringingRemainingMs(id: string) {
  if (settled.has(id)) return 0;
  return Math.max(
    0,
    (watches.get(id)?.deadline || Date.now() + 30_000) - Date.now(),
  );
}
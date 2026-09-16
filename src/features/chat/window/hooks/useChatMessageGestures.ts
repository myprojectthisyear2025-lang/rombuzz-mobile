import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { formatExactMessageTime } from "@/src/features/chat/thread/chatTimeUtils";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import { getMediaKey } from "./chatMediaUtils";

type GestureArgs = {
  myId: string;
  reactTo: (message: Msg, emoji: string) => Promise<void>;
};
export function useChatMessageGestures({ myId, reactTo }: GestureArgs) {
  const [visibleTimestamp, setVisibleTimestamp] = useState("");
  const [heartBurstId, setHeartBurstId] = useState<string | null>(null);
  const heartAnim = useRef(new Animated.Value(0)).current;
  const protectedMediaAnim = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<Record<string, number>>({});
  const singleTapTimerRef = useRef<Record<string, any>>({});
  const timestampHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const DOUBLE_TAP_MS = 260;
  const triggerHeartBurst = (m: any) => {
    const k = getMediaKey(m);
    setHeartBurstId(k);

    heartAnim.setValue(0);
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setHeartBurstId(null);
    });
  };

  const showTimestampForMessage = (m: Msg) => {
    const formatted = formatExactMessageTime(m?.createdAt ?? m?.time);
    if (!formatted) return;

    setVisibleTimestamp(formatted);

    if (timestampHideTimerRef.current) {
      clearTimeout(timestampHideTimerRef.current);
    }

    timestampHideTimerRef.current = setTimeout(() => {
      setVisibleTimestamp("");
      timestampHideTimerRef.current = null;
    }, 2000);
  };

  const reactLove = (m: Msg) => {
    const myReaction = m?.reactions?.[String(myId)];
    if (myReaction === "❤️") return;

    reactTo(m, "❤️");
    triggerHeartBurst(m);
  };

  const handleMessageTap = (
    item: Msg,
    decodedMessage: any,
    options?: {
      singleTapAction?: () => void;
      enableDoubleTapLove?: boolean;
    },
  ) => {
    const tapKey = String(decodedMessage?.id || item?.id || "");
    if (!tapKey) {
      options?.singleTapAction?.();
      return;
    }

    const now = Date.now();
    const last = lastTapRef.current[tapKey] || 0;

    if (options?.enableDoubleTapLove && now - last <= DOUBLE_TAP_MS) {
      lastTapRef.current[tapKey] = 0;

      if (singleTapTimerRef.current[tapKey]) {
        clearTimeout(singleTapTimerRef.current[tapKey]);
        singleTapTimerRef.current[tapKey] = null;
      }

      reactLove(item);
      return;
    }

    lastTapRef.current[tapKey] = now;

    if (!options?.singleTapAction) return;

    if (singleTapTimerRef.current[tapKey]) {
      clearTimeout(singleTapTimerRef.current[tapKey]);
    }

    singleTapTimerRef.current[tapKey] = setTimeout(() => {
      singleTapTimerRef.current[tapKey] = null;
      lastTapRef.current[tapKey] = 0;
      options.singleTapAction?.();
    }, DOUBLE_TAP_MS);
  };
  useEffect(() => {
    const singleTapTimers = singleTapTimerRef.current;
    return () => {
      if (timestampHideTimerRef.current) {
        clearTimeout(timestampHideTimerRef.current);
      }

      Object.values(singleTapTimers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(protectedMediaAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(protectedMediaAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [protectedMediaAnim]);

  return {
    visibleTimestamp,
    heartBurstId,
    heartAnim,
    protectedMediaAnim,
    handleMessageTap,
    showTimestampForMessage,
  };
}

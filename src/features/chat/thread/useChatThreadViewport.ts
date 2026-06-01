/**
 * ============================================================
 * 📁 File: src/features/chat/thread/useChatThreadViewport.ts
 * 🎯 Purpose: Viewport/scroll controller for the RomBuzz mobile chat thread.
 *
 * Used by:
 *   - app/chat/[peerId].tsx
 *
 * What this hook owns:
 *   - FlatList ref used by the chat thread.
 *   - Scroll-to-latest / scroll-to-top helpers.
 *   - Scroll-to-specific-message + temporary highlight behavior.
 *   - First-load bottom snap timing.
 *   - Near-bottom tracking.
 *   - Top/bottom scroll button visibility timing.
 *   - FlatList onContentSizeChange / onScroll / onScrollToIndexFailed handlers.
 *
 * What this hook must NOT touch:
 *   - Message bubble layout or bubble sizes.
 *   - Composer UI, text input, plus menu, camera menu, or voice recording.
 *   - KeyboardAvoidingView behavior.
 *   - Safe-area padding or bottom padding math.
 *   - Sending, editing, deleting, pinning, reactions, sockets, or media viewing.
 *
 * Why this file exists:
 *   - The chat thread's first-open bottom positioning, scroll behavior,
 *     and highlight behavior were buried inside app/chat/[peerId].tsx.
 *   - This hook keeps that sensitive viewport logic isolated so the chat can
 *     open at the latest message without showing an ugly animated crawl from
 *     the top of the list to the bottom.
 *
 * Important limitation:
 *   - This hook can fix first-open scroll behavior and quiet auto-follow.
 *   - Keyboard/composer/safe-area spacing is controlled in app/chat/[peerId].tsx
 *     by KeyboardAvoidingView, LIST_BOTTOM_PAD, and composer padding.
 * ============================================================
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  InteractionManager,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import type { Msg } from "./chatTypes";

type ScrollToIndexFailedInfo = {
  index: number;
  highestMeasuredFrameIndex: number;
  averageItemLength: number;
};

type UseChatThreadViewportArgs = {
  messages: Msg[];
  loading: boolean;
  focusMsgId: string;
  latestAtTop?: boolean;
};

export function useChatThreadViewport({
  messages,
  loading,
  focusMsgId,
  latestAtTop = false,
}: UseChatThreadViewportArgs) {
  const flatRef = useRef<FlatList<Msg>>(null);

  const [highlightId, setHighlightId] = useState<string>("");
  const highlightTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingFocusIdRef = useRef<string>("");

  const [showScrollBtns, setShowScrollBtns] = useState(false);
  const scrollHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [initialViewportReady, setInitialViewportReady] = useState(false);
  const initialViewportReadyRef = useRef(false);

  const nearBottomRef = useRef(true);
  const pendingFollowLatestRef = useRef(false);

  const didInitialSnapRef = useRef(false);
  const initialOpenSettlingRef = useRef(false);
  const initialSettleTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const initialSettleRafRef = useRef<number[]>([]);
  const interactionHandleRef = useRef<{ cancel?: () => void } | null>(null);

  const setInitialReady = useCallback((next: boolean) => {
    initialViewportReadyRef.current = next;
    setInitialViewportReady(next);
  }, []);

  const clearInitialSettleTimers = useCallback(() => {
    initialSettleTimersRef.current.forEach((timer) => clearTimeout(timer));
    initialSettleTimersRef.current = [];

    initialSettleRafRef.current.forEach((rafId) => {
      try {
        cancelAnimationFrame(rafId);
      } catch {}
    });
    initialSettleRafRef.current = [];

    try {
      interactionHandleRef.current?.cancel?.();
    } catch {}
    interactionHandleRef.current = null;
  }, []);

    const snapToEndQuietly = useCallback(() => {
    try {
      if (latestAtTop) {
        flatRef.current?.scrollToOffset({ offset: 0, animated: false });
      } else {
        flatRef.current?.scrollToEnd({ animated: false });
      }
    } catch {}
  }, [latestAtTop]);

  const scheduleQuietSnap = useCallback(
    (delayMs: number) => {
      const timer = setTimeout(() => {
        const rafId = requestAnimationFrame(() => {
          snapToEndQuietly();
        });

        initialSettleRafRef.current.push(rafId);
      }, delayMs);

      initialSettleTimersRef.current.push(timer);
    },
    [snapToEndQuietly]
  );

  const finishInitialOpenSettle = useCallback(() => {
    snapToEndQuietly();

    requestAnimationFrame(() => {
      snapToEndQuietly();
      nearBottomRef.current = true;
      initialOpenSettlingRef.current = false;
      setInitialReady(true);
    });
  }, [setInitialReady, snapToEndQuietly]);

  const startInitialOpenSettle = useCallback(() => {
    if (didInitialSnapRef.current) return;

    didInitialSnapRef.current = true;
    initialOpenSettlingRef.current = true;
    nearBottomRef.current = true;
    pendingFollowLatestRef.current = false;

    clearInitialSettleTimers();
    setInitialReady(false);

    snapToEndQuietly();
    requestAnimationFrame(() => {
      snapToEndQuietly();
    });

    [16, 32, 64, 96, 140, 190, 250, 330, 430, 560].forEach(scheduleQuietSnap);

    interactionHandleRef.current = InteractionManager.runAfterInteractions(() => {
      const revealTimer = setTimeout(() => {
        finishInitialOpenSettle();
      }, 680);

      initialSettleTimersRef.current.push(revealTimer);
    });
  }, [
    clearInitialSettleTimers,
    finishInitialOpenSettle,
    scheduleQuietSnap,
    setInitialReady,
    snapToEndQuietly,
  ]);

   const scrollToLatest = useCallback((animated = false) => {
    const shouldAnimate =
      !!animated &&
      initialViewportReadyRef.current &&
      !initialOpenSettlingRef.current;

    try {
      if (latestAtTop) {
        flatRef.current?.scrollToOffset({ offset: 0, animated: shouldAnimate });
      } else {
        flatRef.current?.scrollToEnd({ animated: shouldAnimate });
      }
    } catch {}
  }, [latestAtTop]);

  const settleToLatest = useCallback((animated = true) => {
    pendingFollowLatestRef.current = true;

    const shouldAnimate =
      !!animated &&
      initialViewportReadyRef.current &&
      !initialOpenSettlingRef.current;

    requestAnimationFrame(() => {
      try {
        if (latestAtTop) {
          flatRef.current?.scrollToOffset({ offset: 0, animated: shouldAnimate });
        } else {
          flatRef.current?.scrollToEnd({ animated: shouldAnimate });
        }
      } catch {}

      requestAnimationFrame(() => {
        try {
          if (latestAtTop) {
            flatRef.current?.scrollToOffset({ offset: 0, animated: shouldAnimate });
          } else {
            flatRef.current?.scrollToEnd({ animated: shouldAnimate });
          }
        } catch {}

        requestAnimationFrame(() => {
          pendingFollowLatestRef.current = false;
        });
      });
    });
  }, [latestAtTop]);

  const scrollToTop = useCallback(() => {
    if (!initialViewportReadyRef.current) return;

    try {
      if (latestAtTop) {
        flatRef.current?.scrollToEnd({ animated: true });
      } else {
        flatRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch {}
  }, [latestAtTop]);
  const highlightMessage = useCallback((id: string) => {
    const key = String(id);
    setHighlightId(key);

    if (highlightTimeoutsRef.current[key]) {
      clearTimeout(highlightTimeoutsRef.current[key]);
    }

    highlightTimeoutsRef.current[key] = setTimeout(() => {
      setHighlightId((prev) => (prev === key ? "" : prev));

      if (pendingFocusIdRef.current === key) {
        pendingFocusIdRef.current = "";
      }

      delete highlightTimeoutsRef.current[key];
    }, 1800);
  }, []);

  const tryScrollToMessage = useCallback(
    (id: string, animated = true) => {
      const targetId = String(id || "");
      if (!targetId) return false;

      const idx = messages.findIndex((m) => String(m?.id) === targetId);
      if (idx < 0) return false;

      pendingFocusIdRef.current = targetId;

      try {
        flatRef.current?.scrollToIndex({
          index: idx,
          animated,
          viewPosition: 0.5,
        });

        highlightMessage(targetId);
        return true;
      } catch {
        return false;
      }
    },
    [messages, highlightMessage]
  );

  const scrollToMessage = useCallback(
    (id: string) => {
      const targetId = String(id || "");
      if (!targetId) return;

      pendingFocusIdRef.current = targetId;
      setInitialReady(true);

      const idx = messages.findIndex((m) => String(m?.id) === targetId);
      if (idx < 0) return;

      try {
        flatRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.5,
        });

        highlightMessage(targetId);
      } catch {}
    },
    [messages, highlightMessage, setInitialReady]
  );

  const handleScrollToIndexFailed = useCallback(
    (info: ScrollToIndexFailedInfo) => {
      const pendingId = pendingFocusIdRef.current || focusMsgId;
      if (!pendingId) return;

      const averageLen = Number(info?.averageItemLength || 0);
      const fallbackOffset = averageLen > 0 ? averageLen * info.index : 0;

      try {
        flatRef.current?.scrollToOffset({
          offset: Math.max(0, fallbackOffset),
          animated: false,
        });
      } catch {}

      const timer = setTimeout(() => {
        tryScrollToMessage(String(pendingId), true);
      }, 260);

      initialSettleTimersRef.current.push(timer);
    },
    [focusMsgId, tryScrollToMessage]
  );

  const handleContentSizeChange = useCallback(() => {
    if (loading) return;
    if (!messages.length) return;

    if (focusMsgId) return;

    if (!didInitialSnapRef.current) {
      startInitialOpenSettle();
      return;
    }

    if (initialOpenSettlingRef.current || !initialViewportReadyRef.current) {
      snapToEndQuietly();
      return;
    }

    if (pendingFollowLatestRef.current) {
      requestAnimationFrame(() => {
        snapToEndQuietly();
      });
      return;
    }

    if (nearBottomRef.current) {
      requestAnimationFrame(() => {
        snapToEndQuietly();
      });
    }
  }, [
    focusMsgId,
    loading,
    messages.length,
    snapToEndQuietly,
    startInitialOpenSettle,
  ]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!initialViewportReadyRef.current || initialOpenSettlingRef.current) {
      return;
    }

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 50;

    const isNearBottom =
      contentOffset.y + layoutMeasurement.height >=
      contentSize.height - paddingToBottom;

    nearBottomRef.current = isNearBottom;
    setShowScrollBtns(true);

    if (scrollHideTimer.current) {
      clearTimeout(scrollHideTimer.current);
    }

    scrollHideTimer.current = setTimeout(() => {
      setShowScrollBtns(false);
    }, 900);
  }, []);

  useEffect(() => {
    if (loading) {
      clearInitialSettleTimers();

      didInitialSnapRef.current = false;
      initialOpenSettlingRef.current = false;
      initialViewportReadyRef.current = false;
      pendingFollowLatestRef.current = false;
      nearBottomRef.current = true;
      pendingFocusIdRef.current = "";

      setShowScrollBtns(false);
      setInitialViewportReady(false);
      return;
    }

    if (!messages.length) {
      clearInitialSettleTimers();
      didInitialSnapRef.current = true;
      initialOpenSettlingRef.current = false;
      nearBottomRef.current = true;
      setInitialReady(true);
    }
  }, [clearInitialSettleTimers, loading, messages.length, setInitialReady]);

  useEffect(() => {
    if (loading) return;
    if (!messages.length) return;

    if (focusMsgId) {
      clearInitialSettleTimers();
      didInitialSnapRef.current = true;
      initialOpenSettlingRef.current = false;
      setInitialReady(true);
      return;
    }

    startInitialOpenSettle();
  }, [
    clearInitialSettleTimers,
    focusMsgId,
    loading,
    messages.length,
    setInitialReady,
    startInitialOpenSettle,
  ]);

  useEffect(() => {
    if (!focusMsgId) return;
    if (loading) return;
    if (!messages.length) return;

    clearInitialSettleTimers();
    didInitialSnapRef.current = true;
    initialOpenSettlingRef.current = false;
    setInitialReady(true);
    scrollToMessage(focusMsgId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMsgId, loading, messages.length, setInitialReady]);

  useEffect(() => {
    const pendingId = pendingFocusIdRef.current;
    if (!pendingId) return;
    if (loading) return;
    if (!messages.length) return;

    requestAnimationFrame(() => {
      tryScrollToMessage(String(pendingId), false);
    });
  }, [loading, messages.length, tryScrollToMessage]);

  useEffect(() => {
    return () => {
      clearInitialSettleTimers();

      Object.values(highlightTimeoutsRef.current).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
      highlightTimeoutsRef.current = {};

      if (scrollHideTimer.current) {
        clearTimeout(scrollHideTimer.current);
        scrollHideTimer.current = null;
      }
    };
  }, [clearInitialSettleTimers]);

  return {
    flatRef,
    highlightId,
    showScrollBtns,
    initialViewportReady,
    scrollToLatest,
    settleToLatest,
    scrollToTop,
    scrollToMessage,
    handleContentSizeChange,
    handleScroll,
    handleScrollToIndexFailed,
  };
}

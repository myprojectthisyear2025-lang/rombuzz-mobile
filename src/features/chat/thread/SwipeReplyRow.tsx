/**
 * ============================================================
 * 📁 File: src/features/chat/thread/SwipeReplyRow.tsx
 * 🎯 Purpose: Reusable swipe-to-reply gesture wrapper for RomBuzz chat bubbles.
 *
 * Location:
 *   - src/features/chat/thread/SwipeReplyRow.tsx
 *
 * Used by:
 *   - app/chat/[peerId].tsx
 *
 * What this component does:
 *   - Wraps one chat message row.
 *   - Lets received messages swipe RIGHT to reply.
 *   - Lets sent messages swipe LEFT to reply.
 *   - Shows a small reply arrow while swiping.
 *   - Calls onReply() after the swipe crosses the reply threshold.
 *
 * What this component does NOT do:
 *   - It does not send messages.
 *   - It does not edit/delete/pin/react to messages.
 *   - It does not touch sockets.
 *   - It does not know anything about message data except isMine/disabled.
 *
 * Why this file exists:
 *   - app/chat/[peerId].tsx is too large.
 *   - Swipe gesture logic is independent and safe to split out.
 *   - This keeps the chat screen smaller without changing behavior.
 *
 * Important:
 *   - Keep this file gesture-only.
 *   - Do not add API calls here.
 *   - Do not add message mutation logic here.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef } from "react";
import {
    Animated,
    PanResponder,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from "react-native";

const RBZ_WHITE = "#ffffff";
const RBZ_C1 = "#b1123c";

type SwipeReplyRowProps = {
  children: React.ReactNode;
  isMine: boolean;
  disabled?: boolean;
  onReply: () => void;
  style?: StyleProp<ViewStyle>;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function SwipeReplyRow({
  children,
  isMine,
  disabled,
  onReply,
  style,
}: SwipeReplyRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const triggeredRef = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (disabled) return false;

          const { dx, dy } = gesture;
          const intentionalHorizontal =
            Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2;

          if (!intentionalHorizontal) return false;

          return isMine ? dx < 0 : dx > 0;
        },

        onPanResponderGrant: () => {
          triggeredRef.current = false;
        },

        onPanResponderMove: (_, gesture) => {
          const next = isMine
            ? clamp(gesture.dx, -82, 0)
            : clamp(gesture.dx, 0, 82);

          translateX.setValue(next);
        },

        onPanResponderRelease: (_, gesture) => {
          const crossed = isMine ? gesture.dx <= -56 : gesture.dx >= 56;

          if (crossed && !triggeredRef.current) {
            triggeredRef.current = true;
            onReply();
          }

          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
            speed: 18,
          }).start();
        },

        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
            speed: 18,
          }).start();
        },
      }),
    [disabled, isMine, onReply, translateX]
  );

  const iconOpacity = translateX.interpolate({
    inputRange: isMine ? [-82, -22, 0] : [0, 22, 82],
    outputRange: isMine ? [1, 0.35, 0] : [0, 0.35, 1],
    extrapolate: "clamp",
  });

  const iconScale = translateX.interpolate({
    inputRange: isMine ? [-82, 0] : [0, 82],
    outputRange: [1, 0.86],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[styles.swipeReplyRow, style, { transform: [{ translateX }] }]}
      {...(!disabled ? panResponder.panHandlers : {})}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.swipeReplyIconWrap,
          isMine ? styles.swipeReplyIconWrapMine : styles.swipeReplyIconWrapPeer,
          { opacity: iconOpacity, transform: [{ scale: iconScale }] },
        ]}
      >
        <Ionicons name="arrow-undo" size={16} color={RBZ_WHITE} />
      </Animated.View>

      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  swipeReplyRow: {
    position: "relative",
  },

  swipeReplyIconWrap: {
    position: "absolute",
    top: "50%",
    marginTop: -15,
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ_C1,
    zIndex: 1,
  },

  swipeReplyIconWrapMine: {
    right: 8,
  },

  swipeReplyIconWrapPeer: {
    left: 8,
  },
});
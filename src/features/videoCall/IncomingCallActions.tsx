/**
 * 📁 File: src/features/videoCall/IncomingCallActions.tsx
 * 🎯 Purpose: Renders animated decline and answer buttons for an incoming call.
 * Used by: IncomingCallOverlay.tsx.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { incomingCallStyles as styles } from "./incomingCallOverlayStyles";

export default function IncomingCallActions({
  busy,
  onDecline,
  onAnswer,
}: {
  busy: boolean;
  onDecline: () => void;
  onAnswer: () => void;
}) {
  const declineLift = useRef(new Animated.Value(0)).current;
  const answerLift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (busy) {
      declineLift.stopAnimation();
      answerLift.stopAnimation();
      declineLift.setValue(0);
      answerLift.setValue(0);
      return;
    }

    const makeHop = (lift: Animated.Value, startDelay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(startDelay),
          Animated.spring(lift, {
            toValue: -9,
            stiffness: 220,
            damping: 11,
            mass: 0.7,
            useNativeDriver: true,
          }),
          Animated.spring(lift, {
            toValue: 0,
            stiffness: 180,
            damping: 12,
            mass: 0.8,
            useNativeDriver: true,
          }),
          Animated.delay(550),
        ]),
      );

    const declineAnimation = makeHop(declineLift, 0);
    const answerAnimation = makeHop(answerLift, 260);
    declineAnimation.start();
    answerAnimation.start();

    return () => {
      declineAnimation.stop();
      answerAnimation.stop();
    };
  }, [busy, declineLift, answerLift]);

  return (
    <View style={styles.actions}>
      <View style={styles.actionColumn}>
        <Animated.View
          style={[
            styles.pulseWrap,
            { transform: [{ translateY: declineLift }] },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decline video call"
            onPress={onDecline}
            disabled={busy}
            style={({ pressed }) => [
              styles.roundButton,
              styles.declineButton,
              pressed && !busy ? styles.pressed : null,
              busy ? styles.disabled : null,
            ]}
          >
            <Ionicons
              name="call"
              size={28}
              color="#FFFFFF"
              style={styles.flipIcon}
            />
          </Pressable>
        </Animated.View>
        <Text style={styles.labelText}>Decline</Text>
      </View>

      <View style={styles.actionColumn}>
        <Animated.View
          style={[
            styles.pulseWrap,
            { transform: [{ translateY: answerLift }] },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Answer video call"
            onPress={onAnswer}
            disabled={busy}
            style={({ pressed }) => [
              styles.roundButton,
              styles.acceptButton,
              pressed && !busy ? styles.pressed : null,
              busy ? styles.disabled : null,
            ]}
          >
            <Ionicons name="videocam" size={30} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
        <Text style={styles.labelText}>Answer</Text>
      </View>
    </View>
  );
}
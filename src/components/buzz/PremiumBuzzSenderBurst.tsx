/**
 * ============================================================================
 * 📁 File: src/components/buzz/PremiumBuzzSenderBurst.tsx
 * 🎯 Purpose: Sender-side premium animation after paid Buzz is sent
 *
 * Used by:
 * - src/components/profile/BuzzPokeCard.tsx
 *
 * What this does:
 * - Shows a short premium success animation on sender side.
 * - Uses each Buzz type's emoji, gradient, success title/body, and price.
 * - This is only for the sender after a paid Buzz succeeds.
 * ============================================================================
 */

import { type BuzzType } from "@/src/config/buzzTypes";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";

const RBZ = {
  white: "#ffffff",
};

type Props = {
  visible: boolean;
  buzzType: BuzzType | null;
};

export default function PremiumBuzzSenderBurst({
  visible,
  buzzType,
}: Props) {
  const scale = useRef(new Animated.Value(0.86)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !buzzType) return;

    scale.setValue(0.86);
    opacity.setValue(0);
    bounce.setValue(0);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, {
            toValue: -8,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(bounce, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ),
    ]).start();
  }, [bounce, buzzType, opacity, scale, visible]);

  return (
    <Modal visible={visible && !!buzzType} transparent animationType="none">
      <View pointerEvents="none" style={styles.backdrop}>
        {buzzType ? (
          <Animated.View
            style={[
              styles.animatedWrap,
              {
                opacity,
                transform: [{ scale }],
              },
            ]}
          >
            <LinearGradient colors={buzzType.gradient as any} style={styles.card}>
              <Animated.Text
                style={[
                  styles.emoji,
                  {
                    transform: [{ translateY: bounce }],
                  },
                ]}
              >
                {buzzType.emoji}
              </Animated.Text>

              <Text style={styles.title}>{buzzType.senderSuccessTitle}</Text>
              <Text style={styles.body}>{buzzType.senderSuccessBody}</Text>

              <Text style={styles.cost}>-{buzzType.price} BC</Text>
            </LinearGradient>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  animatedWrap: {
    width: "100%",
    maxWidth: 320,
  },
  card: {
    width: "100%",
    borderRadius: 30,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 20,
  },
  emoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  title: {
    color: RBZ.white,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  body: {
    marginTop: 5,
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  cost: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    color: RBZ.white,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
  },
});
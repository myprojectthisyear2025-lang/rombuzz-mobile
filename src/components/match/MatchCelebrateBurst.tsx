/**
 * ============================================================
 * 📁 File: src/components/match/MatchCelebrateBurst.tsx
 * 💖 Purpose: Reusable floating heart + sparkle celebration layer
 * * Used by: src/components/match/MatchCelebrateOverlay.tsx
 * ============================================================
 */

import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
};

type PercentagePosition = `${number}%`;

type BurstItem = {
  left: PercentagePosition;
  top: PercentagePosition;
  size: number;
  glyph: string;
  delay: number;
};

const ITEMS: BurstItem[] = [
  { left: "10%", top: "18%", size: 18, glyph: "✦", delay: 0 },
  { left: "21%", top: "30%", size: 22, glyph: "❤", delay: 130 },
  { left: "14%", top: "58%", size: 20, glyph: "✦", delay: 220 },
  { left: "28%", top: "74%", size: 26, glyph: "❤", delay: 310 },
  { left: "40%", top: "15%", size: 16, glyph: "✦", delay: 80 },
  { left: "52%", top: "24%", size: 28, glyph: "❤", delay: 180 },
  { left: "63%", top: "16%", size: 18, glyph: "✦", delay: 280 },
  { left: "77%", top: "29%", size: 24, glyph: "❤", delay: 360 },
  { left: "86%", top: "48%", size: 18, glyph: "✦", delay: 120 },
  { left: "72%", top: "72%", size: 26, glyph: "❤", delay: 240 },
  { left: "54%", top: "82%", size: 16, glyph: "✦", delay: 330 },
  { left: "34%", top: "84%", size: 18, glyph: "✦", delay: 420 },
];

export default function MatchCelebrateBurst({
  visible,
}: Props) {
  const opacityValues = useRef(
    ITEMS.map(() => new Animated.Value(0))
  ).current;

  const translateValues = useRef(
    ITEMS.map(() => new Animated.Value(10))
  ).current;

  const scaleValues = useRef(
    ITEMS.map(() => new Animated.Value(0.8))
  ).current;

  const loops = useRef<Animated.CompositeAnimation[]>([]);

  const itemStyles = useMemo(
    () =>
      ITEMS.map((item, index) => ({
        base: {
          left: item.left,
          top: item.top,
        },
        animated: {
          opacity: opacityValues[index],
          transform: [
            { translateY: translateValues[index] },
            { scale: scaleValues[index] },
          ],
        },
      })),
    [opacityValues, scaleValues, translateValues]
  );

  useEffect(() => {
    loops.current.forEach((loop) => loop.stop());
    loops.current = [];

    opacityValues.forEach((v) => v.setValue(0));
    translateValues.forEach((v) => v.setValue(10));
    scaleValues.forEach((v) => v.setValue(0.8));

    if (!visible) return;

    loops.current = ITEMS.map((item, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(item.delay),
          Animated.parallel([
            Animated.timing(opacityValues[index], {
              toValue: 1,
              duration: 260,
              useNativeDriver: true,
            }),
            Animated.timing(translateValues[index], {
              toValue: -16,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(scaleValues[index], {
              toValue: 1.08,
              duration: 520,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(opacityValues[index], {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(translateValues[index], {
              toValue: -26,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scaleValues[index], {
              toValue: 0.92,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(500),
        ])
      )
    );

    loops.current.forEach((loop) => loop.start());

    return () => {
      loops.current.forEach((loop) => loop.stop());
      loops.current = [];
    };
  }, [opacityValues, scaleValues, translateValues, visible]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ITEMS.map((item, index) => (
        <Animated.View
          key={`${item.left}-${item.top}-${index}`}
          style={[
            styles.item,
            itemStyles[index].base,
            itemStyles[index].animated,
          ]}
        >
          <Text
            style={[
              styles.glyph,
              { fontSize: item.size },
            ]}
          >
            {item.glyph}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    position: "absolute",
  },
  glyph: {
    color: "#FFD0DF",
    textShadowColor: "rgba(216,52,95,0.75)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
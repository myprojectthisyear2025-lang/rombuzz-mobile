import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

export function useMicroBuzzVisuals(active: boolean, tipCount: number) {
  const [tipIndex, setTipIndex] = useState(0);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const orbPulse = useRef(new Animated.Value(0)).current;
  const sweepValueRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const tipTimer = setInterval(() => setTipIndex(i => (i + 1) % tipCount), 15000);
    const statusTimer = setInterval(() => setStatusMessageIndex(i => (i + 1) % 4), 4000);
    const listener = sweep.addListener(({ value }) => { sweepValueRef.current = value; });
    const loops = [
      Animated.loop(Animated.timing(sweep, { toValue: 1, duration: 8000, useNativeDriver: true })),
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(orbPulse, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
      ])),
    ];
    loops.forEach(loop => loop.start());
    return () => {
      clearInterval(tipTimer);
      clearInterval(statusTimer);
      loops.forEach(loop => loop.stop());
      sweep.removeListener(listener);
    };
  }, [active, tipCount, sweep, pulse, glowPulse, orbPulse]);

  return { tipIndex, statusMessageIndex, sweep, pulse, glowPulse, orbPulse, sweepValueRef };
}

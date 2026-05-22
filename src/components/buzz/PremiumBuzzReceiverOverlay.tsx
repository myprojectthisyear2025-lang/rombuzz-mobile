/**
 * ============================================================================
 * 📁 File: src/components/buzz/PremiumBuzzReceiverOverlay.tsx
 * 🎯 Purpose: Full-screen receiver-side premium Buzz animation overlay
 *
 * Used by:
 * - app/(tabs)/_layout.tsx
 *
 * What this does:
 * - Shows a screen-wide premium animation based on buzzTypeId / animationKey.
 * - Removes the old square/card message UI from receiver side.
 * - Shows only the premium animation + sender avatar/name bubble.
 * - Avatar bubble opens sender's ViewProfile.
 * - Auto-fades in 4 seconds or less.
 * ============================================================================
 */

import { getBuzzTypeById, type BuzzType } from "@/src/config/buzzTypes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const RBZ = {
  white: "#ffffff",
  dark: "#0f172a",
};

export type PremiumBuzzOverlayPayload = {
  buzzTypeId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
};

type Props = {
  visible: boolean;
  payload: PremiumBuzzOverlayPayload | null;
  onClose: () => void;
};

type ParticleSeed = {
  id: string;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  opacity: number;
};

type EffectKey =
  | "cupid"
  | "midnight"
  | "rain"
  | "rainbow"
  | "sunshine"
  | "thunder"
  | "ring"
  | "teddy"
  | "spotlight"
  | "soul"
  | "valentine"
  | "snow"
  | "spooky"
  | "holiday"
  | "new_year"
  | "normal";

type EffectPreset = {
  key: EffectKey;
  overlay: readonly [string, string];
  avatarPosition: {
    top: number;
    left: number;
  };
  avatarMotion: "float" | "bounce" | "drift" | "shake";
};

const EFFECT_PRESETS: Record<EffectKey, EffectPreset> = {
  cupid: {
    key: "cupid",
    overlay: ["rgba(190,18,60,0.16)", "rgba(244,63,94,0.07)"],
    avatarPosition: { top: 0.62, left: 0.5 },
    avatarMotion: "bounce",
  },
  midnight: {
    key: "midnight",
    overlay: ["rgba(2,6,23,0.78)", "rgba(30,41,59,0.42)"],
    avatarPosition: { top: 0.62, left: 0.46 },
    avatarMotion: "drift",
  },
  rain: {
    key: "rain",
    overlay: ["rgba(30,64,175,0.22)", "rgba(8,47,73,0.13)"],
    avatarPosition: { top: 0.62, left: 0.5 },
    avatarMotion: "float",
  },
  rainbow: {
    key: "rainbow",
    overlay: ["rgba(255,255,255,0.06)", "rgba(236,72,153,0.06)"],
    avatarPosition: { top: 0.68, left: 0.5 },
    avatarMotion: "bounce",
  },
  sunshine: {
    key: "sunshine",
    overlay: ["rgba(251,191,36,0.26)", "rgba(249,115,22,0.10)"],
    avatarPosition: { top: 0.64, left: 0.5 },
    avatarMotion: "bounce",
  },
  thunder: {
    key: "thunder",
    overlay: ["rgba(15,23,42,0.72)", "rgba(49,46,129,0.36)"],
    avatarPosition: { top: 0.64, left: 0.5 },
    avatarMotion: "shake",
  },
  ring: {
    key: "ring",
    overlay: ["rgba(250,204,21,0.12)", "rgba(15,23,42,0.12)"],
    avatarPosition: { top: 0.66, left: 0.5 },
    avatarMotion: "float",
  },
  teddy: {
    key: "teddy",
    overlay: ["rgba(180,83,9,0.18)", "rgba(251,113,133,0.08)"],
    avatarPosition: { top: 0.68, left: 0.5 },
    avatarMotion: "bounce",
  },
  spotlight: {
    key: "spotlight",
    overlay: ["rgba(15,23,42,0.26)", "rgba(245,158,11,0.08)"],
    avatarPosition: { top: 0.66, left: 0.5 },
    avatarMotion: "float",
  },
  soul: {
    key: "soul",
    overlay: ["rgba(88,28,135,0.28)", "rgba(190,24,93,0.12)"],
    avatarPosition: { top: 0.68, left: 0.5 },
    avatarMotion: "drift",
  },
  valentine: {
    key: "valentine",
    overlay: ["rgba(225,29,72,0.18)", "rgba(219,39,119,0.08)"],
    avatarPosition: { top: 0.66, left: 0.5 },
    avatarMotion: "bounce",
  },
  snow: {
    key: "snow",
    overlay: ["rgba(56,189,248,0.18)", "rgba(99,102,241,0.08)"],
    avatarPosition: { top: 0.66, left: 0.5 },
    avatarMotion: "drift",
  },
  spooky: {
    key: "spooky",
    overlay: ["rgba(88,28,135,0.26)", "rgba(124,45,18,0.16)"],
    avatarPosition: { top: 0.66, left: 0.5 },
    avatarMotion: "float",
  },
  holiday: {
    key: "holiday",
    overlay: ["rgba(22,101,52,0.20)", "rgba(185,28,28,0.10)"],
    avatarPosition: { top: 0.66, left: 0.5 },
    avatarMotion: "bounce",
  },
  new_year: {
    key: "new_year",
    overlay: ["rgba(15,23,42,0.42)", "rgba(245,158,11,0.12)"],
    avatarPosition: { top: 0.68, left: 0.5 },
    avatarMotion: "bounce",
  },
  normal: {
    key: "normal",
    overlay: ["rgba(216,52,95,0.16)", "rgba(181,23,158,0.08)"],
    avatarPosition: { top: 0.65, left: 0.5 },
    avatarMotion: "bounce",
  },
};

function resolveEffectKey(type: BuzzType | null, payload?: PremiumBuzzOverlayPayload | null): EffectKey {
  const raw = String(
    type?.animationKey || type?.id || payload?.buzzTypeId || "normal"
  ).toLowerCase();

  if (raw.includes("cupid")) return "cupid";
  if (raw.includes("midnight")) return "midnight";
  if (raw.includes("rainbow")) return "rainbow";
  if (raw.includes("rain")) return "rain";
  if (raw.includes("sunshine")) return "sunshine";
  if (raw.includes("thunder")) return "thunder";
  if (raw.includes("ring")) return "ring";
  if (raw.includes("teddy")) return "teddy";
  if (raw.includes("spotlight")) return "spotlight";
  if (raw.includes("soul")) return "soul";
  if (raw.includes("valentine")) return "valentine";
  if (raw.includes("snow")) return "snow";
  if (raw.includes("spooky")) return "spooky";
  if (raw.includes("holiday")) return "holiday";
  if (raw.includes("new")) return "new_year";

  return "normal";
}

function createSeeds(count: number, width: number, height: number, key: string) {
  const seeds: ParticleSeed[] = [];

  for (let i = 0; i < count; i += 1) {
    const base = (i + 1) * 9301 + key.length * 49297;
    const pseudo = Math.abs(Math.sin(base) * 10000);
    const pseudo2 = Math.abs(Math.sin(base + 91) * 10000);
    const pseudo3 = Math.abs(Math.sin(base + 173) * 10000);
    const pseudo4 = Math.abs(Math.sin(base + 251) * 10000);

    seeds.push({
      id: `${key}-${i}`,
      left: (pseudo % 1) * width,
      top: -height * 0.2 + (pseudo2 % 1) * height * 0.24,
      size: 10 + (pseudo3 % 1) * 22,
      delay: (pseudo4 % 1) * 0.55,
      duration: 0.55 + (pseudo2 % 1) * 0.75,
      drift: -42 + (pseudo3 % 1) * 84,
      rotate: -45 + (pseudo2 % 1) * 90,
      opacity: 0.5 + (pseudo % 1) * 0.45,
    });
  }

  return seeds;
}

function FallingEmoji({
  seed,
  progress,
  emoji,
  height,
  color,
  scale = 1,
  rotate = true,
}: {
  seed: ParticleSeed;
  progress: Animated.Value;
  emoji: string;
  height: number;
  color?: string;
  scale?: number;
  rotate?: boolean;
}) {
  const inputStart = seed.delay;
  const inputMid = Math.min(1, seed.delay + seed.duration / 2);
  const inputEnd = Math.min(1, seed.delay + seed.duration);

  const translateY = progress.interpolate({
    inputRange: [0, inputStart, inputEnd, 1],
    outputRange: [seed.top, seed.top, height + seed.size * 4, height + seed.size * 4],
    extrapolate: "clamp",
  });

  const translateX = progress.interpolate({
    inputRange: [0, inputMid, 1],
    outputRange: [seed.left, seed.left + seed.drift, seed.left + seed.drift * 1.4],
    extrapolate: "clamp",
  });

  const opacity = progress.interpolate({
    inputRange: [0, inputStart, inputMid, inputEnd, 1],
    outputRange: [0, seed.opacity, seed.opacity, 0, 0],
    extrapolate: "clamp",
  });

  const rotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [`${seed.rotate}deg`, `${seed.rotate + 130}deg`],
  });

  return (
    <Animated.Text
      pointerEvents="none"
      style={
        [
          styles.fallingEmoji,
          {
            opacity,
            color,
            fontSize: seed.size * scale,
            lineHeight: seed.size * scale + 6,
            transform: [
              { translateX },
              { translateY },
              { rotate: rotate ? rotation : "0deg" },
            ],
          },
        ] as any
      }
    >
      {emoji}
    </Animated.Text>
  );
}

function RainDrop({
  seed,
  progress,
  height,
}: {
  seed: ParticleSeed;
  progress: Animated.Value;
  height: number;
}) {
  const inputStart = seed.delay;
  const inputEnd = Math.min(1, seed.delay + seed.duration);

  const translateY = progress.interpolate({
    inputRange: [0, inputStart, inputEnd, 1],
    outputRange: [seed.top, seed.top, height + 60, height + 60],
    extrapolate: "clamp",
  });

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [seed.left, seed.left + seed.drift * 0.25],
    extrapolate: "clamp",
  });

  const opacity = progress.interpolate({
    inputRange: [0, inputStart, inputStart + 0.04, inputEnd, 1],
    outputRange: [0, 0, seed.opacity, 0, 0],
    extrapolate: "clamp",
  });

  return (
    <Animated.Text
      pointerEvents="none"
      style={
        [
          styles.fallingEmoji,
          {
            opacity,
            color: "rgba(147,197,253,0.95)",
            fontSize: seed.size * 1.35,
            lineHeight: seed.size * 1.35 + 4,
            transform: [{ translateX }, { translateY }, { rotate: "-12deg" }],
          },
        ] as any
      }
    >
      💧
    </Animated.Text>
  );
}

function RainbowArc({
  progress,
  width,
  height,
}: {
  progress: Animated.Value;
  width: number;
  height: number;
}) {
  const colors = [
    "#ef4444",
    "#f97316",
    "#facc15",
    "#22c55e",
    "#38bdf8",
    "#6366f1",
    "#a855f7",
  ];

  const dots: Array<{
    id: string;
    color: string;
    left: number;
    top: number;
    delay: number;
    size: number;
  }> = [];

  const centerX = width / 2;
  const baseY = height * 0.52;
  const radiusBase = Math.min(width * 0.43, height * 0.25);

  colors.forEach((color, colorIndex) => {
    const radius = radiusBase - colorIndex * 12;

    for (let i = 0; i <= 28; i += 1) {
      const t = i / 28;
      const angle = Math.PI - Math.PI * t;
      const left = centerX + Math.cos(angle) * radius;
      const top = baseY - Math.sin(angle) * radius;

      dots.push({
        id: `${colorIndex}-${i}`,
        color,
        left,
        top,
        delay: t * 0.48,
        size: 8 + colorIndex * 0.2,
      });
    }
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map((dot) => {
        const opacity = progress.interpolate({
          inputRange: [0, dot.delay, Math.min(1, dot.delay + 0.16), 0.92, 1],
          outputRange: [0, 0, 1, 1, 0],
          extrapolate: "clamp",
        });

        const scale = progress.interpolate({
          inputRange: [0, dot.delay, Math.min(1, dot.delay + 0.18), 1],
          outputRange: [0.35, 0.35, 1, 1],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={dot.id}
            style={
              [
                styles.rainbowDot,
                {
                  left: dot.left,
                  top: dot.top,
                  width: dot.size,
                  height: dot.size,
                  borderRadius: dot.size / 2,
                  backgroundColor: dot.color,
                  opacity,
                  transform: [{ scale }],
                },
              ] as any
            }
          />
        );
      })}
    </View>
  );
}

function SpotlightEffect({
  progress,
  width,
  height,
}: {
  progress: Animated.Value;
  width: number;
  height: number;
}) {
  const beamLeft = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-18deg", "6deg", "-12deg"],
  });

  const beamRight = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["18deg", "-6deg", "12deg"],
  });

  const glowOpacity = progress.interpolate({
    inputRange: [0, 0.16, 0.78, 1],
    outputRange: [0, 0.9, 0.8, 0],
    extrapolate: "clamp",
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={
          [
            styles.spotlightBeam,
            {
              left: width * 0.02,
              top: -40,
              height: height * 0.9,
              transform: [{ rotate: beamLeft }],
              opacity: glowOpacity,
            },
          ] as any
        }
      />
      <Animated.View
        style={
          [
            styles.spotlightBeam,
            {
              right: width * 0.02,
              top: -40,
              height: height * 0.9,
              transform: [{ rotate: beamRight }],
              opacity: glowOpacity,
            },
          ] as any
        }
      />
      <Animated.View
        style={
          [
            styles.spotlightCircle,
            {
              left: width * 0.22,
              top: height * 0.42,
              opacity: glowOpacity,
            },
          ] as any
        }
      />
    </View>
  );
}

function SoulConnectionEffect({
  progress,
  width,
  height,
}: {
  progress: Animated.Value;
  width: number;
  height: number;
}) {
  const pulse = progress.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: [0.65, 1.12, 0.9, 1.08, 0.75],
    extrapolate: "clamp",
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.12, 0.82, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: "clamp",
  });

  const threadScaleX = progress.interpolate({
    inputRange: [0, 0.22, 0.7, 1],
    outputRange: [0.05, 1, 1, 0.25],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity }] as any}
    >
      <Animated.Text
        style={
          [
            styles.soulHeart,
            {
              left: width * 0.22,
              top: height * 0.34,
              transform: [{ scale: pulse }],
            },
          ] as any
        }
      >
        💗
      </Animated.Text>

      <Animated.View
        style={
          [
            styles.soulThread,
            {
              left: width * 0.36,
              top: height * 0.405,
              width: width * 0.28,
              transform: [{ scaleX: threadScaleX }],
            },
          ] as any
        }
      />

      <Animated.Text
        style={
          [
            styles.soulHeart,
            {
              left: width * 0.64,
              top: height * 0.34,
              transform: [{ scale: pulse }],
            },
          ] as any
        }
      >
        💜
      </Animated.Text>

      <Animated.Text
        style={
          [
            styles.soulInfinity,
            {
              left: width * 0.42,
              top: height * 0.445,
              transform: [{ scale: pulse }],
            },
          ] as any
        }
      >
        ∞
      </Animated.Text>
    </Animated.View>
  );
}

export default function PremiumBuzzReceiverOverlay({
  visible,
  payload,
  onClose,
}: Props) {
  const router = useRouter();
  const { width, height } = Dimensions.get("window");

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const avatarMotion = useRef(new Animated.Value(0)).current;
  const avatarPulse = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const closeCalledRef = useRef(false);

  const buzzType: BuzzType | null = useMemo(() => {
    if (!payload?.buzzTypeId) return null;
    return getBuzzTypeById(payload.buzzTypeId);
  }, [payload?.buzzTypeId]);

  const effectKey = useMemo(() => resolveEffectKey(buzzType, payload), [buzzType, payload]);
  const preset = EFFECT_PRESETS[effectKey] || EFFECT_PRESETS.normal;

  const particles = useMemo(() => {
    return createSeeds(72, width, height, effectKey);
  }, [effectKey, height, width]);

  const closeOverlay = () => {
    if (closeCalledRef.current) return;
    closeCalledRef.current = true;

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (!visible || !payload || !buzzType) return;

    closeCalledRef.current = false;

    overlayOpacity.setValue(0);
    progress.setValue(0);
    avatarMotion.setValue(0);
    avatarPulse.setValue(1);
    flashOpacity.setValue(0);

    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: 3650,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    const avatarLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarMotion, {
          toValue: 1,
          duration: preset.avatarMotion === "shake" ? 120 : 560,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(avatarMotion, {
          toValue: 0,
          duration: preset.avatarMotion === "shake" ? 120 : 560,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulse, {
          toValue: 1.06,
          duration: 460,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulse, {
          toValue: 1,
          duration: 460,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const thunderLoop =
      effectKey === "thunder" || effectKey === "new_year"
        ? Animated.loop(
            Animated.sequence([
              Animated.delay(260),
              Animated.timing(flashOpacity, {
                toValue: effectKey === "thunder" ? 0.75 : 0.38,
                duration: 55,
                useNativeDriver: true,
              }),
              Animated.timing(flashOpacity, {
                toValue: 0,
                duration: 130,
                useNativeDriver: true,
              }),
              Animated.delay(520),
            ]),
            { iterations: 4 }
          )
        : null;

    avatarLoop.start();
    pulseLoop.start();
    thunderLoop?.start();

    const closeTimer = setTimeout(() => {
      avatarLoop.stop();
      pulseLoop.stop();
      thunderLoop?.stop();
      closeOverlay();
    }, 3950);

    return () => {
      clearTimeout(closeTimer);
      avatarLoop.stop();
      pulseLoop.stop();
      thunderLoop?.stop();
    };
  }, [
    avatarMotion,
    avatarPulse,
    buzzType,
    effectKey,
    flashOpacity,
    onClose,
    overlayOpacity,
    payload,
    preset.avatarMotion,
    progress,
    visible,
  ]);

  const openSenderProfile = () => {
    if (!payload?.senderId) return;

    closeCalledRef.current = true;
    onClose();

    router.push({
      pathname: "/(tabs)/view-profile" as any,
      params: {
        userId: payload.senderId,
        fromPremiumBuzz: "1",
      },
    });
  };

  if (!payload || !buzzType) return null;

  const avatarTranslateY = avatarMotion.interpolate({
    inputRange: [0, 1],
    outputRange:
      preset.avatarMotion === "drift"
        ? [0, -18]
        : preset.avatarMotion === "shake"
        ? [-2, 2]
        : [0, -12],
  });

  const avatarTranslateX = avatarMotion.interpolate({
    inputRange: [0, 1],
    outputRange:
      preset.avatarMotion === "drift"
        ? [-18, 18]
        : preset.avatarMotion === "shake"
        ? [-10, 10]
        : [-8, 8],
  });

  const fadeOutOpacity = progress.interpolate({
    inputRange: [0, 0.08, 0.88, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: "clamp",
  });

  const bigScale = progress.interpolate({
    inputRange: [0, 0.22, 0.72, 1],
    outputRange: [0.45, 1.12, 1, 0.75],
    extrapolate: "clamp",
  });

  const fallFromTop = progress.interpolate({
    inputRange: [0, 0.12, 0.86, 1],
    outputRange: [-160, -160, height * 0.28, height * 0.36],
    extrapolate: "clamp",
  });

  const cupidArrowX = progress.interpolate({
    inputRange: [0, 0.18, 0.72, 1],
    outputRange: [-width * 0.75, -width * 0.75, 0, width * 0.18],
    extrapolate: "clamp",
  });

  const moonOpacity = progress.interpolate({
    inputRange: [0, 0.12, 0.78, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: "clamp",
  });

  const moonScale = progress.interpolate({
    inputRange: [0, 0.22, 1],
    outputRange: [0.58, 1, 1.12],
    extrapolate: "clamp",
  });

  const sunRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "60deg"],
  });

  return (
    <Modal visible={visible && !!payload && !!buzzType} transparent animationType="none">
      <Animated.View style={[styles.root, { opacity: overlayOpacity }] as any}>
        <LinearGradient colors={preset.overlay as any} style={StyleSheet.absoluteFill} />

        {effectKey === "rain" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {particles.slice(0, 68).map((seed) => (
              <RainDrop key={seed.id} seed={seed} progress={progress} height={height} />
            ))}
          </View>
        ) : null}

        {effectKey === "rainbow" ? (
          <RainbowArc progress={progress} width={width} height={height} />
        ) : null}

        {effectKey === "sunshine" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.Text
              style={
                [
                  styles.bigSun,
                  {
                    left: width * 0.5 - 72,
                    top: height * 0.16,
                    opacity: fadeOutOpacity,
                    transform: [{ scale: bigScale }, { rotate: sunRotate }],
                  },
                ] as any
              }
            >
              ☀️
            </Animated.Text>

            {particles.slice(0, 28).map((seed, index) => (
              <FallingEmoji
                key={seed.id}
                seed={seed}
                progress={progress}
                emoji="☀️"
                height={height}
                scale={index % 3 === 0 ? 1.25 : 0.86}
                rotate
              />
            ))}
          </View>
        ) : null}

        {effectKey === "thunder" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.View
              style={[styles.thunderFlash, { opacity: flashOpacity }] as any}
            />

            <Animated.Text
              style={
                [
                  styles.bigThunder,
                  {
                    left: width * 0.5 - 88,
                    top: height * 0.18,
                    opacity: fadeOutOpacity,
                    transform: [{ scale: bigScale }, { rotate: "-8deg" }],
                  },
                ] as any
              }
            >
              ⚡
            </Animated.Text>

            <Animated.Text
              style={
                [
                  styles.bigThunderCloud,
                  {
                    left: width * 0.5 - 105,
                    top: height * 0.1,
                    opacity: fadeOutOpacity,
                    transform: [{ scale: bigScale }],
                  },
                ] as any
              }
            >
              🌩️
            </Animated.Text>

            {particles.slice(0, 38).map((seed) => (
              <RainDrop key={seed.id} seed={seed} progress={progress} height={height} />
            ))}
          </View>
        ) : null}

        {effectKey === "ring" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.Text
              style={
                [
                  styles.bigRing,
                  {
                    left: width * 0.5 - 78,
                    top: 0,
                    opacity: fadeOutOpacity,
                    transform: [{ translateY: fallFromTop }, { scale: bigScale }],
                  },
                ] as any
              }
            >
              💍
            </Animated.Text>

            <Animated.Text
              style={
                [
                  styles.bigDiamond,
                  {
                    left: width * 0.5 + 26,
                    top: 0,
                    opacity: fadeOutOpacity,
                    transform: [
                      { translateY: fallFromTop },
                      { scale: avatarPulse },
                      { rotate: "12deg" },
                    ],
                  },
                ] as any
              }
            >
              💎
            </Animated.Text>

            {particles.slice(0, 24).map((seed) => (
              <FallingEmoji
                key={seed.id}
                seed={seed}
                progress={progress}
                emoji="✦"
                height={height}
                color="rgba(254,240,138,0.96)"
                scale={1.25}
              />
            ))}
          </View>
        ) : null}

        {effectKey === "teddy" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.Text
              style={
                [
                  styles.bigTeddy,
                  {
                    left: width * 0.5 - 86,
                    top: height * 0.19,
                    opacity: fadeOutOpacity,
                    transform: [{ scale: bigScale }, { translateY: avatarTranslateY }],
                  },
                ] as any
              }
            >
              🧸
            </Animated.Text>

            {particles.slice(0, 30).map((seed, index) => (
              <FallingEmoji
                key={seed.id}
                seed={seed}
                progress={progress}
                emoji={index % 4 === 0 ? "🧸" : "💗"}
                height={height}
                scale={index % 4 === 0 ? 1.18 : 0.92}
              />
            ))}
          </View>
        ) : null}

        {effectKey === "spotlight" ? (
          <SpotlightEffect progress={progress} width={width} height={height} />
        ) : null}

        {effectKey === "soul" ? (
          <SoulConnectionEffect progress={progress} width={width} height={height} />
        ) : null}

        {effectKey === "midnight" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.Text
              style={
                [
                  styles.bigMoon,
                  {
                    right: width * 0.12,
                    top: height * 0.12,
                    opacity: moonOpacity,
                    transform: [{ scale: moonScale }],
                  },
                ] as any
              }
            >
              🌕
            </Animated.Text>

            {particles.slice(0, 36).map((seed, index) => (
              <FallingEmoji
                key={seed.id}
                seed={seed}
                progress={progress}
                emoji={index % 4 === 0 ? "✦" : "·"}
                height={height}
                color="rgba(255,255,255,0.92)"
                scale={index % 4 === 0 ? 1.2 : 0.9}
              />
            ))}
          </View>
        ) : null}

        {effectKey === "cupid" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.Text
              style={
                [
                  styles.bigHeart,
                  {
                    left: width * 0.5 - 82,
                    top: height * 0.23,
                    opacity: fadeOutOpacity,
                    transform: [{ scale: bigScale }],
                  },
                ] as any
              }
            >
              ❤️
            </Animated.Text>

            <Animated.Text
              style={
                [
                  styles.bigArrow,
                  {
                    left: width * 0.5 - 115,
                    top: height * 0.305,
                    opacity: fadeOutOpacity,
                    transform: [{ translateX: cupidArrowX }, { rotate: "-8deg" }],
                  },
                ] as any
              }
            >
              ➶
            </Animated.Text>
          </View>
        ) : null}

        {effectKey === "snow" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {particles.slice(0, 54).map((seed, index) => (
              <FallingEmoji
                key={seed.id}
                seed={seed}
                progress={progress}
                emoji={index % 4 === 0 ? "❄️" : "✦"}
                height={height}
                color="rgba(255,255,255,0.95)"
                scale={index % 4 === 0 ? 0.95 : 0.7}
              />
            ))}
          </View>
        ) : null}

        {effectKey === "valentine" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {particles.slice(0, 44).map((seed, index) => (
              <FallingEmoji
                key={seed.id}
                seed={seed}
                progress={progress}
                emoji={index % 3 === 0 ? "🌹" : "💗"}
                height={height}
                scale={index % 3 === 0 ? 1.15 : 0.9}
              />
            ))}
          </View>
        ) : null}

        {effectKey === "spooky" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {particles.slice(0, 32).map((seed, index) => (
              <FallingEmoji
                key={seed.id}
                seed={seed}
                progress={progress}
                emoji={index % 4 === 0 ? "👻" : "🎃"}
                height={height}
                scale={index % 4 === 0 ? 1.15 : 0.95}
              />
            ))}
          </View>
        ) : null}

        {effectKey === "holiday" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {particles.slice(0, 40).map((seed, index) => (
              <FallingEmoji
                key={seed.id}
                seed={seed}
                progress={progress}
                emoji={index % 5 === 0 ? "🎄" : index % 2 === 0 ? "✨" : "❄️"}
                height={height}
                scale={index % 5 === 0 ? 1.1 : 0.8}
              />
            ))}
          </View>
        ) : null}

        {effectKey === "new_year" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.View
              style={[styles.thunderFlash, { opacity: flashOpacity }] as any}
            />

            {particles.slice(0, 52).map((seed, index) => (
              <FallingEmoji
                key={seed.id}
                seed={seed}
                progress={progress}
                emoji={["🎆", "✨", "●", "◆"][index % 4]}
                height={height}
                scale={index % 4 === 0 ? 1.2 : 0.9}
              />
            ))}
          </View>
        ) : null}

        {effectKey === "normal" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {particles.slice(0, 28).map((seed, index) => (
              <FallingEmoji
                key={seed.id}
                seed={seed}
                progress={progress}
                emoji={index % 3 === 0 ? "❤️" : "✨"}
                height={height}
                scale={0.9}
              />
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={openSenderProfile}
          style={[
            styles.avatarPress,
            {
              left: width * preset.avatarPosition.left - 60,
              top: height * preset.avatarPosition.top,
            },
          ]}
        >
          <Animated.View
            style={
              [
                styles.avatarFloatWrap,
                {
                  opacity: fadeOutOpacity,
                  transform: [
                    { translateX: avatarTranslateX },
                    { translateY: avatarTranslateY },
                    { scale: avatarPulse },
                  ],
                },
              ] as any
            }
          >
            <LinearGradient colors={buzzType.gradient as any} style={styles.avatarGlow}>
              <View style={styles.avatarRing}>
                {payload.senderAvatar ? (
                  <Image source={{ uri: payload.senderAvatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Ionicons name="person" size={34} color={RBZ.white} />
                  </View>
                )}
              </View>
            </LinearGradient>

            <View style={styles.nameBubble}>
              <Text numberOfLines={1} style={styles.senderName}>
                {payload.senderName || "Someone"}
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.04)",
  },
  fallingEmoji: {
    position: "absolute",
    left: 0,
    top: 0,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(255,255,255,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  rainbowDot: {
    position: "absolute",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 8,
  },
  bigSun: {
    position: "absolute",
    fontSize: 144,
    textShadowColor: "rgba(254,240,138,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },
  thunderFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  bigThunder: {
    position: "absolute",
    fontSize: 170,
    textShadowColor: "rgba(216,180,254,0.95)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 26,
  },
  bigThunderCloud: {
    position: "absolute",
    fontSize: 150,
    opacity: 0.92,
  },
  bigRing: {
    position: "absolute",
    fontSize: 128,
    textShadowColor: "rgba(254,240,138,0.95)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  bigDiamond: {
    position: "absolute",
    fontSize: 72,
    textShadowColor: "rgba(191,219,254,0.95)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  bigTeddy: {
    position: "absolute",
    fontSize: 170,
    textShadowColor: "rgba(255,255,255,0.65)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  spotlightBeam: {
    position: "absolute",
    width: 155,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    backgroundColor: "rgba(253,224,71,0.22)",
    shadowColor: "#fde68a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 22,
  },
  spotlightCircle: {
    position: "absolute",
    width: 210,
    height: 82,
    borderRadius: 100,
    backgroundColor: "rgba(253,224,71,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  soulHeart: {
    position: "absolute",
    fontSize: 72,
    textShadowColor: "rgba(244,114,182,0.85)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  soulThread: {
    position: "absolute",
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.72)",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
  },
  soulInfinity: {
    position: "absolute",
    fontSize: 84,
    color: "rgba(255,255,255,0.86)",
    fontWeight: "900",
    textShadowColor: "rgba(216,180,254,0.95)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  bigMoon: {
    position: "absolute",
    fontSize: 132,
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },
  bigHeart: {
    position: "absolute",
    fontSize: 160,
    textShadowColor: "rgba(248,113,113,0.95)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },
  bigArrow: {
    position: "absolute",
    fontSize: 132,
    color: "#7f1d1d",
    fontWeight: "900",
    textShadowColor: "rgba(255,255,255,0.68)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  avatarPress: {
    position: "absolute",
    width: 120,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  avatarFloatWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGlow: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.52,
    shadowRadius: 18,
    elevation: 16,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.84)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  avatarFallback: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  nameBubble: {
    marginTop: 8,
    maxWidth: 150,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  senderName: {
    color: RBZ.white,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
});
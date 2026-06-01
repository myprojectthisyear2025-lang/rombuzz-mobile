/**
 * ============================================================
 * 📁 Location: src/components/chat/ChatGiftRevealAnimation.tsx
 * 🎁 Purpose: 2-second premium gift-only reveal animation.
 *
 * Used by:
 *  - src/components/chat/ChatGiftMessageBubble.tsx
 *
 * What this file does:
 *  - Shows ONLY the gift image during reveal/replay.
 *  - Keeps the animation inside the same chat bubble area.
 *  - Randomly selects a stable animation style per gift transaction.
 *  - Auto-finishes after 2 seconds and calls onDone().
 *  - 10 distinct romantic animation modes.
 *
 * Important:
 *  - This does NOT change locked/unbox behavior.
 *  - This does NOT deduct BuzzCoin.
 *  - This does NOT touch app/chat/[peerId].tsx.
 *  - No price badges, no text labels, no extra card UI.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  gold: "#D4AF37",
  softGold: "#FFF4C7",
  rose: "#FFE4E8",
};

type RevealMode =
  | "heartBloom"
  | "diamondBurst"
  | "roseFloat"
  | "spotlightSpin"
  | "confettiKiss"
  | "softPulse"
  | "loveOrbit"
  | "goldPop"
  | "petalRain"
  | "romanticZoom";

type Props = {
  imageUrl?: string;
  giftId?: string;
  transactionId?: string;
  onDone: () => void;
};

function hashText(value: string) {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function pickRevealMode(seed: string): RevealMode {
  const modes: RevealMode[] = [
    "heartBloom",
    "diamondBurst",
    "roseFloat",
    "spotlightSpin",
    "confettiKiss",
    "softPulse",
    "loveOrbit",
    "goldPop",
    "petalRain",
    "romanticZoom",
  ];

  return modes[hashText(seed || "rombuzz-gift") % modes.length];
}

function particleIconForMode(mode: RevealMode, index: number) {
  if (mode === "diamondBurst") return "diamond";
  if (mode === "roseFloat" || mode === "petalRain") return "heart";
  if (mode === "confettiKiss") return index % 2 === 0 ? "heart" : "sparkles";
  if (mode === "goldPop") return index % 2 === 0 ? "sparkles" : "diamond";
  if (mode === "loveOrbit") return index % 2 === 0 ? "heart" : "ellipse";
  return index % 2 === 0 ? "heart" : "sparkles";
}

function particleColorForMode(mode: RevealMode, index: number) {
  if (mode === "diamondBurst" || mode === "goldPop") {
    return index % 2 === 0 ? RBZ.gold : RBZ.softGold;
  }

  if (mode === "petalRain" || mode === "roseFloat") {
    return index % 2 === 0 ? RBZ.c2 : RBZ.c3;
  }

  if (mode === "confettiKiss") {
    return index % 3 === 0 ? RBZ.c2 : index % 3 === 1 ? RBZ.gold : RBZ.c4;
  }

  return index % 2 === 0 ? RBZ.c2 : RBZ.gold;
}

export default function ChatGiftRevealAnimation({
  imageUrl,
  giftId,
  transactionId,
  onDone,
}: Props) {
  const seed = `${transactionId || ""}:${giftId || ""}:${imageUrl || ""}`;
  const mode = useMemo(() => pickRevealMode(seed), [seed]);

  const enter = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const secondBurst = useRef(new Animated.Value(0)).current;
  const floatValue = useRef(new Animated.Value(0)).current;
  const orbitAngle = useRef(new Animated.Value(0)).current;
  const petalFall = useRef(new Animated.Value(0)).current;
  const zoomScale = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enter.setValue(0);
    glow.setValue(0);
    drift.setValue(0);
    spin.setValue(0);
    burst.setValue(0);
    secondBurst.setValue(0);
    floatValue.setValue(0);
    orbitAngle.setValue(0);
    petalFall.setValue(0);
    zoomScale.setValue(0);
    shimmer.setValue(0);
    sway.setValue(0);

    let animation: Animated.CompositeAnimation;

    switch (mode) {
      case "heartBloom":
        animation = Animated.parallel([
          Animated.sequence([
            Animated.timing(enter, {
              toValue: 1,
              duration: 360,
              easing: Easing.out(Easing.back(1.8)),
              useNativeDriver: true,
            }),
            Animated.timing(sway, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(burst, {
              toValue: 1,
              duration: 520,
              easing: Easing.out(Easing.back(1.4)),
              useNativeDriver: true,
            }),
            Animated.timing(burst, {
              toValue: 0,
              duration: 850,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(glow, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
        break;

      case "diamondBurst":
        animation = Animated.parallel([
          Animated.spring(enter, {
            toValue: 1,
            friction: 4,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(burst, {
              toValue: 1,
              duration: 280,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(burst, {
              toValue: 0,
              duration: 1050,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(spin, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 1300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
        break;

      case "roseFloat":
        animation = Animated.parallel([
          Animated.timing(enter, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(floatValue, {
                toValue: 1,
                duration: 800,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(floatValue, {
                toValue: 0,
                duration: 800,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.timing(petalFall, {
            toValue: 1,
            duration: 1900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sway, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
        break;

      case "spotlightSpin":
        animation = Animated.parallel([
          Animated.timing(enter, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(spin, {
            toValue: 1,
            duration: 1900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(glow, {
              toValue: 1,
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glow, {
              toValue: 0.25,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 1700,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]);
        break;

      case "confettiKiss":
        animation = Animated.parallel([
          Animated.timing(enter, {
            toValue: 1,
            duration: 330,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(burst, {
              toValue: 1,
              duration: 220,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(burst, {
              toValue: 0,
              duration: 700,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(420),
            Animated.timing(secondBurst, {
              toValue: 1,
              duration: 220,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(secondBurst, {
              toValue: 0,
              duration: 650,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(sway, {
            toValue: 1,
            duration: 1300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
        break;

      case "softPulse":
        animation = Animated.parallel([
          Animated.timing(enter, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(glow, {
                toValue: 1,
                duration: 520,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(glow, {
                toValue: 0.15,
                duration: 520,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(floatValue, {
                toValue: 1,
                duration: 520,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(floatValue, {
                toValue: 0,
                duration: 520,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ])
          ),
        ]);
        break;

      case "loveOrbit":
        animation = Animated.parallel([
          Animated.spring(enter, {
            toValue: 1,
            friction: 5,
            tension: 75,
            useNativeDriver: true,
          }),
          Animated.timing(orbitAngle, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(burst, {
              toValue: 1,
              duration: 600,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(burst, {
              toValue: 0,
              duration: 900,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(glow, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
        break;

      case "goldPop":
        animation = Animated.parallel([
          Animated.sequence([
            Animated.timing(enter, {
              toValue: 1,
              duration: 240,
              easing: Easing.out(Easing.back(2)),
              useNativeDriver: true,
            }),
            Animated.timing(sway, {
              toValue: 1,
              duration: 750,
              easing: Easing.out(Easing.elastic(1)),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(burst, {
              toValue: 1,
              duration: 220,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(burst, {
              toValue: 0,
              duration: 950,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(spin, {
            toValue: 1,
            duration: 850,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 1300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
        break;

      case "petalRain":
        animation = Animated.parallel([
          Animated.timing(enter, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(petalFall, {
            toValue: 1,
            duration: 1900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatValue, {
            toValue: 1,
            duration: 1900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sway, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
        break;

      case "romanticZoom":
        animation = Animated.parallel([
          Animated.timing(enter, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(zoomScale, {
              toValue: 1,
              duration: 420,
              easing: Easing.out(Easing.back(1.8)),
              useNativeDriver: true,
            }),
            Animated.timing(zoomScale, {
              toValue: 0.92,
              duration: 260,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(zoomScale, {
              toValue: 1,
              duration: 360,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(260),
            Animated.timing(secondBurst, {
              toValue: 1,
              duration: 420,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(secondBurst, {
              toValue: 0,
              duration: 800,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(drift, {
            toValue: 1,
            duration: 1900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
        break;

      default:
        animation = Animated.timing(enter, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        });
    }

    animation.start();

    const doneTimer = setTimeout(() => {
      animation.stop();
      onDone?.();
    }, 2000);

    return () => {
      clearTimeout(doneTimer);
      animation.stop();
    };
  }, [
    mode,
    enter,
    glow,
    drift,
    spin,
    burst,
    secondBurst,
    floatValue,
    orbitAngle,
    petalFall,
    zoomScale,
    shimmer,
    sway,
    onDone,
  ]);

  const giftBaseScale = enter.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange:
      mode === "goldPop"
        ? [0.72, 1.18, 1]
        : mode === "romanticZoom"
          ? [0.7, 1, 1]
          : mode === "softPulse"
            ? [0.9, 1.02, 1]
            : [0.55, 1.08, 1],
  });

  const giftOpacity = enter.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0, 1, 1],
  });

  const giftPulseScale = floatValue.interpolate({
    inputRange: [0, 1],
    outputRange:
      mode === "softPulse"
        ? [0.98, 1.06]
        : mode === "roseFloat"
          ? [1, 1.025]
          : [1, 1],
  });

  const romanticZoomScale = zoomScale.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0.58, 1.13, 1],
  });

  const giftTranslateY = (() => {
    if (mode === "roseFloat") {
      return floatValue.interpolate({
        inputRange: [0, 1],
        outputRange: [4, -14],
      });
    }

    if (mode === "petalRain") {
      return floatValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-4, 7],
      });
    }

    if (mode === "romanticZoom") {
      return drift.interpolate({
        inputRange: [0, 1],
        outputRange: [6, -5],
      });
    }

    if (mode === "softPulse") {
      return floatValue.interpolate({
        inputRange: [0, 1],
        outputRange: [1, -4],
      });
    }

    if (mode === "loveOrbit") {
      return orbitAngle.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -7, 0],
      });
    }

    return drift.interpolate({
      inputRange: [0, 1],
      outputRange: [5, -3],
    });
  })();

  const giftTranslateX = (() => {
    if (mode === "confettiKiss") {
      return sway.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 3, -2],
      });
    }

    if (mode === "goldPop") {
      return sway.interpolate({
        inputRange: [0, 0.35, 0.7, 1],
        outputRange: [0, -5, 5, 0],
      });
    }

    if (mode === "petalRain" || mode === "roseFloat") {
      return sway.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -4, 4],
      });
    }

    return 0;
  })();

  const giftRotate = (() => {
    if (mode === "spotlightSpin") {
      return spin.interpolate({
        inputRange: [0, 1],
        outputRange: ["-5deg", "7deg"],
      });
    }

    if (mode === "diamondBurst") {
      return spin.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ["0deg", "8deg", "0deg"],
      });
    }

    if (mode === "loveOrbit") {
      return orbitAngle.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ["-3deg", "4deg", "-3deg"],
      });
    }

    if (mode === "goldPop") {
      return spin.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "-9deg"],
      });
    }

    if (mode === "petalRain") {
      return sway.interpolate({
        inputRange: [0, 1],
        outputRange: ["-2deg", "3deg"],
      });
    }

    return "0deg";
  })();

  const burstScale = burst.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.2, 1.1, 1.35],
  });

  const burstOpacity = burst.interpolate({
    inputRange: [0, 0.25, 0.75, 1],
    outputRange: [0, 0.7, 0.25, 0],
  });

  const secondBurstScale = secondBurst.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0.4, 1.18, 1.4],
  });

  const secondBurstOpacity = secondBurst.interpolate({
    inputRange: [0, 0.35, 0.8, 1],
    outputRange: [0, 0.55, 0.18, 0],
  });

  const glowOpacity = glow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.08, 0.3, 0.16],
  });

  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.2],
  });

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.5, 0.25, 0],
  });

  const shimmerTranslateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-95, 95],
  });

  const orbitTranslateX = orbitAngle.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 22, 0, -22, 0],
  });

  const orbitTranslateY = orbitAngle.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-15, 0, 15, 0, -15],
  });

  const renderBurstParticles = (
    activeMode: RevealMode,
    animValue: Animated.Value,
    opacityValue: Animated.AnimatedInterpolation<string | number>,
    scaleValue: Animated.AnimatedInterpolation<string | number>,
    count = 12
  ) => {
    return Array.from({ length: count }).map((_, index) => {
      const angle = (index * (360 / count) + hashText(`${seed}-${index}`) % 18) * (Math.PI / 180);

      const baseDistance =
        activeMode === "diamondBurst"
          ? 82
          : activeMode === "goldPop"
            ? 76
            : activeMode === "confettiKiss"
              ? 68
              : activeMode === "loveOrbit"
                ? 56
                : 62;

      const x = Math.cos(angle) * baseDistance;
      const y = Math.sin(angle) * baseDistance;

      const translateX = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, x],
      });

      const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, y],
      });

      return (
        <Animated.View
          key={`burst-${activeMode}-${index}`}
          style={[
            styles.particle,
            {
              opacity: opacityValue,
              transform: [
                { translateX },
                { translateY },
                { scale: scaleValue },
              ],
            },
          ]}
        >
          <Ionicons
            name={particleIconForMode(activeMode, index) as any}
            size={index % 3 === 0 ? 13 : 10}
            color={particleColorForMode(activeMode, index)}
          />
        </Animated.View>
      );
    });
  };

  const renderPetalEffect = () => {
    if (mode !== "petalRain" && mode !== "roseFloat") return null;

    const count = mode === "petalRain" ? 8 : 5;

    return Array.from({ length: count }).map((_, index) => {
      const startX = -92 + index * 26;
      const endX = startX + (index % 2 === 0 ? 28 : -22);

      const translateY = petalFall.interpolate({
        inputRange: [0, 1],
        outputRange: [-78 - index * 8, 132 + index * 12],
      });

      const translateX = petalFall.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [startX, startX + (index % 2 === 0 ? 14 : -14), endX],
      });

      const rotate = petalFall.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", index % 2 === 0 ? "170deg" : "-150deg"],
      });

      const opacity = petalFall.interpolate({
        inputRange: [0, 0.15, 0.82, 1],
        outputRange: [0, 0.48, 0.34, 0],
      });

      return (
        <Animated.View
          key={`petal-${index}`}
          style={[
            styles.petal,
            {
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={index % 2 === 0 ? 12 : 10}
            color={index % 2 === 0 ? RBZ.c2 : RBZ.c3}
          />
        </Animated.View>
      );
    });
  };

  const renderOrbitEffect = () => {
    if (mode !== "loveOrbit") return null;

    return (
      <>
        <Animated.View
          style={[
            styles.orbitParticle,
            {
              opacity: glowOpacity,
              transform: [
                { translateX: orbitTranslateX },
                { translateY: orbitTranslateY },
              ],
            },
          ]}
        >
          <Ionicons name="heart" size={15} color={RBZ.c2} />
        </Animated.View>

        <Animated.View
          style={[
            styles.orbitParticle,
            {
              opacity: glowOpacity,
              transform: [
                {
                  translateX: orbitAngle.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [0, -20, 0, 20, 0],
                  }),
                },
                {
                  translateY: orbitAngle.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [14, 0, -14, 0, 14],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="sparkles" size={14} color={RBZ.gold} />
        </Animated.View>
      </>
    );
  };

  const renderModeParticles = () => {
    if (mode === "heartBloom") {
      return renderBurstParticles(mode, burst, burstOpacity, burstScale, 10);
    }

    if (mode === "diamondBurst") {
      return renderBurstParticles(mode, burst, burstOpacity, burstScale, 14);
    }

    if (mode === "confettiKiss") {
      return (
        <>
          {renderBurstParticles(mode, burst, burstOpacity, burstScale, 12)}
          {renderBurstParticles(mode, secondBurst, secondBurstOpacity, secondBurstScale, 8)}
        </>
      );
    }

    if (mode === "goldPop") {
      return renderBurstParticles(mode, burst, burstOpacity, burstScale, 16);
    }

    if (mode === "romanticZoom") {
      return renderBurstParticles(mode, secondBurst, secondBurstOpacity, secondBurstScale, 8);
    }

    if (mode === "loveOrbit") {
      return renderBurstParticles(mode, burst, burstOpacity, burstScale, 6);
    }

    return null;
  };

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {renderOrbitEffect()}
        {renderModeParticles()}
        {renderPetalEffect()}

        <Animated.View
          style={[
            styles.shimmer,
            {
              opacity: shimmerOpacity,
              transform: [{ translateX: shimmerTranslateX }, { rotate: "18deg" }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.giftStage,
            {
              opacity: giftOpacity,
              transform: [
                { translateX: giftTranslateX },
                { translateY: giftTranslateY },
                { scale: mode === "romanticZoom" ? romanticZoomScale : giftBaseScale },
                { scale: giftPulseScale },
                { rotate: giftRotate },
              ],
            },
          ]}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.giftImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.fallbackGift}>
              <Ionicons name="diamond" size={96} color={RBZ.gold} />
              <Ionicons
                name="sparkles"
                size={36}
                color={RBZ.c2}
                style={styles.fallbackSparkle}
              />
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 236,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 3,
  },
  container: {
    width: 232,
    height: 232,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  giftStage: {
    width: 224,
    height: 224,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    zIndex: 5,
  },
  giftImage: {
    width: 224,
    height: 224,
    backgroundColor: "transparent",
  },
  fallbackGift: {
    width: 224,
    height: 224,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackSparkle: {
    position: "absolute",
    top: 32,
    right: 28,
  },
  glowRing: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,228,232,0.42)",
    zIndex: 1,
  },
  shimmer: {
    position: "absolute",
    width: 42,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.34)",
    zIndex: 4,
  },
  particle: {
    position: "absolute",
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 7,
  },
  petal: {
    position: "absolute",
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
  },
  orbitParticle: {
    position: "absolute",
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9,
  },
});
/**
 * ============================================================
 * 📁 Location: src/components/gifts/GiftCard.tsx
 * 🎁 Purpose: Single gift tile for the RomBuzz gift picker.
 *
 * Used by:
 *  - GiftPicker
 *
 * What this file does:
 *  - Displays the real Cloudinary gift image.
 *  - Displays only the BuzzCoin price.
 *  - Does NOT show gift name, rarity, category, or text labels.
 *  - Adds lightweight per-gift animation styles using React Native Animated.
 *
 * Important:
 *  - Gift names remain internal/admin-only.
 *  - Backend still validates giftId and priceBC before any real transaction.
 * ============================================================
 */

import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RomBuzzGift } from "../../config/rombuzzGifts";

type Props = {
  gift: RomBuzzGift;
  disabled?: boolean;
  locked?: boolean;
  onPress?: (gift: RomBuzzGift) => void;
};

export default function GiftCard({
  gift,
  disabled = false,
  locked = false,
  onPress,
}: Props) {
  const isDisabled = disabled || locked || !gift.enabled;

  const pulse = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkle, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    rotateLoop.start();
    floatLoop.start();
    sparkleLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
      floatLoop.stop();
      sparkleLoop.stop();
    };
  }, [floatY, pulse, rotate, sparkle]);

  const imageAnimatedStyle = useMemo(() => {
    const scale = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.08],
    });

    const softScale = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.97, 1.04],
    });

    const translateY = floatY.interpolate({
      inputRange: [0, 1],
      outputRange: [2, -5],
    });

    const rotateDeg = rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    const tinyRotate = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: ["-4deg", "4deg"],
    });

    const animationType = gift.animationType;

    if (
      animationType === "compassSpin" ||
      animationType === "slowSpin" ||
      animationType === "twinkle"
    ) {
      return {
        transform: [{ rotate: rotateDeg }, { scale: softScale }],
      };
    }

    if (
      animationType === "birdsFlutter" ||
      animationType === "ribbonWave" ||
      animationType === "sway"
    ) {
      return {
        transform: [{ translateY }, { rotate: tinyRotate }, { scale: softScale }],
      };
    }

    if (
      animationType === "bounceIn" ||
      animationType === "cherryBounce" ||
      animationType === "capsuleDrop" ||
      animationType === "lockShake"
    ) {
      return {
        transform: [{ translateY }, { scale }],
      };
    }

    if (
      animationType === "heartPop" ||
      animationType === "kissBurst" ||
      animationType === "roseBloom" ||
      animationType === "zoomPop"
    ) {
      return {
        transform: [{ scale }],
      };
    }

    if (
      animationType === "candleFlicker" ||
      animationType === "lanternGlow" ||
      animationType === "glowPulse" ||
      animationType === "sparkleRise" ||
      animationType === "crystalShine" ||
      animationType === "bonsaiBreath" ||
      animationType === "autumnDrift" ||
      animationType === "softFloat"
    ) {
      return {
        transform: [{ translateY }, { scale: softScale }],
      };
    }

    return {
      transform: [{ scale: softScale }],
    };
  }, [floatY, gift.animationType, pulse, rotate]);

  const glowAnimatedStyle = useMemo(() => {
    const opacity = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.22, 0.5],
    });

    const scale = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1.12],
    });

    return {
      opacity,
      transform: [{ scale }],
    };
  }, [pulse]);

  const sparkleAnimatedStyle = useMemo(() => {
    const opacity = sparkle.interpolate({
      inputRange: [0, 1],
      outputRange: [0.15, 0.85],
    });

    const translateY = sparkle.interpolate({
      inputRange: [0, 1],
      outputRange: [7, -5],
    });

    const scale = sparkle.interpolate({
      inputRange: [0, 1],
      outputRange: [0.65, 1.05],
    });

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  }, [sparkle]);

  return (
    <Pressable
      onPress={() => {
        if (!isDisabled) onPress?.(gift);
      }}
      style={({ pressed }) => [
        styles.card,
        pressed && !isDisabled && styles.cardPressed,
        isDisabled && styles.cardDisabled,
      ]}
    >
      <View style={styles.imageWrap}>
        <Animated.View style={[styles.glow, glowAnimatedStyle]} />

        {gift.animated && (
          <>
            <Animated.Text style={[styles.sparkleOne, sparkleAnimatedStyle]}>
              ✦
            </Animated.Text>
            <Animated.Text style={[styles.sparkleTwo, sparkleAnimatedStyle]}>
              ✧
            </Animated.Text>
          </>
        )}

        <Animated.View style={[styles.imageMotion, imageAnimatedStyle]}>
          <Image
            source={{ uri: gift.imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        {locked && (
          <View style={styles.lockBadge}>
            <Text style={styles.lockText}>🔒</Text>
          </View>
        )}
      </View>

      <View style={styles.pricePill}>
        <Text style={styles.coin}>🪙</Text>
        <Text style={styles.price}>{gift.priceBC}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 104,
    minHeight: 128,
    borderRadius: 24,
    paddingHorizontal: 9,
    paddingTop: 10,
    paddingBottom: 9,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: "rgba(255,105,180,0.18)",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
  },
  cardDisabled: {
    opacity: 0.48,
  },
  imageWrap: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  glow: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 999,
    backgroundColor: "rgba(255,105,180,0.28)",
  },
  imageMotion: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 76,
    height: 76,
  },
  sparkleOne: {
    position: "absolute",
    top: 2,
    right: 9,
    color: "#FF4FA3",
    fontSize: 14,
    fontWeight: "900",
    zIndex: 3,
  },
  sparkleTwo: {
    position: "absolute",
    left: 8,
    bottom: 10,
    color: "#FFB6D8",
    fontSize: 11,
    fontWeight: "900",
    zIndex: 3,
  },
  lockBadge: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(20,20,28,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockText: {
    fontSize: 12,
  },
  pricePill: {
    marginTop: 8,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(107,21,66,0.08)",
    borderWidth: 1,
    borderColor: "rgba(107,21,66,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  coin: {
    fontSize: 12,
  },
  price: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6B1542",
  },
});
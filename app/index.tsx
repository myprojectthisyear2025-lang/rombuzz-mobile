
/**
 * ============================================================
 * 📁 File: app/index.tsx
 * 🎯 Purpose: RomBuzz splash animation (web-style, closer to web)
 *      - Pink gradient background
 *      - Rotating neon rings (thin, opposite directions)
 *      - Smaller glass card with logo
 *      - "Rombuzz" text with glow
 *      - 6 floating particles
 *      - Runs ~2s on app start, then → layout handles routing
 * ============================================================
 */

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";

import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function SplashScreen() {
  const router = useRouter();

  // Overall fade
  const mainOpacity = useRef(new Animated.Value(0)).current;

  // Core card + logo scale
  const coreScale = useRef(new Animated.Value(0.7)).current;

  // Rotating rings (base numeric value)
  const ringRotate = useRef(new Animated.Value(0)).current;

  // Text reveal
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(12)).current;

  // Floating particles
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;
  const particle5 = useRef(new Animated.Value(0)).current;
  const particle6 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous ring rotation
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 6500, // same as before
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Floating particles loop
    const particleLoop = (val: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    particleLoop(particle1, 0);
    particleLoop(particle2, 250);
    particleLoop(particle3, 500);
    particleLoop(particle4, 750);
    particleLoop(particle5, 1000);
    particleLoop(particle6, 1250);

    // Intro / outro sequence (~2.1s total, same behavior)
    Animated.sequence([
      // Fade + scale-in
      Animated.parallel([
        Animated.timing(mainOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coreScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]),
      // Text reveal
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Hold a bit
      Animated.delay(600),
      // Fade out
      Animated.timing(mainOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // ✅ Splash animation finished (2-3 seconds total)
      // 🔥 Layout will handle redirection based on auth state
      console.log("✨ Splash animation complete");
      // Don't navigate here - let _layout.tsx handle it
    });
  }, [
    mainOpacity,
    coreScale,
    ringRotate,
    textOpacity,
    textTranslateY,
    particle1,
    particle2,
    particle3,
    particle4,
    particle5,
    particle6,
  ]);

  // Two separate interpolations from the base numeric value
  const ringRotateDeg = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const ringRotateDegReverse = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  const particleY = (val: Animated.Value, distance: number) =>
    val.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -distance],
    });

  const particleX = (val: Animated.Value, distance: number) =>
    val.interpolate({
      inputRange: [0, 1],
      outputRange: [0, distance],
    });

  const particleOpacity = (val: Animated.Value) =>
    val.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 1, 1, 0],
    });

  return (
    <LinearGradient
      style={styles.container}
      colors={["#ff4bbd", "#ff2f88", "#ff5b68", "#d633ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View style={[styles.centerWrapper, { opacity: mainOpacity }]}>
        {/* 🔁 Centered layer for rings + particles */}
        <View style={styles.ringLayer}>
          {/* Rotating rings */}
          <Animated.View
            style={[
              styles.ring,
              styles.ringOuter,
              { transform: [{ rotate: ringRotateDeg }] },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              styles.ringInner,
              { transform: [{ rotate: ringRotateDegReverse }] },
            ]}
          />

          {/* Floating particles (6 dots around) */}
          <Animated.View
            style={[
              styles.particle,
              styles.particle1,
              {
                opacity: particleOpacity(particle1),
                transform: [
                  { translateY: particleY(particle1, 18) },
                  { translateX: particleX(particle1, -6) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.particle,
              styles.particle2,
              {
                opacity: particleOpacity(particle2),
                transform: [
                  { translateY: particleY(particle2, 22) },
                  { translateX: particleX(particle2, 8) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.particle,
              styles.particle3,
              {
                opacity: particleOpacity(particle3),
                transform: [
                  { translateY: particleY(particle3, 16) },
                  { translateX: particleX(particle3, 10) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.particle,
              styles.particle4,
              {
                opacity: particleOpacity(particle4),
                transform: [
                  { translateY: particleY(particle4, 20) },
                  { translateX: particleX(particle4, -10) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.particle,
              styles.particle5,
              {
                opacity: particleOpacity(particle5),
                transform: [
                  { translateY: particleY(particle5, 24) },
                  { translateX: particleX(particle5, 4) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.particle,
              styles.particle6,
              {
                opacity: particleOpacity(particle6),
                transform: [
                  { translateY: particleY(particle6, 18) },
                  { translateX: particleX(particle6, -4) },
                ],
              },
            ]}
          />
        </View>

        {/* Glass card + logo (always perfectly centered) */}
        <Animated.View
          style={[
            styles.coreCard,
            {
              transform: [{ scale: coreScale }],
            },
          ]}
        >
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text: Rombuzz */}
        <Animated.View
          style={{
            marginTop: 32,
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          }}
        >
          <Text style={styles.brandText}>Rombuzz</Text>
          <Text style={styles.taglineText}>
            Connect with people nearby in real-time
          </Text>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ringLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    position: "absolute",
    borderRadius: 9999,
  },
  ringOuter: {
    width: 280,
    height: 280,
    borderWidth: 2.2,
    borderColor: "rgba(255,255,255,0.40)",
    shadowColor: "#ffbdf3",
    shadowOpacity: 0.75,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  ringInner: {
    width: 230,
    height: 230,
    borderWidth: 1.4,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#ffe6ff",
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  coreCard: {
    width: 94, // smaller, closer to web
    height: 94,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ffb3e6",
    shadowOpacity: 0.95,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  logo: {
    width: 62,
    height: 62,
  },
  brandText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    textShadowColor: "#ffffff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22, // stronger glow
  },
  taglineText: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.94)",
    textAlign: "center",
    paddingHorizontal: 32,
    textShadowColor: "rgba(255,255,255,0.7)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  particle: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#ffffff",
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  particle1: {
    top: -36,
    left: 34,
  },
  particle2: {
    top: -18,
    right: -12,
  },
  particle3: {
    bottom: -26,
    right: 40,
  },
  particle4: {
    bottom: 0,
    left: -24,
  },
  particle5: {
    top: 24,
    right: -30,
  },
  particle6: {
    bottom: -34,
    left: 12,
  },
});

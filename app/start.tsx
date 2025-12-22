/**
 * ============================================================
 * 📁 File: app/start.tsx
 * 🎯 Screen: RomBuzz Mobile — Start (Calm & Romantic)
 *
 * DESIGN:
 *   - No scroll
 *   - No feature cards
 *   - Living background (connection pulse)
 *   - Pure presence + action
 * ============================================================
 */

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function StartScreen() {
  const router = useRouter();

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#b1123c" />

      {/* ROMBUZZ GRADIENT */}
      <LinearGradient
        colors={["#b1123c", "#d8345f", "#e9486a", "#b5179e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* Connection Pulse */}
        <Pulse delay={0} />
        <Pulse delay={1200} />
        <Pulse delay={2400} />

        <Animated.View
          style={[
            styles.center,
            { opacity: fade, transform: [{ translateY: rise }] },
          ]}
        >
          <View style={styles.logoCard}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
            />
          </View>

          <Text style={styles.title}>Rombuzz</Text>
          <Text style={styles.subtitle}>
            Connect with Muji people nearby, in real time
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push("/auth/signup")}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.primaryText}>Get Started</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/auth/login")}
              style={({ pressed }) => [
                styles.ghostBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.ghostText}>Login</Text>
            </Pressable>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* CONNECTION PULSE                                                           */
/* -------------------------------------------------------------------------- */

function Pulse({ delay }: { delay: number }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.4,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.25,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulse,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },

  pulse: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  center: {
    alignItems: "center",
    paddingHorizontal: 24,
  },

  logoCard: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logo: { width: 56, height: 56 },

  title: {
    fontSize: 44,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    marginBottom: 26,
  },

  actions: {
    width: "100%",
    gap: 14,
  },

 primaryBtn: {
  backgroundColor: "#fff",
  paddingVertical: 18,          // ⬅️ increased
  paddingHorizontal: 24,        // ⬅️ added
  borderRadius: 26,             // ⬅️ slightly rounder
  alignItems: "center",
},
  primaryText: {
    color: "#b1123c",
    fontWeight: "800",
    fontSize: 15,
  },

  ghostBtn: {
  borderWidth: 1.5,
  borderColor: "#fff",
  paddingVertical: 18,          // ⬅️ increased
  paddingHorizontal: 24,        // ⬅️ added
  borderRadius: 26,             // ⬅️ slightly rounder
  alignItems: "center",
},
  ghostText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});

/**
 * ============================================================
 * 📁 File: app/(tabs)/microbuzz.tsx
 * 🎯 Purpose: MicroBuzz Screen - Real-time Radar Connection Flow
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  gray: "#6b7280",
  light: "#f9fafb",
} as const;

export default function MicroBuzzScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[RBZ.c1, RBZ.c4]}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={RBZ.white} />
        </Pressable>
        <Text style={styles.title}>MicroBuzz</Text>
        <Text style={styles.subtitle}>Real-time Radar • Nearby Buzz</Text>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.radarContainer}>
          <View style={styles.radarRing} />
          <View style={[styles.radarRing, styles.radarRing2]} />
          <View style={[styles.radarRing, styles.radarRing3]} />
          
          <View style={styles.centerCircle}>
            <Ionicons name="flash" size={40} color={RBZ.white} />
          </View>

          {/* Users around radar */}
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[
              styles.userDot,
              {
                top: i === 1 ? 50 : i === 2 ? 120 : i === 3 ? 200 : 80,
                left: i === 1 ? 120 : i === 2 ? 220 : i === 3 ? 180 : 60,
              }
            ]}>
              <Image
                source={{ uri: `https://images.unsplash.com/photo-${1500648767791 + i}?w=100&auto=format&fit=crop` }}
                style={styles.userAvatar}
              />
            </View>
          ))}
        </View>

        <Text style={styles.radarTitle}>Live Nearby</Text>
        <Text style={styles.radarDescription}>
          12 people are currently active within 5km.
          Start a real-time connection instantly.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={[styles.actionButton, styles.primaryButton]}>
            <Ionicons name="flash" size={20} color={RBZ.white} />
            <Text style={styles.primaryButtonText}>Go Live Now</Text>
          </Pressable>
          
          <Pressable style={[styles.actionButton, styles.secondaryButton]}>
            <Ionicons name="eye" size={20} color={RBZ.c1} />
            <Text style={styles.secondaryButtonText}>Browse Active</Text>
          </Pressable>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>42</Text>
            <Text style={styles.statLabel}>Live Now</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>128</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>Response Rate</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RBZ.light,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: RBZ.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#fde2e4",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  radarContainer: {
    width: 300,
    height: 300,
    position: "relative",
    marginVertical: 30,
  },
  radarRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: "rgba(177, 18, 60, 0.2)",
  },
  radarRing2: {
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderColor: "rgba(177, 18, 60, 0.3)",
  },
  radarRing3: {
    top: 40,
    left: 40,
    right: 40,
    bottom: 40,
    borderColor: "rgba(177, 18, 60, 0.4)",
  },
  centerCircle: {
    position: "absolute",
    top: 130,
    left: 130,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RBZ.c1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  userDot: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: RBZ.white,
    zIndex: 5,
  },
  userAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  radarTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: RBZ.c1,
    marginBottom: 8,
  },
  radarDescription: {
    fontSize: 14,
    color: RBZ.gray,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 140,
  },
  primaryButton: {
    backgroundColor: RBZ.c4,
  },
  primaryButtonText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: RBZ.white,
    borderWidth: 2,
    borderColor: RBZ.c2,
  },
  secondaryButtonText: {
    color: RBZ.c1,
    fontWeight: "900",
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: RBZ.white,
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "900",
    color: RBZ.c1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: RBZ.gray,
    fontWeight: "600",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
});
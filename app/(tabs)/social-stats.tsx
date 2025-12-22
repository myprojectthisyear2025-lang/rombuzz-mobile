/**
 * ============================================================================
 * 📁 File: app/(tabs)/social-stats.tsx
 * 🎯 RomBuzz Mobile — Social Stats (Signature Feature)
 * 
 * Shows mutual interest potential, not just raw likes.
 * Time-decayed interest metrics.
 * ============================================================================
 */

import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const API_BASE = "https://YOUR_BACKEND_URL/api";

/* 🎨 RomBuzz Colors */
const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  gray: "#6b7280",
  light: "#f9fafb",
} as const;

export default function SocialStatsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    potentialMatches: 0,
    mutualInterest: 0,
    recentBuzz: 0,
    buzzStreak: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Simulate API call - replace with real endpoint
      setTimeout(() => {
        setStats({
          potentialMatches: 12,
          mutualInterest: 8,
          recentBuzz: 3,
          buzzStreak: 5,
        });
        setLoading(false);
      }, 800);
    } catch (e) {
      console.error("Social stats error", e);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={RBZ.c1} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔝 Header */}
      <LinearGradient
        colors={[RBZ.c1, RBZ.c4]}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={RBZ.white} />
        </Pressable>
        <Text style={styles.title}>Social Stats</Text>
        <Text style={styles.subtitle}>
          Your mutual interest potential • Time-decayed metrics
        </Text>
      </LinearGradient>

      {/* 📊 Cards Grid */}
      <View style={styles.grid}>
        <StatCard
          icon="users"
          label="Potential Matches"
          value={stats.potentialMatches}
          color={RBZ.c2}
          desc="Within your preferences"
        />
        <StatCard
          icon="heart"
          label="Mutual Interest"
          value={stats.mutualInterest}
          color={RBZ.c3}
          desc="High compatibility"
        />
        <StatCard
          icon="bolt"
          label="Recent Buzz"
          value={stats.recentBuzz}
          color={RBZ.c4}
          desc="Last 24 hours"
        />
        <StatCard
          icon="fire"
          label="BuzzStreak"
          value={stats.buzzStreak}
          color={RBZ.c1}
          desc="Days active"
          isStreak={true}
        />
      </View>

      {/* 📈 Explanation */}
      <View style={styles.explanation}>
        <View style={styles.explanationHeader}>
          <Ionicons name="information-circle" size={20} color={RBZ.c3} />
          <Text style={styles.explanationTitle}>How this works</Text>
        </View>
        <Text style={styles.explanationText}>
          • Only shows people within your distance and preference range
          {"\n"}• Metrics decay over time to show current interest
          {"\n"}• Mutual interest = they liked you AND you might like them
          {"\n"}• BuzzStreak resets after 48h of inactivity
        </Text>
      </View>
    </View>
  );
}

/* ===================== STAT CARD COMPONENT ===================== */

function StatCard({
  icon,
  label,
  value,
  color,
  desc,
  isStreak = false,
}: {
  icon: React.ComponentProps<typeof FontAwesome5>["name"];
  label: string;
  value: number;
  color: string;
  desc: string;
  isStreak?: boolean;
}) {
  return (
    <Pressable style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: color + "22" }]}>
        <FontAwesome5 name={icon} size={22} color={color} />
      </View>
      <Text style={styles.value}>
        {isStreak && "🔥 "}
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.desc}>{desc}</Text>
    </Pressable>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RBZ.light },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.light,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
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
    fontSize: 26,
    fontWeight: "900",
    color: RBZ.white,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#fde2e4",
    marginTop: 6,
    opacity: 0.9,
  },
  grid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  card: {
    width: "47%",
    backgroundColor: RBZ.white,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: "900",
    color: RBZ.c1,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    color: RBZ.c1,
    marginTop: 2,
    textAlign: "center",
    fontWeight: "700",
  },
  desc: {
    fontSize: 11,
    color: RBZ.gray,
    marginTop: 4,
    textAlign: "center",
  },
  explanation: {
    margin: 16,
    padding: 16,
    backgroundColor: RBZ.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: RBZ.c1,
  },
  explanationText: {
    fontSize: 13,
    color: RBZ.gray,
    lineHeight: 20,
  },
});
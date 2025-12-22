/**
 * ============================================================================
 * 📁 File: app/upgrade.tsx
 * 🎯 RomBuzz Mobile — Upgrade (Premium Tiers)
 * ============================================================================
 */

import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

/* 🎨 RomBuzz Brand Colors */
const COLORS = {
  primary: "#b1123c",
  secondary: "#d8345f",
  accent: "#e9486a",
  highlight: "#b5179e",
  white: "#ffffff",
  gray: "#6b7280",
  light: "#f9fafb",
};

export default function UpgradeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 🌟 HERO */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.highlight]}
        style={styles.hero}
      >
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </Pressable>

        <Text style={styles.heroTitle}>Upgrade Your Buzz</Text>
        <Text style={styles.heroSubtitle}>
          Get seen more. Match faster. Unlock the best RomBuzz experience.
        </Text>
      </LinearGradient>

      {/* ⭐ RomBuzz+ */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="star" size={22} color={COLORS.secondary} />
          <Text style={styles.cardTitlePlus}>RomBuzz+</Text>
        </View>

        <Text style={styles.cardDesc}>
          Perfect for daily boosters without going fully Elite.
        </Text>

        <Feature icon="flash" text="More daily right swipes" />
        <Feature icon="shield-checkmark" text="Priority in Discover" />
        <Feature icon="pulse" text="Extra MicroBuzz requests" />
        <Feature icon="refresh" text="Unlimited rewinds" />

        <Pressable style={styles.plusBtn}>
          <Text style={styles.btnText}>Get RomBuzz+</Text>
        </Pressable>
      </View>

      {/* 👑 ELITE */}
      <LinearGradient
        colors={["#facc15", "#fde68a"]}
        style={styles.eliteCard}
      >
        <View style={styles.cardHeader}>
          <FontAwesome5 name="crown" size={24} color="#92400e" />
          <Text style={styles.cardTitleElite}>RomBuzz Elite</Text>
        </View>

        <Text style={styles.cardDescElite}>
          Maximum visibility. Top of every stack. No limits.
        </Text>

        <Feature icon="sparkles" text="Elite profile glow" elite />
        <Feature icon="trending-up" text="Top priority in Discover" elite />
        <Feature icon="flash" text="Max-boosted MicroBuzz radius" elite />
        <Feature icon="infinite" text="Unlimited everything" elite />
        <Feature icon="shield-checkmark" text="Advanced safety tools" elite />

        <Pressable style={styles.eliteBtn}>
          <Text style={styles.eliteBtnText}>Go Elite</Text>
        </Pressable>
      </LinearGradient>

      {/* 🔒 FOOTER */}
      <Text style={styles.footer}>
        Payments coming soon. Your plan will unlock features across Discover,
        MicroBuzz, Chat & more.
      </Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ===================== SMALL COMPONENTS ===================== */

function Feature({
  icon,
  text,
  elite = false,
}: {
  icon: any;
  text: string;
  elite?: boolean;
}) {
  return (
    <View style={styles.feature}>
      <Ionicons
        name={icon}
        size={18}
        color={elite ? "#92400e" : COLORS.primary}
      />
      <Text
        style={[
          styles.featureText,
          elite && { color: "#78350f" },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },

  hero: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  back: {
    position: "absolute",
    top: 48,
    left: 20,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#fde2e4",
    lineHeight: 22,
  },

  card: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 18,
    borderRadius: 20,
    elevation: 6,
  },

  eliteCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 22,
    elevation: 8,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  cardTitlePlus: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },
  cardTitleElite: {
    fontSize: 22,
    fontWeight: "900",
    color: "#78350f",
  },
  cardDesc: {
    color: COLORS.gray,
    marginBottom: 14,
  },
  cardDescElite: {
    color: "#78350f",
    marginBottom: 14,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },

  plusBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 16,
  },

  eliteBtn: {
    marginTop: 18,
    backgroundColor: "#92400e",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  eliteBtnText: {
    color: "#fff7ed",
    fontWeight: "900",
    fontSize: 17,
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 24,
    paddingHorizontal: 20,
  },
});

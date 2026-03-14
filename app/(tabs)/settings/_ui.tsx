/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/_ui.tsx
 * 🎯 Purpose: Shared UI shell + row components for Settings pages
 * ============================================================================
 */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",

  // ✅ WHITE BACKGROUND SYSTEM (RomBuzz-safe)
  bg: "#ffffff",
  card: "rgba(233,72,106,0.08)",     // soft pink-tinted white
  line: "rgba(216,52,95,0.22)",      // RomBuzz border line

  text: "#2b0a16",                   // deep RomBuzz maroon (derived from c1)
  muted: "rgba(43,10,22,0.65)",
  soft: "rgba(43,10,22,0.45)",
} as const;

export function ScreenShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[RBZ.c1, RBZ.c4]} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={RBZ.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 24 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function NavRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? RBZ.c1 : RBZ.c3}
        />
        <Text style={[styles.rowText, danger && { color: "#ff9aa7" }]}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={RBZ.soft} />
    </Pressable>
  );
}

export function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: any;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={RBZ.c3} />
        <Text style={styles.rowText}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function SmallText({ children }: { children: string }) {
  return <Text style={styles.small}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: RBZ.bg },
  header: {
    height: 58,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: { color: RBZ.text, fontSize: 18, fontWeight: "900" },
  card: {
    backgroundColor: RBZ.card,
    borderWidth: 1,
    borderColor: RBZ.line,
    borderRadius: 18,
    padding: 12,
    marginTop: 10,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { color: RBZ.text, fontSize: 15, fontWeight: "700" },
  sectionTitle: {
    color: RBZ.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 10,
  },
  small: { color: RBZ.muted, fontSize: 12, marginTop: 6, lineHeight: 16 },
});

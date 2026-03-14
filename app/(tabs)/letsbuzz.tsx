/**
 * ============================================================================
 * 📁 File: app/(tabs)/letsbuzz.tsx
 * 🎯 Screen: LetsBuzz (2 tabs) → Posts + Reels
 *
 * Uses:
 *  - <LetsBuzzPosts />
 *  - <LetsBuzzReels />
 * ============================================================================
 */

import LetsBuzzPosts from "@/src/components/letsbuzz/LetsBuzzPosts";
import LetsBuzzReels from "@/src/components/letsbuzz/LetsBuzzReels";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  bg: "#f5f5f8ff",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  text: "rgba(9, 9, 9, 0.92)",
  sub: "rgba(255,255,255,0.70)",
};

type TabKey = "posts" | "reels";

export default function LetsBuzzScreen() {
  const insets = useSafeAreaInsets();
  const { post } = useLocalSearchParams<{ post?: string }>();

  const [tab, setTab] = useState<TabKey>("posts");

  useEffect(() => {
    if (post) setTab("posts");
  }, [post]);
  const TabBar = useMemo(() => {
    return (
      <View style={styles.tabWrap}>
        <LinearGradient
          colors={[RBZ.c1, RBZ.c2, RBZ.c3, RBZ.c4]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tabShell}
        >
          <TouchableOpacity
            onPress={() => setTab("posts")}
            activeOpacity={0.9}
            style={[styles.tabBtn, tab === "posts" && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === "posts" && styles.tabTextActive]}>Posts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab("reels")}
            activeOpacity={0.9}
            style={[styles.tabBtn, tab === "reels" && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === "reels" && styles.tabTextActive]}>Reels</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }, [tab]);

  return (
<View style={styles.safe}>
  <View style={{ paddingTop: insets.top }}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Let&apos;sBuzz</Text>
      </View>

      {TabBar}
  </View>

         {/* Body */}
      <View style={{ flex: 1 }}>
        {tab === "posts" ? (
          <LetsBuzzPosts targetPostId={post ? String(post) : undefined} />
        ) : (
          <LetsBuzzReels targetPostId={post ? String(post) : undefined} />
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RBZ.c1 },

  header: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900" },
  subtitle: { color: RBZ.sub, marginTop: 4, fontWeight: "800" },

  tabWrap: { paddingHorizontal: 14, paddingBottom: 10 },
  tabShell: {
    borderRadius: 18,
    padding: 3,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  tabText: { color: "rgba(255,255,255,0.85)", fontWeight: "900" },
  tabTextActive: { color: "#fff" },
});

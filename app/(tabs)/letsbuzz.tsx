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
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Clean, modern color palette
const COLORS = {
  primary: "#FF385C", // Rombuzz signature color (used sparingly)
  background: "#FFFFFF",
  surface: "#F8F9FA",
  text: {
    primary: "#1A1A1A",
    secondary: "#666876",
    tertiary: "#8E94A7",
  },
  border: "#E9ECEF",
  tab: {
    inactive: "#8E94A7",
    active: "#FF385C",
  },
  white: "#FFFFFF",
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
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setTab("posts")}
          activeOpacity={0.7}
          style={[styles.tabButton, tab === "posts" && styles.tabButtonActive]}
        >
          <Ionicons 
            name={tab === "posts" ? "newspaper" : "newspaper-outline"} 
            size={22} 
            color={tab === "posts" ? COLORS.tab.active : COLORS.tab.inactive} 
          />
          <Text style={[
            styles.tabText, 
            tab === "posts" && styles.tabTextActive
          ]}>
            Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab("reels")}
          activeOpacity={0.7}
          style={[styles.tabButton, tab === "reels" && styles.tabButtonActive]}
        >
          <Ionicons 
            name={tab === "reels" ? "play-circle" : "play-circle-outline"} 
            size={22} 
            color={tab === "reels" ? COLORS.tab.active : COLORS.tab.inactive} 
          />
          <Text style={[
            styles.tabText, 
            tab === "reels" && styles.tabTextActive
          ]}>
            Reels
          </Text>
        </TouchableOpacity>

        {/* Active indicator */}
        <View style={[
          styles.activeIndicator,
          { left: tab === "posts" ? "12.5%" : "62.5%" }
        ]} />
      </View>
    );
  }, [tab]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: insets.top + 12 }
      ]}>
        <Text style={styles.title}>Let'sBuzz</Text>
      </View>

      {TabBar}

      {/* Body */}
      <View style={styles.content}>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary, // Changed to red
    letterSpacing: -0.5,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: "relative",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.tab.inactive,
  },
  tabTextActive: {
    color: COLORS.tab.active,
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    width: 60,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    transform: [{ translateX: -30 }], // Half of width to center
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
});
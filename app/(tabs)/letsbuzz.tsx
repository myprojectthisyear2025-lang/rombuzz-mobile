/**
 * ============================================================================
 * 📁 File: app/(tabs)/letsbuzz.tsx
 * 🎯 Screen: LetsBuzz (2 tabs) → Posts + Reels
 *
 * Uses:
 *  - <LetsBuzzPosts />
 *  - <LetsBuzzReels />
 *  - <LetsBuzzReelsFullscreen />
 *
 * What changed:
 *  - Removed fullscreen toggle pill
 *  - Added simple expand button in same row as Let'sBuzz
 *  - Expand button only appears on Reels tab
 *  - Fullscreen still hides header + tabs and opens the fullscreen wrapper
 * ============================================================================
 */

import LetsBuzzPosts from "@/src/components/letsbuzz/LetsBuzzPosts";
import LetsBuzzReels from "@/src/components/letsbuzz/LetsBuzzReels";
import LetsBuzzReelsFullscreen from "@/src/components/letsbuzz/LetsBuzzReelsFullscreen";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  primary: "#FF385C",
  background: "#FFFFFF",
  surface: "#F8F9FA",
  text: {
    primary: "#1A1A1A",
    secondary: "#666876",
    tertiary: "#8E94A7",
    light: "#FFFFFF",
  },
  border: "#E9ECEF",
  tab: {
    inactive: "#8E94A7",
    active: "#FF385C",
  },
  white: "#FFFFFF",
};

type TabKey = "posts" | "reels";

type HeaderExpandButtonProps = {
  visible: boolean;
  onPress: () => void;
};

function HeaderExpandButton({ visible, onPress }: HeaderExpandButtonProps) {
  if (!visible) return <View style={styles.headerActionPlaceholder} />;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.headerExpandButton,
        pressed && styles.headerExpandButtonPressed,
      ]}
    >
      <Ionicons name="expand-outline" size={20} color={COLORS.primary} />
    </Pressable>
  );
}

export default function LetsBuzzScreen() {
  const insets = useSafeAreaInsets();
  const { post } = useLocalSearchParams<{ post?: string }>();

  const [tab, setTab] = useState<TabKey>("posts");
  const [reelsFullscreen, setReelsFullscreen] = useState(false);

  useEffect(() => {
    if (post) setTab("posts");
  }, [post]);

  useEffect(() => {
    if (tab !== "reels" && reelsFullscreen) {
      setReelsFullscreen(false);
    }
  }, [tab, reelsFullscreen]);

  const TabBar = useMemo(() => {
    return (
      <View style={styles.tabSection}>
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
            <Text
              style={[
                styles.tabText,
                tab === "posts" && styles.tabTextActive,
              ]}
            >
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
            <Text
              style={[
                styles.tabText,
                tab === "reels" && styles.tabTextActive,
              ]}
            >
              Reels
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.activeIndicator,
              { left: tab === "posts" ? "12.5%" : "62.5%" },
            ]}
          />
        </View>
      </View>
    );
  }, [tab]);

  if (tab === "reels" && reelsFullscreen) {
    return (
      <View style={styles.fullscreenContainer}>
        <StatusBar hidden />
        <LetsBuzzReelsFullscreen
          targetPostId={post ? String(post) : undefined}
          onClose={() => setReelsFullscreen(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
        hidden={false}
      />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10 },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Let'sBuzz</Text>

          <HeaderExpandButton
            visible={tab === "reels"}
            onPress={() => setReelsFullscreen(true)}
          />
        </View>
      </View>

      {TabBar}

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

  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },

  headerRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },

  headerActionPlaceholder: {
    width: 32,
    height: 32,
  },

  headerExpandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  headerExpandButtonPressed: {
    opacity: 0.7,
  },

  tabSection: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
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
    transform: [{ translateX: -30 }],
  },

  content: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
});
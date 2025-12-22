/**
 * ============================================================
 * 📁 File: app/(tabs)/_layout.tsx
 * 🎯 RomBuzz Mobile — Persistent Bottom Bar (Always Visible)
 *
 * Visible Tabs (left → right):
 *  - Home (RomBuzz logo)
 *  - Chat (glow dot, offset)
 *  - Social Stats (signature)
 *  - Notifications (badge + shake once, only if not on screen)
 *  - Profile (avatar + ring)
 *
 * Hidden routes (still inside tabs so bottom bar stays visible):
 *  - letsbuzz, discover, microbuzz, filter, upgrade
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { Tabs, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",

} as const;

const logo = require("@/assets/images/logo.png");

function Dot({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <View style={styles.dot} />;
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : String(count)}</Text>
    </View>
  );
}

function TabIconWrap({
  children,
  active,
  accent,
}: {
  children: React.ReactNode;
  active: boolean;
  accent?: string;
}) {
  return (
    <View
      style={[
        styles.iconPill,
        active && styles.iconPillActive,
        active && accent ? { borderColor: accent } : null,
      ]}
    >
      {children}
    </View>
  );
}

export default function TabLayout() {
  const segments = useSegments();
  const current = useMemo(() => segments.join("/"), [segments]);
    const insets = useSafeAreaInsets();

  // --- These are temporary local demo signals. Later wire to your real store/socket.
  const chatHasNew = true; // ✅ glow dot (offset) feel
  const notifCount = 2; // ✅ badge count
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<number>(0.55); // 0..1 (later compute)

  // 🔔 Shake only when there are notifications AND user is NOT on notifications screen
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await SecureStore.getItemAsync("RBZ_USER");
        if (!raw) return;

        const u = JSON.parse(raw);

        // Try common fields (keep safe)
        const photo =
          u?.avatar ||
          u?.avatarUrl ||
          u?.photoUrl ||
          u?.profilePic ||
          u?.photos?.[0] ||
          null;

        setProfilePhoto(typeof photo === "string" ? photo : null);

        // Simple completion heuristic (later you'll replace with real logic)
        let score = 0;
        if (u?.firstName) score += 0.15;
        if (u?.bio) score += 0.15;
        if (photo) score += 0.3;
        if (Array.isArray(u?.photos) && u.photos.length >= 2) score += 0.25;
        if (u?.gender && u?.lookingFor) score += 0.15;
        setProfileCompletion(Math.min(1, Math.max(0.25, score)));
      } catch {
        // ignore
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const onNotificationsScreen =
      current.includes("(tabs)/notifications") || current.endsWith("notifications");

    if (!notifCount || onNotificationsScreen) return;

    // single shake (one sequence)
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [notifCount, current, shake]);

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: RBZ.c1,
      borderTopColor: RBZ.c3,
      borderTopWidth: 1,
      height: 72 + insets.bottom, // Add bottom inset to height
      paddingBottom: 10 + insets.bottom, // Add bottom inset to padding
      paddingTop: 10,
    }),
    [insets.bottom] // Add dependency
  );


  return (
    <Tabs
      initialRouteName="homepage"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle,
      }}
    >
      {/* ===================== VISIBLE TABS ===================== */}

      {/* 1) Home (RomBuzz logo) */}
     <Tabs.Screen
          name="homepage"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIconWrap active={focused} accent={RBZ.c3}>
                <Image source={logo} style={styles.logoIcon} />
              </TabIconWrap>
            ),
          }}
        />


      {/* 2) Chat (glow dot offset) */}
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIconWrap active={focused} accent={RBZ.c3}>
              <View style={{ position: "relative" }}>
                <Ionicons
                  name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                  size={26}
                  color={focused ? RBZ.c3 : "#fff"}
                />

                {/* Offset dot (status, not urgency) */}
                <View style={styles.dotWrap}>
                  <Dot visible={!focused && chatHasNew} />
                </View>
              </View>
            </TabIconWrap>
          ),
        }}
      />

      {/* 3) Social Stats (signature) */}
      <Tabs.Screen
        name="social-stats"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIconWrap active={focused} accent={RBZ.c4}>
              <Ionicons
                name={focused ? "flame" : "flame-outline"}
                size={26}
                color={focused ? RBZ.c3 : "#fff"}
              />
            </TabIconWrap>
          ),
        }}
      />

      {/* 4) Notifications (shake once + badge, but no shake/badge if already on screen handled above) */}
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => {
            const rotate = shake.interpolate({
              inputRange: [-1, 1],
              outputRange: ["-10deg", "10deg"],
            });

            return (
              <TabIconWrap active={focused} accent={RBZ.c3}>
                <Animated.View style={{ transform: [{ rotate }] }}>
                  <View style={{ position: "relative" }}>
                    <Ionicons
                      name={focused ? "notifications" : "notifications-outline"}
                      size={26}
                      color={focused ? RBZ.c3 : "#fff"}
                    />

                    {!focused && <Badge count={notifCount} />}
                  </View>
                </Animated.View>
              </TabIconWrap>
            );
          },
        }}
      />

      {/* 5) Profile (avatar + ring thickness reflects completion) */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => {
            const ring = focused ? 3 : profileCompletion >= 0.85 ? 3 : 2;
            return (
              <TabIconWrap active={focused} accent={RBZ.c3}>
                <View
                  style={[
                    styles.avatarRing,
                    { borderWidth: ring, borderColor: RBZ.c3 },
                  ]}
                >
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person" size={22} color={RBZ.white} />
                  )}
                </View>
              </TabIconWrap>
            );
          },
        }}
      />

      {/* ===================== HIDDEN SCREENS (KEEP TAB BAR) ===================== */}

      {/** These are navigated from Home top/center. They must be inside tabs to keep the bar visible. */}
      <Tabs.Screen name="letsbuzz" options={{ href: null }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="microbuzz" options={{ href: null }} />
      <Tabs.Screen name="filter" options={{ href: null }} />
      <Tabs.Screen name="upgrade" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
 iconPill: {
  width: 54,
  height: 54,
  borderRadius: 18,
  alignItems: "center",
  justifyContent: "center",

  backgroundColor: RBZ.c2,   // soft rose
  borderWidth: 1,
  borderColor: RBZ.c3,       // romantic glow
},
iconPillActive: {
  backgroundColor: RBZ.c4,
  borderWidth: 1,
  borderColor: RBZ.c3,

  shadowColor: RBZ.c3,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.45,
  shadowRadius: 10,
  elevation: 8,
},

  logoIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },

  dotWrap: {
    position: "absolute",
    right: -2,
    top: 2, // offset, not centered
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: RBZ.c3,
    borderWidth: 1,
    borderColor: RBZ.c1,
  },

  badge: {
    position: "absolute",
    right: -10,
    top: -8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c3,
    borderWidth: 1,
    borderColor: RBZ.c1,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 11,
  },

  avatarRing: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: RBZ.c1,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
});
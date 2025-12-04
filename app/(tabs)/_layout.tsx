/**
 * ============================================================
 * 📁 File: app/(tabs)/_layout.tsx
 * 🎯 Purpose: RomBuzz Mobile Bottom Navigation (6 Tabs, Icons Only)
 * Tabs: Let'sBuzz, Discover, MicroBuzz, Chat, Notifications, Profile
 * ============================================================
 */

import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false, // ⬅️ ICONS ONLY
      }}
    >

      {/* 1️⃣ Let’sBuzz (Feed) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Let'sBuzz",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* 2️⃣ Discover */}
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="magnifyingglass.circle.fill" color={color} />
          ),
        }}
      />

      {/* 3️⃣ MicroBuzz */}
      <Tabs.Screen
        name="microbuzz"
        options={{
          title: "MicroBuzz",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="scope" color={color} />
          ),
        }}
      />

      {/* 4️⃣ Chat */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bubble.left.and.bubble.right.fill" color={color} />
          ),
        }}
      />

      {/* 5️⃣ Notifications */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bell.fill" color={color} />
          ),
        }}
      />

      {/* 6️⃣ Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle.fill" color={color} />
          ),
        }}
      />

    </Tabs>
  );
}

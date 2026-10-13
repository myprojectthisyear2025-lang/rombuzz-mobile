/**
 * Path: src/features/onboarding/FirstSignupTourNotificationsPreview.tsx
 * Purpose: Illustrate notification filters, activity rows, and unread emphasis.
 * All notifications are fictional and remain inside the tour.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
    TourFrame,
    useTourPreviewStyles,
} from "./FirstSignupTourPreviewKit";

const NOTICES = [
  {
    icon: "heart",
    title: "You and Maya matched",
    copy: "Your next conversation starts here.",
    time: "Just now",
    unread: true,
  },
  {
    icon: "flash",
    title: "A new Buzz",
    copy: "Someone nearby sent you a Buzz.",
    time: "10 min ago",
    unread: true,
  },
  {
    icon: "gift-outline",
    title: "You received a gift",
    copy: "A little something from your match.",
    time: "1 hour ago",
    unread: false,
  },
  {
    icon: "chatbubble-outline",
    title: "A new comment",
    copy: "Maya commented on your post.",
    time: "Today",
    unread: false,
  },
] as const;

export default function FirstSignupTourNotificationsPreview() {
  const { colors, s } = useTourPreviewStyles();

  return (
    <TourFrame title="Notifications" subtitle="Catch up on your RomBuzz activity.">
      <View style={s.between}>
        <Text style={s.label}>Your activity</Text>
        <Text style={s.accent}>Mark all read</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabs}
      >
        {["All", "Buzz", "Matches", "Likes", "Gifts", "Comments"].map(
          (label, index) => (
            <View
              key={label}
              style={[s.tab, index === 0 && s.activeTab]}
            >
              <Text style={index === 0 ? s.accent : s.copy}>{label}</Text>
            </View>
          ),
        )}
      </ScrollView>

      {NOTICES.map((notice) => (
        <View
          key={notice.title}
          style={[
            s.card,
            s.row,
            notice.unread && { backgroundColor: colors.surfaceRaised },
          ]}
        >
          <View style={[local.icon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons
              name={notice.icon}
              size={18}
              color={notice.unread ? colors.brand : colors.iconMuted}
            />
          </View>
          <View style={s.grow}>
            <Text style={s.label}>{notice.title}</Text>
            <Text style={s.copy}>{notice.copy}</Text>
            <Text style={[s.tiny, { marginTop: 4 }]}>{notice.time}</Text>
          </View>
          {notice.unread ? (
            <View style={[local.dot, { backgroundColor: colors.brand }]} />
          ) : null}
        </View>
      ))}
    </TourFrame>
  );
}

const local = StyleSheet.create({
  icon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
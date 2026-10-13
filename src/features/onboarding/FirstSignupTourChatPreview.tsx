/**
 * Path: src/features/onboarding/FirstSignupTourChatPreview.tsx
 * Purpose: Illustrate the chat inbox, match search, unread counts, and presence.
 * Fictional conversations do not load messages or open chat routes.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    TourAvatar,
    TourFrame,
    useTourPreviewStyles,
} from "./FirstSignupTourPreviewKit";

const CONVERSATIONS = [
  { name: "Maya", initials: undefined, text: "Coffee this weekend?", time: "Now", unread: 2 },
  { name: "Jordan", initials: "J", text: "That’s my favorite spot too!", time: "12m", unread: 0 },
  { name: "Alex", initials: "A", text: "You: Sounds like a plan", time: "1h", unread: 0 },
];

export default function FirstSignupTourChatPreview() {
  const { colors, s } = useTourPreviewStyles();

  return (
    <TourFrame
      title="Chats"
      subtitle="Your conversations, all in one place."
    >
      <View style={[s.row, s.card]}>
        <Ionicons name="search-outline" size={17} color={colors.iconMuted} />
        <Text style={s.copy}>Search matches</Text>
      </View>

      <View style={s.card}>
        {CONVERSATIONS.map((item, index) => (
          <View key={item.name}>
            {index > 0 ? <View style={s.divider} /> : null}
            <View style={[s.row, local.conversation]}>
              <View>
                <TourAvatar initials={item.initials} size={43} />
                {index === 0 ? (
                  <View
                    style={[
                      local.online,
                      { borderColor: colors.surface },
                    ]}
                  />
                ) : null}
              </View>
              <View style={s.grow}>
                <Text style={s.label}>{item.name}</Text>
                <Text style={s.copy} numberOfLines={1}>{item.text}</Text>
              </View>
              <View style={local.trailing}>
                <Text style={s.tiny}>{item.time}</Text>
                {item.unread > 0 ? (
                  <View style={[local.badge, { backgroundColor: colors.brand }]}>
                    <Text style={s.buttonText}>{item.unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.label}>Keep your connection going</Text>
        <Text style={[s.copy, { marginTop: 5 }]}>
          Open a match to continue the conversation.
        </Text>
      </View>

      <View style={s.row}>
        <View style={[local.keyDot, { backgroundColor: colors.brand }]} />
        <Text style={s.copy}>Pink counts highlight unread messages.</Text>
      </View>
    </TourFrame>
  );
}

const local = StyleSheet.create({
  conversation: { paddingVertical: 13 },
  trailing: { alignItems: "flex-end", gap: 7 },
  badge: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  online: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: "#35A66F",
  },
  keyDot: { width: 7, height: 7, borderRadius: 4 },
});
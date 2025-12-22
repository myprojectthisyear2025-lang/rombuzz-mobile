/**
 * ============================================================
 * 📁 File: app/(tabs)/chat.tsx
 * 🎯 Purpose: RomBuzz Chat List Screen
 * Shows chat rooms, unread counts, and active users.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  gray: "#6b7280",
  light: "#f9fafb",
} as const;

export default function ChatScreen() {
  const router = useRouter();
  const [chats, setChats] = useState([
    {
      id: "1",
      name: "Sarah M.",
      lastMessage: "Hey! How was your weekend?",
      time: "10:30 AM",
      unread: 3,
      isOnline: true,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b786d4d1?w=400&auto=format&fit=crop",
    },
    {
      id: "2",
      name: "Alex Chen",
      lastMessage: "Let's meet up for coffee tomorrow",
      time: "Yesterday",
      unread: 0,
      isOnline: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
    },
    {
      id: "3",
      name: "Jordan Taylor",
      lastMessage: "Thanks for the great date! 😊",
      time: "2 days ago",
      unread: 1,
      isOnline: false,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop",
    },
    {
      id: "4",
      name: "Mike Rodriguez",
      lastMessage: "Check out this article I sent you",
      time: "3 days ago",
      unread: 0,
      isOnline: true,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop",
    },
  ]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[RBZ.c1, RBZ.c4]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Connect with your matches</Text>
      </LinearGradient>

      {/* Online Users */}
      <View style={styles.onlineSection}>
        <Text style={styles.onlineTitle}>Online Now</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.onlineList}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.onlineUser}>
                <View style={styles.onlineAvatar}>
                  <Image
                    source={{ uri: `https://images.unsplash.com/photo-${1500648767791 + i}?w=200&auto=format&fit=crop` }}
                    style={styles.onlineAvatarImg}
                  />
                  <View style={styles.onlineDot} />
                </View>
                <Text style={styles.onlineName}>
                  {["Alex", "Sam", "Taylor", "Jordan"][i - 1]}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Chat List */}
      <ScrollView style={styles.chatList}>
        <Text style={styles.chatListTitle}>Recent Conversations</Text>
        
        {chats.map((chat) => (
          <Pressable key={chat.id} style={styles.chatItem}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: chat.avatar }} style={styles.avatar} />
              {chat.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>
              <Text style={styles.chatMessage} numberOfLines={1}>
                {chat.lastMessage}
              </Text>
            </View>
            
            {chat.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{chat.unread}</Text>
              </View>
            )}
            
            <Ionicons name="chevron-forward" size={18} color={RBZ.gray} />
          </Pressable>
        ))}
      </ScrollView>

      {/* New Message Button */}
      <Pressable style={styles.newMessageButton}>
        <Ionicons name="add" size={24} color={RBZ.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RBZ.light,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: RBZ.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fde2e4",
    opacity: 0.9,
  },
  onlineSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: RBZ.white,
    marginBottom: 8,
  },
  onlineTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: RBZ.c1,
    marginBottom: 12,
  },
  onlineList: {
    flexDirection: "row",
    gap: 16,
  },
  onlineUser: {
    alignItems: "center",
  },
  onlineAvatar: {
    position: "relative",
    marginBottom: 4,
  },
  onlineAvatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: RBZ.c3,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: RBZ.white,
  },
  onlineName: {
    fontSize: 12,
    color: RBZ.gray,
    fontWeight: "600",
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatListTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: RBZ.c1,
    marginVertical: 16,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RBZ.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: RBZ.white,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "700",
    color: RBZ.c1,
  },
  chatTime: {
    fontSize: 12,
    color: RBZ.gray,
  },
  chatMessage: {
    fontSize: 14,
    color: "#6b7280",
  },
  unreadBadge: {
    backgroundColor: RBZ.c3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  unreadText: {
    color: RBZ.white,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 6,
  },
  newMessageButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: RBZ.c4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
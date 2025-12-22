/**
 * =============================================================================
 * 📁 File: app/(tabs)/notifications.tsx
 * 🎯 Screen: RomBuzz Mobile — Notifications
 *
 * Real-time updates via Socket.IO
 * Mark as read / delete / block / respond to match requests
 * =============================================================================
 */

import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const API_BASE = "https://YOUR_BACKEND_URL/api";

type NotificationType =
  | "wingman"
  | "match"
  | "buzz"
  | "like"
  | "comment"
  | "reaction"
  | "new_post"
  | "share"
  | "system"
  | string;

interface NotificationItem {
  id: string;
  toId: string;
  fromId?: string;
  type: NotificationType;
  message: string;
  href?: string;
  postId?: string;
  postOwnerId?: string;
  entity?: string;
  entityId?: string;
  read?: boolean;
  createdAt: string | Date;
  via?: string;
}

const FILTERS: NotificationType[] = [
  "all",
  "buzz",
  "match",
  "like",
  "comment",
  "reaction",
  "new_post",
  "share",
  "wingman",
];

export default function NotificationsScreen() {
  const router = useRouter();

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationType>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [buzzLoading, setBuzzLoading] = useState<Record<string, boolean>>({});
  const [buzzSent, setBuzzSent] = useState<Record<string, boolean>>({});

  // Demo notifications (replace with real API)
  useEffect(() => {
    const demoNotifications: NotificationItem[] = [
      {
        id: "1",
        toId: "user123",
        fromId: "user456",
        type: "buzz",
        message: "Sarah buzzed you!",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      },
      {
        id: "2",
        toId: "user123",
        fromId: "user789",
        type: "like",
        message: "Alex liked your profile",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      },
      {
        id: "3",
        toId: "user123",
        fromId: "user101",
        type: "match",
        message: "You matched with Jordan!",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        id: "4",
        toId: "user123",
        fromId: "user202",
        type: "comment",
        message: "Taylor commented on your post",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      },
    ];

    setTimeout(() => {
      setNotifications(demoNotifications);
      setLoading(false);
    }, 800);
  }, []);

  // Unread counts
  const unreadCounts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    for (const n of notifications) {
      if (!n.read) {
        c.all++;
        const t = n.type || "system";
        c[t] = (c[t] || 0) + 1;
      }
    }
    return c;
  }, [notifications]);

  // Filtered view
  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleQuickBuzzBack = async (fromId: string | undefined, notificationId: string) => {
    if (!fromId) return;

    setBuzzLoading((prev) => ({ ...prev, [notificationId]: true }));

    setTimeout(() => {
      setBuzzSent((prev) => ({ ...prev, [notificationId]: true }));
      setTimeout(
        () => setBuzzSent((prev) => ({ ...prev, [notificationId]: false })),
        2000
      );
      setBuzzLoading((prev) => ({ ...prev, [notificationId]: false }));
    }, 1000);
  };

  const iconForType = (t: NotificationType) => {
    switch (t) {
      case "buzz":
        return <FontAwesome5 name="bell" size={18} color="#a855f7" />;
      case "like":
        return <FontAwesome5 name="heart" size={18} color="#f43f5e" />;
      case "comment":
        return <FontAwesome5 name="comment" size={18} color="#8b5cf6" />;
      case "reaction":
        return <FontAwesome5 name="comment-dots" size={18} color="#a855f7" />;
      case "match":
        return <FontAwesome5 name="handshake" size={18} color="#22c55e" />;
      case "wingman":
        return <FontAwesome5 name="robot" size={18} color="#6366f1" />;
      case "share":
        return <FontAwesome5 name="share-alt" size={18} color="#3b82f6" />;
      case "new_post":
        return <FontAwesome5 name="plus-circle" size={18} color="#f59e0b" />;
      default:
        return <FontAwesome5 name="user" size={18} color="#6b7280" />;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#b1123c" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            Unread:{" "}
            <Text style={styles.unreadCount}>{unreadCounts.all || 0}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={markAllAsRead}
        >
          <Text style={styles.markAllButtonText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((type) => {
          const isActive = filter === type;
          const label =
            type === "all"
              ? "All"
              : type === "buzz"
              ? "Buzz"
              : type === "match"
              ? "Matches"
              : type === "like"
              ? "Likes"
              : type === "comment"
              ? "Comments"
              : type === "reaction"
              ? "Reactions"
              : type === "new_post"
              ? "New Posts"
              : type === "share"
              ? "Shares"
              : "Wingman";

          const count = unreadCounts[type as string] || 0;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                isActive && styles.filterChipActive,
              ]}
              onPress={() => setFilter(type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {label}
              </Text>
              {count > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Notification List */}
      <ScrollView style={styles.list}>
        {filteredNotifications.map((n) => {
          const isUnread = !n.read;
          const borderColor =
            n.type === "buzz"
              ? "#a855f7"
              : n.type === "match"
              ? "#22c55e"
              : n.type === "like"
              ? "#f43f5e"
              : n.type === "comment"
              ? "#8b5cf6"
              : n.type === "reaction"
              ? "#a855f7"
              : n.type === "new_post"
              ? "#f59e0b"
              : n.type === "share"
              ? "#3b82f6"
              : n.type === "wingman"
              ? "#6366f1"
              : "#d1d5db";

          const createdAtDate =
            n.createdAt instanceof Date
              ? n.createdAt
              : new Date(n.createdAt);

          return (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.notificationCard,
                { borderLeftColor: borderColor },
                isUnread ? styles.notificationUnread : null,
              ]}
              activeOpacity={0.85}
            >
              {/* Left icon */}
              <View style={styles.iconWrapper}>{iconForType(n.type)}</View>

              {/* Middle content */}
              <View style={styles.notificationContent}>
                <Text style={styles.notificationMessage}>{n.message}</Text>
                <Text style={styles.notificationTime}>
                  {formatDistanceToNow(createdAtDate, { addSuffix: true })}
                </Text>

                {/* Buzz actions */}
                {n.type === "buzz" && n.fromId && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        buzzSent[n.id]
                          ? styles.actionBuzzSent
                          : buzzLoading[n.id]
                          ? styles.actionBuzzLoading
                          : styles.actionBuzz,
                      ]}
                      disabled={buzzLoading[n.id] || buzzSent[n.id]}
                      onPress={() =>
                        handleQuickBuzzBack(n.fromId, n.id)
                      }
                    >
                      <Text style={styles.actionText}>
                        {buzzLoading[n.id]
                          ? "⏳"
                          : buzzSent[n.id]
                          ? "✅ Buzz Sent!"
                          : "🔔 Buzz Back"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Right menu */}
              <View style={styles.menuWrapper}>
                <TouchableOpacity
                  onPress={() =>
                    setMenuOpen(menuOpen === n.id ? null : n.id)
                  }
                  style={styles.menuButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons
                    name="more-vert"
                    size={18}
                    color="#6b7280"
                  />
                </TouchableOpacity>

                {menuOpen === n.id && (
                  <View style={styles.menuCard}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        markAsRead(n.id);
                        setMenuOpen(null);
                      }}
                    >
                      <MaterialIcons
                        name="notifications-none"
                        size={16}
                        color="#6b7280"
                      />
                      <Text style={styles.menuItemText}>Mark read</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        deleteNotification(n.id);
                        setMenuOpen(null);
                      }}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={16}
                        color="#6b7280"
                      />
                      <Text style={styles.menuItemText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              When something happens, you'll see it here in real time.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// =============================
// 🎨 Styles
// =============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff5f7",
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#b1123c",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  unreadCount: {
    fontWeight: "700",
    color: "#111827",
  },
  markAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  markAllButtonText: {
    fontSize: 11,
    color: "#4b5563",
    fontWeight: "600",
  },
  filtersRow: {
    marginTop: 6,
    marginBottom: 8,
  },
  filtersContent: {
    paddingRight: 4,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: "#b1123c",
    borderColor: "#b1123c",
  },
  filterChipText: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  filterBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: "#d8345f",
  },
  filterBadgeText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#d1d5db",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  notificationUnread: {
    backgroundColor: "#ffe4f0",
  },
  iconWrapper: {
    marginRight: 10,
    marginTop: 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  notificationTime: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 6,
  },
  actionButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionBuzz: {
    backgroundColor: "#ede9fe",
  },
  actionBuzzLoading: {
    backgroundColor: "#e5e7eb",
  },
  actionBuzzSent: {
    backgroundColor: "#dcfce7",
  },
  menuWrapper: {
    marginLeft: 8,
    alignItems: "flex-end",
  },
  menuButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  menuCard: {
    position: "absolute",
    top: 22,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    minWidth: 130,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  menuItemText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#4b5563",
  },
  emptyState: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
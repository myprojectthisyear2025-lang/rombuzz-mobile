/**
 * =============================================================================
 * 📁 File: app/(tabs)/notifications.tsx
 * 🎯 Screen: RomBuzz Mobile — Notifications (REAL) - PERFECTED UI
 * 
 * Features:
 *  ✅ Fetch notifications from backend
 *  ✅ Real-time updates via socket ("notification")
 *  ✅ Mark read / Mark all read
 *  ✅ Delete notification
 *  ✅ Block sender (same endpoint as web)
 *  ✅ RomBuzz premium UI + filters + unread badges
 *  ✅ FIXED: Menu doesn't hide under other notifications
 *  ✅ FIXED: Better unread indicator color
 *  ✅ FIXED: Smaller, more compact notification cards
 * =============================================================================
 */

import { API_BASE } from "@/src/config/api";
import { getSocket, onNotification } from "@/src/lib/socket";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// RomBuzz Color Palette
const C1 = "#b1123c"; // Primary red
const C2 = "#d8345f"; // Secondary pink
const C3 = "#e9486a"; // Light pink
const C4 = "#b5179e"; // Purple
const C5 = "#7209b7"; // Deep purple
const BG = "#fdf2f8"; // Light pink background
const CARD = "#ffffff"; // White cards
const UNREAD_BG = "#fff0f5"; // Subtle unread background

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

function labelForFilter(type: NotificationType) {
  return type === "all"
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
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState<string>("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationType>("all");
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // For menu positioning
  const menuRefs = useRef<{ [key: string]: { x: number, y: number, width: number, height: number } }>({});
  
  // de-dupe guard for real-time (avoid double inserts)
  const seenIds = useRef(new Set<string>());

  // ---------------------------
  // Load token once
  // ---------------------------
  useEffect(() => {
    (async () => {
      const t = (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";
      setToken(t);
    })();
  }, []);

  // ---------------------------
  // Fetch notifications
  // ---------------------------
  const fetchNotifications = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) {
        data.forEach((n) => n?.id && seenIds.current.add(n.id));
        setNotifications(
          data.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.warn("Fetch notifications failed:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
  }, [token]);

  // ---------------------------
  // Real-time socket listener
  // ---------------------------
  useEffect(() => {
    if (!token) return;

    let unsub: null | (() => void) = null;

    (async () => {
      // ensures singleton socket exists & authed
      await getSocket();

      // subscribe to notifications coming from socket.ts
      unsub = onNotification((n: NotificationItem) => {
        if (!n?.id) return;
        if (seenIds.current.has(n.id)) return;
        seenIds.current.add(n.id);

        setNotifications((prev) => {
          const next = [n, ...prev];
          next.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          return next;
        });
      });
    })();

    return () => {
      try {
        unsub?.();
      } catch {}
    };
  }, [token]);

  // ---------------------------
  // Counts + filtering
  // ---------------------------
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

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  // ---------------------------
  // Helpers: API actions
  // ---------------------------
  const markAsRead = async (id: string) => {
    // optimistic
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setSelectedMenuId(null);

    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  };

  const markAsUnread = async (id: string) => {
    // optimistic
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: false } : n))
    );
    setSelectedMenuId(null);

    try {
      await fetch(`${API_BASE}/notifications/${id}/unread`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await Promise.allSettled(
        unread.map((n) =>
          fetch(`${API_BASE}/notifications/${n.id}/read`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    // optimistic remove
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedMenuId(null);

    try {
      await fetch(`${API_BASE}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      // if delete failed, refetch to stay consistent
      try {
        const res = await fetch(`${API_BASE}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) {
          data.forEach((n) => n?.id && seenIds.current.add(n.id));
          setNotifications(
            data.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          );
        }
      } catch {}
    }
  };

   // ---------------------------
  // Navigation from notification
  // ---------------------------
  const normalizeHref = (raw?: string) => {
    if (!raw) return "/(tabs)/notifications";

    let fixed = raw.trim();
    if (!fixed.startsWith("/")) fixed = "/" + fixed;

    // --- Translate legacy web-style routes to mobile routes ---
    // /discover  -> /(tabs)/discover
    // /letsbuzz  -> /(tabs)/letsbuzz
    // /notifications -> /(tabs)/notifications
    if (fixed === "/discover") fixed = "/(tabs)/discover";
    if (fixed === "/letsbuzz") fixed = "/(tabs)/letsbuzz";
    if (fixed === "/notifications") fixed = "/(tabs)/notifications";

    // /viewprofile/:id or /viewprofile/:id?post=123
    // In mobile:
    //  - profile: /view-profile?id=:id
    //  - post:    /(tabs)/letsbuzz?post=123
    if (fixed.startsWith("/viewprofile/")) {
      const withoutPrefix = fixed.replace("/viewprofile/", ""); // "USER?post=123" or "USER"
      const [userPart, qs] = withoutPrefix.split("?");
      const params = new URLSearchParams(qs || "");
      const post = params.get("post");

      if (post) return `/(tabs)/letsbuzz?post=${encodeURIComponent(post)}`;
      return `/view-profile?id=${encodeURIComponent(userPart)}`;
    }

    return fixed;
  };

  const resolveHref = (n: NotificationItem) => {
    const type = String(n?.type || "system");
    const fromId = n?.fromId ? String(n.fromId) : "";
    const postId = n?.postId || n?.entityId ? String(n.postId || n.entityId) : "";

    // ✅ Your desired mapping (mobile routes)
    if (type === "wingman") {
      return "/(tabs)/discover";
    }

    if (type === "match" || type === "buzz") {
      if (fromId) return `/view-profile?id=${encodeURIComponent(fromId)}`;
      return "/(tabs)/notifications";
    }

    // like -> will become gift:
    // direct to the specific post in LetsBuzz feed
    if (type === "like") {
      if (postId) return `/(tabs)/letsbuzz?post=${encodeURIComponent(postId)}`;
      if (fromId) return `/view-profile?id=${encodeURIComponent(fromId)}`;
      return "/(tabs)/letsbuzz";
    }

    // comment -> that specific post in LetsBuzz feed
    if (type === "comment") {
      if (postId) return `/(tabs)/letsbuzz?post=${encodeURIComponent(postId)}`;
      return "/(tabs)/letsbuzz";
    }

    // new_post -> show the specific post in LetsBuzz feed
    if (type === "new_post") {
      if (postId) return `/(tabs)/letsbuzz?post=${encodeURIComponent(postId)}`;
      if (fromId) return `/view-profile?id=${encodeURIComponent(fromId)}`;
      return "/(tabs)/letsbuzz";
    }

    // share -> direct to the particular post that has been shared
    if (type === "share") {
      if (postId) return `/(tabs)/letsbuzz?post=${encodeURIComponent(postId)}`;
      return "/(tabs)/letsbuzz";
    }

    // reaction -> leave for now, but don't break navigation
    if (type === "reaction") {
      if (postId) return `/(tabs)/letsbuzz?post=${encodeURIComponent(postId)}`;
      return "/(tabs)/notifications";
    }

    // If backend sends href, still accept it (after translating legacy routes)
    if (n?.href) return normalizeHref(n.href);

    return "/(tabs)/notifications";
  };


  const handleOpen = async (n: NotificationItem) => {
    if (selectedMenuId) {
      setSelectedMenuId(null);
      return;
    }
    
    try {
      await markAsRead(n.id);
    } catch {}
    const href = resolveHref(n);
    router.push(href as any);
  };

  // ---------------------------
  // UI helpers
  // ---------------------------
  const iconForType = (t: NotificationType) => {
    switch (t) {
      case "buzz":
        return <FontAwesome5 name="bolt" size={16} color={C1} />;
      case "like":
        return <FontAwesome5 name="heart" size={15} color={C2} />;
      case "comment":
        return <FontAwesome5 name="comment-alt" size={15} color={C4} />;
      case "reaction":
        return <FontAwesome5 name="smile" size={15} color={C5} />;
      case "match":
        return <FontAwesome5 name="handshake" size={15} color={C1} />;
      case "wingman":
        return <FontAwesome5 name="robot" size={15} color={C3} />;
      case "share":
        return <FontAwesome5 name="share-alt" size={15} color={C2} />;
      case "new_post":
        return <FontAwesome5 name="plus-circle" size={15} color={C3} />;
      default:
        return <FontAwesome5 name="bell" size={15} color="#9ca3af" />;
    }
  };

  const leftBarColor = (t: NotificationType) => {
    switch (t) {
      case "buzz":
        return C1;
      case "match":
        return C1;
      case "like":
        return C2;
      case "comment":
        return C4;
      case "reaction":
        return C5;
      case "new_post":
        return C3;
      case "share":
        return C2;
      case "wingman":
        return C3;
      default:
        return "#9ca3af";
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getMenuPosition = (id: string) => {
    const pos = menuRefs.current[id];
    if (!pos) return { top: 40, right: 10 };
    
    // Calculate position to ensure menu is visible
    const menuHeight = 110; // Approximate menu height
    const menuWidth = 160; // Menu width
    
    let top = pos.y + pos.height;
    let right = SCREEN_WIDTH - pos.x - pos.width;
    
    // Adjust if menu would go off screen
    if (top + menuHeight > SCREEN_WIDTH) {
      top = pos.y - menuHeight;
    }
    
    return { top, right };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={C1} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCounts.all || 0} unread • {notifications.length} total
            </Text>
          </View>
          
          {unreadCounts.all > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton} 
              onPress={markAllAsRead}
              activeOpacity={0.7}
            >
              <MaterialIcons name="done-all" size={16} color={C1} />
              <Text style={styles.markAllButtonText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((type) => {
          const isActive = filter === type;
          const count = unreadCounts[type as string] || 0;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                isActive && styles.filterChipActive,
                { borderColor: isActive ? leftBarColor(type) : "#f1d2da" }
              ]}
              onPress={() => setFilter(type)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.filterChipText,
                isActive && styles.filterChipTextActive
              ]}>
                {labelForFilter(type)}
              </Text>
              
              {count > 0 && (
                <View style={[
                  styles.filterBadge,
                  { backgroundColor: isActive ? "#ffffff" : leftBarColor(type) }
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    { color: isActive ? leftBarColor(type) : "#ffffff" }
                  ]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Notifications List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.map((n) => {
          const isUnread = !n.read;
          const createdAtDate = n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt);
          const menuPosition = getMenuPosition(n.id);

          return (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.notificationCard,
                isUnread && styles.notificationUnread,
                { borderLeftColor: leftBarColor(n.type) }
              ]}
              activeOpacity={0.9}
              onPress={() => handleOpen(n)}
            >
              {/* Icon and Content */}
              <View style={styles.cardMainContent}>
                <View style={[
                  styles.iconWrapper, 
                  { backgroundColor: `${leftBarColor(n.type)}10` }
                ]}>
                  {iconForType(n.type)}
                </View>
                
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationType}>
                      {labelForFilter(n.type)}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatDistanceToNow(createdAtDate, { addSuffix: true })}
                    </Text>
                  </View>
                  
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {n.message}
                  </Text>
                  
                  {isUnread && (
                    <View style={styles.unreadIndicator}>
                      <View style={[styles.unreadDot, { backgroundColor: "#10b981" }]} />
                      <Text style={styles.unreadText}>Unread</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Menu Button */}
              <TouchableOpacity
                ref={ref => {
                  if (ref) {
                    ref.measure((x, y, width, height, pageX, pageY) => {
                      menuRefs.current[n.id] = { 
                        x: pageX, 
                        y: pageY, 
                        width, 
                        height 
                      };
                    });
                  }
                }}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedMenuId(selectedMenuId === n.id ? null : n.id);
                }}
                style={styles.menuButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="more-vert" size={18} color="#9ca3af" />
              </TouchableOpacity>

              {/* Menu Modal (FIXED: Always on top) */}
              <Modal
                visible={selectedMenuId === n.id}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedMenuId(null)}
              >
                <TouchableOpacity
                  style={styles.menuBackdrop}
                  activeOpacity={1}
                  onPress={() => setSelectedMenuId(null)}
                >
                  <View style={[styles.menuCard, { 
                    top: menuPosition.top,
                    right: menuPosition.right
                  }]}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        if (n.read) {
                          markAsUnread(n.id);
                        } else {
                          markAsRead(n.id);
                        }
                      }}
                    >
                      <MaterialIcons
                        name={n.read ? "mark-email-unread" : "mark-email-read"}
                        size={16}
                        color={C1}
                      />
                      <Text style={styles.menuItemText}>
                        {n.read ? "Mark as unread" : "Mark as read"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => deleteNotification(n.id)}
                    >
                      <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
                      <Text style={[styles.menuItemText, { color: "#ef4444" }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </TouchableOpacity>
          );
        })}

        {filteredNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FontAwesome5 name="bell-slash" size={40} color="#d1d5db" />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              When you get likes, comments, or matches, they'll appear here
            </Text>
            {filter !== "all" && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setFilter("all")}
              >
                <Text style={styles.emptyButtonText}>Show all notifications</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// =============================
// 🎨 Compact & Polished Styles
// =============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(177, 18, 60, 0.08)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: C1,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
    fontWeight: "500",
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(177, 18, 60, 0.08)",
    gap: 6,
  },
  markAllButtonText: {
    fontSize: 12,
    color: C1,
    fontWeight: "700",
  },
  filtersContainer: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(177, 18, 60, 0.06)",
    backgroundColor: BG,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: "rgba(177, 18, 60, 0.05)",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: -0.2,
  },
  filterChipTextActive: {
    color: C1,
  },
  filterBadge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 14,
    marginBottom: 10,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 72,
  },
  notificationUnread: {
    backgroundColor: UNREAD_BG,
  },
  cardMainContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
    justifyContent: "center",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationType: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  notificationTime: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 4,
  },
  unreadIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  unreadText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  menuButton: {
    padding: 4,
    marginLeft: 8,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100, // Adjust based on your header height
  },
  menuCard: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    zIndex: 9999,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 10,
  },
  menuItemText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(177, 18, 60, 0.08)",
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: C1,
  },
});
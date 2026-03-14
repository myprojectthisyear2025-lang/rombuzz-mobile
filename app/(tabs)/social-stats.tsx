/**
 * ============================================================================
 * 📁 File: app/(tabs)/social-stats.tsx
 * 🎯 Purpose: RomBuzz Mobile — Social Stats (FULLY WIRED with backend)
 * 
 * COMPLETE & READY TO USE:
 * - Real-time stats from backend
 * - Beautiful gradient UI
 * - Full button sets per tab (Accept/Reject/Message/Unmatch/etc.)
 * - Profile navigation
 * - Report/Block functionality
 * - Auto-refresh every 15s
 * ============================================================================
 */

import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions, FlatList, Image,
  Modal,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { API_BASE } from "@/src/config/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* 🎨 RomBuzz Colors */
const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  gray: "#6b7280",
  light: "#f9fafb",
  dark: "#111827",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
} as const;

/* ===================== HELPERS ===================== */

async function getToken() {
  return (
    (await SecureStore.getItemAsync("RBZ_TOKEN")) ||
    (await SecureStore.getItemAsync("token")) ||
    ""
  );
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = await getToken();
  if (!token) throw new Error("NO_TOKEN");

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  return response.json();
}

const safeNum = (n: any) =>
  Number.isFinite(Number(n)) ? Number(n) : 0;

/* ===================== PULSING STAT CARD COMPONENT ===================== */

function StatCard({
  icon,
  label,
  value,
  color,
  desc,
  onPress,
}: {
  icon: React.ComponentProps<typeof FontAwesome5>["name"];
  label: string;
  value: number;
  color: string;
  desc: string;
  onPress?: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 15,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
    }).start(() => {
      if (onPress) onPress();
    });
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <LinearGradient
          colors={[`${color}22`, `${color}11`]}
          style={styles.iconWrap}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FontAwesome5 name={icon} size={24} color={color} />
        </LinearGradient>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.desc}>{desc}</Text>
        {onPress && (
          <View style={styles.cardOverlay}>
            <Ionicons name="chevron-forward" size={16} color={color} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ===================== LIST MODAL COMPONENT ===================== */

function ListModal({
  visible,
  onClose,
  activeTab,
  list,
  listLoading,
  onRefresh,
}: {
  visible: boolean;
  onClose: () => void;
  activeTab: "liked" | "likedYou" | "matches" | null;
  list: any[];
  listLoading: boolean;
  onRefresh: () => void;
}) {
  const router = useRouter();

  const getTitle = () => {
    switch (activeTab) {
      case "liked":
        return "People You Liked";
      case "likedYou":
        return "People Who Liked You";
      case "matches":
        return "Your Matches";
      default:
        return "";
    }
  };

  const getSubtitle = () => {
    switch (activeTab) {
      case "liked":
        return "Tap to cancel likes or view profiles";
      case "likedYou":
        return "Accept, reject, or report incoming likes";
      case "matches":
        return "Chat, unmatch, or view profiles";
      default:
        return "";
    }
  };

  const handleViewProfile = (userId: string) => {
  onClose();

  // ✅ Condition:
  // - If coming from Matches → view-profile.tsx
  // - Else → discover-profile.tsx
  const target =
    activeTab === "matches" ? "/view-profile" : "/discover-profile";

  router.push({
    pathname: target,
    params:
      activeTab === "matches"
        ? { id: userId, fromMatches: "1" } // ✅ matches tab is authoritative
        : { id: userId },
  });
};


 const handleChat = (userId: string) => {
  onClose();

  // ✅ Your real DM screen is: app/chat/[peerId].tsx
  router.push({
    pathname: "/chat/[peerId]",
    params: { peerId: userId },
  });
};


  const handleRespondLike = async (fromId: string, action: "accept" | "reject") => {
    try {
      const response = await apiFetch("/likes/respond", {
        method: "POST",
        body: JSON.stringify({ fromId, action }),
      });

      if (response.success) {
        Alert.alert(
          action === "accept" ? "✅ Match Created!" : "👍 Request Removed",
          action === "accept" 
            ? "You've matched! You can now chat with them."
            : "The like request has been removed.",
          [{ text: "OK", onPress: onRefresh }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process request. Please try again.");
    }
  };

  const handleUnmatch = async (userId: string, userName: string) => {
    Alert.alert(
      "Unmatch",
      `Are you sure you want to unmatch with ${userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            try {
              await apiFetch(`/unmatch/${userId}`, { method: "POST" });
              Alert.alert("Unmatched", "You are no longer matched.", [
                { text: "OK", onPress: onRefresh }
              ]);
            } catch (error) {
              Alert.alert("Error", "Failed to unmatch. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleCancelLike = async (userId: string, userName: string) => {
    Alert.alert(
      "Cancel Like",
      `Remove your like for ${userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove Like",
          style: "destructive",
          onPress: async () => {
          try {
            // ✅ CORRECT BACKEND BEHAVIOR
            // Removes outgoing like (Tom → Ariana)
            // Also removes Tom from Ariana’s "Liked You"
            await apiFetch(`/unmatch/${userId}`, {
              method: "POST",
            });

            Alert.alert(
              "Removed",
              `${userName} has been removed from your likes.`,
              [{ text: "OK", onPress: onRefresh }]
            );
          } catch (error) {
            Alert.alert(
              "Error",
              "Failed to remove like. Please try again."
            );
          }
        },
        },
      ]
    );
  };

const handleReport = (targetId: string, userName: string) => {
  Alert.alert(
    "Report / Block",
    `What would you like to do about ${userName}?`,
    [
      {
        text: "Report User",
        onPress: () => {
          // ✅ Android-safe: show common reasons (no Alert.prompt dependency)
          Alert.alert("Report Reason", "Pick a reason:", [
            {
              text: "Spam / Scam",
              onPress: async () => {
                try {
                  await apiFetch("/report", {
                    method: "POST",
                    body: JSON.stringify({ targetId, reason: "Spam / Scam" }),
                  });
                  Alert.alert("Report submitted", "Thanks — we’ll review it.", [
                    { text: "OK", onPress: onRefresh },
                  ]);
                } catch (e) {
                  Alert.alert("Error", "Failed to report user. Please try again.");
                }
              },
            },
            {
              text: "Harassment",
              onPress: async () => {
                try {
                  await apiFetch("/report", {
                    method: "POST",
                    body: JSON.stringify({ targetId, reason: "Harassment" }),
                  });
                  Alert.alert("Report submitted", "Thanks — we’ll review it.", [
                    { text: "OK", onPress: onRefresh },
                  ]);
                } catch (e) {
                  Alert.alert("Error", "Failed to report user. Please try again.");
                }
              },
            },
            {
              text: "Inappropriate Content",
              onPress: async () => {
                try {
                  await apiFetch("/report", {
                    method: "POST",
                    body: JSON.stringify({ targetId, reason: "Inappropriate Content" }),
                  });
                  Alert.alert("Report submitted", "Thanks — we’ll review it.", [
                    { text: "OK", onPress: onRefresh },
                  ]);
                } catch (e) {
                  Alert.alert("Error", "Failed to report user. Please try again.");
                }
              },
            },
            { text: "Cancel", style: "cancel" },
          ]);
        },
      },
      {
        text: "Block User",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Block User",
            `Block ${userName}? You won't see each other anymore.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Block",
                style: "destructive",
                onPress: async () => {
                  try {
                    // ✅ Backend expects { targetId }
                    await apiFetch("/block", {
                      method: "POST",
                      body: JSON.stringify({ targetId }),
                    });
                    Alert.alert("User Blocked", `${userName} has been blocked.`, [
                      { text: "OK", onPress: onRefresh },
                    ]);
                  } catch (e) {
                    Alert.alert("Error", "Failed to block user. Please try again.");
                  }
                },
              },
            ]
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]
  );
};


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={[RBZ.c1, RBZ.c4]}
        style={styles.modalHeaderGradient}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={28} color={RBZ.white} />
          </TouchableOpacity>
          <View style={styles.modalTitleContainer}>
            <Text style={styles.modalTitle}>{getTitle()}</Text>
            <Text style={styles.modalSubtitle}>{getSubtitle()}</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={22} color={RBZ.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.modalContainer}>
        {listLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={RBZ.c1} />
<Text style={styles.loadingTextWhite}>Loading connections...</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === "matches" ? "people-outline" : "heart-outline"} 
              size={80} 
              color={RBZ.gray} 
            />
            <Text style={styles.emptyText}>
              {activeTab === "liked" && "You haven't liked anyone yet"}
              {activeTab === "likedYou" && "No one has liked you yet"}
              {activeTab === "matches" && "You don't have any matches yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === "liked" && "Start liking profiles to see them here!"}
              {activeTab === "likedYou" && "Complete your profile to get more attention!"}
              {activeTab === "matches" && "Keep exploring to find connections!"}
            </Text>
          </View>
        ) : (
         <FlatList
              data={list}
              keyExtractor={(item) =>
                String(item?.id || item?._id || item?.userId)
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              removeClippedSubviews
              initialNumToRender={6}
              windowSize={7}
              maxToRenderPerBatch={6}
              updateCellsBatchingPeriod={50}
              renderItem={({ item: user }) => {
                const uid = String(user?.id || user?._id || user?.userId || "");
                const name = String(user?.firstName || user?.name || "User");
                if (!uid) return null;
              return (
                <View key={uid} style={styles.listItem}>
                  <TouchableOpacity
                    style={styles.listItemContent}
                    onPress={() => handleViewProfile(uid)}
                  >

                  <View style={styles.userAvatar}>
                    {user.avatar ? (
                      <Image 
                        source={{ uri: user.avatar }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {(user.firstName?.[0] || user.lastName?.[0] || "U").toUpperCase()}
                      </Text>
                    )}
                    {user.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={RBZ.white} />
                      </View>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <View style={styles.userDetails}>
                      {user.age && (
                        <Text style={styles.userDetail}>{user.age} years</Text>
                      )}
                      {user.location && (
                        <Text style={styles.userDetail}>• {user.location}</Text>
                      )}
                      {user.gender && (
                        <Text style={styles.userDetail}>• {user.gender}</Text>
                      )}
                    </View>
                    {user.bio && (
                      <Text style={styles.userBio} numberOfLines={2}>
                        {user.bio}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.listItemActions}>
                  {activeTab === "liked" && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancelLike(uid, name)}
                      >
                        <Ionicons name="close" size={16} color={RBZ.white} />
                        <Text style={styles.actionButtonText}>Remove</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.reportButton]}
                        onPress={() => handleReport(uid, name)}
                      >
                        <Ionicons name="flag-outline" size={16} color={RBZ.white} />
                        <Text style={styles.actionButtonText}>Report</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {activeTab === "likedYou" && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleRespondLike(user.id, "accept")}
                      >
                        <Ionicons name="checkmark" size={18} color={RBZ.white} />
                        <Text style={styles.actionButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRespondLike(user.id, "reject")}
                      >
                        <Ionicons name="close" size={18} color={RBZ.white} />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.reportButton]}
                        onPress={() => handleReport(uid, name)}
                      >
                        <Ionicons name="flag-outline" size={16} color={RBZ.white} />
                        <Text style={styles.actionButtonText}>Report</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {activeTab === "matches" && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.chatButton]}
                        onPress={() => handleChat(uid)}
                      >
                        <Ionicons name="chatbubble-outline" size={16} color={RBZ.white} />
                        <Text style={styles.actionButtonText}>Chat</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.unmatchButton]}
                        onPress={() => handleUnmatch(uid, name)}
                      >
                        <Ionicons name="person-remove-outline" size={16} color={RBZ.white} />
                        <Text style={styles.actionButtonText}>Unmatch</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.reportButton]}
                        onPress={() => handleReport(uid, name)}
                      >
                        <Ionicons name="flag-outline" size={16} color={RBZ.white} />
                        <Text style={styles.actionButtonText}>Report</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => handleViewProfile(uid)}
                  >
                    <Ionicons name="eye-outline" size={16} color={RBZ.white} />
                    <Text style={styles.actionButtonText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

/* ===================== MAIN SCREEN ===================== */

export default function SocialStatsScreen() {
  const router = useRouter();

  // ✅ Always go ONE step back when possible (fallback to Profile, not Home)
  const safeBack = useCallback(() => {
    // expo-router supports canGoBack in newer versions; guard it safely
    const canGoBack =
      typeof (router as any)?.canGoBack === "function"
        ? (router as any).canGoBack()
        : false;

    if (canGoBack) router.back();
    else router.push("/profile"); // better fallback than jumping to Home
  }, [router]);

  // ✅ Swipe right anywhere on the screen to go back (dx > 80)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 18 && Math.abs(g.dy) < 25,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80) safeBack();
      },
    })
  ).current;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [social, setSocial] = useState({
    likedCount: 0,
    likedYouCount: 0,
    matchCount: 0,
    viewsToday: 0,
    viewsTotal: 0,
  });

  const [activeTab, setActiveTab] = useState<null | "liked" | "likedYou" | "matches">(null);
  const [list, setList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headline = "Real-time connections • Live updates • Built for genuine matches";

  /* ===================== FETCHERS ===================== */

  const fetchMe = useCallback(async () => {
    try {
      const data = await apiFetch("/users/me");
      setSocial((prev) => ({
        ...prev,
        viewsToday: safeNum(data?.profileViews?.today),
        viewsTotal: safeNum(data?.profileViews?.total),
      }));
    } catch (error) {
      console.error("fetchMe error:", error);
    }
  }, []);

  const fetchSocial = useCallback(async () => {
    try {
      // ✅ CORRECT BACKEND ENDPOINTS
      const stats = await apiFetch("/social-stats");
      const matchesData = await apiFetch("/matches");

      // Handle different response formats for matches
      const matchesArray = Array.isArray(matchesData)
        ? matchesData
        : Array.isArray(matchesData?.matches)
        ? matchesData.matches
        : Array.isArray(matchesData?.users)
        ? matchesData.users
        : [];

      setSocial((prev) => ({
        ...prev,
        likedCount: safeNum(stats?.likedCount),
        likedYouCount: safeNum(stats?.likedYouCount),
        matchCount: matchesArray.length,
      }));
   } catch (error) {
        const err = error as Error;
        console.error("fetchSocial error:", err);
        if (err.message === "NO_TOKEN") {
        router.replace("/auth/login");
      }
    }
  }, [router]);

  const openList = useCallback(async (type: "liked" | "likedYou" | "matches") => {
    setActiveTab(type);
    setList([]);
    setListLoading(true);

    try {
      let data;
      
      if (type === "matches") {
        data = await apiFetch("/matches");
      } else {
        data = await apiFetch(`/social/${type}`);
      }

      // Handle all possible response formats
      if (Array.isArray(data)) {
        setList(data);
      } else if (Array.isArray(data?.users)) {
        setList(data.users);
      } else if (Array.isArray(data?.matches)) {
        setList(data.matches);
      } else {
        setList([]);
      }
    } catch (error) {
      console.error("openList error", error);
      setList([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  const fetchAll = useCallback(
    async (showSpinner: boolean) => {
      try {
        if (showSpinner) setLoading(true);
        await Promise.all([fetchMe(), fetchSocial()]);
      } catch (e: any) {
        if (e?.message === "NO_TOKEN") {
          router.replace("/auth/login");
          return;
        }
        console.error("SocialStats error:", e);
      } finally {
        setLoading(false);
      }
    },
    [fetchMe, fetchSocial, router]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll(false);
    if (activeTab) {
      await openList(activeTab);
    }
    setRefreshing(false);
  }, [fetchAll, activeTab, openList]);

  const closeModal = useCallback(() => {
    setActiveTab(null);
    setList([]);
  }, []);

  /* ===================== EFFECTS ===================== */

  useFocusEffect(
    useCallback(() => {
      fetchAll(true);

      // Poll every 15 seconds
      pollRef.current = setInterval(() => {
        fetchAll(false);
      }, 15000);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
      };
    }, [fetchAll])
  );

  /* ===================== UI ===================== */

  if (loading) {
    return (
      <LinearGradient
        colors={[RBZ.c1, RBZ.c4]}
        style={styles.loaderContainer}
      >
        <ActivityIndicator size="large" color={RBZ.white} />
        <Text style={styles.loadingTextWhite}>Loading your social stats...</Text>
        <Text style={styles.loadingSubtext}>Connecting to RomBuzz</Text>
      </LinearGradient>
    );
  }

 return (
<View style={styles.container}>
      {/* Header */}
      <LinearGradient 
        colors={[RBZ.c1, RBZ.c4]} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={styles.header}
      >
        <TouchableOpacity onPress={safeBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={RBZ.white} />
      </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Social Stats</Text>
          <Text style={styles.subtitle}>{headline}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.headerRefreshBtn}>
          <Ionicons name="refresh" size={22} color={RBZ.white} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={RBZ.c1}
            colors={[RBZ.c1, RBZ.c2, RBZ.c3]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.grid}>
          <StatCard
            icon="paper-plane"
            label="Likes Sent"
            value={social.likedCount}
            color={RBZ.c2}
            desc="People you've liked"
            onPress={() => openList("liked")}
          />

          <StatCard
            icon="heart"
            label="Likes You"
            value={social.likedYouCount}
            color={RBZ.c3}
            desc="People who liked you"
            onPress={() => openList("likedYou")}
          />

          <StatCard
            icon="user-friends"
            label="Matches"
            value={social.matchCount}
            color={RBZ.c4}
            desc="Mutual connections"
            onPress={() => openList("matches")}
          />

          <StatCard
            icon="eye"
            label="Views Today"
            value={social.viewsToday}
            color={RBZ.c1}
            desc={`${social.viewsTotal} all-time views`}
          />
        </View>

        {/* Stats Summary */}
        <LinearGradient
          colors={["#ffffff", "#fdf2f8"]}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.summaryTitle}> Your Social Activity</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{social.likedCount + social.likedYouCount}</Text>
              <Text style={styles.summaryLabel}>Total Likes</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{social.matchCount}</Text>
              <Text style={styles.summaryLabel}>Matches</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{social.viewsTotal}</Text>
              <Text style={styles.summaryLabel}>Total Views</Text>
            </View>
          </View>
          <Text style={styles.summaryTip}>
            💡 Complete your profile to get more likes!
          </Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>🚀 Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: `${RBZ.c2}15` }]}
              onPress={() => router.push("/discover")}
            >
              <FontAwesome5 name="search" size={20} color={RBZ.c2} />
              <Text style={[styles.actionBtnText, { color: RBZ.c2 }]}>Discover</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: `${RBZ.c3}15` }]}
              onPress={() => router.push("/chat")}
            >
              <FontAwesome5 name="comments" size={20} color={RBZ.c3} />
              <Text style={[styles.actionBtnText, { color: RBZ.c3 }]}>Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: `${RBZ.c4}15` }]}
              onPress={() => router.push("/profile")}
            >
              <FontAwesome5 name="user-edit" size={20} color={RBZ.c4} />
              <Text style={[styles.actionBtnText, { color: RBZ.c4 }]}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips */}
        <LinearGradient
          colors={["#f0f9ff", "#e0f2fe"]}
          style={styles.tipsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.tipsTitle}>💡 Boost Your Stats</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.tipText}>Complete your profile with photos</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.tipText}>Be active and like profiles daily</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.tipText}>Respond to likes within 24 hours</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.tipText}>Send quality messages to matches</Text>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* List Modal */}
      <ListModal
        visible={!!activeTab}
        onClose={closeModal}
        activeTab={activeTab}
        list={list}
        listLoading={listLoading}
        onRefresh={onRefresh}
      />
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: RBZ.light 
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingTextWhite: {
    marginTop: 20,
    fontSize: 16,
    color: RBZ.white,
    fontWeight: "600",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: RBZ.c1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerRefreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { 
    fontSize: 26, 
    fontWeight: "900", 
    color: RBZ.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: { 
    fontSize: 14, 
    color: "#fde2e4", 
    marginTop: 6,
    opacity: 0.9,
  },

  // Scroll Content
  scrollContent: { 
    paddingBottom: 30,
    paddingTop: 16,
  },

  // Grid
  grid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },

  // Card
  card: {
    width: (SCREEN_WIDTH - 48) / 2,
    backgroundColor: RBZ.white,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    position: 'relative',
  },
  cardOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  value: { 
    fontSize: 28, 
    fontWeight: "900", 
    color: RBZ.dark,
    marginBottom: 4,
  },
  label: { 
    fontSize: 15, 
    fontWeight: "800", 
    color: RBZ.dark,
    marginBottom: 2,
  },
  desc: { 
    fontSize: 12, 
    color: RBZ.gray, 
    textAlign: 'center',
  },

  // Summary
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: RBZ.white,
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: RBZ.dark,
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "900",
    color: RBZ.c1,
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: RBZ.gray,
    textAlign: "center",
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#e5e7eb",
  },
  summaryTip: {
    marginTop: 16,
    fontSize: 13,
    color: RBZ.c2,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Actions
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: RBZ.white,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: RBZ.dark,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
  },

  // Tips
  tipsCard: {
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0369a1",
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#0c4a6e",
    marginLeft: 12,
    flex: 1,
  },

  // Modal
  modalHeaderGradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalCloseBtn: {
    marginRight: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: RBZ.white,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: RBZ.light,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: RBZ.dark,
    marginTop: 20,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 15,
    color: RBZ.gray,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
  },
  listItem: {
    backgroundColor: RBZ.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    
  },
  listItemContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: RBZ.c1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    position: "relative",
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "900",
    color: RBZ.white,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: RBZ.success,
    borderRadius: 10,
    padding: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: RBZ.dark,
    marginBottom: 4,
  },
  userDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 6,
  },
  userDetail: {
    fontSize: 13,
    color: RBZ.gray,
    marginRight: 8,
  },
  userBio: {
    fontSize: 14,
    color: RBZ.dark,
    lineHeight: 20,
  },
  listItemActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    minWidth: 100,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: RBZ.success,
  },
  rejectButton: {
    backgroundColor: RBZ.danger,
  },
  cancelButton: {
    backgroundColor: RBZ.warning,
  },
  unmatchButton: {
    backgroundColor: "#dc2626",
  },
  chatButton: {
    backgroundColor: RBZ.info,
  },
  viewButton: {
    backgroundColor: RBZ.c1,
  },
  reportButton: {
    backgroundColor: RBZ.gray,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
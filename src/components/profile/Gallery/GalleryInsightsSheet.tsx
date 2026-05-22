/**
 * ============================================================
 *  File: GalleryInsightsSheet.tsx
 *  Purpose: Insights drawer for gallery media engagement.
 *
 * Features:
 *   - Fetches media insights from backend
 *   - Shows gift totals and gift sender list
 *   - Shows match-private comment threads
 *   - Opens private comment thread per matched user
 *   - Sends private thread messages for the selected media item
 *
 * Used By:
 *   - FullscreenViewer.tsx
 * ============================================================
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";

import PrivateCommentsSheet from "@/src/components/comments/PrivateCommentsSheet";
import { getGiftById } from "@/src/config/rombuzzGifts";
import {
  getGiftSummary,
  type GiftSummaryGiftItem,
  type GiftSummaryResponse,
  type GiftSummaryRow,
} from "@/src/api/gifts";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const MIN_SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",

  white: "#ffffff",
  bg: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  line: "#e5e7eb",
  glass: "rgba(255,255,255,0.95)",
  glassDark: "rgba(0,0,0,0.8)",
};

function displayGiftUserName(row: GiftSummaryRow) {
  const u = row.user || {};
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || u.username || "User";
}

function giftImage(giftId: string) {
  return getGiftById(giftId)?.imageUrl || "";
}

function expandGiftItems(row: GiftSummaryRow) {
  const expanded: GiftSummaryGiftItem[] = [];

  for (const gift of row.gifts || []) {
    const count = Math.max(0, Number(gift.count || 0));

    for (let i = 0; i < count; i += 1) {
      expanded.push({
        ...gift,
        count: 1,
      });
    }
  }

  return expanded;
}

export default function GalleryInsightsSheet({
  ownerId,
  mediaId,
  apiFetch,
  apiJson,
  bottomInset,

  // Notification deep-link support
  deepLinkOpenComments,
  deepLinkCommentId,
  deepLinkParentId,
  deepLinkReplyId,
}: {
  ownerId: string;
  mediaId: string;
  apiFetch: (path: string, init?: RequestInit) => Promise<any>;
  apiJson: (path: string, method: string, body: any) => Promise<any>;
  bottomInset: number;

  deepLinkOpenComments?: boolean;
  deepLinkCommentId?: string;
  deepLinkParentId?: string;
  deepLinkReplyId?: string;
}) {
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<"gifts" | "comments">("gifts");

   const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [errMsg, setErrMsg] = useState<string>("");

    // Shared private comments sheet
  const [privateCommentsOpen, setPrivateCommentsOpen] = useState(false);
  const [privateCommentsCount, setPrivateCommentsCount] = useState(0);
  const deepLinkCommentsConsumedRef = useRef("");

  // Gift summary data
  const [giftSummary, setGiftSummary] = useState<GiftSummaryResponse | null>(null);
  const [giftSummaryLoading, setGiftSummaryLoading] = useState(false);
  const [giftSummaryError, setGiftSummaryError] = useState<string>("");
  const [expandedGiftRow, setExpandedGiftRow] = useState<GiftSummaryRow | null>(null);
  // Animations
  const sheetHeight = useRef(new Animated.Value(0)).current;
  const sheetHeightValueRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const setSheetHeightValue = (nextValue: number) => {
    const clampedValue = Math.max(0, Math.min(MAX_SHEET_HEIGHT, nextValue));

    sheetHeightValueRef.current = clampedValue;
    sheetHeight.setValue(clampedValue);
  };

  // Pan responder for drag-to-expand/collapse
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation((value) => {
          const safeValue = Number(value || sheetHeightValueRef.current || MIN_SHEET_HEIGHT);

          dragStartHeightRef.current = safeValue;
          sheetHeightValueRef.current = safeValue;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const nextHeight = dragStartHeightRef.current - gestureState.dy;

        setSheetHeightValue(nextHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentHeight = sheetHeightValueRef.current;
        const shouldClose = gestureState.vy > 0.9 && currentHeight <= MIN_SHEET_HEIGHT + 30;

        if (shouldClose) {
          closeInsightsDrawer();
          return;
        }

        const midpoint = MIN_SHEET_HEIGHT + (MAX_SHEET_HEIGHT - MIN_SHEET_HEIGHT) / 2;
        const targetHeight =
          gestureState.vy < -0.35 || currentHeight >= midpoint
            ? MAX_SHEET_HEIGHT
            : MIN_SHEET_HEIGHT;

        sheetHeightValueRef.current = targetHeight;

        Animated.spring(sheetHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 45,
          friction: 10,
        }).start();
      },
      onPanResponderTerminate: () => {
        const currentHeight = sheetHeightValueRef.current;
        const midpoint = MIN_SHEET_HEIGHT + (MAX_SHEET_HEIGHT - MIN_SHEET_HEIGHT) / 2;
        const targetHeight = currentHeight >= midpoint ? MAX_SHEET_HEIGHT : MIN_SHEET_HEIGHT;

        sheetHeightValueRef.current = targetHeight;

        Animated.spring(sheetHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 45,
          friction: 10,
        }).start();
      },
    })
  ).current;

   useEffect(() => {
    if (!drawerOpen) return;
    if (!ownerId || !mediaId) return;

    let alive = true;

    sheetHeightValueRef.current = MIN_SHEET_HEIGHT;

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(sheetHeight, {
        toValue: MIN_SHEET_HEIGHT,
        useNativeDriver: false,
        tension: 65,
        friction: 11,
      }),
    ]).start();

      (async () => {
      setErrMsg("");
      setGiftSummaryError("");
      setLoading(true);
      setGiftSummaryLoading(true);
      setExpandedGiftRow(null);

        try {
        const insightsData = await apiFetch(`/media/${ownerId}/insights/${mediaId}`);

        if (!alive) return;

        setInsights(insightsData);
        setErrMsg("");
      } catch (e: any) {
        if (!alive) return;

        setInsights(null);

        // ✅ Do NOT block the Comments/Gifts tabs because owner-only insights failed.
        // Non-owners/commenters should still be able to open private comments and gift summary.
        setErrMsg(e?.message || "Failed to load insights");
      } finally {
        if (alive) {
          setLoading(false);
        }
      }

      try {
        const giftData = await getGiftSummary({
          receiverId: String(ownerId),
          targetType: "gallery_media",
          targetId: String(mediaId),
          includeTransactions: true,
        });

        if (!alive) return;

        setGiftSummary(giftData);
        setGiftSummaryError("");
      } catch (giftError: any) {
        if (!alive) return;

        // ✅ Gift summary gets its own error.
        // Do not reuse media insights errMsg because that makes iPhone show
        // "Request failed" even when only the owner-only insights endpoint failed.
        setGiftSummary(null);
        setGiftSummaryError(
          giftError?.message ? String(giftError.message) : "Failed to load gift insights"
        );
      } finally {
        if (alive) {
          setGiftSummaryLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [drawerOpen, ownerId, mediaId, apiFetch]);

    const openPrivateComments = useCallback(() => {
    if (!ownerId || !mediaId) return;

    setDrawerOpen(false);
    setExpandedGiftRow(null);
    setPrivateCommentsOpen(true);
  }, [mediaId, ownerId]);

  useEffect(() => {
    if (!deepLinkOpenComments) return;
    if (!ownerId || !mediaId) return;

    const consumedKey = [
      String(ownerId || ""),
      String(mediaId || ""),
      String(deepLinkCommentId || ""),
      String(deepLinkParentId || ""),
      String(deepLinkReplyId || ""),
    ].join(":");

    if (deepLinkCommentsConsumedRef.current === consumedKey) return;

    deepLinkCommentsConsumedRef.current = consumedKey;
    setDrawerOpen(false);
    setExpandedGiftRow(null);
    setPrivateCommentsOpen(true);
  }, [
    deepLinkOpenComments,
    ownerId,
    mediaId,
    deepLinkCommentId,
    deepLinkParentId,
    deepLinkReplyId,
  ]);

  const handlePrivateCommentsChanged = useCallback((comments: any[]) => {
    setPrivateCommentsCount(Array.isArray(comments) ? comments.length : 0);
  }, []);

  const giftRows = useMemo(
    () => (Array.isArray(giftSummary?.rows) ? giftSummary.rows : []),
    [giftSummary?.rows]
  );
  const threadList = useMemo(
    () => (Array.isArray(insights?.threads) ? insights.threads : []),
    [insights?.threads]
  );

  const openGiftUserProfile = (userId?: string) => {
    const clickedUserId = String(userId || "");
    const me = String(ownerId || "");

    if (!clickedUserId) return;

    setDrawerOpen(false);
    setExpandedGiftRow(null);

    if (me && clickedUserId === me) {
      router.push("/(tabs)/profile" as any);
      return;
    }

    router.push({
      pathname: "/(tabs)/view-profile",
      params: { userId: clickedUserId },
    } as any);
  };

  const closeInsightsDrawer = () => {
    if (expandedGiftRow) {
      setExpandedGiftRow(null);
      return;
    }

      sheetHeightValueRef.current = 0;

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setDrawerOpen(false);
    });
  };

  const GradientBackground = ({ children, style }: any) => (
    <View style={[style, { backgroundColor: RBZ.glass, backdropFilter: "blur(20px)" }]}>
      {children}
    </View>
  );

  return (
    <>
      {/* Futuristic insights button */}
      <Animated.View style={[styles.insightsBtn, { bottom: bottomInset + 20 }]}>
        <Pressable
          onPress={() => {
            setDrawerOpen(true);
          }}
          style={styles.insightsBtnInner}
        >
          <Ionicons name="analytics" size={20} color={RBZ.white} />
          <Text style={styles.insightsText}>Insights</Text>
          <View style={styles.btnGlow} />
        </Pressable>
      </Animated.View>

      {/* Stats overlay */}
      {drawerOpen === false && insights && (
        <Animated.View style={[styles.statsWrap, { bottom: bottomInset + 80 }]}>
          {Number(insights?.totalGifts || 0) > 0 && (
            <Pressable onPress={() => setDrawerOpen(true)} style={styles.statPill}>
              <Ionicons name="gift" size={16} color={RBZ.white} />
              <Text style={styles.statText}>{Number(insights.totalGifts)}</Text>
              <View style={styles.statGlow} />
            </Pressable>
          )}
          {Number(insights?.threads?.length || 0) > 0 && (
            <Pressable onPress={() => setDrawerOpen(true)} style={styles.statPill}>
              <Ionicons name="chatbubble-ellipses" size={16} color={RBZ.white} />
              <Text style={styles.statText}>{Number(insights.threads.length)}</Text>
              <View style={styles.statGlow} />
            </Pressable>
          )}
        </Animated.View>
      )}

      {/* Main Insights Drawer */}
      <Modal visible={drawerOpen} transparent animationType="none">
        <Pressable style={styles.backdrop} onPress={closeInsightsDrawer} />
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight.interpolate({
                inputRange: [0, MAX_SHEET_HEIGHT],
                outputRange: [0, MAX_SHEET_HEIGHT],
              }),
              transform: [
                {
                  translateY: sheetHeight.interpolate({
                    inputRange: [0, MAX_SHEET_HEIGHT],
                    outputRange: [MAX_SHEET_HEIGHT, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <GradientBackground style={styles.sheetContent}>
            {/* Drag Handle */}
            <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
              <View style={styles.dragIndicator} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>
                  {expandedGiftRow ? displayGiftUserName(expandedGiftRow) : "Gallery Insights"}
                </Text>
                {expandedGiftRow && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {Number(expandedGiftRow.totalCount || 0)} gifts
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.headerRight}>
                         {!expandedGiftRow && (
                  <TouchableOpacity
                    onPress={() => {
                      const target =
                        sheetHeightValueRef.current === MAX_SHEET_HEIGHT
                          ? MIN_SHEET_HEIGHT
                          : MAX_SHEET_HEIGHT;

                      sheetHeightValueRef.current = target;

                      Animated.spring(sheetHeight, {
                        toValue: target,
                        useNativeDriver: false,
                        tension: 50,
                        friction: 7,
                      }).start();
                    }}
                    style={styles.iconBtn}
                  >
                    <Ionicons
                      name={
                        sheetHeightValueRef.current === MAX_SHEET_HEIGHT
                          ? "contract-outline"
                          : "expand-outline"
                      }
                      size={22}
                      color={RBZ.c2}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={closeInsightsDrawer} style={styles.iconBtn}>
                  <Ionicons
                    name={expandedGiftRow ? "arrow-back" : "close"}
                    size={22}
                    color={RBZ.c2}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs (only when not expanded view) */}
            {!expandedGiftRow && (
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  onPress={() => setTab("gifts")}
                  style={[styles.tab, tab === "gifts" && styles.tabActive]}
                >
                  <Ionicons
                    name="gift"
                    size={18}
                    color={tab === "gifts" ? RBZ.c2 : RBZ.muted}
                  />
                  <Text style={[styles.tabText, tab === "gifts" && styles.tabTextActive]}>
                    Gifts
                  </Text>
                  {tab === "gifts" && <View style={styles.tabActiveIndicator} />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTab("comments")}
                  style={[styles.tab, tab === "comments" && styles.tabActive]}
                >
                  <Ionicons
                    name="chatbubbles"
                    size={18}
                    color={tab === "comments" ? RBZ.c2 : RBZ.muted}
                  />
                  <Text style={[styles.tabText, tab === "comments" && styles.tabTextActive]}>
                    Comments
                  </Text>
                  {tab === "comments" && <View style={styles.tabActiveIndicator} />}
                </TouchableOpacity>
              </View>
            )}

            {/* Content */}
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
            >
                   {expandedGiftRow ? (
                <View style={styles.giftGrid}>
                  {expandGiftItems(expandedGiftRow).map((gift, idx) => {
                    const imageUrl = giftImage(gift.giftId);
                    return (
                      <View key={`${gift.giftId}-${idx}`} style={styles.giftTile}>
                        <View style={styles.giftTileInner}>
                          {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={styles.giftTileImage} />
                          ) : (
                            <Ionicons name="gift" size={32} color={RBZ.c2} />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
                    ) : tab === "gifts" ? (
                giftSummaryLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={RBZ.c2} />
                    <Text style={styles.loadingText}>Loading gift insights...</Text>
                  </View>
                ) : giftSummaryError ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={RBZ.c3} />
                    <Text style={styles.errorText}>{giftSummaryError}</Text>
                    <Text style={styles.errorSubtext}>
                      Gift insights could not be loaded for this media.
                    </Text>
                  </View>
                ) : (
                <>
                  {/* KPI Cards */}
                  <View style={styles.kpiRow}>
                    <View style={styles.kpiCard}>
                      <Ionicons name="gift" size={24} color={RBZ.c2} />
                      <Text style={styles.kpiLabel}>Total Gifts</Text>
                      <Text style={styles.kpiValue}>
                        {giftSummaryLoading ? "..." : Number(giftSummary?.totalCount || 0)}
                      </Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Ionicons name="cash" size={24} color={RBZ.c2} />
                      <Text style={styles.kpiLabel}>Total Value</Text>
                      <Text style={styles.kpiValue}>
                        {giftSummaryLoading ? "..." : Number(giftSummary?.totalBC || 0)}
                      </Text>
                    </View>
                  </View>

                  {/* Gift List */}
                  {giftRows.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="gift-outline" size={64} color={RBZ.line} />
                      <Text style={styles.emptyStateText}>No gifts yet</Text>
                      <Text style={styles.emptyStateSubtext}>Be the first to send a gift!</Text>
                    </View>
                  ) : (
                    giftRows.map((row) => {
                      const gifts = Array.isArray(row.gifts) ? row.gifts : [];
                      const preview = gifts.slice(0, 3);
                      const remaining = Math.max(0, Number(row.totalCount || 0) - 3);

                      return (
                        <Animated.View key={String(row.senderId)} style={styles.giftCard}>
                          <TouchableOpacity
                            style={styles.giftCardHeader}
                            onPress={() => openGiftUserProfile(row.senderId)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.avatar}>
                              {row.user?.avatar ? (
                                <Image source={{ uri: row.user.avatar }} style={styles.avatarImage} />
                              ) : (
                                <View style={styles.avatarPlaceholder}>
                                  <Text style={styles.avatarText}>
                                    {displayGiftUserName(row).slice(0, 1).toUpperCase()}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.userInfo}>
                              <Text style={styles.userName}>{displayGiftUserName(row)}</Text>
                              <Text style={styles.giftCount}>
                                {Number(row.totalCount || 0)} gift{Number(row.totalCount || 0) !== 1 ? "s" : ""}
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={RBZ.muted} />
                          </TouchableOpacity>

                          <View style={styles.giftPreviewContainer}>
                            {preview.map((gift) => (
                              <View key={gift.giftId} style={styles.giftPreviewItem}>
                                {giftImage(gift.giftId) ? (
                                  <Image source={{ uri: giftImage(gift.giftId) }} style={styles.giftPreviewImage} />
                                ) : (
                                  <Ionicons name="gift" size={20} color={RBZ.c2} />
                                )}
                                {Number(gift.count || 0) > 1 && (
                                  <View style={styles.countBadge}>
                                    <Text style={styles.countText}>x{gift.count}</Text>
                                  </View>
                                )}
                              </View>
                            ))}
                            {remaining > 0 && (
                              <TouchableOpacity
                                style={styles.remainingBtn}
                                onPress={() => setExpandedGiftRow(row)}
                              >
                                <Text style={styles.remainingText}>+{remaining}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </Animated.View>
                      );
                                     })
                  )}
                </>
                )
              ) : (
                <>
                  <View style={styles.commentsHeader}>
                    <Ionicons name="chatbubbles" size={24} color={RBZ.c2} />
                    <Text style={styles.commentsTitle}>Private Comments</Text>
                    <Text style={styles.commentsSubtitle}>
                      Private comments are separate from owner-only gift insights.
                    </Text>
                  </View>

                  <Pressable
                    onPress={openPrivateComments}
                    style={styles.openPrivateCommentsCard}
                  >
                    <View style={styles.openPrivateCommentsIcon}>
                      <Ionicons name="lock-closed" size={22} color={RBZ.white} />
                    </View>

                    <View style={styles.openPrivateCommentsInfo}>
                      <Text style={styles.openPrivateCommentsTitle}>
                        Open private comments
                      </Text>
                      <Text style={styles.openPrivateCommentsSubtitle}>
                        View comments left on this media by matched users.
                      </Text>
                    </View>

                    <View style={styles.openPrivateCommentsRight}>
                      {privateCommentsCount > 0 ? (
                        <View style={styles.openPrivateCommentsBadge}>
                          <Text style={styles.openPrivateCommentsBadgeText}>
                            {privateCommentsCount}
                          </Text>
                        </View>
                      ) : null}

                      <Ionicons name="arrow-forward" size={18} color={RBZ.c2} />
                    </View>
                  </Pressable>
                </>
              )}
            </Animated.ScrollView>
          </GradientBackground>
        </Animated.View>
      </Modal>

              <PrivateCommentsSheet
        visible={privateCommentsOpen}
        onClose={() => setPrivateCommentsOpen(false)}
        targetType="gallery_media"
        targetId={String(mediaId || "")}
        ownerId={String(ownerId || "")}
        currentUserId={String(ownerId || "")}
        ownerUser={{ id: String(ownerId || "") }}
        title="Private Comments"
        subtitle="Comments are visible only to you and each commenter."
        initialCommentId={String(deepLinkCommentId || "")}
        initialParentId={String(deepLinkParentId || "")}
        initialReplyId={String(deepLinkReplyId || "")}
        onChanged={handlePrivateCommentsChanged}
      />
    </>
  );
}

const styles = StyleSheet.create({
  insightsBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  insightsBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
    backgroundColor: RBZ.c2,
    shadowColor: RBZ.c2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  btnGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
  },
  insightsText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContent: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: RBZ.bg,
    overflow: "hidden",
  },
  dragHandleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: RBZ.line,
  },
  dragIndicator: {
    width: 60,
    height: 30,
    position: "absolute",
    top: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: RBZ.ink,
    letterSpacing: -0.5,
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: RBZ.c2 + "15",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: RBZ.c2,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(216,52,95,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    position: "relative",
    overflow: "hidden",
  },
  tabActive: {
    backgroundColor: RBZ.c2 + "10",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "700",
    color: RBZ.muted,
  },
  tabTextActive: {
    color: RBZ.c2,
  },
  tabActiveIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    width: "50%",
    height: 2,
    backgroundColor: RBZ.c2,
    borderRadius: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "600",
    color: RBZ.muted,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
    color: RBZ.c3,
    textAlign: "center",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: RBZ.muted,
    textAlign: "center",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: RBZ.muted,
    marginTop: 8,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: "900",
    color: RBZ.ink,
    marginTop: 4,
  },
  giftCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  giftCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: RBZ.c2,
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "900",
    color: RBZ.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "900",
    color: RBZ.ink,
  },
  giftCount: {
    fontSize: 12,
    fontWeight: "600",
    color: RBZ.muted,
    marginTop: 2,
  },
  giftPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  giftPreviewItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff0f3",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  giftPreviewImage: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 9,
    fontWeight: "900",
    color: RBZ.white,
  },
  remainingBtn: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffe5ee",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: "900",
    color: RBZ.c1,
  },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 20,
  },
  giftTile: {
    width: "25%",
    aspectRatio: 1,
    padding: 8,
  },
  giftTileInner: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  giftTileImage: {
    width: "80%",
    height: "80%",
    resizeMode: "contain",
  },
  commentsHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: RBZ.ink,
    marginTop: 12,
  },
  commentsSubtitle: {
    fontSize: 13,
    color: RBZ.muted,
    textAlign: "center",
    marginTop: 4,
  },
  openPrivateCommentsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  openPrivateCommentsIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
    marginRight: 12,
  },
  openPrivateCommentsInfo: {
    flex: 1,
  },
  openPrivateCommentsTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: RBZ.ink,
  },
  openPrivateCommentsSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: RBZ.muted,
    marginTop: 3,
    lineHeight: 16,
  },
  openPrivateCommentsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  openPrivateCommentsBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
  },
  openPrivateCommentsBadgeText: {
    color: RBZ.white,
    fontSize: 11,
    fontWeight: "900",
  },
  threadCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  threadCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  threadAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: RBZ.c4 + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  threadAvatarText: {
    fontSize: 22,
    fontWeight: "900",
    color: RBZ.c4,
  },
  threadInfo: {
    flex: 1,
  },
  threadName: {
    fontSize: 16,
    fontWeight: "900",
    color: RBZ.ink,
  },
  threadPreview: {
    fontSize: 13,
    color: RBZ.muted,
    marginTop: 2,
  },
  threadBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RBZ.c2 + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "900",
    color: RBZ.ink,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: RBZ.muted,
    marginTop: 4,
  },
  statsWrap: {
    position: "absolute",
    left: 20,
    flexDirection: "row",
    gap: 10,
    zIndex: 12,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: RBZ.glassDark,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  statGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  statText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 14,
  },
  threadModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: RBZ.bg,
  },
  threadModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: RBZ.line,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RGBA(RBZ.c2, 0.1),
    alignItems: "center",
    justifyContent: "center",
  },
  threadModalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  threadModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
  },
  threadModalAvatarText: {
    fontSize: 18,
    fontWeight: "900",
    color: RBZ.white,
  },
  threadModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: RBZ.ink,
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyMessages: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyMessagesText: {
    fontSize: 16,
    fontWeight: "700",
    color: RBZ.ink,
    marginTop: 16,
  },
  emptyMessagesSubtext: {
    fontSize: 13,
    color: RBZ.muted,
    marginTop: 4,
    textAlign: "center",
  },
  messageBubble: {
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    maxWidth: "85%",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 15,
    color: RBZ.ink,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: RBZ.muted,
    marginTop: 4,
  },
  composerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: RBZ.bg,
    borderTopWidth: 1,
    borderTopColor: RBZ.line,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: "#f8f9fa",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: RBZ.ink,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
  },
});

function RGBA(color: string, alpha: number) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
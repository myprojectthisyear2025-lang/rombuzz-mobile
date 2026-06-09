/**
 * ============================================================
 * 📁 Location: src/components/gifts/GiftInsightSheet.tsx
 * 🎁 Purpose: Reusable private gift summary / insight sheet.
 *
 * Used by:
 *  - LetsBuzz posts
 *  - LetsBuzz reels
 *  - Future profile media gifts
 *  - Future chat locked-media gifts
 *
 * What this file does:
 *  - Owner sees all gifters and total gifts.
 *  - Gifter sees only gifts they personally sent.
 *  - Other viewers should not receive data from backend.
 *  - Shows max 3 gift icons per row.
 *  - Opens a nested detail view when user taps +N.
 *  - Gifter/owner names are clickable.
 *
 * Important:
 *  - This is only a UI sheet.
 *  - Backend remains the privacy source of truth.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getGiftById } from "@/src/config/rombuzzGifts";
import type {
  GiftSummaryResponse,
  GiftSummaryRow,
  GiftSummaryGiftItem,
} from "@/src/api/gifts";

type Props = {
  visible: boolean;
  onClose: () => void;
  summary: GiftSummaryResponse | null;
  currentUserId?: string;
};

function displayName(row: GiftSummaryRow) {
  const rawRow = row as any;
  const u = rawRow.user || rawRow.fromUser || rawRow.sender || {};
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || u.name || u.username || "User";
}

function getRowAvatar(row: GiftSummaryRow) {
  const rawRow = row as any;
  const u: any = rawRow.user || rawRow.fromUser || rawRow.sender || {};

  const direct =
    u.avatar ||
    u.avatarUrl ||
    u.photoUrl ||
    u.profilePic ||
    u.imageUrl ||
    u.picture ||
    "";

  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  if (Array.isArray(u.photos)) {
    const firstPhoto = u.photos.find((p: any) => {
      if (typeof p === "string") return p.trim();
      return p?.url || p?.mediaUrl || p?.photoUrl || p?.imageUrl;
    });

    if (typeof firstPhoto === "string") return firstPhoto.trim();

    return String(
      firstPhoto?.url ||
        firstPhoto?.mediaUrl ||
        firstPhoto?.photoUrl ||
        firstPhoto?.imageUrl ||
        ""
    ).trim();
  }

  return "";
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

export default function GiftInsightSheet({
  visible,
  onClose,
  summary,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [expandedRow, setExpandedRow] = useState<GiftSummaryRow | null>(null);

  const rows = useMemo(() => {
    return Array.isArray(summary?.rows) ? summary.rows : [];
  }, [summary]);

  const title =
    summary?.viewerRole === "owner"
      ? "Gift Summary"
      : "Your Gifts";

  const subtitle =
    summary?.viewerRole === "owner"
      ? `${summary?.totalCount || 0} total gifts received`
      : `${summary?.totalCount || 0} gifts you sent`;

  const closeOneStep = () => {
    if (expandedRow) {
      setExpandedRow(null);
      return;
    }

    onClose();
  };

  const openProfile = (userId?: string) => {
    const clickedUserId = String(userId || "");
    const me = String(currentUserId || "");

    if (!clickedUserId) return;

    onClose();
    setExpandedRow(null);

    if (me && clickedUserId === me) {
      router.push("/(tabs)/profile" as any);
      return;
    }

    router.push({
      pathname: "/(tabs)/view-profile",
      params: { userId: clickedUserId },
    } as any);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeOneStep}>
      <Pressable style={styles.backdrop} onPress={closeOneStep}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{expandedRow ? displayName(expandedRow) : title}</Text>
              <Text style={styles.subtitle}>
                {expandedRow
                  ? `${expandedRow.totalCount || 0} gifts`
                  : subtitle}
              </Text>
            </View>

                    <TouchableOpacity onPress={closeOneStep} style={styles.closeBtn}>
              <Ionicons name={expandedRow ? "chevron-back" : "close"} size={22} color="#5B1B32" />
            </TouchableOpacity>
          </View>

          {expandedRow ? (
            <FlatList
              key="gift-detail-grid"
              data={expandGiftItems(expandedRow)}
              keyExtractor={(item, index) => `${item.giftId}-${index}`}
              numColumns={4}
              contentContainerStyle={styles.allGiftGrid}
              renderItem={({ item }) => {
                const imageUrl = giftImage(item.giftId);

                return (
                  <View style={styles.bigGiftTile}>
                    {!!imageUrl && (
                      <Image source={{ uri: imageUrl }} style={styles.bigGiftImage} />
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No gifts found.</Text>
                </View>
              }
            />
                 ) : (
            <FlatList
              key="gift-summary-list"
              data={rows}
              keyExtractor={(item) => String(item.senderId)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const gifts = Array.isArray(item.gifts) ? item.gifts : [];
                const preview = gifts.slice(0, 3);
                const remaining = Math.max(0, Number(item.totalCount || 0) - 3);

                return (
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={styles.nameBlock}
                      onPress={() => openProfile(item.senderId)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.avatar}>
                        {!!getRowAvatar(item) ? (
                          <Image
                            source={{ uri: getRowAvatar(item) }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={styles.avatarLetter}>
                            {displayName(item).slice(0, 1).toUpperCase()}
                          </Text>
                        )}
                      </View>

                      <View style={styles.nameTextBlock}>
                        <Text numberOfLines={1} style={styles.nameText}>
                          {displayName(item)}
                        </Text>
                        <Text numberOfLines={1} style={styles.countText}>
                          {item.totalCount || 0} gift{Number(item.totalCount || 0) === 1 ? "" : "s"}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.giftPreview}>
                      {preview.map((gift) => {
                        const imageUrl = giftImage(gift.giftId);

                        return (
                          <View key={gift.giftId} style={styles.smallGiftWrap}>
                            {!!imageUrl && (
                              <Image source={{ uri: imageUrl }} style={styles.smallGiftImage} />
                            )}
                            {Number(gift.count || 0) > 1 && (
                              <View style={styles.smallCountPill}>
                                <Text style={styles.smallCountText}>x{gift.count}</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}

                      {remaining > 0 && (
                        <TouchableOpacity
                          style={styles.moreBtn}
                          onPress={() => setExpandedRow(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.moreText}>+{remaining}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No gifts yet.</Text>
                </View>
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(45, 10, 28, 0.36)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "78%",
    minHeight: 320,
    backgroundColor: "#FFF7FB",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.16)",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(91,27,50,0.22)",
    marginBottom: 14,
  },
  header: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    color: "#2A0D1A",
    fontSize: 20,
    fontWeight: "900",
  },
  subtitle: {
    color: "rgba(42,13,26,0.62)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(216,52,95,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 18,
  },
  row: {
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.13)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  nameBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D8345F",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarLetter: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  nameTextBlock: {
    flex: 1,
  },
  nameText: {
    color: "#2A0D1A",
    fontSize: 15,
    fontWeight: "900",
  },
  countText: {
    color: "rgba(42,13,26,0.55)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  giftPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  smallGiftWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF0F6",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  smallGiftImage: {
    width: 29,
    height: 29,
    resizeMode: "contain",
  },
  smallCountPill: {
    position: "absolute",
    right: -4,
    bottom: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#FF385C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  smallCountText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },
  moreBtn: {
    minWidth: 36,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFE5EE",
    borderWidth: 1,
    borderColor: "rgba(255,56,92,0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  moreText: {
    color: "#B3123F",
    fontSize: 12,
    fontWeight: "900",
  },
  allGiftGrid: {
    paddingBottom: 20,
  },
  bigGiftTile: {
    width: "25%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 7,
  },
  bigGiftImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  emptyWrap: {
    paddingVertical: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "rgba(42,13,26,0.52)",
    fontSize: 14,
    fontWeight: "700",
  },
});
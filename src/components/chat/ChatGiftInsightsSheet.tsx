/**
 * ============================================================
 * 📁 Location: src/components/chat/ChatGiftInsightsSheet.tsx
 * 🎁 Purpose: Sent / Received chat gift insight sheet.
 *
 * Used by:
 *  - app/chat/thread-info/[peerId].tsx
 *
 * What this file does:
 *  - Opens from long-pressing the Gift button in chat thread info.
 *  - Shows Sent and Received tabs with counts.
 *  - Shows total gifts and total BuzzCoin value per direction.
 *  - Shows all chat gifts in a clean animated grid.
 *
 * Data source:
 *  - Uses getGiftSummary(receiverId, targetType="chat", targetId=roomId)
 *
 * Important:
 *  - Sent = gifts current user sent to peer.
 *  - Received = gifts peer sent to current user.
 *  - This does not send gifts. GiftPicker handles purchases.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getGiftSummary,
  type GiftSummaryResponse,
} from "@/src/api/gifts";
import { getGiftsByPlacement } from "@/src/config/rombuzzGifts";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#fff5f8",
  bg: "#ffffff",
  line: "rgba(17,24,39,0.10)",
};

type Direction = "sent" | "received";

type Props = {
  visible: boolean;
  onClose: () => void;
  myId: string;
  peerId: string;
  roomId: string;
  peerName?: string;
};

type FlatGiftItem = {
  id: string;
  giftId: string;
  priceBC: number;
  count: number;
  direction: Direction;
};

function findCatalogGift(giftId: string) {
  const gifts = getGiftsByPlacement("chat");
  return gifts.find((gift) => String(gift.id) === String(giftId)) || null;
}

function flattenSummary(summary: GiftSummaryResponse | null, direction: Direction) {
  const rows = Array.isArray((summary as any)?.rows) ? (summary as any).rows : [];
  const flat: FlatGiftItem[] = [];

  rows.forEach((row: any) => {
    const gifts = Array.isArray(row?.gifts) ? row.gifts : [];

    gifts.forEach((gift: any, giftIndex: number) => {
      const count = Math.max(1, Number(gift?.count || 1));
      for (let i = 0; i < count; i += 1) {
        flat.push({
          id: `${direction}-${row?.senderId || row?.userId || "user"}-${gift?.giftId || "gift"}-${giftIndex}-${i}`,
          giftId: String(gift?.giftId || ""),
          priceBC: Number(gift?.priceBC || gift?.totalBC || 0),
          count: 1,
          direction,
        });
      }
    });
  });

  return flat;
}

function summaryCount(summary: GiftSummaryResponse | null) {
  return Number((summary as any)?.totalCount || 0);
}

function summaryValue(summary: GiftSummaryResponse | null) {
  return Number((summary as any)?.totalBC || 0);
}

function AnimatedGiftTile({ item }: { item: FlatGiftItem }) {
  const gift = findCatalogGift(item.giftId);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [pulse]);

  const animStyle = {
    transform: [
      {
        translateY: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [2, -4],
        }),
      },
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.06],
        }),
      },
    ],
  };

  return (
    <View style={styles.giftTile}>
      <Animated.View style={[styles.giftImageWrap, animStyle]}>
        {gift?.imageUrl ? (
          <Image
            source={{ uri: gift.imageUrl }}
            style={styles.giftImage}
            resizeMode="contain"
          />
        ) : (
          <Ionicons name="gift" size={42} color={RBZ.c2} />
        )}
      </Animated.View>

      <View style={styles.pricePill}>
        <Ionicons name="diamond" size={10} color={RBZ.c2} />
        <Text style={styles.priceText}>
          {Number(gift?.priceBC || item.priceBC || 0)}
        </Text>
      </View>
    </View>
  );
}

export default function ChatGiftInsightsSheet({
  visible,
  onClose,
  myId,
  peerId,
  roomId,
  peerName = "this match",
}: Props) {
  const [tab, setTab] = useState<Direction>("sent");
  const [loading, setLoading] = useState(false);
  const [sentSummary, setSentSummary] = useState<GiftSummaryResponse | null>(null);
  const [receivedSummary, setReceivedSummary] = useState<GiftSummaryResponse | null>(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!visible) return;
    if (!myId || !peerId || !roomId) return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrMsg("");

        const [sent, received] = await Promise.all([
          getGiftSummary({
            receiverId: String(peerId),
            targetType: "chat",
            targetId: String(roomId),
            includeTransactions: true,
          }),
          getGiftSummary({
            receiverId: String(myId),
            targetType: "chat",
            targetId: String(roomId),
            includeTransactions: true,
          }),
        ]);

        if (!alive) return;

        setSentSummary(sent);
        setReceivedSummary(received);
      } catch (err: any) {
        if (!alive) return;

        setSentSummary(null);
        setReceivedSummary(null);
        setErrMsg(err?.message || "Could not load chat gifts.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [visible, myId, peerId, roomId]);

  const sentCount = summaryCount(sentSummary);
  const receivedCount = summaryCount(receivedSummary);

  const activeSummary = tab === "sent" ? sentSummary : receivedSummary;
  const activeCount = summaryCount(activeSummary);
  const activeValue = summaryValue(activeSummary);

  const gifts = useMemo(
    () => flattenSummary(activeSummary, tab),
    [activeSummary, tab]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Chat Gifts</Text>
            <Text style={styles.subtitle}>
              Gifts between you and {peerName || "this match"}
            </Text>
          </View>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={RBZ.ink} />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setTab("sent")}
            style={[styles.tabBtn, tab === "sent" ? styles.tabActive : null]}
          >
            <Text style={[styles.tabText, tab === "sent" ? styles.tabTextActive : null]}>
              Sent ({sentCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTab("received")}
            style={[styles.tabBtn, tab === "received" ? styles.tabActive : null]}
          >
            <Text style={[styles.tabText, tab === "received" ? styles.tabTextActive : null]}>
              Received ({receivedCount})
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={RBZ.c2} />
            <Text style={styles.loadingText}>Loading gifts...</Text>
          </View>
        ) : errMsg ? (
          <View style={styles.emptyBox}>
            <Ionicons name="warning-outline" size={28} color={RBZ.c2} />
            <Text style={styles.emptyTitle}>Could not load gifts</Text>
            <Text style={styles.emptySub}>{errMsg}</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Total gifts</Text>
                <Text style={styles.kpiValue}>{activeCount}</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Total value</Text>
                <View style={styles.kpiValueRow}>
                  <Ionicons name="diamond" size={15} color={RBZ.c2} />
                  <Text style={styles.kpiValue}>{activeValue}</Text>
                </View>
              </View>
            </View>

            {gifts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="gift-outline" size={32} color={RBZ.c2} />
                <Text style={styles.emptyTitle}>
                  {tab === "sent" ? "No sent gifts yet" : "No received gifts yet"}
                </Text>
                <Text style={styles.emptySub}>
                  {tab === "sent"
                    ? "Send a gift from the Gift button to make this list shine."
                    : "Gifts you receive in this chat will appear here."}
                </Text>
              </View>
            ) : (
              <View style={styles.giftGrid}>
                {gifts.map((gift) => (
                  <AnimatedGiftTile key={gift.id} item={gift} />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    minHeight: 460,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: RBZ.bg,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderColor: RBZ.line,
  },
  handle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.18)",
    alignSelf: "center",
    marginBottom: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: RBZ.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  subtitle: {
    color: RBZ.gray,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  tabs: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
  },
  tabActive: {
    backgroundColor: RBZ.c2,
    borderColor: RBZ.c2,
  },
  tabText: {
    color: RBZ.gray,
    fontSize: 13,
    fontWeight: "900",
  },
  tabTextActive: {
    color: RBZ.white,
  },
  loadingBox: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: RBZ.gray,
    fontSize: 13,
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: 26,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minHeight: 86,
    borderRadius: 22,
    padding: 14,
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.12)",
    justifyContent: "center",
  },
  kpiLabel: {
    color: RBZ.gray,
    fontSize: 12,
    fontWeight: "800",
  },
  kpiValue: {
    color: RBZ.ink,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },
  kpiValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyBox: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: RBZ.ink,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },
  emptySub: {
    color: RBZ.gray,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
    lineHeight: 18,
    textAlign: "center",
  },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 12,
  },
  giftTile: {
    width: "31%",
    minHeight: 128,
    borderRadius: 22,
    backgroundColor: "#fff7fb",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.13)",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    overflow: "hidden",
  },
  giftImageWrap: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  giftImage: {
    width: 74,
    height: 74,
    backgroundColor: "transparent",
  },
  pricePill: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.13)",
  },
  priceText: {
    color: RBZ.c2,
    fontSize: 11,
    fontWeight: "900",
  },
});
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
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
};

type ThreadMsg = {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: number;
};

export default function GalleryInsightsSheet({
  ownerId,
  mediaId,
  apiFetch,
  apiJson,
  bottomInset,
}: {
  ownerId: string;
  mediaId: string;
  apiFetch: (path: string, init?: RequestInit) => Promise<any>;
  apiJson: (path: string, method: string, body: any) => Promise<any>;
  bottomInset: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<"gifts" | "comments">("gifts");

  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [errMsg, setErrMsg] = useState<string>("");

  // Thread UI (match-private)
  const [threadOpen, setThreadOpen] = useState(false);
  const [activePeer, setActivePeer] = useState<any>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadMsgs, setThreadMsgs] = useState<ThreadMsg[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!drawerOpen) return;
    if (!ownerId || !mediaId) return;

    let alive = true;
    (async () => {
      try {
        setErrMsg("");
        setLoading(true);
        const data = await apiFetch(`/media/${ownerId}/insights/${mediaId}`);
        if (!alive) return;
        setInsights(data);
      } catch (e: any) {
        if (!alive) return;
        setInsights(null);
        setErrMsg(e?.message || "Failed to load insights");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [drawerOpen, ownerId, mediaId, apiFetch]);

  const openThread = async (peer: any) => {
    try {
      setActivePeer(peer);
      setThreadOpen(true);
      setThreadLoading(true);
      setThreadMsgs([]);

      const peerId = String(peer?.peerId || peer?.userId || "");
      const data = await apiFetch(`/media/${ownerId}/thread/${peerId}/${mediaId}`);

      const msgs = Array.isArray(data?.thread?.messages) ? data.thread.messages : [];
      setThreadMsgs(
        msgs.map((m: any) => ({
          id: String(m.id),
          fromId: String(m.fromId),
          toId: String(m.toId),
          text: String(m.text || ""),
          createdAt: Number(m.createdAt || Date.now()),
        }))
      );
    } catch (e: any) {
      setErrMsg(e?.message || "Failed to load thread");
    } finally {
      setThreadLoading(false);
    }
  };

  const sendMsg = async () => {
    const text = draft.trim();
    if (!text) return;

    try {
      const peerId = String(activePeer?.peerId || activePeer?.userId || "");
      setDraft("");

      const res = await apiJson(
        `/media/${ownerId}/thread/${peerId}/${mediaId}/message`,
        "POST",
        { text }
      );

      const msg = res?.message;
      if (msg?.id) {
        setThreadMsgs((p) => [
          ...p,
          {
            id: String(msg.id),
            fromId: String(msg.fromId),
            toId: String(msg.toId),
            text: String(msg.text || ""),
            createdAt: Number(msg.createdAt || Date.now()),
          },
        ]);
      }
    } catch (e: any) {
      setErrMsg(e?.message || "Failed to send");
    }
  };

  const giftList = useMemo(
    () => (Array.isArray(insights?.gifts?.items) ? insights.gifts.items : []),
    [insights?.gifts?.items]
  );

  const threadList = useMemo(
    () => (Array.isArray(insights?.threads) ? insights.threads : []),
    [insights?.threads]
  );

  return (
    <>
      {/* bottom-right insights button */}
      <Pressable
        onPress={() => setDrawerOpen(true)}
        style={[styles.insightsBtn, { bottom: bottomInset + -8 }]}
      >
        <Ionicons name="analytics" size={18} color={RBZ.white} />
        <Text style={styles.insightsText}>Insights</Text>
      </Pressable>

      {/* 🔢 OWNER STATS OVERLAY (gifts + comments) */}
      {drawerOpen === false && insights ? (
        <View style={[styles.statsWrap, { bottom: bottomInset + 72 }]}>
          {Number(insights?.totalGifts || 0) > 0 ? (
            <Pressable onPress={() => setDrawerOpen(true)} style={styles.statPill}>
              <Ionicons name="gift" size={14} color={RBZ.white} />
              <Text style={styles.statText}>{Number(insights.totalGifts)}</Text>
            </Pressable>
          ) : null}

          {Number(insights?.threads?.length || 0) > 0 ? (
            <Pressable onPress={() => setDrawerOpen(true)} style={styles.statPill}>
              <Ionicons name="chatbubble-ellipses" size={14} color={RBZ.white} />
              <Text style={styles.statText}>{Number(insights.threads.length)}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* INSIGHTS DRAWER (slide up) */}
      <Modal visible={drawerOpen} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setDrawerOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: bottomInset + 14 }]}>
          <View style={styles.handle} />

          <View style={styles.sheetTop}>
            <Text style={styles.sheetTitle}>Insights</Text>
            <Pressable onPress={() => setDrawerOpen(false)} style={styles.sheetClose}>
              <Ionicons name="close" size={20} color={RBZ.ink} />
            </Pressable>
          </View>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => setTab("gifts")}
              style={[styles.tabBtn, tab === "gifts" ? styles.tabActive : null]}
            >
              <Text style={[styles.tabText, tab === "gifts" ? styles.tabTextActive : null]}>
                Gifts
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab("comments")}
              style={[styles.tabBtn, tab === "comments" ? styles.tabActive : null]}
            >
              <Text style={[styles.tabText, tab === "comments" ? styles.tabTextActive : null]}>
                Comments
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={{ padding: 16, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ color: RBZ.muted, marginTop: 10, fontWeight: "700" }}>
                Loading…
              </Text>
            </View>
          ) : errMsg ? (
            <View style={{ padding: 16 }}>
              <Text style={{ color: RBZ.c3, fontWeight: "900" }}>{errMsg}</Text>
              <Text style={{ color: RBZ.muted, marginTop: 6 }}>
                If you’re not the owner, Gifts/Insights are private.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 14 }}>
              {tab === "gifts" ? (
                <>
                  <View style={styles.kpiRow}>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiLabel}>Total gifts</Text>
                      <Text style={styles.kpiValue}>{Number(insights?.gifts?.totalCount || 0)}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiLabel}>Total value</Text>
                      <Text style={styles.kpiValue}>{Number(insights?.gifts?.totalValue || 0)}</Text>
                    </View>
                  </View>

                  {giftList.length === 0 ? (
                    <Text style={{ color: RBZ.muted, marginTop: 12, fontWeight: "700" }}>
                      No gifts yet for this media.
                    </Text>
                  ) : (
                    giftList.map((g: any, idx: number) => (
                      <View key={`${g?.fromId}-${idx}`} style={styles.rowCard}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <View style={styles.avatarDot} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>{g?.fromUser?.firstName || "Someone"}</Text>
                            <Text style={styles.rowSub}>
                              {String(g?.giftId || "gift")} × {Number(g?.qty || 1)}
                            </Text>
                          </View>
                          <Text style={styles.rowRight}>
                            {new Date(Number(g?.createdAt || Date.now())).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </>
              ) : (
                <>
                  <Text style={{ color: RBZ.muted, fontWeight: "800", marginBottom: 10 }}>
                    Match-private comment threads (one per match)
                  </Text>

                  {threadList.length === 0 ? (
                    <Text style={{ color: RBZ.muted, marginTop: 6, fontWeight: "700" }}>
                      No comments yet for this media.
                    </Text>
                  ) : (
                    threadList.map((t: any) => (
                      <Pressable
                        key={String(t?.peerId)}
                        onPress={() => openThread(t)}
                        style={styles.rowCard}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <View style={styles.avatarDot2} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>{t?.peerUser?.firstName || "Match"}</Text>
                            <Text style={styles.rowSub} numberOfLines={1}>
                              {t?.lastMessageText || "Tap to open"}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={RBZ.muted} />
                        </View>
                      </Pressable>
                    ))
                  )}
                </>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* THREAD MODAL */}
      <Modal visible={threadOpen} transparent animationType="slide">
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            setThreadOpen(false);
            setActivePeer(null);
            setThreadMsgs([]);
            setDraft("");
          }}
        />
        <View style={[styles.sheet, { paddingBottom: bottomInset + 14 }]}>
          <View style={styles.handle} />

          <View style={styles.sheetTop}>
            <Text style={styles.sheetTitle}>{activePeer?.peerUser?.firstName || "Thread"}</Text>
            <Pressable
              onPress={() => {
                setThreadOpen(false);
                setActivePeer(null);
                setThreadMsgs([]);
                setDraft("");
              }}
              style={styles.sheetClose}
            >
              <Ionicons name="close" size={20} color={RBZ.ink} />
            </Pressable>
          </View>

          {threadLoading ? (
            <View style={{ padding: 16, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ color: RBZ.muted, marginTop: 10, fontWeight: "700" }}>
                Loading thread…
              </Text>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={{ padding: 14 }}>
                {threadMsgs.length === 0 ? (
                  <Text style={{ color: RBZ.muted, fontWeight: "700" }}>
                    No messages yet. Send the first comment.
                  </Text>
                ) : (
                  threadMsgs.map((m) => (
                    <View key={m.id} style={styles.msgRow}>
                      <Text style={styles.msgText}>{m.text}</Text>
                      <Text style={styles.msgTime}>{new Date(m.createdAt).toLocaleTimeString()}</Text>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.composer}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Write a private comment…"
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  style={styles.input}
                />
                <Pressable onPress={sendMsg} style={styles.sendBtn}>
                  <Ionicons name="send" size={18} color={RBZ.white} />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  insightsBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(216,52,95,0.35)",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.35)",
  },
  insightsText: { color: RBZ.white, fontWeight: "900" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: RBZ.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: RBZ.line,
    maxHeight: "82%",
  },

  handle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: RBZ.line,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },

  sheetTop: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: RBZ.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  sheetClose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17,24,39,0.05)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.10)",
  },

  tabs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  tabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: "#f9fafb",
  },
  tabActive: {
    borderColor: RBZ.c2,
    backgroundColor: "#fff0f3",
  },
  tabText: {
    color: RBZ.muted,
    fontWeight: "900",
  },
  tabTextActive: {
    color: RBZ.c2,
  },

  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: "#ffffff",
  },
  kpiLabel: {
    color: RBZ.muted,
    fontWeight: "800",
  },
  kpiValue: {
    color: RBZ.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },

  rowCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: "#ffffff",
    marginBottom: 10,
  },
  rowTitle: { color: RBZ.ink, fontWeight: "900" },
  rowSub: { color: RBZ.muted, marginTop: 2, fontWeight: "700" },
  rowRight: { color: RBZ.muted, fontWeight: "800", fontSize: 12 },

  avatarDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: RBZ.c3,
  },
  avatarDot2: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: RBZ.c4,
  },

  msgRow: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: "#ffffff",
    marginBottom: 10,
  },
  msgText: {
    color: RBZ.ink,
    fontWeight: "700",
    lineHeight: 19,
  },
  msgTime: {
    color: RBZ.muted,
    fontWeight: "800",
    fontSize: 11,
    marginTop: 6,
  },

  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: RBZ.line,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    color: RBZ.white,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(17,24,39,0.75)",
    fontWeight: "700",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
  },
  statsWrap: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    gap: 8,
    zIndex: 12,
  },

  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  statText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 13,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export default function FullscreenViewer({
  item,
  items,
  index,
  onChangeIndex,
  onClose,
  ownerId,
  apiFetch,
  apiJson,

  // ✅ new: instant UI updates in GallerySection
  onLocalPatch,
  onLocalDelete,
}: {
  item: any;
  items: any[];
  index: number;
  onChangeIndex: (i: number) => void;
  onClose: () => void;
  ownerId: string;
  apiFetch: (path: string, init?: RequestInit) => Promise<any>;
  apiJson: (path: string, method: string, body: any) => Promise<any>;

  onLocalPatch?: (updated: any) => void;
  onLocalDelete?: (deletedId: string) => void;
}) {

const { width, height } = useWindowDimensions();
const SCREEN_RATIO = 9 / 16;
const mediaHeight = height * 0.78;
const mediaWidth = Math.min(width, height * SCREEN_RATIO);

const listRef = React.useRef<Animated.FlatList<any>>(null);

const videoRefs = React.useRef<Record<string, Video | null>>({});
const videoLoaded = React.useRef<Record<string, boolean>>({});

const insets = useSafeAreaInsets();

const [optionsOpen, setOptionsOpen] = useState(false);
const current = useMemo(() => {
  return items?.[index] || null;
}, [items, index]);
const captionText = useMemo(() => {
  if (!current?.caption) return "";
  const parts = String(current.caption).split("|");
  return (parts.slice(1).join("|") || "").trim();
}, [current?.caption]);

const [editOpen, setEditOpen] = useState(false);
const [editDraft, setEditDraft] = useState("");

const [visOpen, setVisOpen] = useState(false);

function splitCaption(caption: string) {
  const raw = String(caption || "");
  const parts = raw.split("|");
  const tags = (parts[0] || "").trim();
  const extra = (parts.slice(1).join("|") || "").trim();
  return { tags, extra };
}

function upsertTag(tags: string, key: string, value: string) {
  const arr = tags ? tags.split(/\s+/).filter(Boolean) : [];
  const filtered = arr.filter((t) => !t.startsWith(`${key}:`));
  filtered.push(`${key}:${value}`);
  return filtered.join(" ").trim();
}

// scope:public | scope:matches | scope:private
function buildCaptionWithScope(oldCaption: string, scope: "public" | "matches" | "private", extraOverride?: string) {
  const { tags, extra } = splitCaption(oldCaption || "");
  const nextTags = upsertTag(tags, "scope", scope);
  const finalExtra = typeof extraOverride === "string" ? extraOverride.trim() : extra;
  return finalExtra ? `${nextTags} | ${finalExtra}` : nextTags;
}

async function saveCaption(extraText: string) {
  if (!current?.id) return;
  const nextCaption = buildCaptionWithScope(current.caption || "", inferScopeFromCaption(current.caption || ""), extraText);

  // optimistic UI update
  onLocalPatch?.({ ...current, caption: nextCaption });

  // persist
  await apiJson(`/media/${current.id}`, "PATCH", { caption: nextCaption });

  setEditOpen(false);
  setOptionsOpen(false);
}

function inferScopeFromCaption(caption: string): "public" | "matches" | "private" {
  const t = String(caption || "");
  if (t.includes("scope:matches")) return "matches";
  if (t.includes("scope:private")) return "private";
  if (t.includes("scope:public")) return "public";
  return "public";
}

async function applyVisibility(scope: "public" | "matches" | "private") {
  if (!current?.id) return;

  const nextCaption = buildCaptionWithScope(current.caption || "", scope);
  const backendPrivacy = scope === "public" ? "public" : "private";

  // optimistic UI update
  onLocalPatch?.({ ...current, caption: nextCaption, privacy: backendPrivacy });

  // persist (caption + privacy)
  await apiJson(`/media/${current.id}`, "PATCH", { caption: nextCaption, privacy: backendPrivacy });

  setVisOpen(false);
  setOptionsOpen(false);
}

async function deleteCurrent() {
  if (!current?.id) return;

  // optimistic UI update
  onLocalDelete?.(String(current.id));

  // persist delete
  await apiJson(`/media/${current.id}`, "DELETE", {});

  setOptionsOpen(false);

  // if nothing left, close viewer
  if ((items?.length || 0) <= 1) {
    onClose();
    return;
  }

  // keep index in range
  const nextIndex = Math.max(0, Math.min(index, (items.length - 2)));
  onChangeIndex(nextIndex);
}

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<"gifts" | "comments">("gifts");
const translateY = useSharedValue(0);
const scale = useSharedValue(1);

const SWIPE_Y = 90;


  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [errMsg, setErrMsg] = useState<string>("");

  // Thread UI (match-private)
  const [threadOpen, setThreadOpen] = useState(false);
  const [activePeer, setActivePeer] = useState<any>(null);
  const [threadLoading, setThreadLoading] = useState(false);
    const [threadMsgs, setThreadMsgs] = useState<ThreadMsg[]>([]);
const [draft, setDraft] = useState("");

// 🎬 Reel playback state
const [paused, setPaused] = useState(false);
const [duration, setDuration] = useState(0);
const [position, setPosition] = useState(0);
const seeking = useSharedValue(false);

  const mediaId = useMemo(() => String(item?.id || ""), [item]);

useEffect(() => {
  Object.entries(videoRefs.current).forEach(([id, ref]) => {
    if (!ref) return;
    if (!videoLoaded.current[id]) return; // 🔐 CRASH GUARD

    if (Number(id) === index) {
      ref.playAsync?.();
    } else {
      ref.pauseAsync?.();
      ref.setPositionAsync?.(0);
    }
  });

  setPaused(false);
  setPosition(0);
  setDuration(0);
}, [index]);
const scrubGesture = useMemo(() => {
  return Gesture.Pan()
    .hitSlop({ vertical: 20 }) // Increase vertical hit area
    .onBegin(() => {
      seeking.value = true;
    })
    .onUpdate((e) => {
      if (!duration) return;
      if (!videoRefs.current[index]) return;
      if (!videoLoaded.current[index]) return;

      const barWidth = width - 32; // same as left/right padding
      // Calculate ratio based on touch X coordinate relative to the entire screen
      // We need to subtract the left padding (16) since the bar starts at 16
      const touchX = e.absoluteX - 16;
      const ratio = Math.min(Math.max(touchX / barWidth, 0), 1);
      const newPosition = ratio * duration;

      videoRefs.current[index]?.setPositionAsync(newPosition);
      setPosition(newPosition);
    })
    .onEnd(() => {
      seeking.value = false;
    });
}, [index, duration, width]);

const reelVerticalGesture = useMemo(() => {
  return Gesture.Pan()
    .activeOffsetY([-30, 30]) // 👈 FORCE vertical activation
    .failOffsetX([-20, 20])   // 👈 cancel if horizontal
    .onEnd((e) => {
      if (e.translationY < -SWIPE_Y && index < items.length - 1) {
        onChangeIndex(index + 1);
        listRef.current?.scrollToOffset({
          offset: (index + 1) * width,
          animated: true,
        });
      }

      if (e.translationY > SWIPE_Y && index > 0) {
        onChangeIndex(index - 1);
        listRef.current?.scrollToOffset({
          offset: (index - 1) * width,
          animated: true,
        });
      }
    });
}, [index, items.length, width]);




const pinchGesture = useMemo(() => {
  return Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(e.scale, 3));
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });
}, []);

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

   const giftList = Array.isArray(insights?.gifts?.items) ? insights.gifts.items : [];
  const threadList = Array.isArray(insights?.threads) ? insights.threads : [];


useEffect(() => {
  if (!item) return;
  if (!height) return; // Change from width to height

  const t = setTimeout(() => {
    listRef.current?.scrollToOffset({
      offset: index * height, // Change from width to height
      animated: false,
    });
  }, 0);

  return () => clearTimeout(t);
}, [item, index, height]); // Add height dependency

return (
 <Modal
  transparent={false}   // 🔑 IMPORTANT
  animationType="fade"
  visible={!!item}
  onRequestClose={onClose}
>

    {!item ? null : (
      <View style={styles.wrap}>

<StatusBar hidden />

        {/* top right close */}
   {/* top-left close */}
   
<View
  style={[
    styles.headerBar,
    { paddingTop: insets.top + 6 }
  ]}
>
  <Pressable onPress={onClose} style={styles.headerBtn}>
    <Ionicons name="close" size={22} color={RBZ.ink} />
  </Pressable>

  <Pressable onPress={() => setOptionsOpen(true)} style={styles.headerBtn}>
    <Ionicons name="ellipsis-vertical" size={20} color={RBZ.ink} />
  </Pressable>
</View>


            {/* 📄 CAPTION (shown only if exists) */}
{captionText ? (
  <View
    style={[
      styles.captionWrap,
      {
        bottom: insets.bottom + 40, // 👈 sits ABOVE Insights
      },
    ]}
  >
    <Text style={styles.captionText} numberOfLines={3}>
      {captionText}
    </Text>
  </View>
) : null}

{/* bottom-right insights button */}
<Pressable
  onPress={() => setDrawerOpen(true)}
  style={[styles.insightsBtn, { bottom: insets.bottom + -8 }]}
>
  <Ionicons name="analytics" size={18} color={RBZ.white} />
  <Text style={styles.insightsText}>Insights</Text>
</Pressable>


         {/* media with swipe */}

<Animated.FlatList
  ref={listRef}
  data={items}
  extraData={index}
  horizontal={false}
  pagingEnabled
  snapToInterval={height} // Add this
  decelerationRate="fast" // Add this
  keyExtractor={(i) => String(i.id)}
  showsVerticalScrollIndicator={false}
  onMomentumScrollEnd={(e) => {
    const newIndex = Math.round(
      e.nativeEvent.contentOffset.y / height // Use height variable
    );
    onChangeIndex(newIndex);
  }}
  renderItem={({ item: rowItem, index: rowIndex }) => {
    const isActive = rowIndex === index;
    
    return (
<View
  style={{
    width,
    height,
    paddingTop: 16 + insets.top,
    justifyContent: "center",
  }}
>
    <Pressable
  style={{ flex: 1 }}
  android_disableSound
  pressRetentionOffset={{ top: 80, bottom: 120, left: 0, right: 0 }}
  onPress={() => {
    if (!isActive) return;
    if (rowItem.type !== "video") return; // 🚫 images ignored
    setPaused((p) => !p);
  }}
>

          {rowItem.type === "video" ? (
          
<Video
  ref={(ref) => {
    if (ref) {
      videoRefs.current[rowIndex] = ref;
      videoLoaded.current[rowIndex] = false;
    }
  }}
  key={`video-${rowItem.id}-${rowIndex}`}
  source={{ uri: rowItem.url }}
  onLoad={() => {
    videoLoaded.current[rowIndex] = true;
  }}

  style={{
    width: mediaWidth,
    height: mediaHeight,
    alignSelf: "center",
  }}
  resizeMode={ResizeMode.CONTAIN}
  shouldPlay={isActive && !paused}
  isLooping={false}
  useNativeControls={false}

  onPlaybackStatusUpdate={(s: any) => {
    if (!s.isLoaded) return;
    
    if (isActive) {
      setPosition(s.positionMillis || 0);
      setDuration(s.durationMillis || 0);

      // auto advance
      if (s.didJustFinish && index < items.length - 1) {
        onChangeIndex(index + 1);
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset: (index + 1) * height,
            animated: true,
          });
        }, 100);
      }
    }
  }}
  onError={(e) => console.log('Video error:', e)}
/>
          ) : (
           <Image
  source={{ uri: rowItem.url }}
  style={{
    width: mediaWidth,
    height: mediaHeight,
    alignSelf: "center",
  }}
  resizeMode="contain"
/>

          )}
        </Pressable>
      </View>
    );
  }}
/>

{paused && item?.type === "video" && (
  <View
    style={{
      position: "absolute",
      top: "45%",
      alignSelf: "center",

      backgroundColor: "rgba(0,0,0,0.45)",
      padding: 18,
      borderRadius: 50,
      zIndex: 20,
    }}
  >
    <Ionicons name="play" size={32} color={RBZ.white} />
  </View>
)}

{/* 🔢 OWNER STATS OVERLAY (gifts + comments) */}
{drawerOpen === false && insights && (
<View style={[styles.statsWrap, { bottom: insets.bottom + 72 }]}>

    {Number(insights?.totalGifts || 0) > 0 && (
      <Pressable onPress={() => setDrawerOpen(true)} style={styles.statPill}>
        <Ionicons name="gift" size={14} color={RBZ.white} />
        <Text style={styles.statText}>
          {Number(insights.totalGifts)}
        </Text>
      </Pressable>
    )}

    {Number(insights?.threads?.length || 0) > 0 && (
      <Pressable onPress={() => setDrawerOpen(true)} style={styles.statPill}>
        <Ionicons name="chatbubble-ellipses" size={14} color={RBZ.white} />
        <Text style={styles.statText}>
          {Number(insights.threads.length)}
        </Text>
      </Pressable>
    )}
  </View>
)}


        {/* INSIGHTS DRAWER (slide up) */}
        <Modal visible={drawerOpen} transparent animationType="slide">
          <Pressable style={styles.backdrop} onPress={() => setDrawerOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
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
                        <Text style={styles.kpiValue}>
                          {Number(insights?.gifts?.totalCount || 0)}
                        </Text>
                      </View>
                      <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Total value</Text>
                        <Text style={styles.kpiValue}>
                          {Number(insights?.gifts?.totalValue || 0)}
                        </Text>
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
                              <Text style={styles.rowTitle}>
                                {g?.fromUser?.firstName || "Someone"}
                              </Text>
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
                              <Text style={styles.rowTitle}>
                                {t?.peerUser?.firstName || "Match"}
                              </Text>
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
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
            <View style={styles.handle} />

            <View style={styles.sheetTop}>
              <Text style={styles.sheetTitle}>
                {activePeer?.peerUser?.firstName || "Thread"}
              </Text>
              <Pressable
                onPress={() => {
                  setThreadOpen(false);
                  setActivePeer(null);
                  setThreadMsgs([]);
                  setDraft("");
                }}
                style={styles.sheetClose}
              >
                <Ionicons name="close" size={20} color={RBZ.white} />
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
                        <Text style={styles.msgTime}>
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </Text>
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
        {/* ⋮ OPTIONS SHEET */}
<Modal visible={optionsOpen} transparent animationType="slide">
  <Pressable
    style={styles.backdrop}
    onPress={() => setOptionsOpen(false)}
  />

  <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
    <View style={styles.handle} />

    <Text style={styles.sheetTitle}>    Options</Text>

   <Pressable
  style={styles.optionRow}
  onPress={() => {
    const { extra } = splitCaption(String(current?.caption || ""));
    setEditDraft(extra);
    setEditOpen(true);
  }}
>
  <Ionicons name="create-outline" size={18} color={RBZ.c3} />
  <Text style={styles.optionText}>Edit caption</Text>
</Pressable>

<Pressable
  style={styles.optionRow}
  onPress={() => {
    setVisOpen(true);
  }}
>
  <Ionicons name="eye-outline" size={18} color={RBZ.c3} />
  <Text style={styles.optionText}>Change visibility</Text>
</Pressable>

<Pressable
  style={styles.optionRow}
  onPress={() => {
    setOptionsOpen(false);

    Alert.alert(
      "Delete media?",
      "This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCurrent().catch(() => {});
          },
        },
      ]
    );
  }}
>
  <Ionicons name="trash-outline" size={18} color={RBZ.c3} />
  <Text style={[styles.optionText, { color: RBZ.c3 }]}>Delete media</Text>
</Pressable>


  </View>
</Modal>
{item?.type === "video" && duration > 0 && (
  <GestureDetector gesture={scrubGesture}>
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + 12,
        left: 16,
        right: 16,
        paddingVertical: 10, // Add vertical padding for better touch area
      }}
    >
      {/* Progress bar container with bigger touch area */}
      <View style={{ height: 30, justifyContent: "center" }}>
        <View
          style={{
            height: 4,
            backgroundColor: "rgba(255,255,255,0.25)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${(position / duration) * 100}%`,
              height: "100%",
              backgroundColor: RBZ.c3,
            }}
          />
        </View>
        
        {/* Scroller handle */}
        <View
          style={{
            position: "absolute",
            left: `${Math.max(0, Math.min((position / duration) * 100, 100))}%`,
            marginLeft: -12,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: RBZ.c3,
            borderWidth: 3,
            borderColor: RBZ.white,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 4,
          }}
        />
      </View>

      <View
        style={{
          marginTop: 8,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: RBZ.white, fontSize: 12, fontWeight: "700" }}>
          {Math.floor(position / 1000)}s
        </Text>
        <Text style={{ color: RBZ.white, fontSize: 12, fontWeight: "700" }}>
          {Math.floor(duration / 1000)}s
        </Text>
      </View>
    </View>
  </GestureDetector>
)}


</View>
)}
{/* ✏️ EDIT CAPTION MODAL */}
<Modal visible={editOpen} transparent animationType="fade">
  <Pressable style={styles.backdrop} onPress={() => setEditOpen(false)} />
  <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
    <View style={styles.handle} />
    <Text style={styles.sheetTitle}>     Edit caption</Text>

    <TextInput
      value={editDraft}
      onChangeText={setEditDraft}
      placeholder="Write a short vibe…"
      placeholderTextColor="rgba(17,24,39,0.45)"
      style={[
        styles.input,
        {
          marginTop: 12,
          backgroundColor: "rgba(248,250,252,1)",
          borderColor: "rgba(17,24,39,0.12)",
          color: RBZ.ink,
        },
      ]}
      multiline
    />

    <Pressable
      onPress={() => {
        saveCaption(editDraft).catch(() => {});
      }}
      style={[
        styles.optionRow,
        { marginTop: 12, justifyContent: "center", backgroundColor: RBZ.c1, borderRadius: 14 },
      ]}
    >
      <Text style={{ color: RBZ.white, fontWeight: "900" }}>Save</Text>
    </Pressable>
  </View>
</Modal>

{/* 👁️ VISIBILITY MODAL */}
<Modal visible={visOpen} transparent animationType="slide">
  <Pressable style={styles.backdrop} onPress={() => setVisOpen(false)} />
  <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
    <View style={styles.handle} />
    <Text style={styles.sheetTitle}>      Visibility</Text>

    <Pressable style={styles.optionRow} onPress={() => applyVisibility("public").catch(() => {})}>
      <Ionicons name="globe-outline" size={18} color={RBZ.c2} />
      <Text style={styles.optionText}>Public</Text>
    </Pressable>

    <Pressable style={styles.optionRow} onPress={() => applyVisibility("matches").catch(() => {})}>
      <Ionicons name="people-outline" size={18} color={RBZ.c4} />
      <Text style={styles.optionText}>Matched-only</Text>
    </Pressable>

    <Pressable style={styles.optionRow} onPress={() => applyVisibility("private").catch(() => {})}>
      <Ionicons name="lock-closed-outline" size={18} color={RBZ.ink} />
      <Text style={styles.optionText}>Private</Text>
    </Pressable>
  </View>
</Modal>

</Modal>

);
}


const styles = StyleSheet.create({
 wrap: {
  flex: 1,
  backgroundColor: "#000000", // fully opaque
},

  close: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
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
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
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
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  rowTitle: { color: RBZ.white, fontWeight: "900" },
  rowSub: { color: "rgba(255,255,255,0.70)", marginTop: 2, fontWeight: "700" },
  rowRight: { color: "rgba(255,255,255,0.55)", fontWeight: "800", fontSize: 12 },

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
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
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
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    color: RBZ.white,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
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

topLeftBtn: {
  position: "absolute",
  left: 16,
  zIndex: 50,
  width: 42,
  height: 42,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: RBZ.bg,
  shadowColor: "#000",
  shadowOpacity: 0.18,
  shadowRadius: 6,
  elevation: 6,
},

topRightBtn: {
  position: "absolute",
  right: 16,
  zIndex: 50,
  width: 42,
  height: 42,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: RBZ.bg,
  shadowColor: "#000",
  shadowOpacity: 0.18,
  shadowRadius: 6,
  elevation: 6,
},


optionRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: RBZ.line,
},


optionText: {
  color: RBZ.ink,
  fontWeight: "800",
  fontSize: 15,
},

mediaWrap: {
  flex: 1,
},
headerBar: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 64,
  paddingHorizontal: 16,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "rgba(0,0,0,0.35)",
  zIndex: 100,
},

headerBtn: {
  width: 42,
  height: 42,
  borderRadius: 14,
  backgroundColor: RBZ.bg,
  alignItems: "center",
  justifyContent: "center",
},

captionWrap: {
  position: "absolute",
  left: 16,
  right: 16,
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 14,
  backgroundColor: "rgba(0,0,0,0.45)",
  zIndex: 20,
},

captionText: {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: "700",
  lineHeight: 19,
},

});

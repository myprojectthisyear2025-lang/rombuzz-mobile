/**
 * ============================================================
 * 📁 File: app/(tabs)/chat.tsx
 * 🎯 Screen: RomBuzz Mobile — Chat List (Instagram-style)
 *
 * FLOW:
 *  - Loads matched users from GET /matches (same as web)
 *  - Joins all match rooms (so edits/deletes/reactions broadcast work)
 *  - Shows last message preview + unread badge
 *  - Tap user → opens /chat/[peerId]
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  DeviceEventEmitter,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  unstable_batchedUpdates,
} from "react-native";


import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#f5f6fa",
  line: "rgba(0,0,0,0.08)",
};

const UNREAD_MAP_KEY = "RBZ_unread_map";
const UNREAD_TOTAL_KEY = "RBZ_unread_total";

const HIDDEN_CHATS_KEY = (meId: string) => (meId ? `RBZ_chat_hidden_${meId}` : "");

// ✅ Web parity: persist chat list order per-user
const CHAT_ORDER_KEY = (meId: string) => (meId ? `RBZ_chat_order_${meId}` : "");


type MatchUser = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  profilePic?: string;
  photo?: string;

  lastMessageTime?: any;
  lastMessage?: any;
  updatedAt?: any;
  createdAt?: any;
};

const safeId = (u: any) => String(u?.id || u?._id || "");
const fullName = (u: any) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "RomBuzz User";
const avatarUrl = (u: any) =>
  u?.avatar || u?.profilePic || u?.photo || "https://i.pravatar.cc/200?img=12";

function makeRoomId(a: string, b: string) {
  return [String(a), String(b)].sort().join("_");
}

// ✅ Same tag as chat window (prevents ::RBZ:: blob in previews)
const RBZ_TAG = "::RBZ::";

const safePreviewText = (lastMessage: any, myId: string) => {
  if (!lastMessage) return "Say Hello!";

  const senderId = String(
    lastMessage?.from ??
      lastMessage?.fromId ??
      lastMessage?.senderId ??
      lastMessage?.userId ??
      ""
  );

  const isMine = !!myId && !!senderId && String(senderId) === String(myId);

  const withMinePrefix = (value: string) => {
    const clean = String(value || "").trim();
    if (!clean) return "Say Hello!";
    return isMine ? `You: ${clean}` : clean;
  };

  // Most direct preview
  if (typeof lastMessage?.preview === "string" && lastMessage.preview.trim()) {
    return withMinePrefix(lastMessage.preview);
  }

  // Try common text fields
  const rawText =
    lastMessage?.text ??
    lastMessage?.message ??
    lastMessage?.body ??
    "";

  // Decode ::RBZ:: payloads
  if (typeof rawText === "string" && rawText.startsWith(RBZ_TAG)) {
    try {
      const payload = JSON.parse(rawText.slice(RBZ_TAG.length));

      if (payload?.type === "text" && typeof payload?.text === "string" && payload.text.trim()) {
        return withMinePrefix(payload.text);
      }

      if (payload?.type === "media") {
        if (payload?.mediaType === "image") return withMinePrefix("📷 Photo");
        if (payload?.mediaType === "video") return withMinePrefix("🎥 Video");
        if (payload?.mediaType === "audio") return withMinePrefix("🎙 Voice message");
        return withMinePrefix("📎 Attachment");
      }

      if (payload?.type === "share_post") {
        return withMinePrefix("🖼 Shared a post");
      }

      if (payload?.type === "share_reel") {
        return withMinePrefix("🎬 Shared a reel");
      }
    } catch {
      // fall through
    }
  }

  if (typeof rawText === "string" && rawText.trim()) {
    return withMinePrefix(rawText);
  }

  // Useful fallback for messages with attachment fields but no text
  if (lastMessage?.mediaUrl || lastMessage?.url) {
    return withMinePrefix("📎 Attachment");
  }

  return "Say Hello!";
};

async function getJSONStore(key: string, fallback: any) {
  if (!key || !key.trim()) return fallback;


  try {
    const v = await SecureStore.getItemAsync(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

async function setJSONStore(key: string, val: any) {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(val));
  } catch {}
}

// ✅ Web parity: apply stored order first, then fallback to _sortTime
function applyStoredOrder(list: MatchUser[], storedIds: string[]) {
  if (!Array.isArray(storedIds) || storedIds.length === 0) return list;

  const map = new Map<string, MatchUser>();
  list.forEach((m) => map.set(String(safeId(m)), m));

  const ordered: MatchUser[] = [];
  for (const id of storedIds) {
    const hit = map.get(String(id));
    if (hit) {
      ordered.push(hit);
      map.delete(String(id));
    }
  }

  // Append remaining, already pre-sorted by _sortTime upstream
  return [...ordered, ...Array.from(map.values())];
}

// ✅ Web parity: move peer to top + persist full ordered id list
function reorderMatchesPersist(
  meId: string,
  list: MatchUser[],
  peerId: string
) {
  const pid = String(peerId);
  const idx = list.findIndex((m) => String(safeId(m)) === pid);
  if (idx === -1) return list;

  const copy = [...list];
  const [item] = copy.splice(idx, 1);
  const next = [item, ...copy];

  // Persist order (ignore await; fire-and-forget like web localStorage)
  const key = CHAT_ORDER_KEY(meId);
  if (key) setJSONStore(key, next.map((m) => String(safeId(m))));

  return next;
}

// ✅ Global unread total (for bottom tab badge)
async function persistUnreadTotal(total: number) {
  try {
    await SecureStore.setItemAsync(UNREAD_TOTAL_KEY, String(total));
  } catch {}

  // ✅ RN-safe event bus
  try {
    DeviceEventEmitter.emit("rbz:unread:total", { total });
  } catch {}
}


// ✅ Server truth: fetch unread summary (total + per peer)
async function fetchUnreadSummary(token: string) {
  const r = await fetch(`${API_BASE}/chat/unread-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await r.json().catch(() => ({}));
  return {
    total: Number(j?.total || 0) || 0,
    byPeer: j?.byPeer && typeof j.byPeer === "object" ? j.byPeer : {},
  };
}

// ✅ Apply server unread summary everywhere (state + storage + global events)
async function applyUnreadSummary(summary: any) {
  const total = Number(summary?.total || 0) || 0;

  const safeByPeer: Record<string, number> = {};
  const rawByPeer =
    summary?.byPeer && typeof summary.byPeer === "object" ? summary.byPeer : {};

  Object.keys(rawByPeer || {}).forEach((k) => {
    safeByPeer[String(k)] = Number(rawByPeer[k] || 0) || 0;
  });

  // persist map + total
  await setJSONStore(UNREAD_MAP_KEY, safeByPeer);
  await SecureStore.setItemAsync(UNREAD_TOTAL_KEY, String(total)).catch(() => {});

  // broadcast for bottom tab + any listeners
  try {
    DeviceEventEmitter.emit("rbz:unread:total", { total });
  } catch {}

  try {
    DeviceEventEmitter.emit("rbz:unread:summary", { total, byPeer: safeByPeer });
  } catch {}


  return { total, byPeer: safeByPeer };
}



const nickKey = (meId: string, peerId: string) =>
  meId && peerId ? `RBZ_nick_${meId}_${peerId}` : "";

export default function ChatTab() {
  const router = useRouter();
const insets = useSafeAreaInsets();
const [loading, setLoading] = useState(true);
const [user, setUser] = useState<any>(null);

const [matches, setMatches] = useState<MatchUser[]>([]);

const [nickMap, setNickMap] = useState<Record<string, string>>({});
const [filtered, setFiltered] = useState<MatchUser[]>([]);
const [hiddenPeers, setHiddenPeers] = useState<string[]>([]);

  const [query, setQuery] = useState("");
const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
const activePeerRef = useRef<string | null>(null);

// ✅ Dedup unread bumps (same message arrives via chat:message + direct:message etc)
const seenMsgIdsRef = useRef<Record<string, number>>({}); // msgId -> timestamp(ms)
const TTL_MS = 8000; // keep msg ids for 8s, enough to kill duplicates

// ✅ Robust peer id extraction (covers different payload shapes)
const peerFromMsg = (msg: any) =>
  String(msg?.from || msg?.fromId || msg?.senderId || msg?.userId || "");

const socketRef = useRef<any>(null);

// ✅ Presence batching refs MUST be top-level (hooks rule)
const presenceQueueRef = useRef<Record<string, boolean>>({});
const presenceFlushRef = useRef<any>(null);

const myId = useMemo(() => String(user?.id || user?._id || ""), [user]);

// Listen for nickname updates from Thread Info
useEffect(() => {
  const handler = (e: any) => {
    const { peerId, nickname } = e.detail || {};
    if (!peerId) return;

    setNickMap((prev) => ({
      ...prev,
      [peerId]: nickname || "",
    }));
  };

  globalThis.addEventListener?.("rbz:nickname:update", handler);
  return () => {
    globalThis.removeEventListener?.("rbz:nickname:update", handler);
  };
}, []);

//listener for active chat updates (to prevent showing unread badge when already in that chat)
useEffect(() => {
  const handler = (e: any) => {
    activePeerRef.current = e?.detail?.peerId || null;
  };

  globalThis.addEventListener?.("rbz:chat:active", handler);
  return () => {
    globalThis.removeEventListener?.("rbz:chat:active", handler);
  };
}, []);



// Load hidden chats (delete chat = hide for me)
useEffect(() => {
  if (!myId) return;

  const k = HIDDEN_CHATS_KEY(myId);
  if (!k || typeof k !== "string") return;

  (async () => {
    const list = await getJSONStore(k, []);
    setHiddenPeers(Array.isArray(list) ? list : []);
  })();
}, [myId]);


  const [unreadTotal, setUnreadTotal] = useState(0);

  const reconcileTimerRef = useRef<any>(null);

  const reconcileFromServer = async () => {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");
    if (!token) return;

    try {
      const summary = await fetchUnreadSummary(token);
      setUnreadMap(summary.byPeer || {});
      setUnreadTotal(summary.total || 0);
      await applyUnreadSummary(summary);
    } catch {}
  };

   useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync("RBZ_USER");
      const u = raw ? JSON.parse(raw) : null;
      setUser(u);

      const um = await getJSONStore(UNREAD_MAP_KEY, {});
      setUnreadMap(um || {});

      // ✅ load total for bottom tab badge
      const tRaw = await SecureStore.getItemAsync(UNREAD_TOTAL_KEY);
      const t = Number(tRaw || 0) || 0;
      setUnreadTotal(t);
      persistUnreadTotal(t); // emit once so Tabs can render immediately

      // ✅ NEW: always pull server truth once so badge can't get stuck at 0
      reconcileFromServer();
    })();
  }, []);


  // ✅ When Chat tab is tapped: clear unread on SERVER + keep badge at 0
  useEffect(() => {
    const handler = async () => {
      try {
        // optimistic UI immediately
        setUnreadMap({});
        setUnreadTotal(0);
        await setJSONStore(UNREAD_MAP_KEY, {});
        await SecureStore.setItemAsync(UNREAD_TOTAL_KEY, "0").catch(() => {});
        persistUnreadTotal(0);

        // server clear (truth)
        const token = await SecureStore.getItemAsync("RBZ_TOKEN");
        if (!token) return;

        const r = await fetch(`${API_BASE}/chat/mark-all-read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        const j = await r.json().catch(() => ({}));
        const summary = j?.summary || { total: 0, byPeer: {} };

        const applied = await applyUnreadSummary(summary);
        setUnreadMap(applied.byPeer || {});
        setUnreadTotal(applied.total || 0);
      } catch {}
    };

    const sub = DeviceEventEmitter.addListener("rbz:chat:tab-opened", handler);
    return () => sub.remove();
  }, []);



  // ✅ Foreground sync (prevents drift across devices)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        reconcileFromServer();
      }
    });
    return () => sub.remove();
  }, []);

  // ✅ When a thread opens, it dispatches rbz:chat:clear-peer (optimistic clear)
  useEffect(() => {
    const handler = (e: any) => {
      const pid = String(e?.detail?.peerId || "");
      if (!pid) return;

      setUnreadMap((prev) => {
        const existing = Number(prev?.[pid] || 0) || 0;
        if (!existing) return prev;

        const next = { ...prev };
        delete next[pid];
        setJSONStore(UNREAD_MAP_KEY, next);
        return next;
      });

      setUnreadTotal((prev) => {
        // we don't know exact existing count here reliably from prev state closure,
        // so do a quick reconcile right away.
        const next = Number(prev || 0) || 0;
        persistUnreadTotal(next);
        return next;
      });

      // ✅ server truth after optimistic clear
      reconcileFromServer();
    };

    globalThis.addEventListener?.("rbz:chat:clear-peer", handler);
    return () => globalThis.removeEventListener?.("rbz:chat:clear-peer", handler);
  }, []);


// Load nicknames for chat list
const loadNicknames = async (list: MatchUser[]) => {
  if (!myId) return;

  const map: Record<string, string> = {};

  for (const m of list) {
    const pid = safeId(m);
    if (!pid) continue;

if (!myId || !pid) continue;

const key = `RBZ_nick_${myId}_${pid}`;
const n = await SecureStore.getItemAsync(key);

    if (n) map[pid] = n;
  }

  setNickMap(map);
};

  // Load matches (same endpoint as web)
  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync("RBZ_TOKEN");
       if (!token) {
  router.replace("/auth/login");
  return;
}
const r = await fetch(`${API_BASE}/matches`, {
  headers: { Authorization: `Bearer ${token}` },
});


        const data = await r.json();

        let list: MatchUser[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.matches)
          ? data.matches
          : [];

            // sort by last activity (same idea as web)
        list = list
          .map((m: any) => {
            const ts =
              m.lastMessageTime ||
              m.lastMessage?.time ||
              m.lastMessage?.createdAt ||
              m.updatedAt ||
              m.createdAt ||
              0;
            return { ...m, _sortTime: new Date(ts).getTime() || 0 };
          })
          .sort((a: any, b: any) => (b._sortTime || 0) - (a._sortTime || 0));

        const visible = list.filter((m: any) => {
          const pid = safeId(m);
          return !hiddenPeers.includes(String(pid));
        });

        // ✅ Web parity: apply stored chat order after sorting fallback
        const storedOrder = await getJSONStore(CHAT_ORDER_KEY(myId), []);
        const orderedVisible = applyStoredOrder(visible, storedOrder);

        setMatches(orderedVisible);
        setFiltered(orderedVisible);
        loadNicknames(visible);


        // Snapshot presence (same as web logic)
        const states = await Promise.all(
          list.map(async (m: any) => {
            const id = safeId(m);
            try {
              const pr = await fetch(`${API_BASE}/presence/${id}`);
              const pj = await pr.json();
              return { id, online: !!pj?.online };
            } catch {
              return { id, online: false };
            }
          })
        );

        setOnlineMap((prev) => {
          const out = { ...prev };
          states.forEach((s) => (out[s.id] = s.online));
          return out;
        });

     } catch (e) {
  console.log("❌ Chat load failed", e);
  setMatches([]);
  setFiltered([]);
} finally {
  setLoading(false);
}

    })();
}, [user, hiddenPeers, myId]);
useEffect(() => {
  if (!user) return;

  let s: any;

   const onConnect = () => {
    try {
      s.emit("register", myId);
    } catch {}

    // ✅ socket reconnect → refresh server unread truth
    reconcileFromServer();
  };


  // ✅ Batch presence changes (debounced)
  const flushPresence = () => {
    const queued = presenceQueueRef.current;
    presenceQueueRef.current = {};


    unstable_batchedUpdates(() => {
      setOnlineMap((prev) => {
        const next = { ...prev };
        Object.keys(queued).forEach((uid) => {
          if (queued[uid]) next[String(uid)] = true;
          else delete next[String(uid)];
        });
        return next;
      });
    });
  };

  const queuePresence = (userId: any, online: boolean) => {
    if (!userId) return;
    presenceQueueRef.current[String(userId)] = online;

    if (presenceFlushRef.current) clearTimeout(presenceFlushRef.current);
    presenceFlushRef.current = setTimeout(flushPresence, 350); // ✅ debounce presence
  };

  const onOnline = ({ userId }: any) => queuePresence(userId, true);

  const onOffline = ({ userId }: any) => queuePresence(userId, false);

const bumpUnread = (raw: any) => {
  // Some emitters wrap message payload (defensive)
  const msg = raw?.message ? raw.message : raw;

  // ✅ Must have stable id (dedupe relies on it)
  const msgId = String(msg?.id || "");
  if (!msgId) return;

  const peerId = peerFromMsg(msg);
  if (!peerId) return;

  const isOutgoing = String(msg?.from) === String(myId);

  // ✅ If user is actively inside this chat, do NOTHING
  // (prevents chat list from fighting the open chat screen)
  if (activePeerRef.current === peerId) return;

  // ✅ DEDUPE: same message often arrives via multiple events
  const now = Date.now();
  const last = seenMsgIdsRef.current[msgId] || 0;

  // cleanup occasionally
  if (now - last > TTL_MS) {
    Object.keys(seenMsgIdsRef.current).forEach((k) => {
      if (now - (seenMsgIdsRef.current[k] || 0) > TTL_MS) delete seenMsgIdsRef.current[k];
    });
  }

  // if we've already processed this message id recently, ignore
  if (now - last < TTL_MS) return;

  // mark processed
  seenMsgIdsRef.current[msgId] = now;

  // ✅ ALWAYS update preview + sort order (incoming OR outgoing)
  setMatches((prev) => {
    const msgTime =
      new Date(msg?.time || msg?.createdAt || Date.now()).getTime() || Date.now();

    const next = prev.map((m) => {
      if (safeId(m) !== peerId) return m;

      return {
        ...m,
        lastMessage: msg,
        lastMessageTime: msgTime,
        _sortTime: msgTime,
      };
    });

    // sort by latest message time (received/sent)
    const sorted = [...next].sort((a: any, b: any) => {
      const at =
        a.lastMessageTime ||
        a.lastMessage?.time ||
        a.lastMessage?.createdAt ||
        a._sortTime ||
        a.updatedAt ||
        a.createdAt ||
        0;

      const bt =
        b.lastMessageTime ||
        b.lastMessage?.time ||
        b.lastMessage?.createdAt ||
        b._sortTime ||
        b.updatedAt ||
        b.createdAt ||
        0;

      return (new Date(bt).getTime() || 0) - (new Date(at).getTime() || 0);
    });

    // ✅ Web parity: move the peer to top and persist that order
    const persisted = reorderMatchesPersist(myId, sorted, peerId);

    // Keep filtered list in sync if you rely on it elsewhere
    setFiltered(persisted);

    return persisted;
  });


  // ✅ ONLY count unread for incoming (not your own messages)
  if (isOutgoing) return;

  // ✅ per-thread count
  setUnreadMap((prev) => {
    const next = { ...prev, [peerId]: (prev[peerId] || 0) + 1 };
    setJSONStore(UNREAD_MAP_KEY, next);
    return next;
  });

   // ✅ global total badge (bottom tab) — optimistic
  setUnreadTotal((prev) => {
    const nextTotal = (prev || 0) + 1;
    persistUnreadTotal(nextTotal);
    return nextTotal;
  });

  // ✅ reconcile to server truth (debounced)
  if (reconcileTimerRef.current) clearTimeout(reconcileTimerRef.current);
  reconcileTimerRef.current = setTimeout(() => {
    reconcileFromServer();
  }, 700);
};


  (async () => {
    s = await getSocket();
    socketRef.current = s;

    s.emit("register", myId);

      s.on("connect", onConnect);
    s.on("presence:online", onOnline);
    s.on("presence:offline", onOffline);

       // ✅ Keep both (backend emits both), but bumpUnread now dedupes by msg.id
    s.on("chat:message", bumpUnread);
    s.on("direct:message", bumpUnread);

    // ✅ Server truth pushes (prevents drift)
       s.on("chat:unread:update", async (summary: any) => {
      const applied = await applyUnreadSummary(summary);

      // ✅ batch both updates so list renders once
      unstable_batchedUpdates(() => {
        setUnreadMap(applied.byPeer || {});
        setUnreadTotal(applied.total || 0);
      });
    });


  })();

  return () => {
    if (!s) return;
    s.off("connect", onConnect);
    s.off("presence:online", onOnline);
    s.off("presence:offline", onOffline);
    s.off("chat:message", bumpUnread);
    s.off("direct:message", bumpUnread);
    s.off("chat:unread:update");
  };
}, [user, myId]);



  // Join all rooms so room broadcasts reach chat list (message:edit/delete/react)
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !myId || !matches?.length) return;

    const roomIds = matches.map((m) => makeRoomId(myId, safeId(m)));
    roomIds.forEach((rid) => s.emit("joinRoom", rid));

    return () => {
      roomIds.forEach((rid) => s.emit("leaveRoom", rid));
    };
  }, [matches, myId]);

  // Search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) return setFiltered(matches);

    setFiltered(
      matches.filter((m) => fullName(m).toLowerCase().includes(q))
    );
  }, [query, matches]);

  const openChat = (peer: MatchUser) => {
    const pid = safeId(peer);
    if (!pid) return;

    // clear unread for this peer
    setUnreadMap((prev) => {
      if (!prev[pid]) return prev;
      const next = { ...prev };
      delete next[pid];
      setJSONStore(UNREAD_MAP_KEY, next);

        // ⚠️ DO NOT touch UNREAD_TOTAL_KEY here.
      // That total is now a "global since last reset" counter for the bottom tab badge.
      return next;

    });

           // ✅ Web parity: bump thread to top + persist order on open
      setMatches((prev) => {
        const next = reorderMatchesPersist(myId, prev, pid);
        setFiltered(next);
        return next;
      });

      router.push({
        pathname: "/chat/[peerId]" as any,
        params: {
          peerId: pid,
          name: fullName(peer),
          avatar: avatarUrl(peer),
        },
      });
  };


  return (
    <View style={styles.container}>
      <LinearGradient colors={[RBZ.c1, RBZ.c4]} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Chats</Text>
         
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.75)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search matches"
            placeholderTextColor="rgba(255,255,255,0.75)"
            style={styles.search}
          />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={{ color: RBZ.gray, marginTop: 10 }}>Loading chats…</Text>
        </View>
            ) : (
        <FlatList
          style={styles.list}
          data={filtered}
          keyExtractor={(m) => String(safeId(m))}
          contentContainerStyle={{
            paddingBottom: 90 + insets.bottom,
          }}
          removeClippedSubviews
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={42} color={RBZ.gray} />
              <Text style={styles.emptyTitle}>No chats yet</Text>
              <Text style={styles.emptySub}>
                Once you match, your conversations will appear here.
              </Text>
            </View>
          }
          renderItem={({ item: m }) => {
            const pid = safeId(m);
            const online = !!onlineMap[pid];
            const unread = unreadMap[pid] || 0;

            return (
              <Pressable key={pid} onPress={() => openChat(m)} style={styles.row}>
                <View style={styles.avatarWrap}>
                  <Image source={{ uri: avatarUrl(m) }} style={styles.avatar} />
                  {online ? <View style={styles.onlineDot} /> : null}
                </View>

                              <View style={styles.mid}>
                  <View style={styles.topLine}>
                    <Text style={styles.name} numberOfLines={1}>
                      {nickMap[pid] || fullName(m)}
                    </Text>

                    {/* If you don't have a time formatter yet, keep this blank for now */}
                    <Text style={styles.time} numberOfLines={1}>
                      {""}
                    </Text>
                  </View>

                <View style={styles.bottomLine}>
                  <Text style={styles.preview} numberOfLines={1}>
                    {safePreviewText(m?.lastMessage, myId)}
                  </Text>

                  {unread > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
                    </View>
                  ) : null}
                </View>
                </View>

              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RBZ.soft },
  header: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: RBZ.white, fontSize: 22, fontWeight: "800" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  searchWrap: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  search: { flex: 1, color: RBZ.white, fontSize: 15 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },

  list: { flex: 1, paddingHorizontal: 12, paddingTop: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: RBZ.white,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  avatarWrap: { width: 56, height: 56, borderRadius: 18 },
  avatar: { width: 56, height: 56, borderRadius: 18 },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: RBZ.white,
  },

  mid: { flex: 1, marginLeft: 12 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { color: RBZ.ink, fontSize: 16, fontWeight: "800", maxWidth: "78%" },
  time: { color: RBZ.gray, fontSize: 12 },

  bottomLine: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  preview: { flex: 1, color: RBZ.gray, fontSize: 13 },

  right: { width: 48, alignItems: "flex-end", justifyContent: "center" },

  badge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
  },
  badgeText: { color: RBZ.white, fontSize: 12, fontWeight: "900" },

  empty: { alignItems: "center", paddingTop: 90, paddingHorizontal: 20 },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: "900", color: RBZ.ink },
  emptySub: { marginTop: 6, fontSize: 13, color: RBZ.gray, textAlign: "center" },
});

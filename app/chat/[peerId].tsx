
/**
 * ============================================================
 * 📁 File: app/chat/[peerId].tsx
 * 🎯 Screen: RomBuzz Mobile — Chat Window (Instagram-style DM)
 *
 * FEATURES (matches web behavior):
 *  - Realtime messages via Socket.IO (chat:message)
 *  - Edit (1h window handled by backend)
 *  - Unsend for me / for all
 *  - Reactions (❤️ 😂 😮 😢 🔥)
 *  - View-once supported via ::RBZ:: payload (backend filters)
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";


import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AudioBubble from "@/src/components/chat/AudioBubble";
import ChatCameraModal from "@/src/components/chat/ChatCameraModal";
import ChatPlusModal from "@/src/components/chat/ChatPlusModal";
import MediaViewer from "@/src/components/chat/MediaViewer";
import VoiceRecorderButton from "@/src/components/chat/VoiceRecorderButton";
import { uploadToCloudinaryUnsigned } from "@/src/config/uploadMedia";

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

const RBZ_TAG = "::RBZ::";
const IS_EXPO_GO = Constants.appOwnership === "expo";

const SCREEN_W = Dimensions.get("window").width;
const BUBBLE_MAX_W = Math.floor(SCREEN_W * 0.72); // IG-like bubble width

const encodePayload = (obj: any) => `${RBZ_TAG}${JSON.stringify(obj)}`;

// ✅ Parse ::RBZ:: only once per message version (huge win on long threads)
const decodedCacheRef = { current: new Map<string, { sig: string; val: any }>() };

const maybeDecode = (m: any) => {
  if (!m) return m;
  if (typeof m?.text === "string" && m.text.startsWith(RBZ_TAG)) {
    try {
      const payload = JSON.parse(m.text.slice(RBZ_TAG.length));
      return { ...m, ...payload };
    } catch {
      return m;
    }
  }
  return m;
};

const decodeCached = (m: any) => {
  const id = String(m?.id || "");
  if (!id) return maybeDecode(m);

  // ✅ IMPORTANT: reactions must be part of the signature,
  // otherwise reaction updates won't re-render until refresh.
  const reactionsSig = (() => {
    try {
      return JSON.stringify(m?.reactions || {});
    } catch {
      return "";
    }
  })();

  // sig changes if message text/deleted/edited/reactions changes
  const sig = `${String(m?.text || "")}|${String(m?.deleted || "")}|${String(m?.edited || "")}|${reactionsSig}`;

  const hit = decodedCacheRef.current.get(id);
  if (hit && hit.sig === sig) return hit.val;

  const val = maybeDecode(m);
  decodedCacheRef.current.set(id, { sig, val });
  return val;
};


function makeRoomId(a: string, b: string) {
  return [String(a), String(b)].sort().join("_");
}

type Msg = {
  id: string;
  from: string;
  to: string;
  text?: string;
  type?: string;
  time?: any;

  edited?: boolean;
  seen?: boolean; // ✅ add this

  deleted?: boolean;
  reactions?: Record<string, string>;
  ephemeral?: { mode?: string };
  _temp?: boolean;
  roomId?: string;
};

function dedupeById(list: Msg[]) {
  const map = new Map<string, Msg>();
  for (const m of list) {
    map.set(String(m.id), m); // latest wins
  }
  return Array.from(map.values());
}
export default function ChatWindowMobile() {
  const router = useRouter();
const params = useLocalSearchParams<{
  peerId: string;
  name?: string;
  avatar?: string;
  focusMsgId?: string;
}>();
const insets = useSafeAreaInsets();

const peerId = String(params.peerId || "");

// route-param fallback only
const routePeerName = String(params.name || "").trim();
const routePeerAvatar = String(params.avatar || "").trim();

// real peer profile state
const [peerProfile, setPeerProfile] = useState<{
  firstName?: string;
  lastName?: string;
  avatar?: string;
} | null>(null);

const peerName = (
  [peerProfile?.firstName, peerProfile?.lastName].filter(Boolean).join(" ").trim() ||
  routePeerName ||
  "Chat"
);

const peerAvatar =
  peerProfile?.avatar ||
  routePeerAvatar ||
  "https://i.pravatar.cc/200?img=12";

/* ============================================================
   🔔 ACTIVE CHAT SIGNAL (for unread suppression + reordering)
============================================================ */

useEffect(() => {
  if (!peerId) return;

  // ✅ Tell chat list: this peer is actively open
  try {
    globalThis.dispatchEvent?.(
      new CustomEvent("rbz:chat:active", {
        detail: { peerId },
      })
    );
  } catch {}

  return () => {
    // ✅ Tell chat list: no active chat
    try {
      globalThis.dispatchEvent?.(
        new CustomEvent("rbz:chat:active", {
          detail: { peerId: null },
        })
      );
    } catch {}
  };
}, [peerId]);

const [me, setMe] = useState<any>(null);
const [nickname, setNickname] = useState("");
const headerName = nickname.trim() ? nickname.trim() : peerName;

const nickKey = (meId: string, pid: string) =>
  meId && pid ? `RBZ_nick_${meId}_${pid}` : "";

  const myId = useMemo(() => String(me?.id || me?._id || ""), [me]);

  const roomId = useMemo(() => makeRoomId(myId, peerId), [myId, peerId]);

   const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

const [text, setText] = useState("");
const [typing, setTyping] = useState(false);
const [keyboardOpen, setKeyboardOpen] = useState(false);
const [composerExpanded, setComposerExpanded] = useState(false);
const [composerActionsOpen, setComposerActionsOpen] = useState(false);
const [inputHeight, setInputHeight] = useState(44);
const [replyIdeasOpen, setReplyIdeasOpen] = useState(false);
const [replyIdeasLoading, setReplyIdeasLoading] = useState(false);
const [replyIdeasError, setReplyIdeasError] = useState("");
const [replyIdeas, setReplyIdeas] = useState<Array<{ id: string; tone: string; text: string }>>([]);
// ➕ Attach modal
const [plusOpen, setPlusOpen] = useState(false);

// 📷 Dedicated camera modal
const [cameraOpen, setCameraOpen] = useState(false);
// ✅ Fullscreen media viewer (reusable component)
const [viewerOpen, setViewerOpen] = useState(false);
const [viewerMsg, setViewerMsg] = useState<any | null>(null);

// ✅ View-once / View-twice client enforcement (removal)
const [mediaViews, setMediaViews] = useState<Record<string, number>>({});
const [expiredMedia, setExpiredMedia] = useState<Record<string, true>>({});

// ✅ Double-tap ❤️ burst (IG-style)
const [heartBurstId, setHeartBurstId] = useState<string | null>(null);
const heartAnim = useRef(new Animated.Value(0)).current;
const lastTapRef = useRef<Record<string, number>>({});
const singleTapTimerRef = useRef<Record<string, any>>({});

const getMaxViews = (m: any): 1 | 2 | undefined => {
  const mv = m?.ephemeral?.maxViews;
  if (mv === 1 || mv === 2) return mv;
  // fallback if mode string exists
  const mode = m?.ephemeral?.mode;
  if (mode === "once") return 1;
  if (mode === "twice") return 2;
  return undefined;
};

const getMediaKey = (m: any) => String(m?.id || m?.url || "");
const isExpired = (m: any) => {
  const k = getMediaKey(m);
  return !!expiredMedia[k];
};

const openViewer = (m: any) => {
  setViewerMsg(m);
  setViewerOpen(true);
};

const closeViewer = () => {
  setViewerOpen(false);
  setViewerMsg(null);
};

const consumeEphemeralView = async (m: any) => {
  const maxViews = getMaxViews(m);
  if (!maxViews) return; // only for once/twice

  if (!m?.id || !roomId) return;

  try {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");

    const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/${m.id}/viewed`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const j = await r.json().catch(() => ({}));

    // if server already expired it, we also update instantly (socket will also sync)
  if (j?.viewsLeft === 0) {
  // media removal will be handled by socket event
  closeViewer();
}

  } catch (e) {
    console.log("❌ consumeEphemeralView failed", e);
  }
};


const triggerHeartBurst = (m: any) => {
  const k = getMediaKey(m);
  setHeartBurstId(k);

  heartAnim.setValue(0);
  Animated.sequence([
    Animated.timing(heartAnim, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    }),
    Animated.timing(heartAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }),
  ]).start(() => {
    setHeartBurstId(null);
  });
};

const handleMediaTap = (m: any) => {
  const k = getMediaKey(m);
  const now = Date.now();
  const last = lastTapRef.current[k] || 0;

  // double tap window
  if (now - last < 260) {
    lastTapRef.current[k] = 0;
    if (singleTapTimerRef.current[k]) {
      clearTimeout(singleTapTimerRef.current[k]);
      singleTapTimerRef.current[k] = null;
    }

    // ✅ double tap => ❤️ + burst
    reactTo(m, "❤️");
    triggerHeartBurst(m);
    return;
  }

  lastTapRef.current[k] = now;

  // single tap delayed => fullscreen
  singleTapTimerRef.current[k] = setTimeout(() => {
    singleTapTimerRef.current[k] = null;
    openViewer(m);
  }, 260);
};

// typing / read receipts
const typingStopRef = useRef<any>(null);

const isTypingRef = useRef(false);
const lastSeenEmitRef = useRef<string | null>(null);

const emitTyping = (next: boolean) => {
  const s = socketRef.current;
  if (!s || !myId || !peerId) return;
  try {
    s.emit("typing", { roomId, from: myId, to: peerId, typing: next });
  } catch {}
};

const markSeen = (msgId: string) => {
  const s = socketRef.current;
  if (!s || !msgId || !myId || !peerId) return;
  if (lastSeenEmitRef.current === msgId) return;
  lastSeenEmitRef.current = msgId;
  try {
    s.emit("message:seen", { roomId, msgId, from: myId, to: peerId });
  } catch {}
};

// 👇 ADD THESE TWO FUNCTIONS
const onTyping = (p: any) => {
  if (String(p?.from) !== String(peerId)) return;
  setTyping(!!p?.typing);
};

const onSeen = (payload: any) => {
  const seenUpTo =
    payload?.lastSeenId ||
    payload?.seenUpTo ||
    payload?.msgId ||
    payload?.messageId ||
    payload?.id ||
    payload;

  if (!seenUpTo || !myId) return;

  setMessages((prev) => {
    let hit = false;

    return prev.map((m) => {
      if (String(m.from) !== String(myId)) return m;

      if (!hit) {
        if (String(m.id) === String(seenUpTo)) hit = true;
        return { ...m, seen: true };
      }
      return m;
    });
  });
};


  // message action sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMsg, setSheetMsg] = useState<Msg | null>(null);

  // edit mode
  const [editId, setEditId] = useState<string | null>(null);

 const socketRef = useRef<any>(null);
const flatRef = useRef<FlatList>(null);
const focusMsgId = String(params.focusMsgId || "");
const [highlightId, setHighlightId] = useState<string>("");
// ⬆️⬇️ Scroll helpers (top / bottom buttons)
const [showScrollBtns, setShowScrollBtns] = useState(false);
const scrollHideTimer = useRef<any>(null);

// ✅ Auto-scroll control
const didInitialScrollRef = useRef(false);
const layoutReadyRef = useRef(false);

const nearBottomRef = useRef(true);

// ✅ force-follow the latest message after layout/content updates
const pendingFollowLatestRef = useRef(false);

// ✅ one-time "snap to bottom" when thread loads (prevents visible crawl)
const didInitialSnapRef = useRef(false);
const scrollToLatest = (animated = false) => {
  try {
    flatRef.current?.scrollToEnd({ animated });
  } catch {}
};

const settleToLatest = (animated = true) => {
  pendingFollowLatestRef.current = true;

  requestAnimationFrame(() => {
    try {
      flatRef.current?.scrollToEnd({ animated });
    } catch {}

    requestAnimationFrame(() => {
      try {
        flatRef.current?.scrollToEnd({ animated });
      } catch {}

      // ✅ release on next frame after layout catches up
      requestAnimationFrame(() => {
        pendingFollowLatestRef.current = false;
      });
    });
  });
};

const scrollToTop = () => {
  try {
    flatRef.current?.scrollToOffset({ offset: 0, animated: true });
  } catch {}
};

// ✅ Dynamic bottom padding:
// - smaller when keyboard is open (removes empty gap)
// - larger when keyboard is closed (keeps last bubble visible above composer)
const LIST_BOTTOM_PAD = keyboardOpen
  ? Math.max(8, inputHeight + (editId ? 54 : 42)) // ✅ tight when keyboard open
  : 96 + insets.bottom; // ✅ safe spacing when keyboard closed
const scrollToMessage = (id: string) => {
  if (!id) return;

  const idx = messages.findIndex((m) => String(m?.id) === String(id));
  if (idx < 0) return;

  // try a couple times (FlatList sometimes isn't ready immediately)
  const tryScroll = (attempt: number) => {
    try {
      flatRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      setHighlightId(String(id));
      setTimeout(() => setHighlightId(""), 1200);
    } catch {
      if (attempt < 3) setTimeout(() => tryScroll(attempt + 1), 220);
    }
  };

  tryScroll(0);
};

const mine = (m: any) => String(m?.from) === String(myId);

// IG-style: show "Seen"/"Sent" under the last message you sent
const lastMyMsgId = useMemo(() => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = maybeDecode(messages[i] as any);
    if (mine(m) && !m?.deleted) return String(m.id);
  }
  return null;
}, [messages, myId]);

    // Load me
  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync("RBZ_USER");
      setMe(raw ? JSON.parse(raw) : null);
    })();
  }, []);

  // Load real peer profile so header works even when route params are missing
  useEffect(() => {
    if (!peerId) return;

    let alive = true;

    (async () => {
      try {
        const token = await SecureStore.getItemAsync("RBZ_TOKEN");
        if (!token) return;

        const r = await fetch(`${API_BASE}/users/${peerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const j = await r.json().catch(() => ({}));
        const u = j?.user || null;

        if (!alive || !u) return;

        setPeerProfile({
          firstName: String(u.firstName || "").trim(),
          lastName: String(u.lastName || "").trim(),
          avatar: String(u.avatar || "").trim(),
        });
      } catch (e) {
        console.log("❌ peer profile load failed", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [peerId]);

  // ✅ Track keyboard open/closed so we can remove extra bottom gaps
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, () => {
      setKeyboardOpen(true);

      // ✅ keep latest visible above composer when keyboard opens
      settleToLatest(false);
    });

    const hideSub = Keyboard.addListener(hideEvt, () => {
      setKeyboardOpen(false);

      // ✅ re-settle after keyboard closes too
      settleToLatest(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
// Load nickname (persistent)
useEffect(() => {
  if (!myId || !peerId) return;

  const key = nickKey(myId, peerId);
  if (!key) return;

  (async () => {
    const n = (await SecureStore.getItemAsync(key)) || "";
    setNickname(n);
  })();
}, [myId, peerId]);


  // Load messages
  useEffect(() => {
    if (!myId || !peerId) return;

    (async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync("RBZ_TOKEN");
        const r = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await r.json();
        const list = Array.isArray(data) ? data : [];

        setMessages(list);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [myId, peerId, roomId]);

  // ✅ Snap to bottom ONCE after initial load (instant, no visible crawl)
useEffect(() => {
  if (loading) return;
  if (!messages.length) return;
  if (focusMsgId) return; // don't fight "scrollToMessage"

  if (didInitialSnapRef.current) return;
  didInitialSnapRef.current = true;

  // Run after layout/paint so FlatList knows final content height
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flatRef.current?.scrollToEnd({ animated: false });
    });
  });
}, [loading, messages.length, focusMsgId]);

    /* ============================================================
   ✅ CLEAR UNREAD FOR THIS PEER ON OPEN
============================================================ */
useEffect(() => {
  if (!peerId) return;

  // ✅ Optimistic clear (UI immediately)
  try {
    const e = new CustomEvent("rbz:chat:clear-peer", {
      detail: { peerId },
    });
    globalThis.dispatchEvent?.(e);
  } catch {}

  // ✅ Server mark-read + reconcile summary (prevents drift across devices)
  (async () => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      if (!token) return;

      // 1) mark-read on server
      await fetch(`${API_BASE}/chat/mark-read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ peerId }),
      }).catch(() => null);

      // 2) fetch server truth
      const r = await fetch(`${API_BASE}/chat/unread-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await r.json().catch(() => ({}));
      const total = Number(j?.total || 0) || 0;
      const byPeer = (j?.byPeer && typeof j.byPeer === "object") ? j.byPeer : {};

      // 3) persist caches (same keys chat.tsx + tabs use)
      await SecureStore.setItemAsync("RBZ_unread_total", String(total)).catch(() => {});
      await SecureStore.setItemAsync("RBZ_unread_map", JSON.stringify(byPeer || {})).catch(() => {});

      // 4) broadcast so tabs + chat list update instantly
      try {
        globalThis.dispatchEvent?.(
          new CustomEvent("rbz:unread:total", { detail: { total } })
        );
      } catch {}

      try {
        globalThis.dispatchEvent?.(
          new CustomEvent("rbz:unread:summary", { detail: { total, byPeer } })
        );
      } catch {}
    } catch {}
  })();
}, [peerId]);


  //reflect nickname
  useEffect(() => {
  const handler = (e: any) => {
    if (e?.detail?.peerId !== peerId) return;
    setNickname(e.detail.nickname || "");
  };

  globalThis.addEventListener?.("rbz:nickname:update", handler);
  return () => {
    globalThis.removeEventListener?.("rbz:nickname:update", handler);
  };
}, [peerId]);


// Socket wiring (join room for edit/delete/react broadcasts)
useEffect(() => {
  if (!myId || !peerId || !roomId) return;

  let alive = true;
  let s: any;

const onIncoming = (raw: any) => {
  const payload = raw?.message ? raw.message : raw;
  const msg = payload as Msg;

  // ✅ IMPORTANT:
  // "direct:message" is used by chat list as a PREVIEW payload (often no id/url/time).
  // The chat window must ignore preview-only payloads or you'll get blank/black messages until refresh.
  if (!msg?.id) return;

  const incomingRoomId =
    raw?.roomId ||
    msg?.roomId ||
    makeRoomId(String(msg.from), String(msg.to));

  if (incomingRoomId !== roomId) return;

  setMessages((prev) => {
    let next = [...prev];

    // 🔁 Replace optimistic temp message
    const tempIndex = next.findIndex(
      (m) =>
        m._temp &&
        String(m.from) === String(msg.from) &&
        String(m.to) === String(msg.to) &&
        String(m.text) === String(msg.text)
    );

    if (tempIndex !== -1) {
      next[tempIndex] = msg;
    } else {
      next.push(msg);
    }

    // ✅ ABSOLUTE GUARANTEE: no duplicate IDs
    return dedupeById(next);
  });

  if (String(msg?.from) === String(peerId)) {
    markSeen(String(msg.id));
  }

  // ✅ ALWAYS follow the newest message while this chat is open
  // sent or received — both should land just above the composer
  settleToLatest(true);
};

  const onEdited = (payload: any) => {
    const msg = maybeDecode(payload?.message || payload);
    if (!msg?.id) return;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
  };

   const onDeleted = (payload: any) => {
    const id =
      payload?.id ||
      payload?.msgId ||
      payload?.messageId ||
      payload;

    if (!id) return;

    // ✅ permanently remove from active thread UI
    setMessages((prev) => prev.filter((m) => String(m.id) !== String(id)));
  };

  const onReacted = (payload: any) => {
    const msg = maybeDecode(payload?.message || payload);
    if (!msg?.id) return;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
  };
 const onEphemeralExpired = (payload: any) => {
  const expiredId =
    payload?.msgId || payload?.messageId || payload?.id || payload;

  const systemMessage = payload?.systemMessage || null;
  if (!expiredId) return;

  setMessages((prev) => {
    const map = new Map<string, Msg>();

    // remove expired media
    prev.forEach((m) => {
      if (String(m.id) !== String(expiredId)) {
        map.set(String(m.id), m);
      }
    });

    // add system message ONCE
    if (systemMessage?.id) {
      map.set(String(systemMessage.id), systemMessage);
    }

    return Array.from(map.values());
  });
};


  (async () => {
    s = await getSocket();
    if (!alive) return;

    socketRef.current = s;

    // make sure server knows who we are
    try {
      s.emit("user:register", myId);
    } catch {}

    // join this DM room so we receive edits/reactions/deletes
    try {
      s.emit("joinRoom", roomId);
    } catch {}

    // listen (support multiple event names so it matches backend/web)
   s.on("chat:message", onIncoming);
s.on("message", onIncoming);


    s.on("message:edit", onEdited);
    s.on("chat:edit", onEdited);

    s.on("message:delete", onDeleted);
    s.on("chat:delete", onDeleted);

   s.on("message:react", onReacted);
s.on("chat:react", onReacted);
s.on("message:seen", onSeen);
s.on("chat:seen", onSeen);
s.on("typing", onTyping);
s.on("chat:ephemeral:expired", onEphemeralExpired);

  })();
  
  return () => {
    alive = false;
    if (!s) return;

    try {
      s.emit("leaveRoom", roomId);
    } catch {}

  s.off("chat:message", onIncoming);
s.off("message", onIncoming);

    s.off("message:edit", onEdited);
    s.off("chat:edit", onEdited);

    s.off("message:delete", onDeleted);
    s.off("chat:delete", onDeleted);

   s.off("message:react", onReacted);
s.off("chat:react", onReacted);
s.off("message:seen", onSeen);
s.off("chat:seen", onSeen);
s.off("typing", onTyping);
s.off("chat:ephemeral:expired", onEphemeralExpired);

  };
}, [myId, peerId, roomId]);


// ✅ When chat opens / messages load: mark the latest peer message as seen immediately
useEffect(() => {
  if (!myId || !peerId) return;
  if (loading) return;
  if (!messages?.length) return;

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = maybeDecode(messages[i] as any);
    if (!m || m?.deleted) continue;

    const isPeerMsg = String(m?.from) === String(peerId);
    if (!isPeerMsg) continue;

    markSeen(String(m.id));
    break;
  }
}, [loading, messages, myId, peerId]);

// 🔎 Scroll + highlight when coming from Shared Media → "Show in chat"
useEffect(() => {
  if (!focusMsgId) return;
  if (loading) return;
  if (!messages.length) return;

  scrollToMessage(focusMsgId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [focusMsgId, loading, messages.length]);

const openSheet = (m: Msg) => {
  setSheetMsg(m);
  setSheetOpen(true);
};


  const closeSheet = () => {
    setSheetOpen(false);
    setSheetMsg(null);
  };

const applyReplyIdea = (ideaText: string) => {
  const next = String(ideaText || "").trim();
  if (!next) return;

  setText(next);
  setReplyIdeasOpen(false);
  setReplyIdeasError("");
};

const loadReplyIdeas = async (
  mode: "natural" | "flirty" | "funny" | "safe" = "natural"
) => {
  if (!myId || !peerId || !roomId) return;

  setReplyIdeasLoading(true);
  setReplyIdeasError("");
  setReplyIdeasOpen(true);

  try {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");

    const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/reply-suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mode,
        count: 4,
      }),
    });

    const j = await r.json().catch(() => ({}));

    const list = Array.isArray(j?.suggestions) ? j.suggestions : [];

    if (list.length) {
      setReplyIdeas(
        list.map((x: any, i: number) => ({
          id: String(x?.id || `${mode}-${i + 1}`),
          tone: String(x?.tone || mode),
          text: String(x?.text || "").trim(),
        })).filter((x: any) => x.text)
      );
      return;
    }

    // fallback if backend returns nothing
    const fallbackBase =
      mode === "flirty"
        ? [
            "You’re making this conversation dangerously easy to enjoy 😌",
            "Okay, now I need the full story because I’m curious.",
            "You’re kind of fun to talk to, not gonna lie.",
            "That actually made me smile. Tell me more.",
          ]
        : mode === "safe"
        ? [
            "That’s nice. What are you up to right now?",
            "That sounds interesting. How did that happen?",
            "Haha fair enough. What made you think that?",
            "I get that. Tell me a little more.",
          ]
        : mode === "funny"
        ? [
            "That was suspiciously smooth 😂",
            "Okay, I didn’t expect that answer and now I’m invested.",
            "You might actually be trouble in the best way.",
            "That’s funny — continue immediately.",
          ]
        : [
            "That’s actually interesting. Tell me more.",
            "Okay, now I’m curious — what happened next?",
            "That sounds good. What got you into that?",
            "Haha, fair. What are you doing right now?",
          ];

    setReplyIdeas(
      fallbackBase.map((text, i) => ({
        id: `${mode}-fallback-${i + 1}`,
        tone: mode,
        text,
      }))
    );
  } catch {
    setReplyIdeasError("Could not load reply ideas.");
    setReplyIdeas([
      {
        id: `${mode}-safe-1`,
        tone: mode,
        text: "That’s interesting — tell me more.",
      },
      {
        id: `${mode}-safe-2`,
        tone: mode,
        text: "Haha fair enough. What are you up to right now?",
      },
      {
        id: `${mode}-safe-3`,
        tone: mode,
        text: "Okay now I’m curious. What happened next?",
      },
    ]);
  } finally {
    setReplyIdeasLoading(false);
  }
};

const reactTo = async (m: Msg, emoji: string) => {
  if (!m?.id || !myId) return;

  const mid = String(m.id);

  // ✅ toggle logic
  setMessages((prev) =>
    prev.map((x) => {
      if (String(x.id) !== mid) return x;

      const next = { ...(x.reactions || {}) };

      if (next[String(myId)] === emoji) {
        delete next[String(myId)];
      } else {
        next[String(myId)] = emoji;
      }

      return { ...x, reactions: next };
    })
  );

  closeSheet();

  try {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");
    await fetch(`${API_BASE}/chat/rooms/${roomId}/${mid}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emoji }),
    });
  } catch {}
};



  const startEdit = (m: Msg) => {
    const dec = maybeDecode(m);
    setEditId(m.id);
    setText(String(dec?.text || ""));
    closeSheet();
  };

  const unsendForMe = async (m: Msg) => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/${m.id}?scope=me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (j?.ok) {
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
      }
    } catch {}
    closeSheet();
  };

  const unsendForAll = async (m: Msg) => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/${m.id}?scope=all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok) {
        Alert.alert("Unsend failed", j?.error || "Try again");
        return;
      }

      // ✅ immediate local removal for sender
      setMessages((prev) => prev.filter((x) => String(x.id) !== String(m.id)));
    } catch {
      Alert.alert("Unsend failed", "Try again");
    }
    closeSheet();
  };

    const sendMediaPayload = async (payloadObj: any) => {
  if (!myId || !peerId) return;

  // optimistic local
  const tempId = `temp_media_${Date.now()}`;

  const temp: Msg = {
    id: tempId,
    from: myId,
    to: peerId,
    text: encodePayload(payloadObj),
    type: "media",
    time: new Date().toISOString(),
    _temp: true,
  };

  setMessages((p) => [...p, temp]);

  // ✅ keep latest media visible above composer too
  settleToLatest(true);

  try {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");

    const r = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: encodePayload(payloadObj) }),
    });

    const j = await r.json();
    const serverMsg: Msg | null = j?.message || null;

     if (serverMsg?.id) {
      setMessages((prev) =>
        dedupeById(prev.map((m) => (m.id === tempId ? serverMsg : m)))
      );

      // ✅ settle again after temp replacement
      settleToLatest(true);
    }

  } catch {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
    Alert.alert("Send failed", "Could not send media.");
  }
};

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !myId || !peerId) return;

    const isEditing = !!editId;

    // optimistic
    const tempId = `temp_${Date.now()}`;
      if (!isEditing) {
      const temp: Msg = {
        id: tempId,
        from: myId,
        to: peerId,
        text: trimmed,
        type: "text",
        time: new Date().toISOString(),
        _temp: true,
      };
      setMessages((p) => [...p, temp]);

      // ✅ force the newest outgoing message above the composer
      settleToLatest(true);
    }

    setText("");
    setInputHeight(44);
    setComposerExpanded(false);
    setComposerActionsOpen(false);

    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");

    if (isEditing) {
    const editingId = String(editId);

    // ✅ optimistic local update (instant)
    setMessages((prev) =>
    prev.map((m) =>
      String(m.id) === editingId
        ? { ...m, text: trimmed, edited: true }
        : m
    )
  );

  const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/${editingId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text: trimmed }),
  });

  const j = await r.json();

  if (!j?.ok) {
    Alert.alert("Edit failed", j?.error || "Try again");
  } else {
    // ✅ if server returns the updated message, sync it
    const serverMsg: Msg | null = j?.message || null;
   if (serverMsg?.id) {
  setMessages((prev) =>
    dedupeById(prev.map((m) => (m.id === tempId ? serverMsg : m)))
  );
}

  }

  setEditId(null);
  return;
}


      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: trimmed }),
      });

      const j = await r.json();

         const serverMsg: Msg | null = j?.message || null;
      if (serverMsg?.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? serverMsg : m))
        );

        // ✅ second settle after optimistic temp gets replaced
        settleToLatest(true);
      }
    } catch {
      // rollback temp (optional)
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };
  const formatReactions = (reactions?: Record<string, string>) => {
  if (!reactions) return "";

  const counts: Record<string, number> = {};
  Object.values(reactions).forEach((e) => {
    counts[e] = (counts[e] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([e, c]) => `${e}${c > 1 ? c : ""}`)
    .join(" ");
};


 const renderItem = ({ item }: { item: Msg }) => {
  const m = decodeCached(item);
  const isMine = mine(m);

  const isSharedPost =
    m?.type === "share_post" &&
    typeof m?.mediaUrl === "string" &&
    !!String(m.mediaUrl).trim();

  const isSharedReel =
    m?.type === "share_reel" &&
    typeof m?.mediaUrl === "string" &&
    !!String(m.mediaUrl).trim();

  const isShared = isSharedPost || isSharedReel;

  // basic media handling (web uses ::RBZ:: payload)
  const isMedia = !isShared && (m?.type === "media" || !!m?.url);
  const isAudio = m?.mediaType === "audio";
  const reactLine = formatReactions(m?.reactions);

  return (
<View
  style={[
    styles.bubbleRow,
    isMine ? styles.rowMine : styles.rowPeer,
    String(item.id) === String(highlightId) ? styles.focusRing : null,
  ]}
>
    {/* ✅ Tiny clickable avatar before received messages */}
    {!isMine ? (
      <Pressable
        onPress={() =>
          router.push({
           pathname: "/view-profile",
            params: { userId: peerId },
          })
        }
        style={styles.tinyAvatarBtn}
      >
        <Image source={{ uri: peerAvatar }} style={styles.tinyAvatar} />
      </Pressable>
    ) : null}


{/* ✅ CONTENT (media = no bubble, text = bubble) */}
<View
  style={[
    styles.msgWrap,
    isMine ? styles.msgWrapMine : styles.msgWrapPeer,
    reactLine ? styles.msgWrapWithReact : null,
  ]}
>
    {isAudio ? (
    <AudioBubble uri={m.url} isMine={isMine} />
  ) : isMedia ? (
    isExpired(m) ? null : (
      <Pressable
        onPress={() => handleMediaTap(m)}
        onLongPress={() => openSheet(item)}
        style={[
          styles.mediaWrap,
          isMine ? styles.mediaMine : styles.mediaPeer,
        ]}
      >
          
        {m.mediaType === "video" ? (
          <Video
            source={{ uri: m.url }}
            style={[styles.mediaThumb, getMaxViews(m) && styles.mediaBlur]}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
          />
        ) : (
          <Image
            source={{ uri: m.url }}
            style={[styles.mediaThumb, getMaxViews(m) && styles.mediaBlur]}
            resizeMode="cover"
          />
        )}

        {/* ✅ Center play badge for chat videos */}
        {m.mediaType === "video" ? (
          <View style={styles.videoPlayOverlay} pointerEvents="none">
            <View style={styles.videoPlayBadge}>
              <Ionicons name="play" size={22} color={RBZ.white} />
            </View>
          </View>
        ) : null}

        {/* 🔒 Blur overlay for view-once / twice */}
        {getMaxViews(m) ? (
          <View style={styles.mediaOverlay} pointerEvents="none">
            <Ionicons name="eye" size={28} color={RBZ.white} />
            <Text style={styles.mediaOverlayText}>Tap to view</Text>
          </View>
        ) : null}

        {getMaxViews(m) ? (
          <View style={styles.viewBadge}>
            <Ionicons name="eye" size={14} color={RBZ.white} />
            <Text style={styles.viewBadgeText}>
              {getMaxViews(m) === 1 ? "View once" : "View twice"}
            </Text>
          </View>
        ) : null}

        {heartBurstId === getMediaKey(m) ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartBurst,
              {
                opacity: heartAnim,
                transform: [
                  {
                    scale: heartAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1.35],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="heart" size={76} color="#ff2d55" />
          </Animated.View>
        ) : null}
      </Pressable>
    )
  ) : isShared ? (
    m?.deleted ? (
      <Pressable
        onLongPress={() => openSheet(item)}
        style={{
          alignSelf: "flex-start",
          maxWidth: BUBBLE_MAX_W,
          flexShrink: 0,
          overflow: "visible",
        }}
      >
        <View style={[styles.bubble, isMine ? styles.mine : styles.peer]}>
          <Text style={[styles.msgText, isMine ? styles.mineText : styles.peerText]}>
            This message was unsent
          </Text>
        </View>
      </Pressable>
    ) : (
      <Pressable
        onPress={() =>
          openViewer({
            id: String(m?.id || ""),
            url: String(m?.mediaUrl || ""),
            mediaType: isSharedReel ? "video" : "image",
          })
        }
        onLongPress={() => openSheet(item)}
        style={[
          styles.mediaWrap,
          isMine ? styles.mediaMine : styles.mediaPeer,
        ]}
      >
      
        {isSharedReel ? (
          <Video
            source={{ uri: String(m?.mediaUrl || "") }}
            style={styles.mediaThumb}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted
          />
        ) : (
          <Image
            source={{ uri: String(m?.mediaUrl || "") }}
            style={styles.mediaThumb}
            resizeMode="cover"
          />
        )}

        {/* ✅ Extra visual cue so reels look like videos immediately */}
        {isSharedReel ? (
          <View style={styles.videoPlayOverlay} pointerEvents="none">
            <View style={styles.videoPlayBadge}>
              <Ionicons name="play" size={22} color={RBZ.white} />
            </View>
          </View>
        ) : null}

        <View style={styles.mediaOverlay} pointerEvents="none">
          <Ionicons
            name={isSharedReel ? "play-circle-outline" : "images-outline"}
            size={28}
            color={RBZ.white}
          />
          <Text style={styles.mediaOverlayText}>
            {isSharedReel ? "Shared reel" : "Shared post"}
          </Text>
          <Text style={styles.mediaOverlayText}>Tap to open</Text>
        </View>
      </Pressable>
    )
  ) : (
    <Pressable
      onLongPress={() => openSheet(item)}
      style={{
        alignSelf: "flex-start",
        maxWidth: BUBBLE_MAX_W,
        flexShrink: 0,
        overflow: "visible",
      }}
    >
      <View style={[styles.bubble, isMine ? styles.mine : styles.peer]}>
        <Text style={[styles.msgText, isMine ? styles.mineText : styles.peerText]}>
          {m?.deleted ? "This message was unsent" : String(m?.text || "")}
        </Text>
      </View>
    </Pressable>
  )}

   {/* ✅ Reaction pill hangs on bubble edge */}
  {reactLine ? (
    <Pressable
      onPress={() => {
        // ✅ remove ONLY my reaction (toggle off)
        const myEmoji = (m?.reactions && myId) ? m.reactions[String(myId)] : null;
        if (!myEmoji) return;
        reactTo(item, myEmoji); // reactTo already toggles: same emoji => remove
      }}
      hitSlop={10}
      style={[
        styles.reactionPill,
        isMine ? styles.reactionPillMine : styles.reactionPillPeer,
      ]}
    >
      <Text style={styles.reactText}>{reactLine}</Text>
    </Pressable>
  ) : null}
</View>


      {/* ✅ Meta under message: Edited + Seen/Sent */}
      <View style={[styles.metaRow, isMine ? styles.metaMine : styles.metaPeer]}>
        {m?.edited && !m?.deleted ? <Text style={styles.metaLabel}>Edited</Text> : null}

        {isMine && String(m?.id) === String(lastMyMsgId) ? (
          <Text style={styles.metaLabel}>{m?.seen ? "Seen" : "Sent"}</Text>
        ) : null}
      </View>
      </View>

    );
  };

  return (
    <View style={styles.container}>
        <LinearGradient
          colors={[RBZ.c1, RBZ.c1]}
          style={[
            styles.topBar,
            { paddingTop: 16 + insets.top },
          ]}
        >
<Pressable
  onPress={() => {
    try {
      globalThis.dispatchEvent?.(
        new CustomEvent("rbz:chat:active", {
          detail: { peerId: null },
        })
      );
    } catch {}
    router.back();
  }}
  style={styles.topBtn}
>
          <Ionicons name="chevron-back" size={22} color={RBZ.white} />
        </Pressable>

         {/* Peer header (tap avatar/name -> thread info tab) */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/chat/thread-info/[peerId]" as any,
                params: {
                  peerId,
                  name: headerName,
                  avatar: peerAvatar,
                },
              })
            }
            style={styles.peerInfo}
          >
            <Image source={{ uri: peerAvatar }} style={styles.peerAvatar} />
            <View>
              <Text style={styles.peerName} numberOfLines={1}>
                {headerName}
              </Text>
              <Text style={styles.peerSub} numberOfLines={1}>
                {typing ? "typing…" : "RomBuzz chat"}
              </Text>
            </View>
          </Pressable>

                     <View style={styles.topActions}>
          <Pressable
            onPress={() => loadReplyIdeas("natural")}
            style={styles.topBtn}
          >
            <Ionicons name="color-wand" size={18} color={RBZ.white} />
          </Pressable>

          <Pressable style={styles.topBtn}>
            <Ionicons name="call-outline" size={20} color={RBZ.white} />
          </Pressable>

          <Pressable style={styles.topBtn}>
            <Ionicons name="videocam-outline" size={22} color={RBZ.white} />
          </Pressable>
        </View>
      </LinearGradient>
           <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 + insets.top : 0}
      >
        {loading ? (
          <View style={styles.loading}>
            <Text style={{ color: RBZ.gray }}>Loading messages…</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(m) => (m._temp ? `temp-${m.id}` : `srv-${m.id}`)}
              renderItem={renderItem}
              scrollEventThrottle={16}
              removeClippedSubviews
              initialNumToRender={18}
              maxToRenderPerBatch={18}
              windowSize={9}
              updateCellsBatchingPeriod={50}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingTop: 12,
                paddingBottom: LIST_BOTTOM_PAD,
              }}
                      onContentSizeChange={() => {
                if (loading) return;
                if (!messages.length) return;
                if (!didInitialSnapRef.current) return;

                // ✅ if a send/receive/update explicitly requested follow,
                // honor it regardless of nearBottomRef
                if (pendingFollowLatestRef.current) {
                  requestAnimationFrame(() => {
                    flatRef.current?.scrollToEnd({ animated: false });
                  });
                  return;
                }

                if (!nearBottomRef.current) return;

                requestAnimationFrame(() => {
                  flatRef.current?.scrollToEnd({ animated: true });
                });
              }}
              onScroll={({ nativeEvent }) => {
                const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
                const paddingToBottom = 50;

                const isNearBottom =
                  contentOffset.y + layoutMeasurement.height >=
                  contentSize.height - paddingToBottom;

                nearBottomRef.current = isNearBottom;

                setShowScrollBtns(true);

                if (scrollHideTimer.current) {
                  clearTimeout(scrollHideTimer.current);
                }

                scrollHideTimer.current = setTimeout(() => {
                  setShowScrollBtns(false);
                }, 900);
              }}
                      />
          </View>
        )}

        {typing ? (
          <View style={styles.typingBarWrap}>
            <View style={styles.typingBar}>
              <View style={styles.typingDot} />
              <Text style={styles.typingBarText}>{headerName} is typing...</Text>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.composer,
            {
              marginBottom: keyboardOpen ? 8 : 0,
              paddingBottom: keyboardOpen ? 2 : Math.max(8, insets.bottom),
            },
          ]}
        >
          {editId ? (
            <View style={styles.editChip}>
              <Ionicons name="pencil" size={14} color={RBZ.white} />
              <Text style={styles.editChipText}>Editing</Text>
              <Pressable
                onPress={() => {
                  setEditId(null);
                  setText("");
                  setInputHeight(44);
                  setComposerExpanded(false);
                  setComposerActionsOpen(false);
                }}
              >
                <Ionicons name="close" size={16} color={RBZ.white} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.composerRow}>
            {!composerExpanded ? (
              <>
                <Pressable onPress={() => setPlusOpen(true)} style={styles.attachBtn}>
                  <Ionicons name="add" size={24} color={RBZ.c1} />
                </Pressable>

                <Pressable onPress={() => setCameraOpen(true)} style={styles.cameraBtn}>
                  <Ionicons name="camera" size={20} color={RBZ.c1} />
                </Pressable>

                <VoiceRecorderButton
                  onSend={(url) => {
                    sendMediaPayload({
                      type: "media",
                      mediaType: "audio",
                      url,
                    });
                  }}
                />
              </>
            ) : (
              <Pressable
                onPress={() => setComposerActionsOpen((v) => !v)}
                style={styles.expandActionsBtn}
                hitSlop={10}
              >
                <Ionicons
                  name={composerActionsOpen ? "chevron-forward" : "chevron-back"}
                  size={18}
                  color={RBZ.c1}
                />
              </Pressable>
            )}

            <View style={[styles.inputWrap, composerExpanded ? styles.inputWrapExpanded : null]}>
              {composerExpanded && composerActionsOpen ? (
                <View style={styles.inlineActionsRow}>
                  <Pressable onPress={() => setPlusOpen(true)} style={styles.inlineActionBtn}>
                    <Ionicons name="add" size={22} color={RBZ.c1} />
                  </Pressable>

                  <Pressable onPress={() => setCameraOpen(true)} style={styles.inlineActionBtn}>
                    <Ionicons name="camera" size={18} color={RBZ.c1} />
                  </Pressable>

                  <View style={styles.inlineVoiceWrap}>
                    <VoiceRecorderButton
                      onSend={(url) => {
                        sendMediaPayload({
                          type: "media",
                          mediaType: "audio",
                          url,
                        });
                      }}
                    />
                  </View>
                </View>
              ) : null}

              <TextInput
                value={text}
                onChangeText={(t) => {
                  setText(t);

                  if (!composerExpanded) {
                    setComposerExpanded(true);
                  }

                  if (!isTypingRef.current) {
                    isTypingRef.current = true;
                    emitTyping(true);
                  }

                  if (typingStopRef.current) clearTimeout(typingStopRef.current);
                  typingStopRef.current = setTimeout(() => {
                    isTypingRef.current = false;
                    emitTyping(false);
                  }, 1200);
                }}
                  onFocus={() => {
                  setComposerExpanded(true);
                  settleToLatest(false);
                }}
                onBlur={() => {
                  if (isTypingRef.current) {
                    isTypingRef.current = false;
                    emitTyping(false);
                  }

                  if (!String(text || "").trim()) {
                    setComposerExpanded(false);
                    setComposerActionsOpen(false);
                    setInputHeight(44);
                  }
                }}
                onContentSizeChange={(e) => {
                  const next = Math.max(
                    44,
                    Math.min(120, Math.ceil(e.nativeEvent.contentSize.height))
                  );
                  setInputHeight(next);
                }}
                placeholder="Message..."
                placeholderTextColor={RBZ.gray}
                style={[styles.input, styles.inputMultiline, { height: inputHeight }]}
                multiline
                scrollEnabled
                textAlignVertical="top"
                blurOnSubmit={false}
              />

              <Pressable onPress={send} style={styles.sendBtn}>
                <Ionicons name="send" size={18} color={RBZ.white} />
              </Pressable>
            </View>
          </View>
        </View>

        {showScrollBtns ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.scrollBtnsWrap,
              { bottom: 90 + insets.bottom },
            ]}
          >
            <Pressable onPress={scrollToTop} style={styles.scrollBtn}>
              <Ionicons name="chevron-up" size={18} color={RBZ.white} />
            </Pressable>

            <Pressable onPress={() => scrollToLatest(true)} style={styles.scrollBtn}>
              <Ionicons name="chevron-down" size={18} color={RBZ.white} />
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
{plusOpen ? (
<ChatPlusModal
  visible={plusOpen}
  onClose={() => setPlusOpen(false)}
  onSendPayload={async (p) => {
    const url = await uploadToCloudinaryUnsigned(
      p.localUri,
      p.mediaType === "video" ? "video" : "image"
    );

    const payloadObj = {
      type: "media",
      url,
      mediaType: p.mediaType,
      ephemeral: p.ephemeral,
      gift: p.gift,
      overlayText: p.overlayText || "",
    };

    await sendMediaPayload(payloadObj);
  }}
/>
) : null}

{cameraOpen ? (
<ChatCameraModal
  visible={cameraOpen}
  onClose={() => setCameraOpen(false)}
  onCaptured={async (items) => {
    // Only one item for now
    const item = items[0];
    if (!item) return;

    try {
      const url = await uploadToCloudinaryUnsigned(
        item.uri,
        item.mediaType === "video" ? "video" : "image"
      );

      const maxViews =
  item.visibility === "once" ? 1 : item.visibility === "twice" ? 2 : undefined;

await sendMediaPayload({
  type: "media",
  url,
  mediaType: item.mediaType,

  // ✅ visibility mode used by your existing getMaxViews()
  ephemeral: maxViews ? { maxViews, mode: item.visibility } : undefined,

  // ✅ preview tools payload
  overlayText: item.overlayText || "",
  drawing: item.drawing || undefined,
});

    } catch {
      Alert.alert("Camera", "Failed to send photo");
    } 
    finally {
      setCameraOpen(false);
    }
  }}
/>
) : null}

<MediaViewer
  visible={viewerOpen}
  uri={viewerMsg?.url || ""}
  mediaType={viewerMsg?.mediaType === "video" ? "video" : "image"}
  maxViews={getMaxViews(viewerMsg)}
  allowDownload={!IS_EXPO_GO && !getMaxViews(viewerMsg)}
  onClose={() => {
    // ✅ consume ONLY when viewer is closed
    if (viewerMsg && getMaxViews(viewerMsg)) {
      consumeEphemeralView(viewerMsg);
    }
    closeViewer();
  }}
/>

      {/* ✨ Reply Ideas */}
      <Modal
        visible={replyIdeasOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setReplyIdeasOpen(false)}
      >
        <Pressable
          style={styles.replyIdeasOverlay}
          onPress={() => setReplyIdeasOpen(false)}
        >
          <Pressable
            style={styles.replyIdeasSheet}
            onPress={() => {}}
          >
                   <View style={styles.replyIdeasHeader}>
              <Text style={styles.replyIdeasTitle}>Reply Ideas</Text>
              <Pressable onPress={() => setReplyIdeasOpen(false)}>
                <Ionicons name="close" size={20} color={RBZ.ink} />
              </Pressable>
            </View>

            <View style={styles.replyModeRow}>
              <Pressable
                style={styles.replyModeChip}
                onPress={() => loadReplyIdeas("natural")}
              >
                <Text style={styles.replyModeChipText}>Natural</Text>
              </Pressable>

              <Pressable
                style={styles.replyModeChip}
                onPress={() => loadReplyIdeas("flirty")}
              >
                <Text style={styles.replyModeChipText}>Flirty</Text>
              </Pressable>

              <Pressable
                style={styles.replyModeChip}
                onPress={() => loadReplyIdeas("funny")}
              >
                <Text style={styles.replyModeChipText}>Funny</Text>
              </Pressable>

              <Pressable
                style={styles.replyModeChip}
                onPress={() => loadReplyIdeas("safe")}
              >
                <Text style={styles.replyModeChipText}>Safe</Text>
              </Pressable>
            </View>

            {replyIdeasLoading ? (
              <View style={styles.replyIdeasLoadingWrap}>
                <Text style={styles.replyIdeasLoadingText}>Loading ideas…</Text>
              </View>
            ) : null}

            {!!replyIdeasError ? (
              <Text style={styles.replyIdeasErrorText}>{replyIdeasError}</Text>
            ) : null}

            <View style={styles.replyIdeasList}>
              {replyIdeas.map((idea) => (
                <Pressable
                  key={idea.id}
                  style={styles.replyIdeaCard}
                  onPress={() => applyReplyIdea(idea.text)}
                >
                  <Text style={styles.replyIdeaTone}>
                    {String(idea.tone || "idea").toUpperCase()}
                  </Text>
                  <Text style={styles.replyIdeaText}>{idea.text}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Action Sheet */}
      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={closeSheet}>
        <Pressable style={styles.sheetOverlay} onPress={closeSheet}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Message</Text>

            <View style={styles.emojiRow}>
              {["❤️", "😂", "😮", "😢", "🔥"].map((e) => (
                <Pressable
                  key={e}
                  style={styles.emojiBtn}
                  onPress={() => sheetMsg && reactTo(sheetMsg, e)}
                >
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sheetDivider} />

            {sheetMsg && mine(sheetMsg) ? (
              <>
                <Pressable style={styles.sheetItem} onPress={() => startEdit(sheetMsg)}>
                  <Ionicons name="pencil-outline" size={18} color={RBZ.ink} />
                  <Text style={styles.sheetItemText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.sheetItem}
                  onPress={() =>
                    Alert.alert("Unsend", "Unsend for everyone?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Unsend for all", style: "destructive", onPress: () => unsendForAll(sheetMsg) },
                    ])
                  }
                >
                  <Ionicons name="trash-outline" size={18} color={RBZ.ink} />
                  <Text style={styles.sheetItemText}>Unsend for all</Text>
                </Pressable>
              </>
            ) : null}

            <Pressable
              style={styles.sheetItem}
              onPress={() =>
                sheetMsg &&
                Alert.alert("Remove", "Remove message for you?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Remove", style: "destructive", onPress: () => unsendForMe(sheetMsg) },
                ])
              }
            >
              <Ionicons name="eye-off-outline" size={18} color={RBZ.ink} />
              <Text style={styles.sheetItemText}>Remove for me</Text>
            </Pressable>

            <Pressable style={[styles.sheetItem, { justifyContent: "center" }]} onPress={closeSheet}>
              <Text style={[styles.sheetItemText, { color: RBZ.c2, fontWeight: "900" }]}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RBZ.soft },

 topBar: {
  paddingTop: 16,
  paddingBottom: 12,
  paddingHorizontal: 10,
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  peerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  peerAvatar: { width: 38, height: 38, borderRadius: 14, backgroundColor: RBZ.white },
  peerName: { color: RBZ.white, fontSize: 15, fontWeight: "900", maxWidth: 220 },
  peerSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 1 },
  topActions: { flexDirection: "row", gap: 8 },

  loading: { flex: 1, alignItems: "center", justifyContent: "center" },

bubbleRow: {
  marginBottom: 4, // ✅ tight like Instagram
  flexDirection: "row",
  alignItems: "flex-start",
  overflow: "visible",
},


  rowMine: {
  justifyContent: "flex-end",
},
rowPeer: {
  justifyContent: "flex-start",
},


bubble: {
  maxWidth: BUBBLE_MAX_W,
  minWidth: 44,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: RBZ.line,
  position: "relative",     // ✅ anchor for reactions
  overflow: "visible",
  flexShrink: 0,
},


  mine: { backgroundColor: RBZ.c2, borderTopRightRadius: 6 },
  peer: { backgroundColor: RBZ.white, borderTopLeftRadius: 6 },

  msgText: { fontSize: 14, lineHeight: 19 },
  mineText: { color: RBZ.white, fontWeight: "700" },
  peerText: { color: RBZ.ink, fontWeight: "700" },

reacts: { marginTop: 6, fontSize: 13 },
seenLabel: { marginTop: 6, fontSize: 12, color: RBZ.gray, alignSelf: "flex-end" },

   composer: {
  backgroundColor: RBZ.white,
  borderTopWidth: 1,
  borderTopColor: RBZ.line,
  paddingHorizontal: 10,
  paddingTop: 6,
  paddingBottom: 8,
  flexShrink: 0,
},

typingBarWrap: {
  paddingHorizontal: 12,
  paddingTop: 6,
  paddingBottom: 4,
  backgroundColor: RBZ.soft,
},

typingBar: {
  alignSelf: "flex-start",
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: RBZ.white,
  borderWidth: 1,
  borderColor: RBZ.line,
},

typingDot: {
  width: 8,
  height: 8,
  borderRadius: 999,
  backgroundColor: RBZ.c2,
},

typingBarText: {
  fontSize: 12,
  fontWeight: "800",
  color: RBZ.gray,
},

  editChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: RBZ.c1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 8,
  },
  editChipText: { color: RBZ.white, fontWeight: "900", fontSize: 12 },

 composerRow: {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 10,
},

inputWrap: {
  flex: 1,
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 8,
},

inputWrapExpanded: {
  flex: 1,
},

attachBtn: {
  width: 40,
  height: 40,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(181,23,158,0.10)",
},

cameraBtn: {
  width: 40,
  height: 40,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(181,23,158,0.10)",
},

   input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RBZ.line,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 11,
    color: RBZ.ink,
    backgroundColor: RBZ.soft,
    fontSize: 14,
    fontWeight: "700",
  },

  inputMultiline: {
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
  },

  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: 12,
  },
  sheet: {
    backgroundColor: RBZ.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  sheetTitle: { fontSize: 14, fontWeight: "900", color: RBZ.ink, marginBottom: 8 },
  emojiRow: { flexDirection: "row", gap: 10, paddingBottom: 8 },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  tinyAvatarBtn: {
  width: 26,
  height: 26,
  borderRadius: 13,
  marginRight: 8,
  marginTop: 2,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
},
tinyAvatar: {
  width: 26,
  height: 26,
  borderRadius: 13,
},

metaRow: {
  flexDirection: "row",
  gap: 10,
  marginTop: 6,
},
metaMine: { alignSelf: "flex-end" },
metaPeer: { alignSelf: "flex-start" },

metaLabel: {
  fontSize: 12,
  color: RBZ.gray,
  fontWeight: "700",
},
// ✅ Wrap each message content so reactions can "hang" 
msgWrap: {
  position: "relative",
  alignSelf: "flex-start",
  overflow: "visible",
},
msgWrapMine: {
  alignSelf: "flex-end",
},
msgWrapPeer: {
  alignSelf: "flex-start",
},
// add space under the bubble ONLY when reaction exists (so it doesn't collide with meta row)
msgWrapWithReact: {
  marginBottom: 14,
},

// ✅ Rombuzz-style reaction pill (overlapping bubble edge)
reactionPill: {
  position: "absolute",
  bottom: -10, // hangs outside bubble edge
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.12)",
  // ✅ keep it above bubble/media so it's tappable
  zIndex: 50,
  elevation: 6,
},
reactionPillMine: {
  right: -6,
},
reactionPillPeer: {
  right: -6,
},

reactText: {
  fontSize: 12,
  fontWeight: "800",
},
mediaWrap: {
  marginVertical: 6,
  borderRadius: 18,
  overflow: "hidden",
  backgroundColor: "#000",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.10)",
  maxWidth: BUBBLE_MAX_W,
},

mediaMine: {
  alignSelf: "flex-end",
},

mediaPeer: {
  alignSelf: "flex-start",
},

mediaThumb: {
  width: "100%",
  aspectRatio: 3 / 4,
},
mediaBlur: {
  opacity: 0.15,
},
mediaOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0,0,0,0.35)",
  alignItems: "center",
  justifyContent: "center",
},
mediaOverlayText: {
  color: RBZ.white,
  fontSize: 14,
  fontWeight: "900",
},

videoPlayOverlay: {
  ...StyleSheet.absoluteFillObject,
  alignItems: "center",
  justifyContent: "center",
},

videoPlayBadge: {
  width: 54,
  height: 54,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0,0,0,0.45)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.22)",
},

viewBadge: {
  position: "absolute",
  left: 10,
  bottom: 10,
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 10,
  height: 30,
  borderRadius: 15,
  backgroundColor: "rgba(0,0,0,0.55)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.14)",
},

viewBadgeText: {
  color: RBZ.white,
  fontSize: 12,
  fontWeight: "900",
},

heartBurst: {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  alignItems: "center",
  justifyContent: "center",
},
focusRing: {
  borderWidth: 2,
  borderColor: "rgba(181,23,158,0.55)", // RBZ c4 glow
  backgroundColor: "rgba(181,23,158,0.06)",
  borderRadius: 18,
  padding: 4,
},
systemBubble: {
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: "rgba(0,0,0,0.06)",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.10)",
},
systemText: {
  fontSize: 12,
  fontWeight: "800",
  color: RBZ.gray,
},
scrollBtnsWrap: {
  position: "absolute",
  right: 14,
  gap: 10,
  alignItems: "center",
},

scrollBtn: {
  width: 34,
  height: 34,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: RBZ.c1,
  borderWidth: 1,
  borderColor: "rgba(243, 199, 5, 0.35)",
  elevation: 3,
},

replyIdeasOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.35)",
  justifyContent: "flex-end",
},

replyIdeasSheet: {
  backgroundColor: RBZ.white,
  borderTopLeftRadius: 22,
  borderTopRightRadius: 22,
  paddingHorizontal: 14,
  paddingTop: 14,
  paddingBottom: 18,
  borderTopWidth: 1,
  borderColor: RBZ.line,
  maxHeight: "72%",
},

replyIdeasHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
},

replyIdeasTitle: {
  fontSize: 16,
  fontWeight: "900",
  color: RBZ.ink,
},

replyModeRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 12,
},

replyModeChip: {
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: RBZ.soft,
  borderWidth: 1,
  borderColor: RBZ.line,
},

replyModeChipText: {
  fontSize: 12,
  fontWeight: "800",
  color: RBZ.ink,
},

replyIdeasLoadingWrap: {
  paddingVertical: 10,
},

replyIdeasLoadingText: {
  fontSize: 13,
  fontWeight: "700",
  color: RBZ.gray,
},

replyIdeasErrorText: {
  fontSize: 12,
  fontWeight: "700",
  color: RBZ.c1,
  marginBottom: 10,
},

replyIdeasList: {
  gap: 10,
},

replyIdeaCard: {
  borderRadius: 16,
  borderWidth: 1,
  borderColor: RBZ.line,
  backgroundColor: RBZ.soft,
  paddingHorizontal: 12,
  paddingVertical: 12,
},

replyIdeaTone: {
  fontSize: 11,
  fontWeight: "900",
  color: RBZ.c4,
  marginBottom: 6,
},

replyIdeaText: {
  fontSize: 14,
  lineHeight: 20,
  fontWeight: "700",
  color: RBZ.ink,
},
expandActionsBtn: {
  width: 34,
  height: 34,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(181,23,158,0.10)",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
},

inlineActionsRow: {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 8,
  paddingRight: 6,
},

inlineActionBtn: {
  width: 34,
  height: 34,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(181,23,158,0.10)",
},

inlineVoiceWrap: {
  width: 40, // gives the VoiceRecorderButton a stable space
  alignItems: "center",
  justifyContent: "center",
},

  sheetDivider: { height: 1, backgroundColor: RBZ.line, marginVertical: 10 },
  sheetItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  sheetItemText: { fontSize: 14, fontWeight: "800", color: RBZ.ink },
});

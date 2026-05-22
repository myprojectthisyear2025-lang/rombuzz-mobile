/**
 * ============================================================
 * 📁 File: app/(tabs)/_layout.tsx
 * 🎯 RomBuzz Mobile — Persistent Bottom Bar (Always Visible)
 *
 * Visible Tabs (left → right):
 *  - Home (RomBuzz logo)
 *  - Chat (glow dot, offset)
 *  - Social Stats (signature)
 *  - Notifications (badge + shake once, only if not on screen)
 *  - Profile (avatar + ring)
 *
 * Hidden routes (still inside tabs so bottom bar stays visible):
 *  - letsbuzz, discover, microbuzz, filter, upgrade
 * ============================================================
 */

import PremiumBuzzReceiverOverlay, {
  type PremiumBuzzOverlayPayload,
} from "@/src/components/buzz/PremiumBuzzReceiverOverlay";
import { API_BASE } from "@/src/config/api";
import IncomingCallOverlay from "@/src/features/videoCall/IncomingCallOverlay";
import { getSocket, onNotification } from "@/src/lib/socket";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  DeviceEventEmitter,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ============================================================
   CONSTANTS
============================================================ */

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
} as const;

const TAB_ORDER = [
  "homepage",
  "chat",
  "social-stats",
  "notifications",
  "profile",
] as const;

const SCREEN_WIDTH = Dimensions.get("window").width;
const logo = require("@/assets/images/logo.png");

/* ============================================================
   SMALL UI HELPERS
============================================================ */

function Dot({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <View style={styles.dot} />;
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : String(count)}</Text>
    </View>
  );
}

function TabIconWrap({
  children,
  active,
  accent,
}: {
  children: React.ReactNode;
  active: boolean;
  accent?: string;
}) {
  return (
    <View
      style={[
        styles.iconPill,
        active && styles.iconPillActive,
        active && accent ? { borderColor: accent } : null,
      ]}
    >
      {children}
    </View>
  );
}

/* ============================================================
   MAIN LAYOUT
============================================================ */

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  /* -------------------------------
     💎 PREMIUM BUZZ GLOBAL OVERLAY
     - Receiver sees bouncing sender avatar on any tab screen
     - User can disable this later from settings
  -------------------------------- */

  const PREMIUM_BUZZ_ANIMATIONS_KEY = "RBZ_PREMIUM_BUZZ_ANIMATIONS_ENABLED";

  const [premiumBuzzOverlayPayload, setPremiumBuzzOverlayPayload] =
    useState<PremiumBuzzOverlayPayload | null>(null);

  const [premiumBuzzOverlayVisible, setPremiumBuzzOverlayVisible] =
    useState(false);

  /* -------------------------------
     ROUTE AWARE SWIPE ENABLE
  -------------------------------- */

  const tabName = segments?.[1] ?? null;

  /* -------------------------------
     ✅ CHAT UNREAD TOTAL (BOTTOM BADGE)
     Rules:
      - increments in real time (from chat.tsx socket bump)
      - resets when Chat tab is tapped
      - still increments while on Chat tab
      - resets when leaving Chat tab
  -------------------------------- */

   const UNREAD_TOTAL_KEY = "RBZ_unread_total";
  const UNREAD_MAP_KEY = "RBZ_unread_map";

  const [chatUnreadTotal, setChatUnreadTotal] = useState(0);
  const prevTabRef = useRef<string | null>(null);

   // ✅ Bottom layout owns live chat unread now.
  // Do NOT depend on chat.tsx being mounted.
  const chatUnreadSeenIdsRef = useRef<Record<string, number>>({});
  const chatUnreadSyncTimerRef = useRef<any>(null);

  // ✅ Active chat thread guard.
  // If Tom is already inside Kylie thread, Kylie messages should NOT bump layout badge.
  const activeChatPeerRef = useRef<string | null>(null);

  // ✅ Unique pulse animation for Chat tab (every 3 sec when unread > 0)
  const chatPulse = useRef(new Animated.Value(0)).current;
  const pulseTimerRef = useRef<any>(null);

  const publishChatUnreadTotal = async (total: number) => {
    const safeTotal = Math.max(0, Number(total || 0) || 0);

    setChatUnreadTotal(safeTotal);

    try {
      await SecureStore.setItemAsync(UNREAD_TOTAL_KEY, String(safeTotal));
    } catch {}

    try {
      DeviceEventEmitter.emit("rbz:unread:total", { total: safeTotal });
    } catch {}
  };

   const applyChatUnreadSummary = async (summary: any) => {
    const rawByPeer =
      summary?.byPeer && typeof summary.byPeer === "object" ? summary.byPeer : {};

    const safeByPeer: Record<string, number> = {};
    Object.keys(rawByPeer || {}).forEach((k) => {
      safeByPeer[String(k)] = Math.max(0, Number(rawByPeer[k] || 0) || 0);
    });

    // ✅ If user is already inside a peer thread, do not show unread for that peer.
    const activePeer = activeChatPeerRef.current;
    if (activePeer && safeByPeer[activePeer]) {
      delete safeByPeer[activePeer];
    }

    // ✅ Recalculate total from filtered peer map.
    // Do not blindly trust summary.total because it may include the active open thread.
    const total = Object.values(safeByPeer).reduce((sum, n) => {
      return sum + Math.max(0, Number(n || 0) || 0);
    }, 0);

    try {
      await SecureStore.setItemAsync(UNREAD_MAP_KEY, JSON.stringify(safeByPeer));
      await SecureStore.setItemAsync(UNREAD_TOTAL_KEY, String(total));
    } catch {}

    setChatUnreadTotal(total);

    try {
      DeviceEventEmitter.emit("rbz:unread:total", { total });
      DeviceEventEmitter.emit("rbz:unread:summary", {
        total,
        byPeer: safeByPeer,
      });
    } catch {}
  };

  const fetchChatUnreadSummary = async () => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      if (!token) return;

      const r = await fetch(`${API_BASE}/chat/unread-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await r.json().catch(() => ({}));
      await applyChatUnreadSummary({
        total: Number(j?.total || 0) || 0,
        byPeer: j?.byPeer && typeof j.byPeer === "object" ? j.byPeer : {},
      });
    } catch {}
  };

  const runChatPulseOnce = () => {
    chatPulse.stopAnimation();
    chatPulse.setValue(0);

    Animated.sequence([
      Animated.timing(chatPulse, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(chatPulse, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ✅ Start/stop pulse loop based on unread
  useEffect(() => {
    // stop any existing timer
    if (pulseTimerRef.current) {
      clearInterval(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }

    // reset visual state when no unread
    if (!chatUnreadTotal) {
      chatPulse.stopAnimation();
      chatPulse.setValue(0);
      return;
    }

    // unread exists → pulse now + every 3 seconds
    runChatPulseOnce();
    pulseTimerRef.current = setInterval(runChatPulseOnce, 3000);

    return () => {
      if (pulseTimerRef.current) {
        clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatUnreadTotal]);

   // ✅ Load cached total + server truth + live local events
  useEffect(() => {
    let alive = true;

    const load = async () => {
      const raw = await SecureStore.getItemAsync(UNREAD_TOTAL_KEY);
      const n = Number(raw || 0) || 0;

      if (!alive) return;
      setChatUnreadTotal(n);

      // ✅ Then server truth, so badge is correct even after cold start.
      fetchChatUnreadSummary();
    };

    const totalSub = DeviceEventEmitter.addListener(
      "rbz:unread:total",
      (payload: any) => {
        const total = Number(payload?.total ?? 0) || 0;
        setChatUnreadTotal(Math.max(0, total));
      }
    );

    const summarySub = DeviceEventEmitter.addListener(
      "rbz:unread:summary",
      (payload: any) => {
        const total = Number(payload?.total ?? 0) || 0;
        setChatUnreadTotal(Math.max(0, total));
      }
    );

    load();

    return () => {
      alive = false;
      totalSub.remove();
      summarySub.remove();
    };
  }, []);

  // ✅ Track which chat thread is currently open.
  // Thread screen should emit:
  // DeviceEventEmitter.emit("rbz:chat:active", { peerId })
  // DeviceEventEmitter.emit("rbz:chat:active", { peerId: null }) on leave
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("rbz:chat:active", (payload: any) => {
      const peerId = String(payload?.peerId || "");
      activeChatPeerRef.current = peerId || null;
    });

    return () => sub.remove();
  }, []);

  // ✅ Persistent bottom bar socket listener.
  // This is the important fix:
  // _layout.tsx stays mounted, so the chat badge updates even when user is NOT on chat.tsx.
  useEffect(() => {
    let alive = true;
    let s: any;

    const getMyId = async () => {
      try {
        const raw = await SecureStore.getItemAsync("RBZ_USER");
        const u = raw ? JSON.parse(raw) : null;
        return String(u?.id || u?._id || "");
      } catch {
        return "";
      }
    };

    const scheduleServerSync = () => {
      if (chatUnreadSyncTimerRef.current) {
        clearTimeout(chatUnreadSyncTimerRef.current);
      }

      chatUnreadSyncTimerRef.current = setTimeout(() => {
        fetchChatUnreadSummary();
      }, 650);
    };

    const onUnreadUpdate = async (summary: any) => {
      await applyChatUnreadSummary(summary);
    };

       const onIncomingMessage = async (raw: any) => {
      const msg = raw?.message ? raw.message : raw;
      const msgId = String(msg?.id || "");
      if (!msgId) return;

      const fromId = String(
        msg?.from || msg?.fromId || msg?.senderId || msg?.userId || ""
      );

      const myId = await getMyId();
      if (!myId || !fromId) return;

      // ✅ Do not count your own outgoing message.
      if (String(fromId) === String(myId)) return;

      // ✅ If Tom is already inside Kylie thread, Kylie messages are read/live.
      // Do NOT bump bottom layout count.
      if (
        activeChatPeerRef.current &&
        String(activeChatPeerRef.current) === String(fromId)
      ) {
        scheduleServerSync();
        return;
      }

      // ✅ Dedupe same incoming message from chat:message + direct:message.
      const now = Date.now();
      const last = chatUnreadSeenIdsRef.current[msgId] || 0;
      if (now - last < 8000) return;

      chatUnreadSeenIdsRef.current[msgId] = now;

      Object.keys(chatUnreadSeenIdsRef.current).forEach((k) => {
        if (now - (chatUnreadSeenIdsRef.current[k] || 0) > 8000) {
          delete chatUnreadSeenIdsRef.current[k];
        }
      });

      // ✅ Optimistic instant bottom badge.
      setChatUnreadTotal((prev) => {
        const next = Math.max(0, Number(prev || 0) + 1);

        SecureStore.setItemAsync(UNREAD_TOTAL_KEY, String(next)).catch(() => {});
        DeviceEventEmitter.emit("rbz:unread:total", { total: next });

        return next;
      });

      // ✅ Server truth shortly after.
      scheduleServerSync();
    };

    (async () => {
      s = await getSocket();
      if (!alive || !s) return;

      const myId = await getMyId();

      try {
        if (myId) {
          s.emit("register", myId);
          s.emit("user:register", myId);
        }
      } catch {}

      s.on("chat:unread:update", onUnreadUpdate);
      s.on("chat:message", onIncomingMessage);
      s.on("direct:message", onIncomingMessage);

      // ✅ Fresh server truth when socket connects/reconnects.
      s.on("connect", fetchChatUnreadSummary);

      fetchChatUnreadSummary();
    })();

    return () => {
      alive = false;

      if (chatUnreadSyncTimerRef.current) {
        clearTimeout(chatUnreadSyncTimerRef.current);
        chatUnreadSyncTimerRef.current = null;
      }

      if (!s) return;

      s.off("chat:unread:update", onUnreadUpdate);
      s.off("chat:message", onIncomingMessage);
      s.off("direct:message", onIncomingMessage);
      s.off("connect", fetchChatUnreadSummary);
    };
  }, []);

  // ✅ Foreground sync: if app wakes up, fetch real unread count.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        fetchChatUnreadSummary();
      }
    });

    return () => sub.remove();
  }, []);


   // ✅ Server-accurate unread: do NOT auto-reset when leaving Chat tab.
  useEffect(() => {
    const curr = tabName ? String(tabName) : null;
    prevTabRef.current = curr;
  }, [segments?.join("/")]);
  const isRootTab =
    segments?.[0] === "(tabs)" &&
    segments.length === 2 &&
    TAB_ORDER.includes(tabName as any);

  const currentIndex = TAB_ORDER.indexOf(tabName as any);

  /* -------------------------------
     PROFILE DATA
  -------------------------------- */

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0.55);

 useEffect(() => {
  let alive = true;

  const loadTabProfile = async () => {
    const raw = await SecureStore.getItemAsync("RBZ_USER");
    if (!alive || !raw) return;

    try {
      const u = JSON.parse(raw);

      setProfilePhoto(
        u?.avatar ||
          u?.avatarUrl ||
          u?.photoUrl ||
          u?.profilePic ||
          u?.photos?.[0] ||
          null
      );

      let score = 0;
      if (u?.firstName) score += 0.15;
      if (u?.bio) score += 0.15;
      if (u?.photos?.length >= 2) score += 0.25;
      if (u?.gender && u?.lookingFor) score += 0.15;
      setProfileCompletion(Math.min(1, Math.max(0.25, score)));
    } catch {}
  };

  // ✅ Load once now
  loadTabProfile();

  // ✅ And re-load whenever the active tab changes (instant UI update)
  // segments changes when you navigate tabs/routes
  // This keeps the avatar/ring fresh without slowing the UI.
  // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
    alive = false;
  };
}, [segments?.join("/")]);


  /* -------------------------------
     ✅ NOTIFICATIONS UNREAD (BOTTOM BADGE)
     Uses same source/logic as notifications.tsx:
      - GET /notifications
      - unread = count where read === false
      - realtime bump from socket ("notification")
  -------------------------------- */

  type NotificationItem = {
    id?: string;
    read?: boolean;
    type?: string;
    createdAt?: string;
  };

  const [notifToken, setNotifToken] = useState("");
  const [notifUnreadTotal, setNotifUnreadTotal] = useState(0);
  const seenNotifIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const t = (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";
      setNotifToken(t);
    })();
  }, []);

  const fetchNotifUnreadTotal = async () => {
    if (!notifToken) return;
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${notifToken}` },
      });
      const data = await res.json().catch(() => []);
      if (!Array.isArray(data)) {
        setNotifUnreadTotal(0);
        return;
      }

      for (const n of data as NotificationItem[]) {
        if (n?.id) seenNotifIds.current.add(n.id);
      }

      const unread = (data as NotificationItem[]).reduce((acc, n) => {
        return !n?.read ? acc + 1 : acc;
      }, 0);

      setNotifUnreadTotal(unread);
    } catch {
      setNotifUnreadTotal(0);
    }
  };

  // refresh on token load + any tab change (so it updates after reading notifications)
  useEffect(() => {
    if (!notifToken) return;
    fetchNotifUnreadTotal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifToken, tabName]);

   // realtime bump
  useEffect(() => {
    if (!notifToken) return;

    let unsub: null | (() => void) = null;

    (async () => {
      await getSocket();
      unsub = onNotification((n: NotificationItem) => {
        if (!n?.id) return;
        if (seenNotifIds.current.has(n.id)) return;
        seenNotifIds.current.add(n.id);

        // if backend sends read=false (or missing), treat as unread
        if (!n.read) setNotifUnreadTotal((c) => c + 1);
      });
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [notifToken]);

  // ✅ Premium Buzz receiver animation.
  // Backend emits this after paid Buzz succeeds:
  // socket.emit("premium_buzz:received", payload)
  useEffect(() => {
    let alive = true;
    let s: any;

    const isPremiumBuzzAnimationEnabled = async () => {
      try {
        const raw = await SecureStore.getItemAsync(PREMIUM_BUZZ_ANIMATIONS_KEY);

        // Default ON. Only exact "false" disables it.
        return raw !== "false";
      } catch {
        return true;
      }
    };

    const onPremiumBuzzReceived = async (payload: any) => {
      if (!payload) return;

      const enabled = await isPremiumBuzzAnimationEnabled();
      if (!enabled) return;

      const senderId = String(
        payload?.senderId || payload?.fromId || payload?.userId || ""
      );

      if (!senderId) return;
      if (!alive) return;

      setPremiumBuzzOverlayPayload({
        buzzTypeId: String(
          payload?.buzzTypeId || payload?.buzzType || payload?.animationKey || ""
        ),
        senderId,
        senderName: String(payload?.senderName || payload?.fromName || "Someone"),
        senderAvatar: String(payload?.senderAvatar || payload?.avatar || ""),
      });

      setPremiumBuzzOverlayVisible(true);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    };

    (async () => {
      s = await getSocket();
      if (!alive || !s) return;

      s.on("premium_buzz:received", onPremiumBuzzReceived);
    })();

    return () => {
      alive = false;

      if (!s) return;
      s.off("premium_buzz:received", onPremiumBuzzReceived);
    };
  }, []);

  /* -------------------------------
     NOTIFICATION SHAKE (UNCHANGED)
  -------------------------------- */

  const shake = useRef(new Animated.Value(0)).current;


  /* -------------------------------
     SWIPE HANDLER (NO ANIMATION)
  -------------------------------- */

  const onSwipeEnd = ({ nativeEvent }: any) => {
    if (!isRootTab) return;
    if (nativeEvent.state !== State.END) return;

    const { translationX, velocityX } = nativeEvent;

    const distanceOK = Math.abs(translationX) > SCREEN_WIDTH * 0.22;
    const velocityOK = Math.abs(velocityX) > 900;

    if (!distanceOK && !velocityOK) return;

    // Swipe left → next
    if (translationX < 0 && currentIndex < TAB_ORDER.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/(tabs)/${TAB_ORDER[currentIndex + 1]}`);
      return;
    }

    // Swipe right → prev
    if (translationX > 0 && currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/(tabs)/${TAB_ORDER[currentIndex - 1]}`);
    }
  };

  /* ============================================================
     TABS UI
  ============================================================ */

  const TabsContent = (
   <Tabs
  initialRouteName="homepage"
  screenOptions={{
    headerShown: false,
    tabBarShowLabel: false,

    // ✅keep tabs mounted so heavy screens render instantly on return

    tabBarStyle: {
      backgroundColor: RBZ.c1,
      borderTopColor: RBZ.c3,
      borderTopWidth: 1,
      height: 72 + insets.bottom,
      paddingBottom: 10 + insets.bottom,
      paddingTop: 10,
    },
  }}
>

      <Tabs.Screen
        name="homepage"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIconWrap active={focused}>
              <Image source={logo} style={styles.logoIcon} />
            </TabIconWrap>
          ),
        }}
      />
           <Tabs.Screen
        name="chat"
        options={{
          // ✅ Do NOT clear unread when user only opens the Chat tab.
          // Per-person unread badges must stay visible in the chat list.
          // Unread clears only when the actual conversation thread is opened.
          tabBarButton: (props: any) => (
            <Pressable
              {...props}
              onPress={(e) => {
                props?.onPress?.(e);
              }}
            />
          ),


          tabBarIcon: ({ focused }) => (
            <TabIconWrap active={focused}>
              <View style={{ position: "relative" }}>

                {/* ✅ Pulse ring appears only when unread exists */}
                {chatUnreadTotal > 0 && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.chatPulseRing,
                      {
                        opacity: chatPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.55],
                        }),
                        transform: [
                          {
                            scale: chatPulse.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.42],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                )}

                {/* ✅ Subtle icon “breath” synced with ring */}
                        <Animated.View
                  style={{
                    transform:
                      chatUnreadTotal > 0
                        ? [
                            {
                              scale: chatPulse.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.08],
                              }),
                            },
                          ]
                        : [{ scale: 1 }],
                  }}
                >
                  <Ionicons
                    name={
                      focused
                        ? "chatbubble-ellipses"
                        : "chatbubble-ellipses-outline"
                    }
                    size={26}
                    color={focused ? RBZ.white : "rgba(255,255,255,0.65)"}
                  />
                </Animated.View>

                {/* ✅ Server-accurate unread total badge */}
                <Badge count={chatUnreadTotal} />
              </View>
            </TabIconWrap>
          ),
        }}
      />


      <Tabs.Screen
        name="social-stats"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIconWrap active={focused} accent={RBZ.c4}>
              <Ionicons
                name={focused ? "flame" : "flame-outline"}
                size={26}
                color={focused ? RBZ.white : "rgba(255,255,255,0.65)"}
              />
            </TabIconWrap>
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => {
            const rotate = shake.interpolate({
              inputRange: [-1, 1],
              outputRange: ["-10deg", "10deg"],
            });
            return (
              <TabIconWrap active={focused}>
                <Animated.View style={{ transform: [{ rotate }] }}>
                  <View style={{ position: "relative" }}>
                    <Ionicons
                      name={
                        focused
                          ? "notifications"
                          : "notifications-outline"
                      }
                      size={26}
                      color={focused ? RBZ.white : "rgba(255,255,255,0.65)"}
                    />
                    {!focused && <Badge count={notifUnreadTotal} />}
                  </View>
                </Animated.View>
              </TabIconWrap>
            );
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => {
            const ring = focused ? 3 : profileCompletion >= 0.85 ? 3 : 2;
            return (
              <TabIconWrap active={focused}>
                <View
                  style={[
                    styles.avatarRing,
                    { borderWidth: ring, borderColor: RBZ.c3 },
                  ]}
                >
                  {profilePhoto ? (
                    <Image
                      source={{ uri: profilePhoto }}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <Ionicons
                      name="person"
                      size={22}
                      color={
                        focused ? RBZ.white : "rgba(255,255,255,0.65)"
                      }
                    />
                  )}
                </View>
              </TabIconWrap>
            );
          },
        }}
      />

      {/* HIDDEN ROUTES */}
      <Tabs.Screen name="letsbuzz" options={{ href: null }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="microbuzz" options={{ href: null }} />
      <Tabs.Screen name="filter" options={{ href: null }} />
      <Tabs.Screen name="upgrade" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="user/[id]" options={{ href: null }} />
      <Tabs.Screen name="discover-profile" options={{ href: null }} />
      <Tabs.Screen name="view-profile" options={{ href: null }} />
    </Tabs>
  );

  /* ============================================================
     FINAL RENDER
  ============================================================ */

    const PremiumBuzzOverlayNode = (
    <PremiumBuzzReceiverOverlay
      visible={premiumBuzzOverlayVisible}
      payload={premiumBuzzOverlayPayload}
      onClose={() => {
        setPremiumBuzzOverlayVisible(false);
        setPremiumBuzzOverlayPayload(null);
      }}
    />
  );

     // ❌ No swipe outside root tabs
  if (!isRootTab) {
    return (
      <View style={{ flex: 1 }}>
        {TabsContent}
        {PremiumBuzzOverlayNode}
        <IncomingCallOverlay />
      </View>
    );
  }

  // ✅ Swipe only on root tabs
   return (
    <PanGestureHandler
      onHandlerStateChange={onSwipeEnd}
      activeOffsetX={[-18, 18]}
      failOffsetY={[-12, 12]}
    >
      <View style={{ flex: 1 }}>
        {TabsContent}
        {PremiumBuzzOverlayNode}
        <IncomingCallOverlay />
      </View>
    </PanGestureHandler>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  iconPill: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
    borderWidth: 1,
    borderColor: RBZ.c3,
    marginTop: 4,
  },
  iconPillActive: {
    shadowColor: RBZ.c3,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
    dotWrap: {
    position: "absolute",
    right: -2,
    top: 2,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: RBZ.c3,
    borderWidth: 1,
    borderColor: RBZ.c1,
  },

  // ✅ Chat pulse ring (unique unread indicator — no count)
  chatPulseRing: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: RBZ.c3,
  },

  badge: {
    position: "absolute",
    right: -10,
    top: -8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c3,
    borderWidth: 1,
    borderColor: RBZ.c1,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 11,
  },
  avatarRing: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: RBZ.c1,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
});

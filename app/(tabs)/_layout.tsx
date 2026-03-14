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

import { API_BASE } from "@/src/config/api";
import { getSocket, onNotification } from "@/src/lib/socket";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
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
  const [chatUnreadTotal, setChatUnreadTotal] = useState(0);
  const prevTabRef = useRef<string | null>(null);

  // ✅ Unique pulse animation for Chat tab (every 3 sec when unread > 0)
  const chatPulse = useRef(new Animated.Value(0)).current;
  const pulseTimerRef = useRef<any>(null);

   const resetChatUnreadTotal = async () => {
    setChatUnreadTotal(0);
    try {
      await SecureStore.setItemAsync(UNREAD_TOTAL_KEY, "0");
    } catch {}

    // ✅ RN-safe event bus
    try {
      DeviceEventEmitter.emit("rbz:unread:total", { total: 0 });
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

  // Load total once + live subscribe to updates
    useEffect(() => {
    let alive = true;

    const load = async () => {
      const raw = await SecureStore.getItemAsync(UNREAD_TOTAL_KEY);
      const n = Number(raw || 0) || 0;
      if (!alive) return;
      setChatUnreadTotal(n);
    };

    const sub = DeviceEventEmitter.addListener(
      "rbz:unread:total",
      (payload: any) => {
        const total = Number(payload?.total ?? 0) || 0;
        setChatUnreadTotal(total);
      }
    );

    load();

    return () => {
      alive = false;
      sub.remove();
    };
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
          // ✅ When Chat tab is tapped, clear badge immediately (UX requirement)
            tabBarButton: (props: any) => (
            <Pressable
              {...props}
              onPress={(e) => {
                props?.onPress?.(e);

                // ✅ UX: clear badge immediately on tap
                resetChatUnreadTotal();

                // ✅ RN-safe event bus → chat list will clear + mark-all-read on server
                try {
                  DeviceEventEmitter.emit("rbz:chat:tab-opened");
                } catch {}
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

  // ❌ No swipe outside root tabs
  if (!isRootTab) {
    return <View style={{ flex: 1 }}>{TabsContent}</View>;
  }

  // ✅ Swipe only on root tabs
  return (
    <PanGestureHandler
      onHandlerStateChange={onSwipeEnd}
      activeOffsetX={[-18, 18]}
      failOffsetY={[-12, 12]}
    >
      <View style={{ flex: 1 }}>{TabsContent}</View>
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

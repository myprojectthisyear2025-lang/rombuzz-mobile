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
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import FirstSignupTour from "@/src/features/onboarding/FirstSignupTour";
import IncomingCallOverlay from "@/src/features/videoCall/IncomingCallOverlay";
import { getSocket, onNotification } from "@/src/lib/socket";
import RootBottomBar, {
  type RootTabName,
} from "@/src/navigation/RootBottomBar";
import { rbzGetAuthToken, rbzGetCurrentUser } from "@/src/performance/api/rbzApiClient";
import { useUnreadSummary } from "@/src/features/chat/unread/useUnreadSummary";
import { rbzStartupWarmup } from "@/src/performance/startup/rbzStartupWarmup";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  DeviceEventEmitter,
  Dimensions,
  StyleSheet,
  Text,
  View
} from "react-native";
//import { PanGestureHandler } from "react-native-gesture-handler";
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
  "letsbuzz",
  "social-stats",
  "chat",
  "profile",
] as const;

const SCREEN_WIDTH = Dimensions.get("window").width;

/* ============================================================
   SMALL UI HELPERS
============================================================ */

function Dot({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <View style={styles.dot} />;
}

function Badge({ count }: { count: number }) {
  const { colors } = useRomBuzzTheme();

  if (!count) return null;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.brand,
          borderColor: colors.tabBar,
        },
      ]}
    >
      <Text style={styles.badgeText}>
        {count > 99 ? "99+" : String(count)}
      </Text>
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

  const { colors } =
    useRomBuzzTheme();

  const tabIconColor = (
    focused: boolean
  ) =>
    focused
      ? colors.brand
      : colors.iconMuted;

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
     ROUTE AWARE TAB DETECTION
  -------------------------------- */

  const tabName =
    segments?.[1] === "(root)"
      ? segments?.[2] ?? null
      : segments?.[1] ?? null;

  const [letsBuzzFullscreen, setLetsBuzzFullscreen] = useState(false);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "rbz:letsbuzz:fullscreen",
      (payload: any) => {
        setLetsBuzzFullscreen(!!payload?.active);
      }
    );

    return () => sub.remove();
  }, []);

  // ✅ Batch 2 startup warmup:
  // This runs after layout mounts and never blocks tab rendering.
  useEffect(() => {
    rbzStartupWarmup().catch(() => {});
  }, []);

  // The app-level unread owner survives tab/thread navigation.
  const { total: chatUnreadTotal } = useUnreadSummary();
  const chatPulse = useRef(new Animated.Value(0)).current;
  const pulseTimerRef = useRef<any>(null);

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

  const isRootTab =
    segments?.[0] === "(tabs)" &&
    segments?.[1] === "(root)" &&
    TAB_ORDER.includes(
      tabName as any
    );

  const navigateRootTab =
    useCallback(
      (
        nextTab:
          RootTabName
      ) => {
        if (!nextTab) return;

        if (
          isRootTab &&
          tabName === nextTab
        ) {
          return;
        }

        Haptics.impactAsync(
          Haptics
            .ImpactFeedbackStyle
            .Light
        ).catch(() => {});

        router.push(
          `/(tabs)/(root)/${nextTab}` as any
        );
      },
      [
        isRootTab,
        router,
        tabName,
      ]
    );

  /* -------------------------------
     PROFILE DATA
  -------------------------------- */

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0.55);

 useEffect(() => {
  let alive = true;

   const loadTabProfile = async () => {
    if (!alive) return;

    try {
      const u = await rbzGetCurrentUser();
      if (!alive || !u) return;

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

  const NOTIF_UNREAD_TOTAL_KEY = "RBZ_notif_unread_total";

  const [notifToken, setNotifToken] = useState("");
  const [notifUnreadTotal, setNotifUnreadTotal] = useState(0);
  const seenNotifIds = useRef<Set<string>>(new Set());
  const notifUnreadFetchAtRef = useRef(0);

   useEffect(() => {
    const notifSub = DeviceEventEmitter.addListener(
      "rbz:notif:unread-total",
      (payload: any) => {
        const total = Number(payload?.total || 0) || 0;
        setNotifUnreadTotal(Math.max(0, total));
      }
    );

    (async () => {
      const cachedNotifRaw = await SecureStore.getItemAsync(NOTIF_UNREAD_TOTAL_KEY);
      const cachedNotifTotal = Number(cachedNotifRaw || 0) || 0;
      setNotifUnreadTotal(Math.max(0, cachedNotifTotal));

      const t = await rbzGetAuthToken();
      setNotifToken(t);
    })();

    return () => {
      notifSub.remove();
    };
  }, []);

   const fetchNotifUnreadTotal = async (force = false) => {
    if (!notifToken) return;

    try {
      const now = Date.now();

      // ✅ PERF: do not fetch the entire notifications list on every tab movement.
      if (!force && now - notifUnreadFetchAtRef.current < 60_000) return;
      notifUnreadFetchAtRef.current = now;

      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${notifToken}` },
      });
      const data = await res.json().catch(() => []);
      if (!Array.isArray(data)) {
        setNotifUnreadTotal(0);
        await SecureStore.setItemAsync(NOTIF_UNREAD_TOTAL_KEY, "0").catch(() => {});
        return;
      }

      for (const n of data as NotificationItem[]) {
        if (n?.id) seenNotifIds.current.add(n.id);
      }

      const unread = (data as NotificationItem[]).reduce((acc, n) => {
        return !n?.read ? acc + 1 : acc;
      }, 0);

      const safeUnread = Math.max(0, unread);

      setNotifUnreadTotal(safeUnread);

      await SecureStore.setItemAsync(
        NOTIF_UNREAD_TOTAL_KEY,
        String(safeUnread)
      ).catch(() => {});

      DeviceEventEmitter.emit(
        "rbz:notif:unread-total",
        {
          total: safeUnread,
        }
      );
    } catch {
      // Keep cached/stale badge instead of forcing 0 on network failure.
    }
  };

   // ✅ PERF:
  // Load once when token is ready.
  // Only force refresh when entering Notifications tab, not on every tab movement.
  useEffect(() => {
    if (!notifToken) return;

    if (tabName === "notifications") {
      fetchNotifUnreadTotal(true);
      return;
    }

    fetchNotifUnreadTotal(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifToken, tabName === "notifications"]);

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
        if (!n.read) {
          setNotifUnreadTotal((c) => {
            const next =
              Math.max(
                0,
                Number(c || 0) + 1
              );

            SecureStore.setItemAsync(
              NOTIF_UNREAD_TOTAL_KEY,
              String(next)
            ).catch(() => {});

            DeviceEventEmitter.emit(
              "rbz:notif:unread-total",
              {
                total: next,
              }
            );

            return next;
          });
        }
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


  /* ============================================================
     TABS UI
     - Five main tabs live inside the native swipe pager.
     - Bottom RomBuzz navigation remains persistent here.
     - Hidden routes remain in the parent tabs exactly as before.
  ============================================================ */

  const TabsContent = (
    <Tabs
      initialRouteName="(root)"
      tabBar={() =>
        (
          tabName === "microbuzz" ||
          (tabName === "letsbuzz" && letsBuzzFullscreen)
        ) ? null : (
          <RootBottomBar
            activeTab={
              TAB_ORDER.includes(
                tabName as any
              )
                ? tabName
                : null
            }
            chatUnreadTotal={
              chatUnreadTotal
            }
            chatPulse={
              chatPulse
            }
            profilePhoto={
              profilePhoto
            }
            profileCompletion={
              profileCompletion
            }
            onNavigate={
              navigateRootTab
            }
          />
        )
      }
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* ROOT SWIPE PAGER */}
      <Tabs.Screen
        name="(root)"
        options={{
          headerShown: false,
          title: "RomBuzz",
        }}
      />

      {/* HIDDEN ROUTES */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="microbuzz"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="filter"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="upgrade"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="user/[id]"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="discover-profile"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="view-profile"
        options={{
          href: null,
        }}
      />
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

  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          colors.background,
      }}
    >
      {TabsContent}

      {PremiumBuzzOverlayNode}

      <IncomingCallOverlay />

      <FirstSignupTour />
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  iconPill: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    marginTop: 0,
  },

  iconPillActive: {
    backgroundColor: "transparent",
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
  backgroundColor: "#F4F4F6",
},
avatarImg: {
  width: "100%",
  height: "100%",
},
});

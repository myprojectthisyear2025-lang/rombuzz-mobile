import { useColorScheme } from "@/hooks/use-color-scheme";
import { API_BASE } from "@/src/config/api";
import { resolveNotificationHref } from "@/src/lib/socket";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import Constants from "expo-constants";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const IS_EXPO_GO = Constants.appOwnership === "expo";
const Notifications: any = IS_EXPO_GO ? null : require("expo-notifications");

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const PUSH_TOKEN_KEY = "RBZ_PUSH_TOKEN_CURRENT";
const PUSH_SYNC_PREFIX = "RBZ_PUSH_TOKEN_SYNC_";

function getPushSyncKey(userId: string) {
  return `${PUSH_SYNC_PREFIX}${String(userId || "").trim()}`;
}

function getProjectId() {
  const easProjectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    "";

  return typeof easProjectId === "string" ? easProjectId.trim() : "";
}

async function ensureNotificationChannel() {
  if (!Notifications) return;
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#b1123c",
  });
}

async function registerForPushNotificationsAsync() {
  try {
    if (!Notifications) return "";
    await ensureNotificationChannel();

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== "granted") return "";

    const projectId = getProjectId();
    if (!projectId) return "";

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token?.data || "";
  } catch (error) {
    console.log("Push registration failed", error);
    return "";
  }
}

async function syncPushTokenToBackend(
  authToken: string,
  pushToken: string,
  userId: string
) {
  if (!authToken || !pushToken || !userId) return false;

  try {
    const res = await fetch(`${API_BASE}/users/me/push-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: pushToken,
        platform: Platform.OS,
        appOwnership: Constants.appOwnership || "",
      }),
    });

    return res.ok;
  } catch (error) {
    console.log("Push token sync failed", error);
    return false;
  }
}

async function removePushTokenFromBackend(authToken: string, pushToken: string) {
  if (!authToken || !pushToken) return;

  try {
    await fetch(`${API_BASE}/users/me/push-token`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: pushToken,
      }),
    });
  } catch (error) {
    console.log("Push token removal failed", error);
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments() as string[];

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [splashDone, setSplashDone] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [authUserId, setAuthUserId] = useState("");

  const pushSyncInFlightRef = useRef(false);
  const lastSessionRef = useRef<{ token: string; userId: string }>({
    token: "",
    userId: "",
  });
  const handledResponseIdsRef = useRef(new Set<string>());
  const loggedInRef = useRef<boolean>(false);

  useEffect(() => {
    loggedInRef.current = loggedIn === true;
  }, [loggedIn]);

  useEffect(() => {
    let mounted = true;

    const syncAuth = async () => {
      try {
        const token = (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";
        const rawUser = await SecureStore.getItemAsync("RBZ_USER");
        let userId = "";

        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser);
            userId = String(parsed?.id || parsed?._id || "").trim();
          } catch {}
        }

        if (!mounted) return;

        setAuthToken(token);
        setAuthUserId(userId);
        setLoggedIn(!!token);

        if (token) {
          lastSessionRef.current = { token, userId };
        }
      } catch {
        if (!mounted) return;
        setAuthToken("");
        setAuthUserId("");
        setLoggedIn(false);
      } finally {
        if (mounted) setReady(true);
      }
    };

    syncAuth();
    const interval = setInterval(syncAuth, 400);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!ready || loggedIn === null || !splashDone) return;

    const timer = setTimeout(() => {
      if (loggedIn) {
        router.replace("/(tabs)/homepage");
      } else {
        router.replace("/auth/login");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [ready, loggedIn, splashDone, router]);

  useEffect(() => {
    if (!ready || loggedIn === null || !splashDone) return;

    const current = segments.join("/");
    if (current === "index") return;

    if (loggedIn === false) {
      if (current !== "start" && !current.startsWith("auth")) {
        router.replace("/auth/login");
        return;
      }
    }

    if (loggedIn === true) {
      if (current === "start" || current.startsWith("auth")) {
        router.replace("/(tabs)/homepage");
      }
    }
  }, [ready, loggedIn, segments, splashDone, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone(true);
    }, 2100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !splashDone || loggedIn !== true || !authToken || !authUserId) return;
    if (pushSyncInFlightRef.current) return;

    let cancelled = false;

    const syncPushToken = async () => {
      pushSyncInFlightRef.current = true;

      try {
        const syncKey = getPushSyncKey(authUserId);
        const syncedToken = (await SecureStore.getItemAsync(syncKey)) || "";
        let currentPushToken = (await SecureStore.getItemAsync(PUSH_TOKEN_KEY)) || "";

        if (!currentPushToken || currentPushToken === syncedToken) {
          currentPushToken = await registerForPushNotificationsAsync();
        }

        if (cancelled || !currentPushToken) return;

        await SecureStore.setItemAsync(PUSH_TOKEN_KEY, currentPushToken);

        if (currentPushToken === syncedToken) return;

        const synced = await syncPushTokenToBackend(authToken, currentPushToken, authUserId);
        if (!cancelled && synced) {
          await SecureStore.setItemAsync(syncKey, currentPushToken);
        }
      } finally {
        pushSyncInFlightRef.current = false;
      }
    };

    syncPushToken();

    return () => {
      cancelled = true;
    };
  }, [ready, splashDone, loggedIn, authToken, authUserId]);

  useEffect(() => {
    if (loggedIn !== false) return;

    const removeOnLogout = async () => {
      const lastToken = lastSessionRef.current.token;
      const lastUserId = lastSessionRef.current.userId;
      const savedPushToken = (await SecureStore.getItemAsync(PUSH_TOKEN_KEY)) || "";

      if (lastToken && savedPushToken) {
        await removePushTokenFromBackend(lastToken, savedPushToken);
      }

      if (lastUserId) {
        await SecureStore.deleteItemAsync(getPushSyncKey(lastUserId)).catch(() => {});
      }

      lastSessionRef.current = { token: "", userId: "" };
    };

    removeOnLogout();
  }, [loggedIn]);

  useEffect(() => {
    if (!Notifications) return;

    const handleNotificationResponse = (response: any | null) => {
      if (!response || !loggedInRef.current) return;

      const responseId = String(
        response.notification.request.identifier ||
          response.notification.request.content.data?.notificationId ||
          response.notification.date?.toISOString?.() ||
          ""
      );

      if (responseId && handledResponseIdsRef.current.has(responseId)) return;
      if (responseId) handledResponseIdsRef.current.add(responseId);

      const href = resolveNotificationHref(
        response.notification.request.content.data || {}
      );

      try {
        router.push(href as any);
      } catch {
        router.push("/(tabs)/notifications");
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (!Notifications) return;
    if (!ready || !splashDone || loggedIn !== true) return;

    Notifications.getLastNotificationResponseAsync()
      .then((response: any) => {
        if (!response) return;

        const responseId = String(response.notification.request.identifier || "");
        if (responseId && handledResponseIdsRef.current.has(responseId)) return;
        if (responseId) handledResponseIdsRef.current.add(responseId);

        const href = resolveNotificationHref(
          response.notification.request.content.data || {}
        );

        try {
          router.push(href as any);
        } catch {
          router.push("/(tabs)/notifications");
        }
      })
      .catch(() => {});
  }, [ready, splashDone, loggedIn, router]);

  if (!ready || loggedIn === null || !splashDone) {
    return (
      <ThemeProvider
        value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      >
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="start" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/forgot-password" />
          <Stack.Screen name="(tabs)" />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

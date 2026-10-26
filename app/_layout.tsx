
/**
 * ============================================================
 * 📁 File: app/_layout.tsx
 * 🎯 Purpose: Global RomBuzz navigation and startup providers.
 *
 * Usage:
 *   Controls auth routing, notifications, calling, overlays,
 *   and the global application-version update gate.
 * ============================================================
 */

import { Sentry } from "@/src/monitoring/sentry";
import { perfMark } from "@/src/performance/diagnostics/core";
import { installNetworkDiagnostics } from "@/src/performance/diagnostics/network";

import RomBuzzSystemStatusBar from "@/src/components/system/RomBuzzSystemStatusBar";
import {
  RomBuzzThemeProvider,
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";
import { useRomBuzzTypography } from "@/src/design/rombuzzTypography";
import AppUpdateGate from "@/src/features/appUpdate/AppUpdateGate";
import { getSessionGeneration, getSessionSnapshot, isSessionCurrent } from "@/src/features/auth/rbzSession";
import { useRootAuth } from "@/src/features/auth/useRootAuth";
import { useStartupPresentation } from "@/src/features/auth/useStartupPresentation";
import { useChatUnreadLifecycle } from "@/src/features/chat/unread/useChatUnreadLifecycle";
import IncomingMeetMiddleOverlay from "@/src/features/meetMiddle/IncomingMeetMiddleOverlay";
import { useNotificationLifecycle } from "@/src/features/notifications/notificationState";
import { shouldPresentPush, usePushRegistration } from "@/src/features/notifications/usePushRegistration";
import ActiveVideoCallMiniBubble from "@/src/features/videoCall/ActiveVideoCallMiniStore";
import { handleVideoCallNotificationAction } from "@/src/features/videoCall/videoCallNotificationActions";
import { VideoCallProvider } from "@/src/features/videoCall/VideoCallProvider";
import { resolveNotificationHref } from "@/src/lib/socket";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import Constants from "expo-constants";
import { Stack, useRouter, useSegments } from "expo-router";
import React, {
  useEffect,
  useMemo,
  useRef
} from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

installNetworkDiagnostics();

const IS_EXPO_GO = Constants.appOwnership === "expo";
const Notifications: any = IS_EXPO_GO ? null : require("expo-notifications");

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async (notification: any) => {
      const show = shouldPresentPush(notification?.request?.content?.data);
      return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
    },
  });

  Notifications.setNotificationCategoryAsync("incoming_video_call", [
    {
      identifier: "ANSWER_CALL",
      buttonTitle: "Answer",
      options: { opensAppToForeground: true },
    },
    {
      identifier: "DECLINE_CALL",
      buttonTitle: "Decline",
      options: { opensAppToForeground: true, isDestructive: true },
    },
  ]).catch((err: any) => {
    console.warn(
      "Incoming call notification actions could not register:",
      err?.message || err,
    );
  });
}

function RootLayout() {
  useEffect(() => { perfMark("startup", "root-mounted"); }, []);
  const {
    colors,
    isDark,
  } = useRomBuzzTheme();

  const router = useRouter();
  const segments = useSegments() as string[];

  const navigationTheme = useMemo(() => {
    const baseTheme =
      isDark ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,

      colors: {
        ...baseTheme.colors,

        primary: colors.brand,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.brand,
      },
    };
  }, [colors, isDark]);

  const { ready, loggedIn, onboardingPending, authToken, authUserId } = useRootAuth();
  useChatUnreadLifecycle(ready && loggedIn === true && onboardingPending === false);
  useNotificationLifecycle(ready && loggedIn === true && onboardingPending === false);
  const splashDone = useRomBuzzTypography();

  useStartupPresentation(ready && splashDone, segments);

  const handledResponseIdsRef = useRef(new Set<string>());
  const loggedInRef = useRef<boolean>(false);

  useEffect(() => {
    // Incomplete onboarding is not considered navigable logged-in state.
    loggedInRef.current =
      loggedIn === true && onboardingPending === false;
  }, [loggedIn, onboardingPending]);

  usePushRegistration(Notifications, ready && splashDone && loggedIn && !onboardingPending);

  useEffect(() => {
    if (
      !ready ||
      loggedIn === null ||
      onboardingPending === null ||
      !splashDone
    ) {
      return;
    }

    const current = segments.join("/");
    if (current !== "" && current !== "index") return;

    if (onboardingPending) {
      router.replace("/auth/register-full");
    } else if (loggedIn) {
      router.replace("/(tabs)/(root)/homepage");
    } else {
      router.replace("/auth/login");
    }
  }, [
    ready,
    loggedIn,
    onboardingPending,
    splashDone,
    segments,
    router,
  ]);

  useEffect(() => {
    if (
      !ready ||
      loggedIn === null ||
      onboardingPending === null ||
      !splashDone
    ) {
      return;
    }

    const current = segments.join("/");
    if (current === "" || current === "index") return;

    // An unfinished signup always wins over normal auth routing.
    // This prevents killing/reopening the app from bypassing onboarding.
    if (onboardingPending) {
      if (current !== "auth/register-full") {
        router.replace("/auth/register-full");
      }
      return;
    }

    if (loggedIn === false) {
      if (current !== "start" && !current.startsWith("auth")) {
        router.replace("/auth/login");
        return;
      }
    }

    if (loggedIn === true) {
      if (current === "start" || current.startsWith("auth")) {
        router.replace("/(tabs)/(root)/homepage");
      }
    }
  }, [
    ready,
    loggedIn,
    onboardingPending,
    segments,
    splashDone,
    router,
  ]);

  useEffect(() => {
    if (!Notifications) return;

    const handleNotificationResponse = async (response: any | null) => {
      if (!response || !loggedInRef.current || !getSessionSnapshot().token) return;
      const recipientId = String(response.notification.request.content.data?.recipientId || response.notification.request.content.data?.receiverId || "");
      const current = getSessionSnapshot().user;
      if (!recipientId || recipientId !== String(current?.id || current?._id || "")) return;

      const responseId = String(
        response.notification.request.identifier ||
          response.notification.request.content.data?.notificationId ||
          response.notification.date?.toISOString?.() ||
          ""
      );

      if (responseId && handledResponseIdsRef.current.has(responseId)) return;
      if (responseId) handledResponseIdsRef.current.add(responseId);

      const handledCallAction = await handleVideoCallNotificationAction(
        response,
        (route) => router.push(route as any),
      );
      if (handledCallAction) return;

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

    if (
      !ready ||
      !splashDone ||
      loggedIn !== true ||
      onboardingPending !== false
    ) {
      return;
    }

    const owner = getSessionGeneration();
    Notifications.getLastNotificationResponseAsync()
      .then(async (response: any) => {
        if (!response || !isSessionCurrent(owner)) return;
        const recipientId = String(response.notification.request.content.data?.recipientId || response.notification.request.content.data?.receiverId || "");
        if (!recipientId || recipientId !== authUserId) return;

        const responseId = String(response.notification.request.identifier || "");
        if (responseId && handledResponseIdsRef.current.has(responseId)) return;
        if (responseId) handledResponseIdsRef.current.add(responseId);

        const handledCallAction = await handleVideoCallNotificationAction(
          response,
          (route) => router.push(route as any),
        );
        if (handledCallAction) return;

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
  }, [
    ready,
    splashDone,
    loggedIn,
    onboardingPending,
    authUserId,
    authToken,
    router,
  ]);

   return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <ThemeProvider value={navigationTheme}>
        <VideoCallProvider key={authUserId || "signed-out"}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="index"
              options={{ animation: "none" }}
            />
            <Stack.Screen name="start" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/register" />
            <Stack.Screen name="auth/forgot-password" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="video-call/[callId]"
              options={{
                presentation: "transparentModal",
                animation: "fade",
                contentStyle: {
                  backgroundColor: "transparent",
                },
              }}
            />
          </Stack>

          <IncomingMeetMiddleOverlay />
          <ActiveVideoCallMiniBubble />
        </VideoCallProvider>

        <RomBuzzSystemStatusBar />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppRoot() {
  return (
    <RomBuzzThemeProvider>
      <AppUpdateGate>
        <RootLayout />
      </AppUpdateGate>
    </RomBuzzThemeProvider>
  );
}

export default Sentry.wrap(AppRoot);

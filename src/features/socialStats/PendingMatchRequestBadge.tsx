/**
 * File: src/features/socialStats/PendingMatchRequestBadge.tsx
 * Purpose: Keep the pending match-request count current and render its tab badge.
 */

import { fetchSocialStatsFresh, readCachedSocialStats } from "@/src/features/performance/useCachedSocialStats";
import { getSocket } from "@/src/lib/socket";
import React, { useEffect, useState } from "react";
import { AppState, DeviceEventEmitter, StyleSheet, Text, View } from "react-native";

export function usePendingMatchRequestCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    let hasFreshSocialStats = false;
    let socket: any = null;

    const refresh = () => {
      fetchSocialStatsFresh()
        .then((social) => {
          if (!alive) return;
          hasFreshSocialStats = true;
          setCount(social.likedYouCount);
        })
        .catch(() => {});
    };

    readCachedSocialStats()
      .then(({ social }) => {
        if (alive && !hasFreshSocialStats) setCount(social.likedYouCount);
      })
      .catch(() => {});

    const warmed = DeviceEventEmitter.addListener("rbz:social-stats:warmed", (payload: any) => {
      const value = Number(payload?.social?.likedYouCount ?? payload?.social?.likesReceived ?? 0);
      if (!alive) return;
      hasFreshSocialStats = true;
      setCount(Number.isFinite(value) ? Math.max(0, value) : 0);
    });
    const handled = DeviceEventEmitter.addListener("rbz:match-request:handled", () => {
      setCount((current) => Math.max(0, current - 1));
      refresh();
    });
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    const onNotification = (payload: any) => {
      if (payload?.type === "buzz" && payload?.via === "discover_like") refresh();
    };

    getSocket().then((connectedSocket) => {
      if (!alive || !connectedSocket) return;
      socket = connectedSocket;
      socket.on("notification", onNotification);
      socket.on("connect", refresh);
    }).catch(() => {});

    return () => {
      alive = false;
      warmed.remove();
      handled.remove();
      appState.remove();
      socket?.off("notification", onNotification);
      socket?.off("connect", refresh);
    };
  }, []);

  return count;
}

export default function PendingMatchRequestBadge({
  count,
  backgroundColor,
  borderColor,
}: {
  count: number;
  backgroundColor: string;
  borderColor: string;
}) {
  if (count <= 0) return null;

  return (
    <View style={[styles.badge, { backgroundColor, borderColor }]}>
      <Text style={styles.text}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderWidth: 1,
  },
  text: { color: "#fff", fontWeight: "900", fontSize: 11 },
});
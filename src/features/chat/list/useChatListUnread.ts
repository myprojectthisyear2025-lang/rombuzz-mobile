/**
 * Path: src/features/chat/list/useChatListUnread.ts
 * Purpose: Initial identity and unread hydration, foreground reconciliation, and peer-clear events.
 */

import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";
import { rbzGetCurrentUser } from "@/src/performance/api/rbzApiClient";
import {
  UNREAD_MAP_KEY, UNREAD_TOTAL_KEY, applyUnreadSummary,
  fetchUnreadSummary, getJSONStore, persistUnreadTotal, setJSONStore,
} from "./chatListPersistence";
import type { ChatListState } from "./useChatListState";

type UnreadState = Pick<ChatListState, "setUser" | "setUnreadMap" | "setUnreadTotal">;

export function useChatListUnread({ setUser, setUnreadMap, setUnreadTotal }: UnreadState) {
  const reconcileFromServer = async () => {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");
    if (!token) return;

    try {
      const summary = await fetchUnreadSummary(token);
      setUnreadMap(summary.byPeer || {});
      setUnreadTotal(summary.total || 0);
      await applyUnreadSummary(summary);
    } catch { }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      // Uses the user already primed in memory by the tab layout when possible.
      // On a true cold process, this performs one SecureStore read.
      const cachedUser = await rbzGetCurrentUser().catch(() => null);

      if (alive && cachedUser) {
        setUser(cachedUser);
      }

      // Unread state is secondary UI. Load it in parallel after the user has
      // already unlocked the per-user chat inbox cache.
      const [um, tRaw] = await Promise.all([
        getJSONStore(UNREAD_MAP_KEY, {}),
        SecureStore.getItemAsync(UNREAD_TOTAL_KEY).catch(() => null),
      ]);

      if (!alive) return;

      setUnreadMap(um || {});

      const t = Number(tRaw || 0) || 0;
      setUnreadTotal(t);
      persistUnreadTotal(t);

      // Pull server truth after cached rows have had a chance to paint.
      reconcileFromServer();
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ Do NOT clear unread when Chat tab opens.
  // The chat list must show per-person unread badges.
  // Unread for a peer is cleared only when openChat(peer) opens that thread.

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

  return reconcileFromServer;
}

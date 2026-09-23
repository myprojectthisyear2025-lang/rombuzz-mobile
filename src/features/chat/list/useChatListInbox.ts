import { perfState } from "@/src/performance/diagnostics/core";
/**
 * Path: src/features/chat/list/useChatListInbox.ts
 * Purpose: Cached inbox hydration, refresh, deferred presence, persistence, and search filtering.
 */

import { useCallback, useEffect, useRef } from "react";
import type { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { DeviceEventEmitter } from "react-native";
import { rbzGetAuthToken } from "@/src/performance/api/rbzApiClient";
import { fullName, safeId, sameChatListForPaint, type MatchUser } from "./chatListPresentation";
import {
  CHAT_ORDER_KEY, PINNED_CHATS_KEY, applyPinnedOrder, applyStoredOrder, getJSONStore,
} from "./chatListPersistence";
import type { ChatListState } from "./useChatListState";

type InboxState = Pick<ChatListState,
  "myId" | "matches" | "onlineMap" | "chatPerfRef" | "setNickMap" |
  "setMatches" | "setFiltered" | "setLoading" | "setRefreshing" | "setOnlineMap">;

export function useChatListInbox(
  {
    myId, matches, onlineMap, chatPerfRef, setNickMap, setMatches,
    setFiltered, setLoading, setRefreshing, setOnlineMap,
  }: InboxState,
  router: ReturnType<typeof useRouter>,
  reconcileFromServer: () => Promise<void>,
) {
  const chatCacheHydratedRef = useRef(false);
  const inboxCacheReadyRef = useRef(false);
  const inboxCacheOwnerIdRef = useRef("");
  const inboxCacheWriteTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const hydrateCachedChats = useCallback(async () => {
    if (!myId) return false;

    try {
      const cached = await chatPerfRef.current.readCachedInbox();

      const cachedMatches = Array.isArray(cached?.matches)
        ? cached.matches
        : [];

      if (!cachedMatches.length) return false;

      // The inbox is saved in its current visible order. Paint it immediately
      // after one cache read. Presence, nicknames, pin settings, and server
      // refresh must never block the actual rows.
      inboxCacheReadyRef.current = true;
      inboxCacheOwnerIdRef.current = myId;

      perfState("chat", "cache");
      setMatches(cachedMatches);
      setFiltered(cachedMatches);
      setLoading(false);

      if (cached?.onlineMap && typeof cached.onlineMap === "object") {
        setOnlineMap(cached.onlineMap);
      }

      // Nicknames can arrive after first paint.
      loadNicknames(cachedMatches);

      // A separately refreshed presence cache may be newer. Apply it later
      // without delaying the visible chat list.
      chatPerfRef.current.readCachedPresence()
        .then((cachedPresence) => {
          if (cachedPresence?.onlineMap) {
            setOnlineMap(cachedPresence.onlineMap);
          }
        })
        .catch(() => { });

      return true;
    } catch {
      return false;
    }
  }, [myId]);

  const loadChats = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!myId) return;

      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        // ✅ PERF: cache FIRST.
        // Do not wait for token/network before showing the old chat list.
        if (mode === "initial" && !chatCacheHydratedRef.current) {
          chatCacheHydratedRef.current = true;
          await hydrateCachedChats();
        }

        const token = await rbzGetAuthToken();

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        // ✅ PERF: fresh /matches still happens, but it no longer blocks first paint.
        const list = await chatPerfRef.current.fetchMatchesFresh();

        // ✅ Chat list must always be based on real matched users.
        // Do NOT filter matched users with device-local hidden state.
        // Delete chat should clear messages only, not remove the person from chat list.
        const visible = list;

        // ✅ Web parity: apply stored chat order after sorting fallback
        const storedOrder = await getJSONStore(CHAT_ORDER_KEY(myId), []);
        const storedPinned = await getJSONStore(PINNED_CHATS_KEY(myId), []);

        const orderedVisible = applyPinnedOrder(
          applyStoredOrder(visible, storedOrder),
          Array.isArray(storedPinned) ? storedPinned : []
        );

        inboxCacheReadyRef.current = true;
        inboxCacheOwnerIdRef.current = myId;

        perfState("chat", "fresh");
        setMatches((prev) => {
          if (sameChatListForPaint(prev, orderedVisible)) {
            return prev;
          }

          setFiltered(orderedVisible);
          return orderedVisible;
        });

        loadNicknames(orderedVisible);
        setLoading(false);

        // Save fresh inbox for next instant open.
        chatPerfRef.current.writeCachedInbox(orderedVisible, onlineMap).catch(() => { });

        // ✅ PERF: presence fetch is now delayed until after chat list appears.
        // This removes the old blocking N+1 presence wait from tab navigation.
        chatPerfRef.current.refreshPresenceAfterPaint(orderedVisible)
          .then((freshPresence) => {
            if (!freshPresence || !Object.keys(freshPresence).length) return;

            setOnlineMap((prev) => {
              const next = {
                ...prev,
                ...freshPresence,
              };

              chatPerfRef.current.writeCachedInbox(orderedVisible, next).catch(() => { });
              return next;
            });
          })
          .catch(() => { });

        // ✅ Also refresh unread truth during pull-down refresh.
        await reconcileFromServer();
      } catch (e) {
        console.log("❌ Chat load failed", e);

        // ✅ PERF: do not wipe stale cached UI just because fresh network failed.
        if (mode === "refresh") {
          setRefreshing(false);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [myId, router, hydrateCachedChats]
  );
  // Load matches (same endpoint as web)
  useEffect(() => {
    loadChats("initial");
  }, [loadChats]);

  // Persist every visible inbox change, including socket previews, pin/order
  // changes, deletes, and refreshed presence. Debouncing avoids excessive
  // storage writes when several socket events arrive close together.
  useEffect(() => {
    if (
      !myId ||
      !inboxCacheReadyRef.current ||
      inboxCacheOwnerIdRef.current !== myId
    ) {
      return;
    }

    if (inboxCacheWriteTimerRef.current) {
      clearTimeout(inboxCacheWriteTimerRef.current);
    }

    inboxCacheWriteTimerRef.current = setTimeout(() => {
      chatPerfRef.current
        .writeCachedInbox(matches, onlineMap)
        .catch(() => { });

      inboxCacheWriteTimerRef.current = null;
    }, 300);

    return () => {
      if (inboxCacheWriteTimerRef.current) {
        clearTimeout(inboxCacheWriteTimerRef.current);
        inboxCacheWriteTimerRef.current = null;
      }
    };
  }, [matches, myId, onlineMap]);

  // ✅ If startup warmup finishes while this tab is mounted,
  // hydrate cached inbox without waiting for another tab visit.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("rbz:chat:inbox-warmed", (payload: any) => {
      const warmedMeId = String(payload?.meId || "");
      if (!myId || warmedMeId !== myId) return;

      // Do not replace a list that already came from cache or the network.
      // This event is only useful when the screen initially had no cache.
      if (inboxCacheReadyRef.current) return;

      hydrateCachedChats().catch(() => { });
    });

    return () => sub.remove();
  }, [myId, hydrateCachedChats]);
  return { loadChats };
}

export function useChatListFilter(
  { query, matches, pinnedPeers, setFiltered }:
    Pick<ChatListState, "query" | "matches" | "pinnedPeers" | "setFiltered">,
) {
  // Search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    const base = applyPinnedOrder(matches, pinnedPeers);

    if (!q) {
      setFiltered(base);
      return;
    }

    setFiltered(
      base.filter((m) => fullName(m).toLowerCase().includes(q))
    );
  }, [query, matches, pinnedPeers]);
}

/**
 * Path: src/features/chat/list/useChatListState.ts
 * Purpose: Shared inbox state, stable avatars, cache helpers, and local preference listeners.
 */

import { useCachedChatInbox } from "@/src/features/performance/useCachedChatInbox";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import {
  ALERT_CHATS_KEY, HIDDEN_CHATS_KEY, MANUAL_UNREAD_KEY,
  MUTED_CHATS_KEY, PINNED_CHATS_KEY, getJSONStore, setJSONStore,
} from "./chatListPersistence";
import {
  avatarUrl,
  safeId,
  shouldRefreshAvatarUrl,
  type MatchUser,
} from "./chatListPresentation";

export function useChatListState() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [matches, setMatches] = useState<MatchUser[]>([]);

  const [nickMap, setNickMap] = useState<Record<string, string>>({});
  const [filtered, setFiltered] = useState<MatchUser[]>([]);
  const [hiddenPeers, setHiddenPeers] = useState<string[]>([]);
  const [pinnedPeers, setPinnedPeers] = useState<string[]>([]);
  const [mutedPeers, setMutedPeers] = useState<string[]>([]);
  const [alertPeers, setAlertPeers] = useState<string[]>([]);
  const [manualUnreadPeers, setManualUnreadPeers] = useState<string[]>([]);
  const [actionPeer, setActionPeer] = useState<MatchUser | null>(null);

  const [query, setQuery] = useState("");
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const activePeerRef = useRef<string | null>(null);
  const stableAvatarByPeerRef = useRef<Record<string, string>>({});
  const myId = useMemo(() => String(user?.id || user?._id || ""), [user]);

  const stableAvatarUrl = useCallback((m: MatchUser) => {
    const pid = safeId(m);
    const next = avatarUrl(m);

    if (!pid) return next;

    const prev = stableAvatarByPeerRef.current[pid];

    if (
      !prev ||
      shouldRefreshAvatarUrl(prev, next)
    ) {
      stableAvatarByPeerRef.current[pid] = next;
      return next;
    }

    return prev;
  }, []);

  const {
    readCachedInbox,
    writeCachedInbox,
    readCachedPresence,
    fetchMatchesFresh,
    refreshPresenceAfterPaint,
  } = useCachedChatInbox(myId);

  // ✅ Keep latest cache helpers in refs so effects do not re-run forever
  // just because hook-returned functions got recreated during render.
  const chatPerfRef = useRef({
    readCachedInbox,
    writeCachedInbox,
    readCachedPresence,
    fetchMatchesFresh,
    refreshPresenceAfterPaint,
  });

  useEffect(() => {
    chatPerfRef.current = {
      readCachedInbox,
      writeCachedInbox,
      readCachedPresence,
      fetchMatchesFresh,
      refreshPresenceAfterPaint,
    };
  }, [
    readCachedInbox,
    writeCachedInbox,
    readCachedPresence,
    fetchMatchesFresh,
    refreshPresenceAfterPaint,
  ]);

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
    const handler = (payload: any) => {
      const peerId = String(payload?.peerId || payload?.detail?.peerId || "");
      activePeerRef.current = peerId || null;
    };

    const sub = DeviceEventEmitter.addListener("rbz:chat:active", handler);

    globalThis.addEventListener?.("rbz:chat:active", handler);

    return () => {
      sub.remove();
      globalThis.removeEventListener?.("rbz:chat:active", handler);
    };
  }, []);

  // Load chat list controls
  useEffect(() => {
    if (!myId) return;

    (async () => {
      // ✅ IMPORTANT:
      // Old versions stored hidden chat IDs locally.
      // That caused each device to show a different chat list.
      // Chat list must be match-based, so clear old local hidden state.
      await setJSONStore(HIDDEN_CHATS_KEY(myId), []);
      setHiddenPeers([]);

      const pinned = await getJSONStore(PINNED_CHATS_KEY(myId), []);
      const muted = await getJSONStore(MUTED_CHATS_KEY(myId), []);
      const alerts = await getJSONStore(ALERT_CHATS_KEY(myId), []);
      const manualUnread = await getJSONStore(MANUAL_UNREAD_KEY(myId), []);

      setPinnedPeers(Array.isArray(pinned) ? pinned : []);
      setMutedPeers(Array.isArray(muted) ? muted : []);
      setAlertPeers(Array.isArray(alerts) ? alerts : []);
      setManualUnreadPeers(Array.isArray(manualUnread) ? manualUnread : []);
    })();
  }, [myId]);

  const [unreadTotal, setUnreadTotal] = useState(0);

  return {
    loading, setLoading, refreshing, setRefreshing,
    user, setUser, matches, setMatches,
    nickMap, setNickMap, filtered, setFiltered,
    hiddenPeers, setHiddenPeers, pinnedPeers, setPinnedPeers,
    mutedPeers, setMutedPeers, alertPeers, setAlertPeers,
    manualUnreadPeers, setManualUnreadPeers, actionPeer, setActionPeer,
    query, setQuery, onlineMap, setOnlineMap,
    unreadMap, setUnreadMap, activePeerRef, myId,
    stableAvatarUrl, chatPerfRef, unreadTotal, setUnreadTotal,
  };
}

export type ChatListState = ReturnType<typeof useChatListState>;

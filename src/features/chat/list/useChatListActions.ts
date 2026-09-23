import { perfTap } from "@/src/performance/diagnostics/core";
/**
 * Path: src/features/chat/list/useChatListActions.ts
 * Purpose: Chat preference actions, delete and unmatch confirmations, and thread navigation.
 */

import type { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { API_BASE } from "@/src/config/api";
import { fullName, makeRoomId, safeId, type MatchUser } from "./chatListPresentation";
import {
  ALERT_CHATS_KEY, HIDDEN_CHATS_KEY, MANUAL_UNREAD_KEY,
  MUTED_CHATS_KEY, PINNED_CHATS_KEY, UNREAD_MAP_KEY,
  applyPinnedOrder, applyUnreadSummary, reorderMatchesPersist,
  setJSONStore, toggleListValue,
} from "./chatListPersistence";
import type { ChatListState } from "./useChatListState";

type ActionState = Pick<ChatListState,
  "myId" | "pinnedPeers" | "mutedPeers" | "alertPeers" | "manualUnreadPeers" |
  "unreadMap" | "hiddenPeers" | "setPinnedPeers" | "setMutedPeers" | "setAlertPeers" |
  "setManualUnreadPeers" | "setUnreadMap" | "setUnreadTotal" | "setHiddenPeers" |
  "setMatches" | "setFiltered" | "setActionPeer" | "stableAvatarUrl">;

export function useChatListActions(
  { myId, pinnedPeers, mutedPeers, alertPeers, manualUnreadPeers, unreadMap, hiddenPeers,
    setPinnedPeers, setMutedPeers, setAlertPeers, setManualUnreadPeers, setUnreadMap, setUnreadTotal,
    setHiddenPeers, setMatches, setFiltered, setActionPeer, stableAvatarUrl }: ActionState,
  router: ReturnType<typeof useRouter>,
) {
  const patchRoomPrefs = async (peerId: string, patch: Record<string, boolean>) => {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");
    if (!token || !myId || !peerId) return null;

    const roomId = makeRoomId(myId, peerId);

    const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/prefs`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || "Failed to update chat settings");

    if (j?.summary) {
      const applied = await applyUnreadSummary(j.summary);
      setUnreadMap(applied.byPeer || {});
      setUnreadTotal(applied.total || 0);
    }

    return j;
  };

  const togglePinPeer = async (peer: MatchUser) => {
    const pid = safeId(peer);
    if (!pid || !myId) return;

    const shouldPin = !pinnedPeers.includes(pid);

    await toggleListValue(PINNED_CHATS_KEY(myId), pinnedPeers, setPinnedPeers, pid, shouldPin);
    await patchRoomPrefs(pid, { pinned: shouldPin });

    setMatches((prev) => {
      const next = applyPinnedOrder(prev, shouldPin ? [...pinnedPeers, pid] : pinnedPeers.filter((x) => x !== pid));
      setFiltered(next);
      return next;
    });

    setActionPeer(null);
  };

  const toggleMutePeer = async (peer: MatchUser) => {
    const pid = safeId(peer);
    if (!pid || !myId) return;

    const shouldMute = !mutedPeers.includes(pid);

    await toggleListValue(MUTED_CHATS_KEY(myId), mutedPeers, setMutedPeers, pid, shouldMute);
    await patchRoomPrefs(pid, { muted: shouldMute });

    setActionPeer(null);
  };

  const toggleAlertPeer = async (peer: MatchUser) => {
    const pid = safeId(peer);
    if (!pid || !myId) return;

    const shouldAlert = !alertPeers.includes(pid);

    await toggleListValue(ALERT_CHATS_KEY(myId), alertPeers, setAlertPeers, pid, shouldAlert);
    await patchRoomPrefs(pid, { alertOnline: shouldAlert });

    setActionPeer(null);
  };

  const toggleReadPeer = async (peer: MatchUser) => {
    const pid = safeId(peer);
    if (!pid || !myId) return;

    const unread = Number(unreadMap[pid] || 0) > 0 || manualUnreadPeers.includes(pid);
    const shouldMarkUnread = !unread;

    if (shouldMarkUnread) {
      await toggleListValue(MANUAL_UNREAD_KEY(myId), manualUnreadPeers, setManualUnreadPeers, pid, true);
      setUnreadMap((prev) => {
        const next = { ...prev, [pid]: Math.max(1, Number(prev[pid] || 0)) };
        setJSONStore(UNREAD_MAP_KEY, next);
        return next;
      });
      await patchRoomPrefs(pid, { forceUnread: true });
    } else {
      await toggleListValue(MANUAL_UNREAD_KEY(myId), manualUnreadPeers, setManualUnreadPeers, pid, false);
      setUnreadMap((prev) => {
        const next = { ...prev };
        delete next[pid];
        setJSONStore(UNREAD_MAP_KEY, next);
        return next;
      });
      await patchRoomPrefs(pid, { forceUnread: false });
    }

    setActionPeer(null);
  };

  const deletePeerChat = async (peer: MatchUser) => {
    const pid = safeId(peer);
    if (!pid || !myId) return;

    const token = await SecureStore.getItemAsync("RBZ_TOKEN");
    if (!token) return;

    const roomId = makeRoomId(myId, pid);

    // ✅ Delete chat means clear/hide messages from my side only.
    // It should NOT remove a matched user from the chat list.
    await fetch(`${API_BASE}/chat/rooms/${roomId}?scope=me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);

    // ✅ Make sure old server/client deletedForMe state does not keep hiding this matched user.
    await patchRoomPrefs(pid, {
      deletedForMe: false,
      forceUnread: false,
    }).catch(() => null);

    setUnreadMap((prev) => {
      const next = { ...prev };
      delete next[pid];
      setJSONStore(UNREAD_MAP_KEY, next);
      return next;
    });

    if (manualUnreadPeers.includes(pid)) {
      const nextManual = manualUnreadPeers.filter((x) => x !== pid);
      setManualUnreadPeers(nextManual);
      await setJSONStore(MANUAL_UNREAD_KEY(myId), nextManual);
    }

    setMatches((prev) => {
      const next = prev.map((m) => {
        if (safeId(m) !== pid) return m;

        return {
          ...m,
          lastMessage: null,
          lastMessageTime: null,
          _sortTime: 0,
        };
      });

      setFiltered(next);
      return next;
    });

    setActionPeer(null);
  };

  const unmatchPeer = async (peer: MatchUser) => {
    const pid = safeId(peer);
    if (!pid || !myId) return;

    const token = await SecureStore.getItemAsync("RBZ_TOKEN");
    if (!token) return;

    const roomId = makeRoomId(myId, pid);

    const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/unmatch`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || "Failed to unmatch");

    const nextHidden = Array.from(new Set([...hiddenPeers.map(String), pid]));
    setHiddenPeers(nextHidden);
    await setJSONStore(HIDDEN_CHATS_KEY(myId), nextHidden);

    setMatches((prev) => {
      const next = prev.filter((m) => safeId(m) !== pid);
      setFiltered(next);
      return next;
    });

    setActionPeer(null);
  };

  const confirmDeletePeerChat = (peer: MatchUser) => {
    Alert.alert(
      "Delete chat?",
      `This will delete the chat from your side only.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deletePeerChat(peer).catch(() => { }),
        },
      ]
    );
  };

  const confirmUnmatchPeer = (peer: MatchUser) => {
    Alert.alert(
      "Unmatch?",
      `This will unmatch you immediately and remove this chat from your list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: () => unmatchPeer(peer).catch(() => { }),
        },
      ]
    );
  };

  const openChat = (peer: MatchUser) => {
    const pid = safeId(peer);
    if (!pid || !myId) return;

    perfTap("chat-open");
    // clear unread for this peer
    setUnreadMap((prev) => {
      if (!prev[pid]) return prev;
      const next = { ...prev };
      delete next[pid];
      setJSONStore(UNREAD_MAP_KEY, next);

      // ⚠️ DO NOT touch UNREAD_TOTAL_KEY here.
      // That total is now a "global since last reset" counter for the bottom tab badge.
      return next;
    });

    if (manualUnreadPeers.includes(pid)) {
      const nextManual = manualUnreadPeers.filter((x) => x !== pid);
      setManualUnreadPeers(nextManual);
      setJSONStore(MANUAL_UNREAD_KEY(myId), nextManual);
      patchRoomPrefs(pid, { forceUnread: false }).catch(() => { });
    }

    // ✅ Web parity: bump thread to top + persist order on open
    setMatches((prev) => {
      const next = reorderMatchesPersist(myId, prev, pid);
      setFiltered(next);
      return next;
    });

    router.push({
      pathname: "/chat/[peerId]" as any,
      params: {
        peerId: pid,
        name: fullName(peer),
        avatar: stableAvatarUrl(peer),
      },
    });
  };

  return {
    togglePinPeer, toggleMutePeer, toggleAlertPeer, toggleReadPeer,
    confirmDeletePeerChat, confirmUnmatchPeer, openChat
  };
}

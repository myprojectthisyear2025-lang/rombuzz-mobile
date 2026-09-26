/**
 * ============================================================
 * 📁 File: src/features/chat/thread/chatUnavailableCache.ts
 * 🎯 Purpose: Remove stale local chat state after a peer becomes unavailable.
 *
 * Used by:
 *   - useChatThreadFastOpen.ts
 *   - src/lib/socket.ts
 *
 * Owns:
 *   - Thread cache cleanup
 *   - Chat inbox/presence cache cleanup
 *   - Unread cache cleanup
 *   - Per-peer chat preference/order cleanup
 *
 * Must NOT touch:
 *   - Network requests
 *   - Navigation or alerts
 *   - Message layout/composer/scroll behavior
 * ============================================================
 */

import * as SecureStore from "expo-secure-store";
import { chatUnread } from "@/src/features/chat/unread/chatUnread";

import {
  clearCachedChatThread,
} from "@/src/features/chat/thread/rbzChatThreadCache";

import {
  rbzCacheGet,
  rbzCacheKey,
  rbzCacheSet,
} from "@/src/performance/cache/rbzCache";

type CachedInbox = {
  matches?: any[];
  onlineMap?: Record<string, boolean>;
  savedAt?: number;
};


function safeId(value: any) {
  return String(value || "").trim();
}

function peerIdFromMatch(match: any) {
  return safeId(
    match?.id ||
      match?._id ||
      match?.userId ||
      match?.peerId
  );
}

async function removePeerFromJsonArray(
  key: string,
  peerId: string
) {
  if (!key) return;

  try {
    const raw =
      await SecureStore.getItemAsync(key);

    const parsed = raw
      ? JSON.parse(raw)
      : [];

    if (!Array.isArray(parsed)) {
      return;
    }

    const next = parsed
      .map(String)
      .filter((id) => id !== peerId);

    await SecureStore.setItemAsync(
      key,
      JSON.stringify(next)
    );
  } catch {}
}

export async function clearUnavailableChatLocalState(
  args: {
    myId: string;
    peerId: string;
    roomId?: string;
  }
) {
  const myId =
    safeId(args.myId);

  const peerId =
    safeId(args.peerId);

  const roomId =
    safeId(args.roomId);

  if (!myId || !peerId) {
    return;
  }

  if (roomId) {
    await clearCachedChatThread(
      roomId
    );
  }

  try {
    const inboxKey =
      rbzCacheKey(
        "RBZ_PERF_CHAT_INBOX",
        myId
      );

    const cached =
      await rbzCacheGet<CachedInbox>(
        inboxKey,
        {
          matches: [],
          onlineMap: {},
        }
      );

    const matches =
      (
        cached.value?.matches ||
        []
      ).filter(
        (match) =>
          peerIdFromMatch(
            match
          ) !== peerId
      );

    const onlineMap = {
      ...(
        cached.value
          ?.onlineMap ||
        {}
      ),
    };

    delete onlineMap[peerId];

    await rbzCacheSet(
      inboxKey,
      {
        matches,
        onlineMap,
        savedAt:
          Date.now(),
      }
    );
  } catch {}

  try {
    const presenceKey =
      rbzCacheKey(
        "RBZ_PERF_CHAT_PRESENCE",
        myId
      );

    const cached =
      await rbzCacheGet<
        Record<string, boolean>
      >(
        presenceKey,
        {}
      );

    const next = {
      ...(cached.value || {}),
    };

    delete next[peerId];

    await rbzCacheSet(
      presenceKey,
      next
    );
  } catch {}

  chatUnread.clearPeer(peerId, myId);

  await Promise.allSettled([
    removePeerFromJsonArray(
      `RBZ_chat_order_${myId}`,
      peerId
    ),

    removePeerFromJsonArray(
      `RBZ_chat_pinned_${myId}`,
      peerId
    ),

    removePeerFromJsonArray(
      `RBZ_chat_muted_${myId}`,
      peerId
    ),

    removePeerFromJsonArray(
      `RBZ_chat_alert_online_${myId}`,
      peerId
    ),

    removePeerFromJsonArray(
      `RBZ_chat_manual_unread_${myId}`,
      peerId
    ),
  ]);
}
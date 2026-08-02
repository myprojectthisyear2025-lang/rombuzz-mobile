/**
 * ============================================================
 * 📁 File: src/features/chat/thread/useChatThreadFastOpen.ts
 * 🎯 Purpose: Stale-first fast opener for RomBuzz chat threads.
 *
 * Used by:
 *   - app/chat/[peerId].tsx
 *
 * What this hook owns:
 *   - Reads cached chat room messages immediately on navigation.
 *   - Refreshes the room from /chat/rooms/:roomId in the background.
 *   - Reconciles server truth without dropping socket/local changes that
 *     happen while the refresh request is in flight.
 *   - Writes stable server/socket messages back into thread cache.
 *
 * What this hook must NOT do:
 *   - No socket listeners.
 *   - No sending/editing/deleting/pinning/reactions.
 *   - No composer, keyboard, safe-area, or bubble layout changes.
 *   - No view-once/twice mutation rules.
 *
 * Why:
 *   - The main chat thread previously waited for network before rendering.
 *   - This makes chat open like a normal app: cached thread first,
 *     server truth second.
 * ============================================================
 */

import { API_BASE } from "@/src/config/api";
import { rbzGetAuthToken } from "@/src/performance/api/rbzApiClient";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  clearCachedChatThread,
  readCachedChatThread,
  writeCachedChatThread,
} from "@/src/features/chat/thread/rbzChatThreadCache";
import { dedupeById } from "@/src/features/chat/thread/chatPayload";
import type { Msg } from "@/src/features/chat/thread/chatTypes";

type SetMessages = Dispatch<SetStateAction<Msg[]>>;

type ParsedChatRoomResponse = {
  messages: Msg[];
  paginated: boolean;
  hasMore: boolean;
  nextCursor: string;
  cursorInvalid: boolean;
};

type UseChatThreadFastOpenArgs = {
  myId: string;
  peerId: string;
  roomId: string;
  focusMsgId?: string;
  messages: Msg[];
  loading: boolean;
  setMessages: SetMessages;
  setLoading: (next: boolean) => void;
  settleToLatest?: (animated?: boolean) => void;
};

const CACHE_WRITE_DEBOUNCE_MS = 450;
const CHAT_PAGE_SIZE = 40;

function getStableMessageId(message: any) {
  return String(message?.id || message?._id || "").trim();
}

function hasStableId(message: any) {
  return !!getStableMessageId(message);
}

function isLocalUploadingMessage(message: any) {
  if (!message) return false;
  if (message?._temp) return true;
  if (message?.uploading) return true;

  const storage = String(message?.storage || message?.provider || "").toLowerCase();
  if (storage === "local_uploading") return true;

  const rawText = String(message?.text || "");
  if (rawText.includes('"storage":"local_uploading"')) return true;
  if (rawText.includes('"provider":"local_uploading"')) return true;
  if (rawText.includes('"uploading":true')) return true;

  return false;
}

function sanitizeMessagesForCache(messages: Msg[]) {
  return dedupeById(
    (Array.isArray(messages) ? messages : [])
      .filter((message) => hasStableId(message))
      .filter((message) => !isLocalUploadingMessage(message))
      .map((message) => {
        const clean: Msg = {
          ...message,
          id: getStableMessageId(message),
          _temp: false,
        };

        return clean;
      })
  );
}

function persistMessagesForCache(roomId: string, messages: Msg[]) {
  const cleanForCache = sanitizeMessagesForCache(messages);

  if (cleanForCache.length) {
    writeCachedChatThread(roomId, cleanForCache);
  } else {
    clearCachedChatThread(roomId);
  }
}

function messageVersionSignature(message: Msg) {
  try {
    return JSON.stringify(message);
  } catch {
    return [
      getStableMessageId(message),
      String(message?.text || ""),
      String(message?.edited || ""),
      String(message?.deleted || ""),
      String(message?.seen || ""),
    ].join("|");
  }
}

function buildMessageVersionMap(messages: Msg[]) {
  const versions = new Map<string, string>();

  (Array.isArray(messages) ? messages : []).forEach((message) => {
    const id = getStableMessageId(message);
    if (!id) return;
    versions.set(id, messageVersionSignature(message));
  });

  return versions;
}

function reconcileServerMessages(
  serverMessages: Msg[],
  currentMessages: Msg[],
  requestBaseline: Map<string, string>
) {
  const current = Array.isArray(currentMessages) ? currentMessages : [];
  const currentIds = new Set(
    current.map((message) => getStableMessageId(message)).filter(Boolean)
  );

  // A message that existed when the request started but no longer exists in
  // current state was removed locally by a socket/action while the request was
  // running. Do not let the older response resurrect it.
  const removedWhileRefreshing = new Set<string>();
  requestBaseline.forEach((_version, id) => {
    if (!currentIds.has(id)) {
      removedWhileRefreshing.add(id);
    }
  });

  const safeServerMessages = serverMessages.filter((message) => {
    return !removedWhileRefreshing.has(getStableMessageId(message));
  });

  // Preserve optimistic uploads, newly arrived socket messages, and edits /
  // reactions / seen-state changes that occurred after the request started.
  const changedWhileRefreshing = current.filter((message) => {
    if (isLocalUploadingMessage(message)) return true;

    const id = getStableMessageId(message);
    if (!id) return false;

     const baselineVersion = requestBaseline.get(id);
    if (!baselineVersion) return true;

    return baselineVersion !== messageVersionSignature(message);
  });

  return dedupeById([...safeServerMessages, ...changedWhileRefreshing]);
}

function getRemovedWhileRefreshing(
  currentMessages: Msg[],
  requestBaseline: Map<string, string>
) {
  const currentIds = new Set(
    (Array.isArray(currentMessages) ? currentMessages : [])
      .map((message) => getStableMessageId(message))
      .filter(Boolean)
  );

  const removed = new Set<string>();

  requestBaseline.forEach((_version, id) => {
    if (!currentIds.has(id)) {
      removed.add(id);
    }
  });

  return removed;
}

function getChangedWhileRefreshing(
  currentMessages: Msg[],
  requestBaseline: Map<string, string>
) {
  return (Array.isArray(currentMessages) ? currentMessages : []).filter(
    (message) => {
      if (isLocalUploadingMessage(message)) return true;

      const id = getStableMessageId(message);
      if (!id) return false;

      const baselineVersion = requestBaseline.get(id);

      if (!baselineVersion) return true;

      return baselineVersion !== messageVersionSignature(message);
    }
  );
}

function mergeMessageOverlaysPreservingOrder(
  baseMessages: Msg[],
  overlayMessages: Msg[]
) {
  const overlaysById = new Map<string, Msg>();

  (overlayMessages || []).forEach((message) => {
    const id = getStableMessageId(message);

    if (id) {
      overlaysById.set(id, message);
    }
  });

  const usedIds = new Set<string>();

  const merged = (baseMessages || []).map((message) => {
    const id = getStableMessageId(message);
    const overlay = id ? overlaysById.get(id) : null;

    if (!overlay) return message;

    usedIds.add(id);
    return overlay;
  });

  overlaysById.forEach((message, id) => {
    if (!usedIds.has(id)) {
      merged.push(message);
    }
  });

  return dedupeById(merged);
}

function getMessageTimeMs(message: Msg) {
  const raw = message?.createdAt ?? message?.time;

  if (raw == null || raw === "") return 0;

  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return 0;

    return raw < 1e12 ? raw * 1000 : raw;
  }

  const parsed = Date.parse(String(raw));

  return Number.isFinite(parsed) ? parsed : 0;
}

function getOldestLoadableMessageId(messages: Msg[]) {
  for (const message of Array.isArray(messages) ? messages : []) {
    if (isLocalUploadingMessage(message)) continue;

    const id = getStableMessageId(message);

    if (id) return id;
  }

  return "";
}

function reconcileLatestServerPage(
  serverMessages: Msg[],
  currentMessages: Msg[],
  requestBaseline: Map<string, string>
) {
  const current = Array.isArray(currentMessages) ? currentMessages : [];

  const removedWhileRefreshing = getRemovedWhileRefreshing(
    current,
    requestBaseline
  );

  const changedWhileRefreshing = getChangedWhileRefreshing(
    current,
    requestBaseline
  );

  const safeServerMessages = serverMessages.filter((message) => {
    return !removedWhileRefreshing.has(getStableMessageId(message));
  });

  if (!safeServerMessages.length) {
    return mergeMessageOverlaysPreservingOrder(
      [],
      changedWhileRefreshing
    );
  }

  const oldestServerMessage = safeServerMessages[0];
  const oldestServerId = getStableMessageId(oldestServerMessage);

  const overlapIndex = current.findIndex((message) => {
    return getStableMessageId(message) === oldestServerId;
  });

  let cachedOlderMessages: Msg[] = [];

  if (overlapIndex >= 0) {
    cachedOlderMessages = current.slice(0, overlapIndex);
  } else {
    const oldestServerTime = getMessageTimeMs(oldestServerMessage);

    const serverIds = new Set(
      safeServerMessages.map((message) => {
        return getStableMessageId(message);
      })
    );

    cachedOlderMessages = current.filter((message) => {
      const id = getStableMessageId(message);

      if (
        !id ||
        serverIds.has(id) ||
        isLocalUploadingMessage(message)
      ) {
        return false;
      }

      const messageTime = getMessageTimeMs(message);

      return (
        oldestServerTime > 0 &&
        messageTime > 0 &&
        messageTime < oldestServerTime
      );
    });
  }

  return mergeMessageOverlaysPreservingOrder(
    [...cachedOlderMessages, ...safeServerMessages],
    changedWhileRefreshing
  );
}

function reconcileOlderServerPage(
  serverMessages: Msg[],
  currentMessages: Msg[],
  requestBaseline: Map<string, string>
) {
  const current = Array.isArray(currentMessages) ? currentMessages : [];

  const removedWhileRefreshing = getRemovedWhileRefreshing(
    current,
    requestBaseline
  );

  const changedIds = new Set(
    getChangedWhileRefreshing(current, requestBaseline).map(
      (message) => getStableMessageId(message)
    )
  );

  const safeServerMessages = serverMessages.filter((message) => {
    return !removedWhileRefreshing.has(getStableMessageId(message));
  });

  const serverById = new Map<string, Msg>();

  safeServerMessages.forEach((message) => {
    const id = getStableMessageId(message);

    if (id) {
      serverById.set(id, message);
    }
  });

  const currentIds = new Set(
    current
      .map((message) => getStableMessageId(message))
      .filter(Boolean)
  );

  const refreshedCurrent = current.map((message) => {
    const id = getStableMessageId(message);

    if (!id || changedIds.has(id)) {
      return message;
    }

    return serverById.get(id) || message;
  });

  const newlyLoadedOlder = safeServerMessages.filter((message) => {
    const id = getStableMessageId(message);

    return !!id && !currentIds.has(id);
  });

  return dedupeById([
    ...newlyLoadedOlder,
    ...refreshedCurrent,
  ]);
}

function parseChatRoomResponse(data: any): ParsedChatRoomResponse {
  if (Array.isArray(data)) {
    return {
      messages: dedupeById(data as Msg[]),
      paginated: false,
      hasMore: false,
      nextCursor: "",
      cursorInvalid: false,
    };
  }

  return {
    messages: dedupeById(
      (Array.isArray(data?.messages) ? data.messages : []) as Msg[]
    ),
    paginated: !!data?.paginated,
    hasMore: !!data?.hasMore,
    nextCursor: String(data?.nextCursor || "").trim(),
    cursorInvalid: !!data?.cursorInvalid,
  };
}

function buildChatRoomPageUrl(roomId: string, before = "") {
  const beforeQuery = before
    ? `&before=${encodeURIComponent(before)}`
    : "";

  return `${API_BASE}/chat/rooms/${encodeURIComponent(
    roomId
  )}?limit=${CHAT_PAGE_SIZE}${beforeQuery}`;
}

export function useChatThreadFastOpen({
  myId,
  peerId,
  roomId,
  focusMsgId = "",
  messages,
  loading,
  setMessages,
  setLoading,
  settleToLatest,
}: UseChatThreadFastOpenArgs) {
  const cacheWriteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheReadyRoomRef = useRef("");
  const latestMessagesRef = useRef<Msg[]>(messages);

  const paginationRoomRef = useRef("");
  const olderCursorRef = useRef("");
  const serverFallbackCursorRef = useRef("");
  const hasMoreOlderRef = useRef(false);
  const loadingOlderRef = useRef(false);

  // Store the completed room id instead of a bare boolean so switching chats
  // can never leave the first-message arrow enabled for the wrong room.
  const [historyCompleteRoomId, setHistoryCompleteRoomId] = useState("");

  const olderRequestControllerRef =
    useRef<AbortController | null>(null);

  latestMessagesRef.current = messages;

  const canJumpToFirstMessage =
    !!roomId && historyCompleteRoomId === roomId;

  const loadOlderMessages = useCallback(async () => {
    if (!myId || !peerId || !roomId) return;

    // A focused-message deep link uses the legacy full-history request.
    if (String(focusMsgId || "").trim()) return;

    if (paginationRoomRef.current !== roomId) return;

    if (
      !hasMoreOlderRef.current ||
      loadingOlderRef.current
    ) {
      return;
    }

    let before = olderCursorRef.current;

    if (!before) return;

    loadingOlderRef.current = true;
    setHistoryCompleteRoomId("");

    const controller = new AbortController();
    olderRequestControllerRef.current = controller;

    try {
      const token = await rbzGetAuthToken();

      if (!token) return;

      const requestBaseline = buildMessageVersionMap(
        latestMessagesRef.current
      );

      // Two attempts are allowed because a cached cursor may refer to a
      // message that has since been removed. In that case, retry with the
      // cursor returned by the most recent server page.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await fetch(
          buildChatRoomPageUrl(roomId, before),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Failed to load older messages"
          );
        }

        const parsed = parseChatRoomResponse(data);

        if (paginationRoomRef.current !== roomId) return;

        if (!parsed.paginated) {
          hasMoreOlderRef.current = false;
          olderCursorRef.current = "";
          serverFallbackCursorRef.current = "";
          return;
        }

        if (parsed.cursorInvalid) {
          const fallbackCursor =
            serverFallbackCursorRef.current;

          if (
            fallbackCursor &&
            fallbackCursor !== before
          ) {
            before = fallbackCursor;
            serverFallbackCursorRef.current = "";
            continue;
          }

          hasMoreOlderRef.current = false;
          olderCursorRef.current = "";
          serverFallbackCursorRef.current = "";
          return;
        }

        const predictedNext = reconcileOlderServerPage(
          parsed.messages,
          latestMessagesRef.current,
          requestBaseline
        );

        hasMoreOlderRef.current = parsed.hasMore;
        setHistoryCompleteRoomId(parsed.hasMore ? "" : roomId);
        serverFallbackCursorRef.current = parsed.nextCursor;

        olderCursorRef.current = parsed.hasMore
          ? getOldestLoadableMessageId(predictedNext) ||
            parsed.nextCursor
          : "";

        setMessages((current) => {
          const next = reconcileOlderServerPage(
            parsed.messages,
            current,
            requestBaseline
          );

          latestMessagesRef.current = next;

          return next;
        });

        return;
      }
    } catch (error: any) {
      if (error?.name === "AbortError") return;

      console.log(
        "❌ loadOlderMessages failed",
        error?.message || error
      );
    } finally {
      if (
        olderRequestControllerRef.current === controller
      ) {
        olderRequestControllerRef.current = null;
      }

      loadingOlderRef.current = false;
    }
  }, [
    focusMsgId,
    myId,
    peerId,
    roomId,
    setMessages,
  ]);

  useEffect(() => {
    if (!myId || !peerId || !roomId) return;

    let alive = true;
    const controller = new AbortController();

    const shouldSnapLatest =
      !String(focusMsgId || "").trim();

    // Keep the legacy full-history request for focused-message deep links.
    // A normal thread open uses the new latest-message pagination route.
    const shouldUsePagination = shouldSnapLatest;

    cacheReadyRoomRef.current = "";
    paginationRoomRef.current = roomId;
    olderCursorRef.current = "";
    serverFallbackCursorRef.current = "";
    hasMoreOlderRef.current = false;
    loadingOlderRef.current = false;
    setHistoryCompleteRoomId("");

    olderRequestControllerRef.current?.abort();
    olderRequestControllerRef.current = null;

    async function hydrateThread() {
      let showedCache = false;

      try {
        const cached = await readCachedChatThread(roomId);

        if (!alive) return;

        cacheReadyRoomRef.current = roomId;

        if (cached?.messages?.length) {
          showedCache = true;

          const cachedMessages = dedupeById(cached.messages as Msg[]);
          latestMessagesRef.current = cachedMessages;
          setMessages(cachedMessages);
          setLoading(false);

          if (shouldSnapLatest) {
            requestAnimationFrame(() => {
              settleToLatest?.(false);
            });
          }
        }
      } catch {
        // Cache must never break chat.
        if (alive) {
          cacheReadyRoomRef.current = roomId;
        }
      }

      if (!showedCache) {
        setLoading(true);
      }

      try {
        const token = await rbzGetAuthToken();
        if (!token) {
          if (alive && !showedCache) {
            latestMessagesRef.current = [];
            setMessages([]);
            setLoading(false);
          }
          return;
        }

           // Capture the exact message state visible when the request begins.
        // The response is later reconciled against this snapshot so socket
        // events and optimistic messages cannot disappear during refresh.
        const requestBaseline = buildMessageVersionMap(
          latestMessagesRef.current
        );

        const requestUrl = shouldUsePagination
          ? buildChatRoomPageUrl(roomId)
          : `${API_BASE}/chat/rooms/${encodeURIComponent(roomId)}`;

        const response = await fetch(requestUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Failed to load messages"
          );
        }

        const parsed = parseChatRoomResponse(data);

        if (!alive) return;

        const predictedNext = parsed.paginated
          ? reconcileLatestServerPage(
              parsed.messages,
              latestMessagesRef.current,
              requestBaseline
            )
          : reconcileServerMessages(
              parsed.messages,
              latestMessagesRef.current,
              requestBaseline
            );

        hasMoreOlderRef.current =
          parsed.paginated &&
          parsed.hasMore &&
          !!parsed.nextCursor;

        setHistoryCompleteRoomId(
          parsed.paginated && parsed.hasMore ? "" : roomId
        );

        serverFallbackCursorRef.current = parsed.paginated
          ? parsed.nextCursor
          : "";

        olderCursorRef.current =
          parsed.paginated && parsed.hasMore
            ? getOldestLoadableMessageId(predictedNext) ||
              parsed.nextCursor
            : "";

        setMessages((current) => {
          const next = parsed.paginated
            ? reconcileLatestServerPage(
                parsed.messages,
                current,
                requestBaseline
              )
            : reconcileServerMessages(
                parsed.messages,
                current,
                requestBaseline
              );

          latestMessagesRef.current = next;

          return next;
        });

        if (shouldSnapLatest) {
          requestAnimationFrame(() => {
            settleToLatest?.(false);
          });
        }
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        if (alive && !showedCache) {
          latestMessagesRef.current = [];
          setMessages([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

      hydrateThread();

    return () => {
      alive = false;
      controller.abort();

      olderRequestControllerRef.current?.abort();
      olderRequestControllerRef.current = null;

      paginationRoomRef.current = "";
      olderCursorRef.current = "";
      serverFallbackCursorRef.current = "";
      hasMoreOlderRef.current = false;
      loadingOlderRef.current = false;

      if (cacheReadyRoomRef.current === roomId) {
        // Flush the latest stable state when the user leaves quickly, even if
        // the normal 450 ms debounce has not fired yet.
        persistMessagesForCache(
          roomId,
          latestMessagesRef.current
        );

        cacheReadyRoomRef.current = "";
      }
    };
  }, [
    focusMsgId,
    myId,
    peerId,
    roomId,
    setLoading,
    setMessages,
    settleToLatest,
  ]);

  useEffect(() => {
    if (!roomId) return;
    if (loading) return;
    if (cacheReadyRoomRef.current !== roomId) return;

    if (cacheWriteTimerRef.current) {
      clearTimeout(cacheWriteTimerRef.current);
    }

    cacheWriteTimerRef.current = setTimeout(() => {
      persistMessagesForCache(roomId, messages);
      cacheWriteTimerRef.current = null;
    }, CACHE_WRITE_DEBOUNCE_MS);

    return () => {
      if (cacheWriteTimerRef.current) {
        clearTimeout(cacheWriteTimerRef.current);
        cacheWriteTimerRef.current = null;
      }
    };
  }, [loading, messages, roomId]);

  return {
    loadOlderMessages,
    canJumpToFirstMessage,
  };
}

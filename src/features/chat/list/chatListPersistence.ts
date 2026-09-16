/**
 * Path: src/features/chat/list/chatListPersistence.ts
 * Purpose: Existing inbox storage keys, ordering, preferences, and unread synchronization.
 */

import type { Dispatch, SetStateAction } from "react";
import * as SecureStore from "expo-secure-store";
import { DeviceEventEmitter } from "react-native";
import { API_BASE } from "@/src/config/api";
import { safeId, type MatchUser } from "./chatListPresentation";

export const UNREAD_MAP_KEY = "RBZ_unread_map";
export const UNREAD_TOTAL_KEY = "RBZ_unread_total";

export const HIDDEN_CHATS_KEY = (meId: string) => (meId ? `RBZ_chat_hidden_${meId}` : "");

// ✅ Web parity: persist chat list order per-user
export const CHAT_ORDER_KEY = (meId: string) => (meId ? `RBZ_chat_order_${meId}` : "");

// ✅ Chat list controls
export const PINNED_CHATS_KEY = (meId: string) => (meId ? `RBZ_chat_pinned_${meId}` : "");
export const MUTED_CHATS_KEY = (meId: string) => (meId ? `RBZ_chat_muted_${meId}` : "");
export const ALERT_CHATS_KEY = (meId: string) => (meId ? `RBZ_chat_alert_online_${meId}` : "");
export const MANUAL_UNREAD_KEY = (meId: string) => (meId ? `RBZ_chat_manual_unread_${meId}` : "");

export async function getJSONStore(key: string, fallback: any) {
  if (!key || !key.trim()) return fallback;

  try {
    const v = await SecureStore.getItemAsync(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export async function setJSONStore(key: string, val: any) {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(val));
  } catch { }
}

// ✅ Web parity: apply stored order first, then fallback to _sortTime
export function applyStoredOrder(list: MatchUser[], storedIds: string[]) {
  if (!Array.isArray(storedIds) || storedIds.length === 0) return list;

  const map = new Map<string, MatchUser>();
  list.forEach((m) => map.set(String(safeId(m)), m));

  const ordered: MatchUser[] = [];
  for (const id of storedIds) {
    const hit = map.get(String(id));
    if (hit) {
      ordered.push(hit);
      map.delete(String(id));
    }
  }

  // Append remaining, already pre-sorted by _sortTime upstream
  return [...ordered, ...Array.from(map.values())];
}

// ✅ Web parity: move peer to top + persist full ordered id list
export function reorderMatchesPersist(
  meId: string,
  list: MatchUser[],
  peerId: string
) {
  const pid = String(peerId);
  const idx = list.findIndex((m) => String(safeId(m)) === pid);
  if (idx === -1) return list;

  const copy = [...list];
  const [item] = copy.splice(idx, 1);
  const next = [item, ...copy];

  // Persist order (ignore await; fire-and-forget like web localStorage)
  const key = CHAT_ORDER_KEY(meId);
  if (key) setJSONStore(key, next.map((m) => String(safeId(m))));

  return next;
}

export function applyPinnedOrder(list: MatchUser[], pinnedIds: string[]) {
  const pinnedSet = new Set((pinnedIds || []).map((x) => String(x)));

  return [...list].sort((a, b) => {
    const ap = pinnedSet.has(String(safeId(a))) ? 1 : 0;
    const bp = pinnedSet.has(String(safeId(b))) ? 1 : 0;

    if (ap !== bp) return bp - ap;

    const at =
      (a as any).lastMessageTime ||
      (a as any).lastMessage?.time ||
      (a as any).lastMessage?.createdAt ||
      (a as any)._sortTime ||
      (a as any).updatedAt ||
      (a as any).createdAt ||
      0;

    const bt =
      (b as any).lastMessageTime ||
      (b as any).lastMessage?.time ||
      (b as any).lastMessage?.createdAt ||
      (b as any)._sortTime ||
      (b as any).updatedAt ||
      (b as any).createdAt ||
      0;

    return (new Date(bt).getTime() || 0) - (new Date(at).getTime() || 0);
  });
}

// ✅ Global unread total (for bottom tab badge)
export async function persistUnreadTotal(total: number) {
  try {
    await SecureStore.setItemAsync(UNREAD_TOTAL_KEY, String(total));
  } catch { }

  // ✅ RN-safe event bus
  try {
    DeviceEventEmitter.emit("rbz:unread:total", { total });
  } catch { }
}

// ✅ Server truth: fetch unread summary (total + per peer)
export async function fetchUnreadSummary(token: string) {
  const r = await fetch(`${API_BASE}/chat/unread-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await r.json().catch(() => ({}));
  return {
    total: Number(j?.total || 0) || 0,
    byPeer: j?.byPeer && typeof j.byPeer === "object" ? j.byPeer : {},
  };
}

// ✅ Apply server unread summary everywhere (state + storage + global events)
export async function applyUnreadSummary(summary: any) {
  const total = Number(summary?.total || 0) || 0;

  const safeByPeer: Record<string, number> = {};
  const rawByPeer =
    summary?.byPeer && typeof summary.byPeer === "object" ? summary.byPeer : {};

  Object.keys(rawByPeer || {}).forEach((k) => {
    safeByPeer[String(k)] = Number(rawByPeer[k] || 0) || 0;
  });

  // persist map + total
  await setJSONStore(UNREAD_MAP_KEY, safeByPeer);
  await SecureStore.setItemAsync(UNREAD_TOTAL_KEY, String(total)).catch(() => { });

  // broadcast for bottom tab + any listeners
  try {
    DeviceEventEmitter.emit("rbz:unread:total", { total });
  } catch { }

  try {
    DeviceEventEmitter.emit("rbz:unread:summary", { total, byPeer: safeByPeer });
  } catch { }

  return { total, byPeer: safeByPeer };
}

export const nickKey = (meId: string, peerId: string) =>
  meId && peerId ? `RBZ_nick_${meId}_${peerId}` : "";

export const toggleListValue = async (
  key: string,
  current: string[],
  setter: Dispatch<SetStateAction<string[]>>,
  peerId: string,
  enabled: boolean
) => {
  const next = enabled
    ? Array.from(new Set([...current.map(String), String(peerId)]))
    : current.map(String).filter((x) => x !== String(peerId));

  setter(next);
  await setJSONStore(key, next);

  return next;
};

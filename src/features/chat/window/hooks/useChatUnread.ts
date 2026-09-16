import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/src/config/api";

/** Keeps the chat list, tab badge and server unread summary in sync. */
export function useChatUnread(peerId: string) {
  useEffect(() => {
    if (!peerId) return;

    // ✅ Tell chat list: this peer is actively open
    try {
      globalThis.dispatchEvent?.(
        new CustomEvent("rbz:chat:active", {
          detail: { peerId },
        }),
      );
    } catch {}

    return () => {
      // ✅ Tell chat list: no active chat
      try {
        globalThis.dispatchEvent?.(
          new CustomEvent("rbz:chat:active", {
            detail: { peerId: null },
          }),
        );
      } catch {}
    };
  }, [peerId]);
  useEffect(() => {
    if (!peerId) return;

    // ✅ Optimistic clear (UI immediately)
    try {
      const e = new CustomEvent("rbz:chat:clear-peer", {
        detail: { peerId },
      });
      globalThis.dispatchEvent?.(e);
    } catch {}

    // ✅ Server mark-read + reconcile summary (prevents drift across devices)
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("RBZ_TOKEN");
        if (!token) return;

        // 1) mark-read on server
        await fetch(`${API_BASE}/chat/mark-read`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ peerId }),
        }).catch(() => null);

        // 2) fetch server truth
        const r = await fetch(`${API_BASE}/chat/unread-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const j = await r.json().catch(() => ({}));
        const total = Number(j?.total || 0) || 0;
        const byPeer =
          j?.byPeer && typeof j.byPeer === "object" ? j.byPeer : {};

        // 3) persist caches (same keys chat.tsx + tabs use)
        await SecureStore.setItemAsync("RBZ_unread_total", String(total)).catch(
          () => {},
        );
        await SecureStore.setItemAsync(
          "RBZ_unread_map",
          JSON.stringify(byPeer || {}),
        ).catch(() => {});

        // 4) broadcast so tabs + chat list update instantly
        try {
          globalThis.dispatchEvent?.(
            new CustomEvent("rbz:unread:total", { detail: { total } }),
          );
        } catch {}

        try {
          globalThis.dispatchEvent?.(
            new CustomEvent("rbz:unread:summary", {
              detail: { total, byPeer },
            }),
          );
        } catch {}
      } catch {}
    })();
  }, [peerId]);
}

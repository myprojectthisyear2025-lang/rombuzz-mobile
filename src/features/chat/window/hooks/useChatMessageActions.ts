import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/src/config/api";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import type { ChatParticipants, SetMessages } from "./chatWindowTypes";

type ActionArgs = ChatParticipants & {
  setMessages: SetMessages;
  closeSheet: () => void;
};
export function useChatMessageActions({
  myId,
  roomId,
  setMessages,
  closeSheet,
}: ActionArgs) {
  const reactTo = async (m: Msg, emoji: string) => {
    if (!m?.id || !myId) return;

    const mid = String(m.id);

    // ✅ toggle logic
    setMessages((prev) =>
      prev.map((x) => {
        if (String(x.id) !== mid) return x;

        const next = { ...(x.reactions || {}) };

        if (next[String(myId)] === emoji) {
          delete next[String(myId)];
        } else {
          next[String(myId)] = emoji;
        }

        return { ...x, reactions: next };
      }),
    );

    closeSheet();

    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      await fetch(`${API_BASE}/chat/rooms/${roomId}/${mid}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });
    } catch {}
  };

  const togglePinMessage = async (m: Msg) => {
    if (!m?.id || !myId) return;

    const mid = String(m.id);
    const nextPinned = !m?.pinned;
    const optimisticPinnedAt = nextPinned ? new Date().toISOString() : null;
    const optimisticPinnedBy = nextPinned ? String(myId) : null;

    setMessages((prev) =>
      prev.map((x) =>
        String(x.id) === mid
          ? {
              ...x,
              pinned: nextPinned,
              pinnedAt: optimisticPinnedAt,
              pinnedBy: optimisticPinnedBy,
            }
          : x,
      ),
    );

    closeSheet();

    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/${mid}/pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pinned: nextPinned }),
      });

      const j = await r.json().catch(() => ({}));
      const serverMsg: Msg | null = j?.message || null;

      if (!r.ok || !serverMsg?.id) {
        throw new Error(j?.error || "Could not update pinned state.");
      }

      setMessages((prev) =>
        prev.map((x) =>
          String(x.id) === mid
            ? {
                ...x,
                pinned: !!serverMsg.pinned,
                pinnedAt: serverMsg.pinnedAt ?? null,
                pinnedBy: serverMsg.pinnedBy ?? null,
              }
            : x,
        ),
      );
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((x) =>
          String(x.id) === mid
            ? {
                ...x,
                pinned: !!m?.pinned,
                pinnedAt: m?.pinnedAt ?? null,
                pinnedBy: m?.pinnedBy ?? null,
              }
            : x,
        ),
      );
      Alert.alert("Pin failed", e?.message || "Try again");
    }
  };
  const unsendForMe = async (m: Msg) => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(
        `${API_BASE}/chat/rooms/${roomId}/${m.id}?scope=me`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const j = await r.json();
      if (j?.ok) {
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
      }
    } catch {}
    closeSheet();
  };

  const unsendForAll = async (m: Msg) => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(
        `${API_BASE}/chat/rooms/${roomId}/${m.id}?scope=all`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok) {
        Alert.alert("Unsend failed", j?.error || "Try again");
        return;
      }

      // ✅ immediate local removal for sender
      setMessages((prev) => prev.filter((x) => String(x.id) !== String(m.id)));
    } catch {
      Alert.alert("Unsend failed", "Try again");
    }
    closeSheet();
  };

  return { reactTo, togglePinMessage, unsendForMe, unsendForAll };
}

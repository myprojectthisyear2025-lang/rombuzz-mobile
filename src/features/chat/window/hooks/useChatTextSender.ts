import { perfTap, perfMark } from "@/src/performance/diagnostics/core";
import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/src/config/api";
import {
  dedupeById,
  maybeDecode,
  mergeReplySnapshot,
} from "@/src/features/chat/thread/chatPayload";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import type { useChatComposer } from "./useChatComposer";
import type { ChatParticipants, SetMessages } from "./chatWindowTypes";

type SendArgs = ChatParticipants & {
  messages: Msg[];
  setMessages: SetMessages;
  settleToLatest: (animated?: boolean) => void;
  composer: ReturnType<typeof useChatComposer>;
};
export function useChatTextSender({
  myId,
  peerId,
  roomId,
  messages,
  setMessages,
  settleToLatest,
  composer,
}: SendArgs) {
  const {
    text,
    editId,
    replyingTo,
    setReplyingTo,
    setText,
    setInputHeight,
    setComposerExpanded,
    setComposerActionsOpen,
    setEditId,
  } = composer;
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !myId || !peerId) return;

    perfTap("chat-send");
    const isEditing = !!editId;
    const currentReply = replyingTo;
    const editingId = editId ? String(editId) : null;
    const originalMessage = editingId
      ? messages.find((m) => String(m.id) === editingId)
      : null;
    const originalText = String(
      maybeDecode(originalMessage as any)?.text || "",
    );

    // optimistic
    const tempId = `temp_${Date.now()}`;
    if (!isEditing) {
      const temp: Msg = {
        id: tempId,
        from: myId,
        to: peerId,
        text: trimmed,
        type: "text",
        time: new Date().toISOString(),
        replyTo: currentReply,
        _temp: true,
      };
      perfMark("chat-send", "optimistic-state-scheduled");
      setMessages((p) => [...p, temp]);
      setReplyingTo(null);

      // ✅ force the newest outgoing message above the composer
      settleToLatest(true);
    }

    setText("");
    setInputHeight(44);
    setComposerExpanded(false);
    setComposerActionsOpen(false);

    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");

      if (isEditing) {
        if (!editingId) return;

        // ✅ optimistic local update (instant)
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === editingId
              ? { ...m, text: trimmed, edited: true }
              : m,
          ),
        );

        const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/${editingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: trimmed }),
        });

        const j = await r.json().catch(() => ({}));

        if (!r.ok || !j?.ok) {
          setMessages((prev) =>
            prev.map((m) =>
              String(m.id) === editingId
                ? {
                    ...m,
                    text: originalText,
                    edited: !!originalMessage?.edited,
                  }
                : m,
            ),
          );
          Alert.alert("Edit failed", j?.error || "Try again");
          return;
        }

        const serverMsg: Msg | null = j?.message || null;
        if (serverMsg?.id) {
          setMessages((prev) =>
            dedupeById(
              prev.map((m) =>
                String(m.id) === String(serverMsg.id)
                  ? { ...m, ...serverMsg }
                  : m,
              ),
            ),
          );
        }

        setEditId(null);
        return;
      }

      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: trimmed,
          replyTo: currentReply || undefined,
        }),
      });

      const j = await r.json().catch(() => ({}));

      perfMark("chat-send", r.ok ? "http-success" : "http-failed");
      if (!r.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        Alert.alert(
          "Failed to send message",
          j?.message || j?.error || "You cannot send messages to this user.",
        );
        return;
      }

      const serverMsg: Msg | null = j?.message || null;
      if (serverMsg?.id) {
        setMessages((prev) =>
          dedupeById(
            prev.map((m) =>
              m.id === tempId ? mergeReplySnapshot(m, serverMsg) : m,
            ),
          ),
        );

        // ✅ second settle after optimistic temp gets replaced
        settleToLatest(true);
      }
    } catch {
      if (isEditing && editingId) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === editingId
              ? { ...m, text: originalText, edited: !!originalMessage?.edited }
              : m,
          ),
        );
        Alert.alert("Edit failed", "Try again");
      } else {
        // rollback temp (optional)
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    }
  };

  return { send };
}

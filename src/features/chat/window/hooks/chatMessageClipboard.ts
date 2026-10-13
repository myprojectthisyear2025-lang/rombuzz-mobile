/**
 * 📁 File: src/features/chat/window/hooks/chatMessageClipboard.ts
 * 🎯 Purpose: Copy ordinary chat text to the system clipboard.
 * Used by: ChatMessageActionsSheet.tsx.
 * Preserves: Exact text, whitespace, and line breaks.
 * Excludes: Deleted messages, media, and structured payloads.
 */


import type { Msg } from "@/src/features/chat/thread/chatTypes";
import { Alert } from "react-native";

// Load clipboard only when the user taps Copy.
export function getCopyableMessageText(
  message: Msg | null | undefined,
  myId: string,
  peerId: string,
  roomId: string,
): string | null {
  if (!message || !myId || !peerId || !roomId) return null;

  const from = String(message.from);
  const to = String(message.to);
  const belongsToThread =
    (from === myId && to === peerId) ||
    (from === peerId && to === myId);

  if (!belongsToThread) return null;
  if (message.roomId && message.roomId !== roomId) return null;

  if (
    message.deleted ||
    message.system ||
    message.action ||
    message.ephemeral ||
    message.url ||
    message.mediaUrl ||
    message.mediaType ||
    message.meetMiddle ||
    message.meetMiddleRequest
  ) {
    return null;
  }

  if (message.type && message.type !== "text") return null;
  if (typeof message.text !== "string") return null;
  if (!message.text.trim() || message.text.startsWith("::RBZ::")) {
    return null;
  }

  return message.text;
}

export async function copyMessageText(text: string) {
  try {
    const Clipboard = await import("expo-clipboard");
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    Alert.alert(
      "Copy unavailable",
      "Copy requires the updated app build. You can continue chatting.",
    );
    return false;
  }
}
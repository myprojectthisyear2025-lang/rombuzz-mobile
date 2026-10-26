/** Send the chat gift bubble after the existing gift picker completes a gift. */
import { API_BASE } from "@/src/config/api";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

type ChatGiftPayload = {
  giftId: string;
  transactionId: string;
  priceBC: number;
};

export function useChatGiftMessage({
  myId,
  peerId,
  roomId,
}: {
  myId: string;
  peerId: string;
  roomId: string;
}) {
  const sendChatGiftMessage = async (payload: ChatGiftPayload) => {
    if (!myId || !peerId || !roomId) return;

    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const rbzPayload = {
        type: "chat_gift",
        gift: {
          giftId: payload.giftId,
          transactionId: payload.transactionId,
          priceBC: payload.priceBC,
          senderId: myId,
          receiverId: peerId,
          roomId,
          opened: false,
          sentAt: Date.now(),
        },
      };

      const res = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: `::RBZ::${JSON.stringify(rbzPayload)}`,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Gift sent, but chat message failed.",
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Gift message",
        err?.message || "Gift was sent, but the chat gift bubble could not be created.",
      );
    }
  };

  return { sendChatGiftMessage };
}
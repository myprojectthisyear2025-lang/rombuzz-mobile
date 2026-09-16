import { useState } from "react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/src/config/api";
import { useChatMediaViewerController } from "@/src/features/chat/thread/ChatMediaViewerController";
import {
  dedupeById,
  maybeDecode,
} from "@/src/features/chat/thread/chatPayload";
import type { Msg } from "@/src/features/chat/thread/chatTypes";
import {
  getMaxViews,
  getMediaKey,
  getChatVideoUri,
  isGiftedPaidMedia,
} from "./chatMediaUtils";
import type { SetMessages } from "./chatWindowTypes";

type EphemeralArgs = {
  roomId: string;
  messages: Msg[];
  setMessages: SetMessages;
};
export function useChatEphemeralMedia({
  roomId,
  messages,
  setMessages,
}: EphemeralArgs) {
  const IS_EXPO_GO = Constants.appOwnership === "expo";
  const [mediaViews, setMediaViews] = useState<Record<string, number>>({});
  const [expiredMedia, setExpiredMedia] = useState<Record<string, true>>({});
  const isExpired = (m: any) => {
    const k = getMediaKey(m);
    return !!expiredMedia[k];
  };
  const consumeEphemeralView = async (m: any) => {
    const maxViews = getMaxViews(m);
    if (!maxViews) return; // only for once/twice

    if (!m?.id || !roomId) return;

    const deadId = String(m.id);

    // ✅ Fast UI: view-once should disappear immediately after close.
    // Do not wait 3-6 seconds for the backend round trip.
    if (maxViews === 1) {
      setExpiredMedia((prev) => ({
        ...prev,
        [deadId]: true,
      }));

      setMessages((prev) => prev.filter((msg) => String(msg?.id) !== deadId));
    }

    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");

      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}/${m.id}/viewed`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const j = await r.json().catch(() => ({}));

      if (typeof j?.viewsLeft === "number") {
        setMediaViews((prev) => ({
          ...prev,
          [String(m.id)]: Number(j.viewsLeft),
        }));
      }

      if (j?.viewsLeft === 0) {
        setExpiredMedia((prev) => ({
          ...prev,
          [deadId]: true,
        }));

        setMessages((prev) => {
          const filtered = prev.filter((msg) => String(msg?.id) !== deadId);

          if (j?.systemMessage?.id) {
            return dedupeById([
              ...filtered,
              {
                ...j.systemMessage,
                system: true,
              },
            ]);
          }

          return dedupeById(filtered);
        });

        return;
      }
    } catch (e) {
      console.log("❌ consumeEphemeralView failed", e);
    }
  };

  const { openImageViewer, openVideoViewer, mediaViewerNode } =
    useChatMediaViewerController({
      messages,
      isExpoGo: IS_EXPO_GO,
      maybeDecodeMessage: maybeDecode,
      isExpiredMessage: isExpired,
      getMaxViews,
      consumeEphemeralView,
    });

  return {
    mediaViews,
    expiredMedia,
    isExpired,
    getMaxViews,
    getChatVideoUri,
    isGiftedPaidMedia,
    openImageViewer,
    openVideoViewer,
    mediaViewerNode,
  };
}

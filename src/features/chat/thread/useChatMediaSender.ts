/**
 * ============================================================
 * 📁 File: src/features/chat/thread/useChatMediaSender.ts
 * 🎯 Purpose: Owns RomBuzz chat media sending/upload logic.
 *
 * Used by:
 *   - app/chat/[peerId].tsx
 *
 * What this file owns:
 *   - Gallery-picked photo/video sending
 *   - Live camera photo/video sending
 *   - Chat audio message payload sending
 *   - Gift-locked chat media metadata
 *   - View once / view twice metadata
 *   - Instant optimistic local media bubbles
 *   - Background upload + server replacement
 *
 * Why:
 *   - Keeps app/chat/[peerId].tsx lighter
 *   - Makes gallery media and live camera media behave the same
 *   - Makes media feel fast by showing local bubble immediately
 * ============================================================
 */

import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";

import { API_BASE } from "@/src/config/api";
import { uploadRomBuzzMedia } from "@/src/config/uploadMedia";
import {
  dedupeById,
  encodePayload,
  mergeReplySnapshot,
} from "@/src/features/chat/thread/chatPayload";
import type { Msg, ReplySnapshot } from "@/src/features/chat/thread/chatTypes";

type SetMessages = React.Dispatch<React.SetStateAction<Msg[]>>;

type ChatMediaKind = "image" | "video" | "audio";
type VisibilityMode = "keep" | "once" | "twice";

type GiftPayload = {
  locked?: boolean;
  priceBC?: number;
  amount?: number;
  currency?: "BC";
};

type SendGalleryMediaArgs = {
  localUri: string;
  mediaType: "image" | "video";
  ephemeral?: {
    mode?: VisibilityMode;
    maxViews?: 1 | 2;
  };
  gift?: GiftPayload;
  overlayText?: string;
  duration?: number;
};

type SendCameraMediaArgs = {
  uri: string;
  mediaType: "image" | "video";
  visibility: VisibilityMode;
  previewMuted?: boolean;
  overlayText?: string;
  gift?: GiftPayload;
  duration?: number;
};

type UseChatMediaSenderArgs = {
  myId: string;
  peerId: string;
  roomId: string;
  replyingTo: ReplySnapshot | null;
  setReplyingTo: (value: ReplySnapshot | null) => void;
  setMessages: SetMessages;
  settleToLatest: (animated?: boolean) => void;
};

function makeTempId() {
  return `temp_media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeGift(gift?: GiftPayload) {
  const priceBC = Math.floor(Number(gift?.priceBC ?? gift?.amount ?? 0) || 0);
  const locked = !!gift?.locked && priceBC > 0;

  if (!locked) {
    return undefined;
  }

  return {
    locked: true,
    priceBC,
    amount: priceBC,
    currency: "BC" as const,
  };
}

function ephemeralFromVisibility(visibility: VisibilityMode) {
  if (visibility === "once") {
    return {
      mode: "once" as const,
      maxViews: 1 as const,
    };
  }

  if (visibility === "twice") {
    return {
      mode: "twice" as const,
      maxViews: 2 as const,
    };
  }

  return undefined;
}

function mediaUploadOptions({
  roomId,
  peerId,
  mediaType,
  duration,
}: {
  roomId: string;
  peerId: string;
  mediaType: ChatMediaKind;
  duration?: number;
}) {
  if (mediaType === "image") {
    return {
      purpose: "chat-image",
      roomId,
    };
  }

  if (mediaType === "video") {
    return {
      purpose: "chat_video",
      context: "chat_video",
      roomId,
      receiverId: peerId,
      requireSignedURLs: true,
      duration,
    };
  }

  return {
    purpose: "chat-audio",
    roomId,
  };
}

function buildUploadedPayload({
  uploaded,
  mediaType,
  ephemeral,
  gift,
  overlayText,
  muted,
}: {
  uploaded: any;
  mediaType: ChatMediaKind;
  ephemeral?: any;
  gift?: GiftPayload;
  overlayText?: string;
  muted?: boolean;
}) {
  const isStream = uploaded?.storage === "cloudflare_stream";

  return {
    type: "media",
    url: isStream
      ? uploaded?.signedUrl || uploaded?.url
      : uploaded?.r2Key || uploaded?.url,
    previewUrl: uploaded?.signedUrl || uploaded?.url,
    storage: uploaded?.storage,
    provider: uploaded?.provider || uploaded?.storage,
    purpose:
      uploaded?.purpose ||
      (isStream ? "chat_video" : ""),
    context:
      uploaded?.context ||
      (isStream ? "chat_video" : ""),
    streamUid: uploaded?.streamUid || uploaded?.uid || "",
    cloudflareStream: uploaded?.cloudflareStream,
    playback: uploaded?.playback,
    thumbnailUrl: uploaded?.thumbnailUrl || "",
    status: uploaded?.status || "",
    duration: uploaded?.duration || 0,
    mediaType,
    muted: mediaType === "video" ? !!muted : false,
    ephemeral,
    gift: normalizeGift(gift),
    overlayText: overlayText || "",
  };
}

function buildLocalPayload({
  localUri,
  mediaType,
  ephemeral,
  gift,
  overlayText,
  muted,
}: {
  localUri: string;
  mediaType: ChatMediaKind;
  ephemeral?: any;
  gift?: GiftPayload;
  overlayText?: string;
  muted?: boolean;
}) {
  return {
    type: "media",
    url: localUri,
    previewUrl: localUri,
    storage: "local_uploading",
    provider: "local_uploading",
    mediaType,
    muted: mediaType === "video" ? !!muted : false,
    ephemeral,
    gift: normalizeGift(gift),
    overlayText: overlayText || "",
    uploading: true,
  };
}

export function useChatMediaSender({
  myId,
  peerId,
  roomId,
  replyingTo,
  setReplyingTo,
  setMessages,
  settleToLatest,
}: UseChatMediaSenderArgs) {
  const postFinalPayload = async ({
    tempId,
    payloadObj,
    replySnapshot,
  }: {
    tempId: string;
    payloadObj: any;
    replySnapshot: ReplySnapshot | null;
  }) => {
    const token = await SecureStore.getItemAsync("RBZ_TOKEN");

    const res = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: encodePayload(payloadObj),
        replyTo: replySnapshot || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          "You cannot send messages in this chat."
      );
    }

    const serverMsg: Msg | null = data?.message || null;

    if (serverMsg?.id) {
      setMessages((prev) =>
        dedupeById(
          prev.map((msg) =>
            String(msg.id) === String(tempId)
              ? mergeReplySnapshot(msg, serverMsg)
              : msg
          )
        )
      );

      settleToLatest(true);
      return;
    }

    setMessages((prev) =>
      prev.map((msg) =>
        String(msg.id) === String(tempId)
          ? {
              ...msg,
              text: encodePayload(payloadObj),
              _temp: false,
            }
          : msg
      )
    );
  };

  const addOptimisticMedia = ({
    localPayload,
    replySnapshot,
  }: {
    localPayload: any;
    replySnapshot: ReplySnapshot | null;
  }) => {
    const tempId = makeTempId();

    const temp: Msg = {
      id: tempId,
      from: myId,
      to: peerId,
      text: encodePayload(localPayload),
      type: "media",
      url: localPayload.url,
      mediaType: localPayload.mediaType,
      time: new Date().toISOString(),
      replyTo: replySnapshot,
      _temp: true,
    } as Msg;

    setMessages((prev) => dedupeById([...prev, temp]));
    setReplyingTo(null);
    settleToLatest(true);

    return tempId;
  };

  const failOptimisticMedia = (tempId: string, message: string) => {
    setMessages((prev) => prev.filter((msg) => String(msg.id) !== String(tempId)));
    Alert.alert("Send failed", message || "Could not send media.");
  };

  const sendUploadedLocalMediaInBackground = ({
    tempId,
    localUri,
    mediaType,
    ephemeral,
    gift,
    overlayText,
    muted,
    replySnapshot,
    duration,
  }: {
    tempId: string;
    localUri: string;
    mediaType: ChatMediaKind;
    ephemeral?: any;
    gift?: GiftPayload;
    overlayText?: string;
    muted?: boolean;
    replySnapshot: ReplySnapshot | null;
    duration?: number;
  }) => {
    Promise.resolve()
      .then(async () => {
        const uploaded = await uploadRomBuzzMedia(
          localUri,
          mediaType === "video" ? "video" : mediaType === "audio" ? "audio" : "image",
          mediaUploadOptions({
            roomId,
            peerId,
            mediaType,
            duration,
          })
        );

        const payloadObj = buildUploadedPayload({
          uploaded,
          mediaType,
          ephemeral,
          gift,
          overlayText,
          muted,
        });

        await postFinalPayload({
          tempId,
          payloadObj,
          replySnapshot,
        });
      })
      .catch((err: any) => {
        failOptimisticMedia(
          tempId,
          err?.message ||
            `Failed to send ${mediaType === "video" ? "video" : mediaType === "audio" ? "audio" : "photo"}.`
        );
      });
  };

  const sendMediaPayload = async (payloadObj: any) => {
    if (!myId || !peerId || !roomId) return;

    const replySnapshot = replyingTo;
    const tempId = addOptimisticMedia({
      localPayload: payloadObj,
      replySnapshot,
    });

    Promise.resolve()
      .then(() =>
        postFinalPayload({
          tempId,
          payloadObj,
          replySnapshot,
        })
      )
      .catch((err: any) => {
        failOptimisticMedia(
          tempId,
          err?.message || "Could not send media."
        );
      });
  };

  const sendGalleryMedia = async (picked: SendGalleryMediaArgs) => {
    if (!myId || !peerId || !roomId || !picked?.localUri) return;

    const gift = normalizeGift(picked.gift);
    const replySnapshot = replyingTo;

    const localPayload = buildLocalPayload({
      localUri: picked.localUri,
      mediaType: picked.mediaType,
      ephemeral: picked.ephemeral,
      gift,
      overlayText: picked.overlayText || "",
    });

    const tempId = addOptimisticMedia({
      localPayload,
      replySnapshot,
    });

    sendUploadedLocalMediaInBackground({
      tempId,
      localUri: picked.localUri,
      mediaType: picked.mediaType,
      ephemeral: picked.ephemeral,
      gift,
      overlayText: picked.overlayText || "",
      replySnapshot,
      duration: picked.duration,
    });
  };

  const sendCameraMedia = async (captured: SendCameraMediaArgs) => {
    if (!myId || !peerId || !roomId || !captured?.uri) return;

    const gift = normalizeGift(captured.gift);
    const ephemeral = ephemeralFromVisibility(captured.visibility);
    const replySnapshot = replyingTo;

    const localPayload = buildLocalPayload({
      localUri: captured.uri,
      mediaType: captured.mediaType,
      ephemeral,
      gift,
      overlayText: captured.overlayText || "",
      muted: captured.mediaType === "video" ? !!captured.previewMuted : false,
    });

    const tempId = addOptimisticMedia({
      localPayload,
      replySnapshot,
    });

    sendUploadedLocalMediaInBackground({
      tempId,
      localUri: captured.uri,
      mediaType: captured.mediaType,
      ephemeral,
      gift,
      overlayText: captured.overlayText || "",
      muted: captured.mediaType === "video" ? !!captured.previewMuted : false,
      replySnapshot,
      duration: captured.duration,
    });
  };

  return {
    sendMediaPayload,
    sendGalleryMedia,
    sendCameraMedia,
  };
}
/**
 * ============================================================================
 * 📁 File: src/features/videoCallGifts/VideoCallGiftOverlay.tsx
 * 🎥🎁 Purpose: Floating video-call BuzzCoin gifting overlay.
 *
 * Used by:
 *   - app/video-call/[callId].tsx
 *
 * What this does:
 *   - Shows gift button during active video call.
 *   - Opens compact Send / Request bubble menu.
 *   - Lets user send BC or request BC without closing the call.
 *   - Listens for live socket gift/request events.
 *   - Shows incoming request bubble with Accept / Reject.
 *
 * Notes:
 *   - This file does not control Agora.
 *   - This file does not cover the full screen.
 *   - Video continues behind all bubbles.
 * ============================================================================
 */

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import { Keyboard, Platform, StyleSheet, View } from "react-native";

import { getSocket } from "@/src/lib/socket";

import VideoCallGiftAmountBubble from "./VideoCallGiftAmountBubble";
import VideoCallGiftBubbleMenu from "./VideoCallGiftBubbleMenu";
import VideoCallGiftButton from "./VideoCallGiftButton";
import VideoCallGiftLiveBubble, {
  type VideoCallLiveBubbleKind,
} from "./VideoCallGiftLiveBubble";

import {
  acceptVideoCallBuzzCoinRequest,
  createVideoCallBuzzCoinRequest,
  getVideoCallBuzzCoinWallet,
  rejectVideoCallBuzzCoinRequest,
  sendVideoCallBuzzCoinGift,
  type VideoCallBuzzCoinWalletPayload,
  type VideoCallGiftPayload,
  type VideoCallGiftRequest,
} from "./videoCallGiftsApi";

type Mode = "send" | "request";

type LiveBubble = {
  id: string;
  kind: VideoCallLiveBubbleKind;
  title: string;
  message?: string;
  note?: string;
  request?: VideoCallGiftRequest | null;
};

type Props = {
  callId: string;
  visible: boolean;
  bottomOffset: number;
  inline?: boolean;
};

function getName(value: any, fallback = "Someone") {
  const first = String(value?.firstName || "").trim();
  if (first) return first.split(/\s+/)[0];
  return fallback;
}

async function getStoredUserIdSafe() {
  try {
    const raw = await SecureStore.getItemAsync("RBZ_USER");
    const user = raw ? JSON.parse(raw) : null;
    return String(user?.id || user?._id || "").trim();
  } catch {
    return "";
  }
}

function extractWalletBalanceBC(payload: VideoCallBuzzCoinWalletPayload | any) {
  const direct =
    payload?.balanceBC ??
    payload?.availableBC ??
    payload?.buzzCoinBalance ??
    payload?.wallet?.balanceBC ??
    payload?.wallet?.availableBC ??
    payload?.wallet?.buzzCoinBalance;

  const next = Number(direct);

  return Number.isFinite(next) ? Math.max(0, Math.floor(next)) : null;
}

function makeLocalActionBubble(args: {
  id?: string;
  kind: VideoCallLiveBubbleKind;
  title: string;
  message?: string;
}): LiveBubble {
  return {
    id: args.id || `${Date.now()}`,
    kind: args.kind,
    title: args.title,
    message: args.message || "",
  };
}

function makeBubbleFromPayload(payload: VideoCallGiftPayload): LiveBubble | null {
  const type = String(payload?.type || "");

  if (type === "video_call_gift_send") {
    return {
      id: payload.transactionId || `${Date.now()}`,
      kind: "gift",
      title: `${getName(payload.sender)} sent you ${payload.amountBC} BC`,
      message: "Added to your creator earnings.",
    };
  }

  if (type === "video_call_request_create") {
    return {
      id: payload.request?.id || `${Date.now()}`,
      kind: "request",
      title: `${getName(payload.requester)} requested ${payload.amountBC} BC`,
      message: "Accept to send BuzzCoin from your balance.",
      note: payload.note || payload.request?.note || "",
      request: payload.request || null,
    };
  }

  if (type === "video_call_request_accept") {
    return {
      id: payload.transactionId || `${Date.now()}`,
      kind: "accepted",
      title: `${getName(payload.receiver)} accepted ${payload.amountBC} BC`,
      message: "Added to creator earnings.",
    };
  }

  if (type === "video_call_request_reject") {
    return {
      id: payload.request?.id || `${Date.now()}`,
      kind: "rejected",
      title: `${getName(payload.receiver)} rejected ${payload.amountBC} BC`,
      message: "No BuzzCoin was moved.",
    };
  }

  return null;
}

export default function VideoCallGiftOverlay({
  callId,
  visible,
  bottomOffset,
  inline = false,
}: Props) {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [amountMode, setAmountMode] = useState<Mode | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveBubble, setLiveBubble] = useState<LiveBubble | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [walletBalanceBC, setWalletBalanceBC] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const keyboardOpen = keyboardHeight > 0;

  const menuBottom = bottomOffset + 62;
  const amountBottom = bottomOffset + 66;
  const liveBottom = bottomOffset + 132;

  // ✅ When typing Custom BC or Notes, lift the amount bubble above keyboard.
  // This keeps Send/Request visible without closing or covering the call.
  const keyboardSafeAmountBottom = keyboardOpen
    ? Math.max(amountBottom, keyboardHeight + 14)
    : amountBottom;

  const keyboardSafeLiveBottom = keyboardOpen
    ? Math.max(liveBottom, keyboardHeight + 18)
    : liveBottom;

  const showButton = visible && !amountMode;
  const showMenu = visible && menuOpen && !amountMode;

  const currentRequestId = useMemo(() => {
    return String(liveBubble?.request?.id || "").trim();
  }, [liveBubble?.request?.id]);

  const currentUserCanRespondToRequest =
    liveBubble?.kind === "request" &&
    !!currentRequestId &&
    !!myUserId &&
    String(liveBubble?.request?.receiverId || "") === String(myUserId);

  const showLiveBubble = visible && !!liveBubble;

   useEffect(() => {
    let alive = true;

    (async () => {
      const id = await getStoredUserIdSafe();
      if (alive) setMyUserId(id);
    })();

    return () => {
      alive = false;
    };
  }, []);

   useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextHeight = Number(event?.endCoordinates?.height || 0);
      setKeyboardHeight(Math.max(0, nextHeight));
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const refreshWalletBalance = async () => {
    try {
      setWalletLoading(true);

      const payload = await getVideoCallBuzzCoinWallet();
      setWalletBalanceBC(extractWalletBalanceBC(payload));
    } catch {
      setWalletBalanceBC(null);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    if (!visible || amountMode !== "send") return;

    refreshWalletBalance();
  }, [visible, amountMode]);

  const closeAmount = () => {
    setAmountMode(null);
    setErrorMessage("");
    Keyboard.dismiss();
  };

  const closeAll = () => {
    setMenuOpen(false);
    closeAmount();
  };

  const showTimedBubble = (next: LiveBubble) => {
    setLiveBubble(next);

    setTimeout(() => {
      setLiveBubble((current) => (current?.id === next.id ? null : current));
    }, 4200);
  };
  const showErrorBubble = (message: string) => {
    const next = {
      id: `${Date.now()}`,
      kind: "error" as VideoCallLiveBubbleKind,
      title: "Could not complete",
      message,
    };

    setLiveBubble(next);

    setTimeout(() => {
      setLiveBubble((current) => (current?.id === next.id ? null : current));
    }, 4200);
  };

  const submitAmount = async (args: { amountBC: number; note: string }) => {
    if (!callId || loading) return;

    try {
      setLoading(true);
      setErrorMessage("");

         if (amountMode === "send") {
        const payload = await sendVideoCallBuzzCoinGift({
          callId,
          amountBC: args.amountBC,
        });

             closeAll();
        refreshWalletBalance();

        // ✅ Sender sees sender-side confirmation only.
        // Do NOT turn sender API response into an incoming gift bubble.
        showTimedBubble(
          makeLocalActionBubble({
            id: payload.transactionId || `${Date.now()}`,
            kind: "success",
            title: `You sent ${args.amountBC} BC`,
            message: payload.receiver
              ? `Sent to ${getName(payload.receiver)}.`
              : "BuzzCoin sent successfully.",
          })
        );

        return;
      }

      if (amountMode === "request") {
        const payload = await createVideoCallBuzzCoinRequest({
          callId,
          amountBC: args.amountBC,
          note: args.note,
        });

        closeAll();

        // ✅ Requester sees request-sent confirmation only.
        // Only the OTHER user receives Accept / Reject from socket.
        showTimedBubble(
          makeLocalActionBubble({
            id: payload.request?.id || `${Date.now()}`,
            kind: "success",
            title: `Requested ${args.amountBC} BC`,
            message: payload.receiver
              ? `Request sent to ${getName(payload.receiver)}.`
              : "Request sent successfully.",
          })
        );
      }
    } catch (err: any) {
      const msg = err?.message || "Request failed";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

   const acceptRequest = async () => {
    if (!currentRequestId || loading || !currentUserCanRespondToRequest) return;

    try {
      setLoading(true);
         const payload = await acceptVideoCallBuzzCoinRequest(currentRequestId);
      refreshWalletBalance();

      // ✅ Receiver/payer sees payer-side confirmation.
      showTimedBubble(
        makeLocalActionBubble({
          id: payload.transactionId || `${Date.now()}`,
          kind: "accepted",
          title: `You sent ${payload.amountBC} BC`,
          message: payload.requester
            ? `Sent to ${getName(payload.requester)}.`
            : "Request accepted.",
        })
      );
    } catch (err: any) {
      showErrorBubble(err?.message || "Could not accept request");
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async () => {
    if (!currentRequestId || loading || !currentUserCanRespondToRequest) return;

    try {
      setLoading(true);
      const payload = await rejectVideoCallBuzzCoinRequest(currentRequestId);

      // ✅ Receiver sees local rejected confirmation.
      showTimedBubble(
        makeLocalActionBubble({
          id: payload.request?.id || `${Date.now()}`,
          kind: "rejected",
          title: "Request rejected",
          message: "No BuzzCoin was moved.",
        })
      );
    } catch (err: any) {
      showErrorBubble(err?.message || "Could not reject request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible || !callId) return;

    let mounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const socket = await getSocket();
      if (!mounted) return;

      const handleGiftReceived = (payload: VideoCallGiftPayload) => {
        if (String(payload?.callId || "") !== String(callId)) return;

        const next = makeBubbleFromPayload({
          ...payload,
          type: payload.type || "video_call_gift_send",
        });

        if (next) setLiveBubble(next);
      };

      const handleRequestReceived = (payload: VideoCallGiftPayload) => {
        if (String(payload?.callId || "") !== String(callId)) return;

        const next = makeBubbleFromPayload({
          ...payload,
          type: payload.type || "video_call_request_create",
        });

        if (next) setLiveBubble(next);
      };

      const handleAccepted = (payload: VideoCallGiftPayload) => {
        if (String(payload?.callId || "") !== String(callId)) return;

        const next = makeBubbleFromPayload({
          ...payload,
          type: payload.type || "video_call_request_accept",
        });

        if (next) {
          setLiveBubble(next);
          setTimeout(() => {
            setLiveBubble((current) => (current?.id === next.id ? null : current));
          }, 4200);
        }
      };

      const handleRejected = (payload: VideoCallGiftPayload) => {
        if (String(payload?.callId || "") !== String(callId)) return;

        const next = makeBubbleFromPayload({
          ...payload,
          type: payload.type || "video_call_request_reject",
        });

        if (next) {
          setLiveBubble(next);
          setTimeout(() => {
            setLiveBubble((current) => (current?.id === next.id ? null : current));
          }, 4200);
        }
      };

      socket.on("video-call-gift:received", handleGiftReceived);
      socket.on("video-call-gift-request:received", handleRequestReceived);
      socket.on("video-call-gift-request:accepted", handleAccepted);
      socket.on("video-call-gift-request:rejected", handleRejected);

      cleanup = () => {
        socket.off("video-call-gift:received", handleGiftReceived);
        socket.off("video-call-gift-request:received", handleRequestReceived);
        socket.off("video-call-gift-request:accepted", handleAccepted);
        socket.off("video-call-gift-request:rejected", handleRejected);
      };
    })();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [visible, callId]);

  if (!visible) return null;

  if (inline) {
    return (
      <>
        <VideoCallGiftButton
          visible={showButton}
          inline
          onPress={() => {
            setMenuOpen((prev) => !prev);
            setErrorMessage("");
          }}
        />

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <VideoCallGiftBubbleMenu
            visible={showMenu}
            onClose={() => setMenuOpen(false)}
            onSendPress={() => {
              setMenuOpen(false);
              setAmountMode("send");
              setErrorMessage("");
            }}
            onRequestPress={() => {
              setMenuOpen(false);
              setAmountMode("request");
              setErrorMessage("");
            }}
            style={{ bottom: menuBottom }}
          />
          <VideoCallGiftAmountBubble
            visible={!!amountMode}
            mode={amountMode || "send"}
            loading={loading}
            errorMessage={errorMessage}
            walletBalanceBC={walletBalanceBC}
            walletLoading={walletLoading}
            onSubmit={submitAmount}
            onClose={closeAmount}
            onBuyBuzzCoin={() => {
              closeAll();

              // Wallet currently lives from profile/settings work.
              // Change this route later if you create a dedicated wallet page.
              router.push("/(tabs)/profile");
            }}
            style={{ bottom: keyboardSafeAmountBottom }}
          />

          <VideoCallGiftLiveBubble
            visible={showLiveBubble}
            kind={liveBubble?.kind || "gift"}
            title={liveBubble?.title || ""}
            message={liveBubble?.message || ""}
            note={liveBubble?.note || ""}
            loading={loading}
            onAccept={currentUserCanRespondToRequest ? acceptRequest : undefined}
            onReject={currentUserCanRespondToRequest ? rejectRequest : undefined}
            onClose={() => setLiveBubble(null)}
            style={{ bottom: keyboardSafeLiveBottom }}
          />
        </View>
      </>
    );
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <VideoCallGiftButton
        visible={showButton}
        onPress={() => {
          setMenuOpen((prev) => !prev);
          setErrorMessage("");
        }}
        style={{ bottom: bottomOffset }}
      />

      <VideoCallGiftBubbleMenu
        visible={showMenu}
        onClose={() => setMenuOpen(false)}
        onSendPress={() => {
          setMenuOpen(false);
          setAmountMode("send");
          setErrorMessage("");
        }}
        onRequestPress={() => {
          setMenuOpen(false);
          setAmountMode("request");
          setErrorMessage("");
        }}
        style={{ bottom: menuBottom }}
      />

               <VideoCallGiftAmountBubble
        visible={!!amountMode}
        mode={amountMode || "send"}
        loading={loading}
        errorMessage={errorMessage}
        walletBalanceBC={walletBalanceBC}
        walletLoading={walletLoading}
        onSubmit={submitAmount}
        onClose={closeAmount}
        onBuyBuzzCoin={() => {
          closeAll();

          // Wallet currently lives from profile/settings work.
          // Change this route later if you create a dedicated wallet page.
          router.push("/(tabs)/profile");
        }}
        style={{ bottom: keyboardSafeAmountBottom }}
      />

      <VideoCallGiftLiveBubble
        visible={showLiveBubble}
        kind={liveBubble?.kind || "gift"}
        title={liveBubble?.title || ""}
        message={liveBubble?.message || ""}
        note={liveBubble?.note || ""}
        loading={loading}
        onAccept={currentUserCanRespondToRequest ? acceptRequest : undefined}
        onReject={currentUserCanRespondToRequest ? rejectRequest : undefined}
        onClose={() => setLiveBubble(null)}
        style={{ bottom: keyboardSafeLiveBottom }}
      />
    </View>
  );
}
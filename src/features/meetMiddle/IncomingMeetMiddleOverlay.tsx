// src/features/meetMiddle/IncomingMeetMiddleOverlay.tsx
//
// RomBuzz Meet in the Middle global incoming request overlay.
//
// Purpose:
// - Listens globally for meetMiddle:request:received.
// - Shows Kylie a popup anywhere inside the running app.
// - Accept / Reject works from the popup.
// - Opens /meet-middle/[peerId] after accept.
// - Keeps app/chat/[peerId].tsx clean.
// - Socket popup only works while app process/socket is alive.
//   Closed/killed app support requires Expo push notification later.

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MeetMiddleMiniLogo from "@/src/components/meetMiddle/MeetMiddleMiniLogo";
import { getSocket } from "@/src/lib/socket";
import { postMeetMiddleRequestAction } from "@/src/features/meetMiddle/meetMiddleRequestApi";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#fff5f8",
  line: "rgba(177,18,60,0.16)",
};

type IncomingMeetRequest = {
  sessionId: string;
  peerId: string;
  peerName: string;
  peerAvatar: string;
  expiresAt?: string | number;
};

function defaultAvatar(name: string) {
  const seed = encodeURIComponent(name || "RomBuzz");
  return `https://ui-avatars.com/api/?name=${seed}&background=b1123c&color=fff&bold=true`;
}

function getPeerName(from: any) {
  const first = String(from?.firstName || "").trim();
  const last = String(from?.lastName || "").trim();
  const full = [first, last].filter(Boolean).join(" ").trim();

  return (
    full ||
    String(from?.name || "").trim() ||
    "Someone"
  );
}

function getPeerAvatar(from: any, name: string) {
  return (
    String(from?.avatar || "").trim() ||
    String(from?.photoUrl || "").trim() ||
    String(from?.photos?.[0] || "").trim() ||
    defaultAvatar(name)
  );
}

function normalizeIncomingMeetRequest(payload: any): IncomingMeetRequest | null {
  const session = payload?.session || payload?.data?.session || null;
  const from = payload?.from || payload?.sender || payload?.data?.from || null;
  const chatMessage = payload?.chatMessage || payload?.messageObject || payload?.data?.chatMessage || null;
  const request = chatMessage?.meetMiddleRequest || null;

  const sessionId = String(
    payload?.sessionId ||
      request?.sessionId ||
      session?.sessionId ||
      ""
  ).trim();

  const peerId = String(
    from?.id ||
      from?._id ||
      request?.fromUserId ||
      session?.requestedBy ||
      ""
  ).trim();

  if (!sessionId || !peerId) return null;

  const peerName =
    String(request?.fromName || "").trim() ||
    getPeerName(from);

  const peerAvatar =
    String(request?.fromAvatar || "").trim() ||
    getPeerAvatar(from, peerName);

  return {
    sessionId,
    peerId,
    peerName,
    peerAvatar,
    expiresAt: request?.expiresAt || session?.expiresAt,
  };
}

export default function IncomingMeetMiddleOverlay() {
  const [incoming, setIncoming] = useState<IncomingMeetRequest | null>(null);
  const [busy, setBusy] = useState<"" | "accept" | "decline">("");

  const avatar = useMemo(() => {
    if (!incoming) return defaultAvatar("RomBuzz");
    return incoming.peerAvatar || defaultAvatar(incoming.peerName);
  }, [incoming]);

  useEffect(() => {
    let alive = true;
    let socket: any = null;

    const onIncomingMeetRequest = async (payload: any) => {
      const next = normalizeIncomingMeetRequest(payload);
      if (!next || !alive) return;

      setIncoming(next);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    };

    const closeIfSameSession = (payload: any) => {
      const sessionId = String(
        payload?.sessionId ||
          payload?.session?.sessionId ||
          payload?.chatMessage?.meetMiddleRequest?.sessionId ||
          payload?.message?.meetMiddleRequest?.sessionId ||
          ""
      ).trim();

      if (!sessionId) return;

      setIncoming((prev) => {
        if (!prev) return prev;
        if (String(prev.sessionId) !== sessionId) return prev;
        return null;
      });
    };

    (async () => {
      try {
        socket = await getSocket();
        if (!alive || !socket) return;

        socket.on("meetMiddle:request:received", onIncomingMeetRequest);
        socket.on("meetMiddle:cancelled", closeIfSameSession);
        socket.on("meetMiddle:declined", closeIfSameSession);
        socket.on("meetMiddle:accepted", closeIfSameSession);
        socket.on("meetMiddle:expired", closeIfSameSession);
      } catch {}
    })();

    return () => {
      alive = false;

      if (!socket) return;

      socket.off("meetMiddle:request:received", onIncomingMeetRequest);
      socket.off("meetMiddle:cancelled", closeIfSameSession);
      socket.off("meetMiddle:declined", closeIfSameSession);
      socket.off("meetMiddle:accepted", closeIfSameSession);
      socket.off("meetMiddle:expired", closeIfSameSession);
    };
  }, []);

  const reject = async () => {
    if (!incoming?.sessionId || busy) return;

    setBusy("decline");

    try {
      await postMeetMiddleRequestAction(incoming.sessionId, "decline");
      setIncoming(null);
    } finally {
      setBusy("");
    }
  };

  const accept = async () => {
    if (!incoming?.sessionId || busy) return;

    const snapshot = incoming;
    setBusy("accept");

    try {
      await postMeetMiddleRequestAction(snapshot.sessionId, "accept");

      setIncoming(null);

      router.push({
        pathname: "/meet-middle/[peerId]" as any,
        params: {
          peerId: snapshot.peerId,
          name: snapshot.peerName,
          avatar: snapshot.peerAvatar,
          sessionId: snapshot.sessionId,
          stage: "location-consent",
          source: "incoming-popup",
        },
      });
    } finally {
      setBusy("");
    }
  };

  return (
    <Modal
      visible={!!incoming}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={reject}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LinearGradient
            colors={["#FFFFFF", "#FFF3F7"]}
            style={styles.innerCard}
          >
            <View style={styles.logoWrap}>
              <MeetMiddleMiniLogo size={74} />
            </View>

            <Image source={{ uri: avatar }} style={styles.avatar} />

            <Text style={styles.title}>Meet in the Middle?</Text>

            <Text style={styles.subtitle}>
              {incoming?.peerName || "Someone"} wants to find a romantic halfway spot with you.
            </Text>

            {busy ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={RBZ.c2} />
                <Text style={styles.loadingText}>
                  {busy === "accept" ? "Accepting..." : "Rejecting..."}
                </Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                onPress={reject}
                disabled={!!busy}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.rejectButton,
                  pressed && !busy ? styles.pressed : null,
                  busy ? styles.disabled : null,
                ]}
              >
                <Ionicons name="close" size={20} color={RBZ.c1} />
                <Text style={styles.rejectText}>Reject</Text>
              </Pressable>

              <Pressable
                onPress={accept}
                disabled={!!busy}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.acceptButton,
                  pressed && !busy ? styles.pressed : null,
                  busy ? styles.disabled : null,
                ]}
              >
                <Ionicons name="heart" size={19} color={RBZ.white} />
                <Text style={styles.acceptText}>Accept</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.42)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  card: {
    width: "100%",
    maxWidth: 410,
    borderRadius: 34,
    backgroundColor: "#fff",
    shadowColor: "#b1123c",
    shadowOpacity: 0.22,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 18,
  },
  innerCard: {
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.14)",
    marginBottom: 14,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#f3f4f6",
    marginTop: -34,
    marginBottom: 14,
  },
  title: {
    color: RBZ.ink,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    color: "#5b2536",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "center",
  },
  loadingRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  loadingText: {
    color: RBZ.c1,
    fontSize: 13,
    fontWeight: "900",
  },
  actions: {
    marginTop: 22,
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  rejectButton: {
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.16)",
  },
  acceptButton: {
    backgroundColor: RBZ.c2,
    shadowColor: RBZ.c2,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  rejectText: {
    color: RBZ.c1,
    fontSize: 14,
    fontWeight: "900",
  },
  acceptText: {
    color: RBZ.white,
    fontSize: 14,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.62,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
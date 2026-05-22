/**
 * ============================================================
 * 📁 File: src/features/videoCall/IncomingCallOverlay.tsx
 * 🎥 Purpose: Global incoming video call modal for RomBuzz.
 *
 * Used by:
 *   - app/(tabs)/_layout.tsx later
 *
 * What it does:
 *   - Listens for video-call:incoming socket event.
 *   - Shows Accept / Decline modal.
 *   - Accept calls backend, gets Agora token, then opens video call screen.
 *
 * What it does NOT do:
 *   - It does not render Agora video.
 *   - The actual call screen lives in app/video-call/[callId].tsx.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  acceptVideoCall,
  declineVideoCall,
} from "@/src/features/videoCall/videoCallApi";
import {
  getVideoCallPeerAvatar,
  getVideoCallPeerName,
  type VideoCallSession,
} from "@/src/features/videoCall/videoCallTypes";
import { useVideoCallSocket } from "@/src/features/videoCall/useVideoCallSocket";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
};

function defaultAvatar(name: string) {
  const seed = encodeURIComponent(name || "RomBuzz");
  return `https://ui-avatars.com/api/?name=${seed}&background=b1123c&color=fff&bold=true`;
}

export default function IncomingCallOverlay() {
  const router = useRouter();

  const [myId, setMyId] = useState("");
  const [incomingCall, setIncomingCall] = useState<VideoCallSession | null>(null);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const raw = await SecureStore.getItemAsync("RBZ_USER");
        const user = raw ? JSON.parse(raw) : null;
        const id = String(user?.id || user?._id || "");
        if (alive) setMyId(id);
      } catch {
        if (alive) setMyId("");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const peerName = useMemo(
    () => getVideoCallPeerName(incomingCall, myId),
    [incomingCall, myId]
  );

  const avatar = useMemo(() => {
    return getVideoCallPeerAvatar(incomingCall, myId) || defaultAvatar(peerName);
  }, [incomingCall, myId, peerName]);

  const closeIfSameCall = useCallback((call: VideoCallSession) => {
    setIncomingCall((prev) => {
      if (!prev) return prev;
      if (String(prev.id) !== String(call.id)) return prev;
      return null;
    });
  }, []);

  useVideoCallSocket({
    onIncoming: (payload) => {
      if (!payload?.call?.id) return;

      setIncomingCall(payload.call);
    },
    onCanceled: (payload) => {
      if (payload?.call) closeIfSameCall(payload.call);
    },
    onEnded: (payload) => {
      if (payload?.call) closeIfSameCall(payload.call);
    },
    onMissed: (payload) => {
      if (payload?.call) closeIfSameCall(payload.call);
    },
    onDeclined: (payload) => {
      if (payload?.call) closeIfSameCall(payload.call);
    },
  });

  const decline = async () => {
    if (!incomingCall?.id || busy) return;

    const callId = incomingCall.id;

    setBusy(true);
    try {
      await declineVideoCall(callId);
      setIncomingCall(null);
    } catch (err: any) {
      Alert.alert("Video call", err?.message || "Could not decline the call.");
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!incomingCall?.id || busy) return;

    const callId = incomingCall.id;

    setBusy(true);
    try {
      const result = await acceptVideoCall(callId);

      setIncomingCall(null);

      router.push({
        pathname: "../video-call/[callId]",
        params: {
          callId: result.call.id,
          channelName: result.call.channelName,
          appId: result.token?.appId || "",
          token: result.token?.token || "",
          uid: result.token?.uid || "",
          role: "receiver",
        },
      });
    } catch (err: any) {
      const msg = String(err?.message || "");

      if (err?.status === 410 || msg.includes("call_missed")) {
        setIncomingCall(null);
        Alert.alert("Missed call", "This call already expired.");
        return;
      }

      Alert.alert("Video call", msg || "Could not accept the call.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={!!incomingCall}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={decline}
    >
      <View style={styles.backdrop}>
        <LinearGradient
          colors={["rgba(177,18,60,0.98)", "rgba(181,23,158,0.96)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="videocam" size={26} color={RBZ.white} />
          </View>

          <Image source={{ uri: avatar }} style={styles.avatar} />

          <Text style={styles.title}>{peerName}</Text>
          <Text style={styles.subtitle}>Incoming RomBuzz video call</Text>

          {busy ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.loadingText}>Connecting...</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={decline}
              disabled={busy}
              style={({ pressed }) => [
                styles.roundButton,
                styles.declineButton,
                pressed && !busy ? styles.pressed : null,
                busy ? styles.disabled : null,
              ]}
            >
              <Ionicons name="call" size={28} color="#fff" style={styles.flipIcon} />
            </Pressable>

            <Pressable
              onPress={accept}
              disabled={busy}
              style={({ pressed }) => [
                styles.roundButton,
                styles.acceptButton,
                pressed && !busy ? styles.pressed : null,
                busy ? styles.disabled : null,
              ]}
            >
              <Ionicons name="videocam" size={30} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.labels}>
            <Text style={styles.labelText}>Decline</Text>
            <Text style={styles.labelText}>Accept</Text>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  card: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    marginBottom: 16,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  title: {
    marginTop: 16,
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.84)",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  actions: {
    marginTop: 30,
    width: "72%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roundButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  declineButton: {
    backgroundColor: "#ef4444",
  },
  acceptButton: {
    backgroundColor: "#22c55e",
  },
  pressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.55,
  },
  flipIcon: {
    transform: [{ rotate: "135deg" }],
  },
  labels: {
    marginTop: 10,
    width: "72%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelText: {
    width: 72,
    textAlign: "center",
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: "800",
  },
});
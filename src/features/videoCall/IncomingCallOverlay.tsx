/**
 * 📁 File: src/features/videoCall/IncomingCallOverlay.tsx
 * 🎥 Purpose: Full-screen incoming RomBuzz video-call prompt.
 * Used by: app/(tabs)/_layout.tsx.
 * Actions: Accepts or declines an incoming call through the existing API.
 */

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useVideoCallSocket } from "@/src/features/videoCall/useVideoCallSocket";
import {
  acceptVideoCall,
  declineVideoCall,
} from "@/src/features/videoCall/videoCallApi";
import {
  getVideoCallPeerAvatar,
  getVideoCallPeerName,
  type VideoCallSession,
} from "@/src/features/videoCall/videoCallTypes";
import IncomingCallActions from "./IncomingCallActions";
import { incomingCallStyles as styles } from "./incomingCallOverlayStyles";

function defaultAvatar(name: string) {
  const seed = encodeURIComponent(name || "RomBuzz");
  return `https://ui-avatars.com/api/?name=${seed}&background=b1123c&color=fff&bold=true`;
}

export default function IncomingCallOverlay() {
  const router = useRouter();
  const [myId, setMyId] = useState("");
  const [incomingCall, setIncomingCall] = useState<VideoCallSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [failedAvatarUri, setFailedAvatarUri] = useState("");
  const dismissedCalls = useRef(new Set<string>());

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync("RBZ_USER");
        const user = raw ? JSON.parse(raw) : null;
        if (alive) setMyId(String(user?.id || user?._id || ""));
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
    [incomingCall, myId],
  );
  const avatar = useMemo(
    () => getVideoCallPeerAvatar(incomingCall, myId) || defaultAvatar(peerName),
    [incomingCall, myId, peerName],
  );
  const fallbackAvatar = useMemo(() => defaultAvatar(peerName), [peerName]);
  const renderedAvatar = failedAvatarUri === avatar ? fallbackAvatar : avatar;

  const closeIfSameCall = useCallback((call: VideoCallSession) => {
    dismissedCalls.current.add(String(call.id));
    setIncomingCall((previous) =>
      previous && String(previous.id) === String(call.id) ? null : previous,
    );
  }, []);

  useVideoCallSocket({
    onIncoming: (payload) => {
      const call = payload?.call;
      if (!call?.id || dismissedCalls.current.has(String(call.id))) return;
      if (call.status !== "ringing") return;
      setIncomingCall(call);
    },
    onAccepted: (payload) => payload?.call && closeIfSameCall(payload.call),
    onCanceled: (payload) => payload?.call && closeIfSameCall(payload.call),
    onEnded: (payload) => payload?.call && closeIfSameCall(payload.call),
    onMissed: (payload) => payload?.call && closeIfSameCall(payload.call),
    onDeclined: (payload) => payload?.call && closeIfSameCall(payload.call),
  });

  const decline = async () => {
    if (!incomingCall?.id || busy) return;
    setBusy(true);
    try {
      await declineVideoCall(incomingCall.id);
      closeIfSameCall(incomingCall);
    } catch (err: any) {
      Alert.alert("Video call", err?.message || "Could not decline the call.");
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!incomingCall?.id || busy) return;
    setBusy(true);
    try {
      const result = await acceptVideoCall(incomingCall.id);
      closeIfSameCall(incomingCall);
      router.push({
        pathname: "/video-call/[callId]",
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
      const message = String(err?.message || "");
      if (err?.status === 410 || message.includes("call_missed")) {
        setIncomingCall(null);
        Alert.alert("Missed call", "This call already expired.");
        return;
      }
      Alert.alert("Video call", message || "Could not accept the call.");
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
        <Image
          source={{ uri: renderedAvatar }}
          blurRadius={18}
          resizeMode="cover"
          style={styles.backgroundImage}
          onError={() => {
            if (renderedAvatar === avatar) setFailedAvatarUri(avatar);
          }}
        />
        <LinearGradient
          colors={["rgba(15,12,24,0.20)", "rgba(15,12,24,0.62)"]}
          style={styles.scrim}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <View style={styles.incomingPill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>INCOMING VIDEO CALL</Text>
            </View>
          </View>

                   <View style={styles.profileArea}>
            <View style={styles.avatarGlow}>
              <Image source={{ uri: renderedAvatar }} style={styles.avatar} />
            </View>
            <Text style={styles.videoLabel}>ROMBUZZ CALL</Text>
            <Text numberOfLines={2} style={styles.title}>{peerName}</Text>
            <Text style={styles.subtitle}>is calling you</Text>
            {busy ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.loadingText}>Connecting…</Text>
              </View>
            ) : null}
          </View>

          <IncomingCallActions
            busy={busy}
            onDecline={decline}
            onAnswer={accept}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}
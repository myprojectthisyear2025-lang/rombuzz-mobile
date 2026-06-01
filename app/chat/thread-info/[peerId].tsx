/**
 * ============================================================
 * File: app/chat/thread-info/[peerId].tsx
 * Screen: RomBuzz Chat Thread Info - Premium UI
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';

import ChatGiftInsightsSheet from "@/src/components/chat/ChatGiftInsightsSheet";
import GiftPicker from "@/src/components/gifts/GiftPicker";
import RBZReportSheet from "@/src/components/reporting/RBZReportSheet";
import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";
import { startVideoCall } from "@/src/features/videoCall/videoCallApi";
import MeetMiddleMiniLogo from "@/src/components/meetMiddle/MeetMiddleMiniLogo";

const { width } = Dimensions.get('window');

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#f5f6fa",
  line: "rgba(0,0,0,0.08)",
  success: "#10b981",
  warning: "#f59e0b",
};

function makeRoomId(a: string, b: string) {
  return [String(a), String(b)].sort().join("_");
}

const nickKey = (meId: string, peerId: string) =>
  meId && peerId ? `RBZ_nick_${meId}_${peerId}` : "";

const toneKey = (meId: string, peerId: string) =>
  meId && peerId ? `RBZ_tone_${meId}_${peerId}` : "";

const hiddenKey = (meId: string) =>
  meId ? `RBZ_chat_hidden_${meId}` : "";

async function getJSON(key: string, fallback: any) {
  try {
    const v = await SecureStore.getItemAsync(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

async function setJSON(key: string, val: any) {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(val));
  } catch {}
}

type MediaItem = { id: string; url: string };

export default function ThreadInfo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    peerId: string;
    name?: string;
    avatar?: string;
  }>();

  const peerId = String(params.peerId || "");
  const baseName = String(params.name || "RomBuzz User");
  const avatar = String(params.avatar || "https://i.pravatar.cc/200?img=12");

  const [me, setMe] = useState<any>(null);
  const myId = useMemo(() => String(me?.id || me?._id || ""), [me]);
  const roomId = useMemo(() => makeRoomId(myId, peerId), [myId, peerId]);

  const [nickname, setNickname] = useState("");
  const [draftNick, setDraftNick] = useState("");
  const [editingNick, setEditingNick] = useState(false);

  const displayName = nickname.trim() ? nickname.trim() : baseName;

     const [tone, setTone] = useState<"default" | "soft" | "loud">("default");

     const [media, setMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [pinnedCount, setPinnedCount] = useState(0);
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [giftInsightsOpen, setGiftInsightsOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(false);
  const [startingVideoCall, setStartingVideoCall] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync("RBZ_USER");
      const u = raw ? JSON.parse(raw) : null;
      setMe(u);
    })();
  }, []);

   useEffect(() => {
    if (!myId || !peerId) return;

    const nk = nickKey(myId, peerId);
    const tk = toneKey(myId, peerId);
    if (!nk || !tk) return;

    (async () => {
      const n = (await SecureStore.getItemAsync(nk)) || "";
      setNickname(n);
      setDraftNick(n);

      const t = (await SecureStore.getItemAsync(tk)) as any;
      if (t === "soft" || t === "loud" || t === "default") setTone(t);
    })();
  }, [myId, peerId]);

    useEffect(() => {
    if (!peerId) return;

    let alive = true;

    const loadBlockStatus = async () => {
      setCheckingBlockStatus(true);

      try {
        const token = await SecureStore.getItemAsync("RBZ_TOKEN");

        const r = await fetch(`${API_BASE}/users/blocks`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const j = await r.json().catch(() => ({}));

        const rawList =
          Array.isArray(j)
            ? j
            : Array.isArray(j?.blocked)
              ? j.blocked
              : Array.isArray(j?.blocks)
                ? j.blocks
                : Array.isArray(j?.users)
                  ? j.users
                  : [];

        const blockedNow = rawList.some((item: any) => {
          const id = String(
            item?.id ||
              item?._id ||
              item?.userId ||
              item?.blockedUserId ||
              item?.blocked ||
              item ||
              ""
          );

          return id === String(peerId);
        });

        if (alive) setIsBlocked(blockedNow);
      } catch {
        if (alive) setIsBlocked(false);
      } finally {
        if (alive) setCheckingBlockStatus(false);
      }
    };

    loadBlockStatus();

    return () => {
      alive = false;
    };
  }, [peerId]);

  const confirmNickname = async () => {
    if (!myId || !peerId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const next = draftNick.trim();
    setNickname(next);
    setEditingNick(false);

    const key = nickKey(myId, peerId);
    if (!key) return;

    await SecureStore.setItemAsync(key, next);
    globalThis.dispatchEvent?.(
      new CustomEvent("rbz:nickname:update", {
        detail: { peerId, nickname: next },
      })
    );
  };

  const cancelNickname = () => {
    setDraftNick(nickname);
    setEditingNick(false);
  };

  const saveTone = async (next: "default" | "soft" | "loud") => {
    if (!myId || !peerId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTone(next);

    const key = toneKey(myId, peerId);
    if (!key) return;

    await SecureStore.setItemAsync(key, next);
  };

  const loadMedia = async () => {
    if (!myId || !peerId) return;
    setLoadingMedia(true);
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(`${API_BASE}/chat/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();

      const list = Array.isArray(data) ? data : [];
      const picked = list
        .map((m: any): MediaItem | null => {
          const id = String(m?.id || m?._id || "");
          const url = String(m?.url || m?.mediaUrl || "");
          const type = String(m?.type || "");
          const isMedia = type === "media" || !!url;

          if (!id || !isMedia || !url) return null;
          return { id, url };
        })
        .filter((x): x is MediaItem => x !== null)
        .slice(-60)
        .reverse();

      const pinned = list.filter(
        (m: any) => !!m?.pinned && !m?.deleted && !m?._temp
      ).length;

      setMedia(picked);
      setPinnedCount(pinned);
    } catch {
      setMedia([]);
      setPinnedCount(0);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (!myId || !peerId) return;
    loadMedia();
  }, [myId, peerId]);

  useEffect(() => {
    if (!roomId) return;

    let alive = true;
    let s: any;

    const onPin = (payload: any) => {
      const nextRoomId = String(payload?.roomId || "");
      if (nextRoomId && nextRoomId !== roomId) return;
      loadMedia();
    };

    (async () => {
      s = await getSocket();
      if (!alive || !s) return;
      s.on("message:pin", onPin);
      s.on("chat:pin", onPin);
    })();

    return () => {
      alive = false;
      if (!s) return;
      s.off("message:pin", onPin);
      s.off("chat:pin", onPin);
    };
  }, [roomId, myId, peerId]);

   const openViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(tabs)/view-profile" as any,
      params: {
        userId: peerId,
        fromChat: "1",
        returnTo: `/chat/${peerId}`,
      },
    });
  };

    const handleStartVideoCall = async () => {
    if (!peerId || startingVideoCall) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStartingVideoCall(true);

    try {
      const result = await startVideoCall(peerId);

      router.push({
        pathname: "/video-call/[callId]",
        params: {
          callId: result.call.id,
          channelName: result.call.channelName,
          appId: result.token?.appId || "",
          token: result.token?.token || "",
          uid: result.token?.uid || "",
          role: "caller",
        },
      });
    } catch (err: any) {
      Alert.alert(
        "Video call",
        err?.message || "Could not start the video call."
      );
    } finally {
      setStartingVideoCall(false);
    }
  };

  const blockUser = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(`${API_BASE}/users/blocks/${peerId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setIsBlocked(true);
        Alert.alert("Blocked", `${displayName} is blocked.`);
      } else Alert.alert("Block failed", j?.error || "Try again");
    } catch {
      Alert.alert("Block failed", "Try again");
    }
  };

  const unblockUser = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(`${API_BASE}/users/blocks/${peerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setIsBlocked(false);
        Alert.alert("Unblocked", `${displayName} is unblocked.`);
      } else Alert.alert("Unblock failed", j?.error || "Try again");
    } catch {
      Alert.alert("Unblock failed", "Try again");
    }
  };

   const reportUser = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setReportSheetOpen(true);
  };

  const deleteChatForMe = async () => {
    if (!myId || !peerId) return;

    const k = hiddenKey(myId);
    if (!k) return;

    const hidden: string[] = await getJSON(k, []);
    const next = Array.from(new Set([...(hidden || []), peerId]));
    await setJSON(k, next);

    Alert.alert("Deleted", "Chat removed from your list (for you only).");
    router.back();
  };

  const sendChatGiftMessage = async (payload: {
    giftId: string;
    transactionId: string;
    priceBC: number;
  }) => {
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
        throw new Error(data?.error || data?.message || "Gift sent, but chat message failed.");
      }
    } catch (err: any) {
      Alert.alert(
        "Gift message",
        err?.message || "Gift was sent, but the chat gift bubble could not be created."
      );
    }
  };

      const ActionBtn = ({
    icon,
    label,
    onPress,
    onLongPress,
    customIcon,
  }: {
    icon?: any;
    label: string;
    onPress: () => void;
    onLongPress?: () => void;
    customIcon?: React.ReactNode;
  }) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress?.();
      }}
      delayLongPress={260}
      style={({ pressed }) => [
        styles.actionBtn,
        pressed && styles.actionBtnPressed
      ]}
    >
      <LinearGradient
        colors={[RBZ.c2, RBZ.c4]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.actionIconWrap}
      >
        {customIcon ? customIcon : <Ionicons name={icon} size={20} color={RBZ.white} />}
      </LinearGradient>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );

  const Row = ({
    icon,
    title,
    sub,
    onPress,
    danger,
  }: {
    icon: any;
    title: string;
    sub?: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed
      ]}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <LinearGradient
          colors={danger ? [RBZ.c1, RBZ.c3] : [RBZ.c4, RBZ.c2]}
          style={styles.rowIconGradient}
        >
          <Ionicons name={icon} size={18} color={RBZ.white} />
        </LinearGradient>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={RBZ.gray} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[RBZ.c1, RBZ.c4, RBZ.c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.backBtnPressed
          ]}
        >
          <Ionicons name="arrow-back" size={22} color={RBZ.white} />
        </Pressable>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={() =>
            Alert.alert("More", "More options can live here later (mutual settings, etc).")
          }
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.backBtnPressed
          ]}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={RBZ.white} />
        </Pressable>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Premium Profile Card */}
        <View style={styles.cardPremium}>
          <Pressable
            onPress={openViewProfile}
            style={({ pressed }) => [
              styles.identity,
              pressed && styles.identityPressed
            ]}
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatar }} style={styles.bigAvatar} />
              <LinearGradient
                colors={["transparent", RBZ.c1]}
                style={styles.avatarOverlay}
              />
              <View style={styles.onlineBadge} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.matchBadge}>
                <Ionicons name="heart" size={12} color={RBZ.c1} />
                <Text style={styles.matchText}>RomBuzz Match</Text>
              </View>
            </View>
            <View style={styles.profileArrow}>
              <Ionicons name="arrow-forward" size={18} color={RBZ.white} />
            </View>
          </Pressable>

               <View style={styles.actionsRow}>
            <ActionBtn
              label="Meet"
              customIcon={<MeetMiddleMiniLogo size={23} />}
              onPress={() =>
                router.push({
                  pathname: "/meet-middle/[peerId]" as any,
                  params: { peerId, name: displayName, avatar },
                })
              }
            />
            <ActionBtn
              icon="gift"
              label="Gift"
              onPress={() => setGiftPickerOpen(true)}
              onLongPress={() => setGiftInsightsOpen(true)}
            />
            <ActionBtn
              icon="videocam"
              label={startingVideoCall ? "Calling..." : "Video"}
              onPress={handleStartVideoCall}
            />
          </View>
        </View>

        {/* Nickname Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[RBZ.c4, RBZ.c2]}
              style={styles.sectionIcon}
            >
              <Ionicons name="pricetag" size={16} color={RBZ.white} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Custom Nickname</Text>
          </View>
          <Text style={styles.sectionHint}>
            Only you see this name in your chat list & header
          </Text>

          <View style={styles.nickRow}>
            <View style={styles.nickInputContainer}>
              <Ionicons name="person-outline" size={18} color={RBZ.c4} />
              <TextInput
                value={draftNick}
                onFocus={() => setEditingNick(true)}
                onChangeText={setDraftNick}
                placeholder={`Set a nickname for ${baseName}`}
                placeholderTextColor={RBZ.gray}
                style={styles.nickInput}
              />
            </View>

            {editingNick ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={cancelNickname} style={styles.cancelBtn}>
                  <Ionicons name="close" size={16} color={RBZ.white} />
                </Pressable>
                <Pressable onPress={confirmNickname} style={styles.okBtn}>
                  <Ionicons name="checkmark" size={16} color={RBZ.white} />
                </Pressable>
              </View>
            ) : (
              !!nickname.trim() && (
                <Pressable
                  onPress={() => {
                    setDraftNick("");
                    setEditingNick(true);
                  }}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close" size={14} color={RBZ.white} />
                </Pressable>
              )
            )}
          </View>
        </View>

        {/* Media Sections */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/chat/shared-media/[peerId]" as any,
              params: { peerId, name: baseName, avatar },
            })
          }
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed
          ]}
        >
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <LinearGradient
                colors={[RBZ.c4, RBZ.c2]}
                style={styles.rowIconGradient}
              >
                <Ionicons name="images" size={18} color={RBZ.white} />
              </LinearGradient>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Shared Media</Text>
              <Text style={styles.rowSub}>Photos and videos in separate tabs</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={RBZ.gray} />
          </View>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/chat/purchased-media/[peerId]" as any,
              params: { peerId, name: baseName, avatar },
            })
          }
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed
          ]}
        >
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <LinearGradient
                colors={[RBZ.c1, RBZ.c3]}
                style={styles.rowIconGradient}
              >
                <Ionicons name="gift" size={18} color={RBZ.white} />
              </LinearGradient>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Purchased Media</Text>
              <Text style={styles.rowSub}>Purchased photos and videos in separate tabs</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={RBZ.gray} />
          </View>
        </Pressable>

        {/* Alert Tone Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[RBZ.c2, RBZ.c3]}
              style={styles.sectionIcon}
            >
              <Ionicons name="volume-high" size={16} color={RBZ.white} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Notification Tone</Text>
          </View>
          <View style={styles.tonesRow}>
            {(["default", "soft", "loud"] as const).map((t) => {
              const active = tone === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => saveTone(t)}
                  style={({ pressed }) => [
                    styles.toneChip,
                    active && styles.toneChipActive,
                    pressed && styles.toneChipPressed
                  ]}
                >
                  <Text style={[styles.toneText, active && styles.toneTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                  {active && (
                    <View style={styles.toneActiveDot} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Settings Section */}
        <View style={[styles.card, { paddingBottom: 14 + insets.bottom, marginBottom: 20 }]}>
          <Row
            icon="bookmark"
            title="Pinned messages"
            sub={
              pinnedCount === 0
                ? "No pinned messages yet"
                : pinnedCount === 1
                  ? "1 pinned message"
                  : `${pinnedCount} pinned messages`
            }
            onPress={() =>
              router.push({
                pathname: "/chat/pinned/[peerId]" as any,
                params: { peerId, name: baseName, avatar },
              })
            }
          />

                  <View style={styles.hr} />

          <Row
            icon={isBlocked ? "checkmark-circle" : "ban"}
            title={
              checkingBlockStatus
                ? "Checking block status..."
                : isBlocked
                  ? "Unblock"
                  : "Block"
            }
            sub={
              isBlocked
                ? "Allow messages again"
                : "Stop this user from contacting you"
            }
            onPress={isBlocked ? unblockUser : blockUser}
            danger={!isBlocked}
          />

          <Row
            icon="flag"
            title="Report"
            sub="Tell us what happened"
            onPress={reportUser}
            danger
          />

          <Row
            icon="trash"
            title="Delete chat"
            sub="Removes from your list (for you only)"
            onPress={() =>
              Alert.alert(
                "Delete chat",
                "Remove this chat from your list? This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: deleteChatForMe },
                ]
              )
            }
            danger
          />
        </View>
      </ScrollView>

      <GiftPicker
        visible={giftPickerOpen}
        onClose={() => setGiftPickerOpen(false)}
        receiverId={peerId}
        placement="chat"
        targetType="chat"
        targetId={roomId}
        title="Send a Gift"
        subtitle={`Send a gift to ${displayName}.`}
        onSent={sendChatGiftMessage}
      />

         <ChatGiftInsightsSheet
        visible={giftInsightsOpen}
        onClose={() => setGiftInsightsOpen(false)}
        myId={myId}
        peerId={peerId}
        roomId={roomId}
        peerName={displayName}
      />

      <RBZReportSheet
        visible={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        target={{
          targetType: "chat_conversation",
          targetId: roomId,
          reportedUserId: peerId,
          targetOwnerId: peerId,
          source: "mobile_chat_thread_info",
          title: displayName,
          subtitle: "Private chat conversation",
          avatar,
          evidenceSnapshot: {
            screen: "chat_thread_info",
            roomId,
            reportedUserId: peerId,
            reportedUserName: displayName,
            reportedUserAvatar: avatar,
            reporterUserId: myId,
            pinnedCount,
            sharedMediaCount: media.length,
            isBlocked,
          },
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RBZ.soft },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: RBZ.c1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
  },
  backBtnPressed: {
    backgroundColor: "rgba(255,255,255,0.25)",
    transform: [{ scale: 0.95 }],
  },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: RBZ.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPremium: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: RBZ.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: RBZ.c4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  identityPressed: {
    opacity: 0.8,
  },
  avatarContainer: {
    position: "relative",
  },
  bigAvatar: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: RBZ.soft,
    borderWidth: 3,
    borderColor: RBZ.white,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    borderBottomLeftRadius: 21,
    borderBottomRightRadius: 21,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: RBZ.success,
    borderWidth: 2,
    borderColor: RBZ.white,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: RBZ.ink,
    letterSpacing: -0.3,
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    backgroundColor: "rgba(177,18,60,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  matchText: {
    fontSize: 11,
    fontWeight: "700",
    color: RBZ.c1,
  },
  profileArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
  },

  actionsRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  actionBtnPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: "rgba(216,52,95,0.05)",
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: RBZ.c2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: { fontSize: 12, fontWeight: "700", color: RBZ.ink, marginTop: 4 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: RBZ.ink },
  sectionHint: { fontSize: 12, color: RBZ.gray, marginBottom: 12, lineHeight: 16 },

  nickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: RBZ.soft,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  nickInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nickInput: { flex: 1, fontSize: 14, fontWeight: "500", color: RBZ.ink, paddingVertical: 12 },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RBZ.gray,
    alignItems: "center",
    justifyContent: "center",
  },

  tonesRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  toneChip: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.soft,
    position: "relative",
  },
  toneChipActive: {
    backgroundColor: RBZ.c2,
    borderColor: RBZ.c2,
    shadowColor: RBZ.c2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  toneChipPressed: {
    transform: [{ scale: 0.97 }],
  },
  toneText: { fontSize: 13, fontWeight: "700", color: RBZ.ink },
  toneTextActive: { color: RBZ.white },
  toneActiveDot: {
    position: "absolute",
    bottom: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: RBZ.white,
  },

  hr: { height: 1, backgroundColor: RBZ.line, marginVertical: 8 },

  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowPressed: {
    opacity: 0.7,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: "hidden",
  },
  rowIconDanger: {
    shadowColor: RBZ.c1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rowIconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: RBZ.ink },
  rowTitleDanger: { color: RBZ.c1 },
  rowSub: { marginTop: 4, fontSize: 12, fontWeight: "500", color: RBZ.gray },

  okBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RBZ.success,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: RBZ.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RBZ.gray,
    alignItems: "center",
    justifyContent: "center",
  },
});
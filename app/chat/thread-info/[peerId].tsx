/**
 * ============================================================
 * 📁 File: app/chat/thread-info/[peerId].tsx
 * 🎯 Screen: RomBuzz — Chat “Tab” / Thread Info (matched-only UX)
 *
 * What this screen does:
 *  - Opens from chat header (tap name/avatar)
 *  - Shows avatar + name (tap → View Profile screen)
 *  - CTA row: Meet-in-the-middle, Gift, Video Call
 *  - Chat utilities:
 *      - Nickname (persistent, immediate)
 *      - Shared media grid (from room messages)
 *      - Pinned messages (v1 placeholder)
 *      - Shared gifts (v1 placeholder)
 *      - Alert tone (persistent)
 *      - Block / Report
 *      - Delete chat (hides chat from list, persistent)
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
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE } from "@/src/config/api";

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

  const [nickname, setNickname] = useState("");        // saved value
const [draftNick, setDraftNick] = useState("");      // editable value
const [editingNick, setEditingNick] = useState(false);

const displayName = nickname.trim() ? nickname.trim() : baseName;


  const [tone, setTone] = useState<"default" | "soft" | "loud">("default");

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Load me + settings
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


  // Persist nickname
const confirmNickname = async () => {
  if (!myId || !peerId) return;

  const next = draftNick.trim();
  setNickname(next);
  setEditingNick(false);

  const key = nickKey(myId, peerId);
  if (!key) return;

  await SecureStore.setItemAsync(key, next);
  globalThis.dispatchEvent?.(
  new CustomEvent("rbz:nickname:update", {
    detail: {
      peerId,
      nickname: next,
    },
  })
);


  // 🔔 notify chat screens instantly
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

  // Persist tone
  const saveTone = async (next: "default" | "soft" | "loud") => {
  if (!myId || !peerId) return;
  setTone(next);

  const key = toneKey(myId, peerId);
  if (!key) return;

  await SecureStore.setItemAsync(key, next);
};


  // Shared media from chat room messages
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


      setMedia(picked);
    } catch {
      setMedia([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (!myId || !peerId) return;
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, peerId]);

  const openViewProfile = () => {
    // If user came from chat thread info, they should always be allowed to view
    router.push({
      pathname: "/(tabs)/view-profile" as any,
      params: { userId: peerId, fromChat: "1" },
    });
  };


  // BLOCK / UNBLOCK (uses your backend users.js)
  const blockUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      // ⚠️ Your backend defines the exact path in users.js. If your path differs, tell me and I’ll adjust.
      const r = await fetch(`${API_BASE}/users/blocks/${peerId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) Alert.alert("Blocked", `${displayName} is blocked.`);
      else Alert.alert("Block failed", j?.error || "Try again");
    } catch {
      Alert.alert("Block failed", "Try again");
    }
  };

  const unblockUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const r = await fetch(`${API_BASE}/users/blocks/${peerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) Alert.alert("Unblocked", `${displayName} is unblocked.`);
      else Alert.alert("Unblock failed", j?.error || "Try again");
    } catch {
      Alert.alert("Unblock failed", "Try again");
    }
  };

  const reportUser = async () => {
    // Keeping this v1-safe: UI now, wire backend once you confirm your report endpoint.
    Alert.alert("Report sent", "Thanks. We’ll review this report.");
  };

  // Delete chat = hide from chat list (for me)
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

  const ActionBtn = ({
    icon,
    label,
    onPress,
  }: {
    icon: any;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable onPress={onPress} style={styles.actionBtn}>
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={18} color={RBZ.white} />
      </View>
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
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.rowIcon, danger ? { backgroundColor: "rgba(177,18,60,0.12)" } : null]}>
        <Ionicons name={icon} size={18} color={danger ? RBZ.c1 : RBZ.c4} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger ? { color: RBZ.c1 } : null]}>{title}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={RBZ.gray} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>
      <LinearGradient colors={[RBZ.c1, RBZ.c4]} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={RBZ.white} />
        </Pressable>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={() =>
            Alert.alert("More", "More options can live here later (mutual settings, etc).")
          }
          style={styles.backBtn}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={RBZ.white} />
        </Pressable>
      </LinearGradient>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Identity block */}
        <View style={styles.card}>
        <Pressable onPress={openViewProfile} style={styles.identity}>
          <Image source={{ uri: avatar }} style={styles.bigAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              RomBuzz chat • matched
            </Text>
          </View>
          <Ionicons name="open-outline" size={18} color={RBZ.c4} />
        </Pressable>

        {/* CTA row */}
              <View style={styles.actionsRow}>
          <ActionBtn
            icon="navigate-outline"
            label="Meet"
            onPress={() =>
              router.push({
                pathname: "/meet-in-middle/[peerId]" as any,
                params: { peerId, name: baseName, avatar },
              })
            }
          />
          <ActionBtn
            icon="gift-outline"
            label="Gift"
            onPress={() => Alert.alert("Gifts", "Open gifts flow")}
          />
          <ActionBtn
            icon="videocam-outline"
            label="Video"
            onPress={() => Alert.alert("Video call", "Start video call")}
          />
        </View>
      </View>

      {/* Nickname */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nickname</Text>
        <Text style={styles.sectionHint}>
          Only you see this name in your chat list & header.
        </Text>

        <View style={styles.nickRow}>
          <Ionicons name="pricetag-outline" size={18} color={RBZ.c4} />
          <TextInput
              value={draftNick}
              onFocus={() => setEditingNick(true)}
              onChangeText={setDraftNick}
              placeholder={`Set a nickname for ${baseName}`}
              placeholderTextColor={RBZ.gray}
              style={styles.nickInput}
            />

        {editingNick ? (
  <View style={{ flexDirection: "row", gap: 6 }}>
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
      <Ionicons name="close" size={16} color={RBZ.white} />
    </Pressable>
  )
)}

        </View>
      </View>

 {/* Shared media (clickable only) */}
<Pressable
  onPress={() =>
    router.push({
      pathname: "/chat/shared-media/[peerId]" as any,
      params: { peerId, name: baseName, avatar },
    })
  }
  style={styles.card}
>
  <View style={styles.row}>
    <View style={styles.rowIcon}>
      <Ionicons name="images-outline" size={18} color={RBZ.c4} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>Shared Content</Text>
      <Text style={styles.rowSub}>Tap to view shared media & purchased</Text>
    </View>

    <Ionicons name="chevron-forward" size={18} color={RBZ.gray} />
  </View>
</Pressable>


      {/* Alert tone */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alert Tone</Text>
        <View style={styles.tonesRow}>
          {(["default", "soft", "loud"] as const).map((t) => {
            const active = tone === t;
            return (
              <Pressable
                key={t}
                onPress={() => saveTone(t)}
                style={[styles.toneChip, active ? styles.toneChipActive : null]}
              >
                <Text style={[styles.toneText, active ? { color: RBZ.white } : null]}>
                  {t.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Utilities */}
      <View style={[styles.card, { paddingBottom: 14 + insets.bottom }]}>
        <Row
          icon="bookmark-outline"
          title="Pinned messages"
          sub="Coming in v2 (we’ll wire backend/local pins)"
          onPress={() => Alert.alert("Pinned messages", "Coming soon")}
        />
        <Row
          icon="sparkles-outline"
          title="Shared gifts"
          sub="Coming in v2"
          onPress={() => Alert.alert("Shared gifts", "Coming soon")}
        />

        <View style={styles.hr} />

        <Row icon="ban-outline" title="Block" sub="Stop this user from contacting you" onPress={blockUser} />
        <Row icon="checkmark-circle-outline" title="Unblock" sub="Allow messages again" onPress={unblockUser} />

        <Row icon="flag-outline" title="Report" sub="Tell us what happened" onPress={reportUser} danger />

        <Row
          icon="trash-outline"
          title="Delete chat"
          sub="Removes from your list (for you only)"
          onPress={() =>
            Alert.alert("Delete chat", "Remove this chat from your list?", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: deleteChatForMe },
            ])
          }
          danger
        />
      </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RBZ.soft },

  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  card: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: RBZ.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RBZ.line,
    padding: 12,
  },

  identity: { flexDirection: "row", alignItems: "center", gap: 12 },
  bigAvatar: { width: 62, height: 62, borderRadius: 20, backgroundColor: RBZ.soft },
  name: { fontSize: 18, fontWeight: "900", color: RBZ.ink },
  sub: { marginTop: 3, fontSize: 12, color: RBZ.gray, fontWeight: "700" },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RBZ.line,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: RBZ.soft,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionLabel: { fontSize: 12, fontWeight: "900", color: RBZ.ink },

  sectionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: RBZ.ink },
  sectionHint: { marginTop: 6, fontSize: 12, color: RBZ.gray, fontWeight: "700" },

  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: RBZ.c4,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
  },
  pillText: { color: RBZ.white, fontWeight: "900", fontSize: 12 },

  nickRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: RBZ.soft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RBZ.line,
    paddingHorizontal: 12,
    height: 46,
  },
  nickInput: { flex: 1, fontSize: 14, fontWeight: "800", color: RBZ.ink },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: { marginTop: 10, color: RBZ.gray, fontWeight: "700" },
  mediaTile: { flex: 1, aspectRatio: 1, borderRadius: 14, overflow: "hidden", backgroundColor: RBZ.soft },
  mediaImg: { width: "100%", height: "100%" },

  tonesRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  toneChip: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.soft,
  },
  toneChipActive: { backgroundColor: RBZ.c2, borderColor: "transparent" },
  toneText: { fontSize: 12, fontWeight: "900", color: RBZ.ink },

  hr: { height: 1, backgroundColor: RBZ.line, marginVertical: 10 },

  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(181,23,158,0.10)",
  },
  rowTitle: { fontSize: 14, fontWeight: "900", color: RBZ.ink },
  rowSub: { marginTop: 3, fontSize: 12, fontWeight: "700", color: RBZ.gray },

  okBtn: {
  width: 26,
  height: 26,
  borderRadius: 999,
  backgroundColor: RBZ.c3,
  alignItems: "center",
  justifyContent: "center",
},
cancelBtn: {
  width: 26,
  height: 26,
  borderRadius: 999,
  backgroundColor: RBZ.gray,
  alignItems: "center",
  justifyContent: "center",
},

});

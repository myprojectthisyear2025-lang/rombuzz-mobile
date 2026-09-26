import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/src/config/api";
import { getSessionSnapshot, subscribeSession } from "@/src/features/auth/rbzSession";
import { useScreenActivity } from "@/src/features/lifecycle/useScreenActivity";

type IdentityParams = { peerId: string; name?: string; avatar?: string };

export function useChatIdentity({ peerId, name, avatar }: IdentityParams) {
  const routePeerName = String(name || "").trim();
  const routePeerAvatar = String(avatar || "").trim();
  const [peerProfile, setPeerProfile] = useState<{
    firstName?: string;
    lastName?: string;
    avatar?: string;
  } | null>(null);

  const { user: me, token } = useSyncExternalStore(subscribeSession, getSessionSnapshot, getSessionSnapshot);
  const { active, isActive } = useScreenActivity();
  const [nickname, setNickname] = useState("");

  const profileFullName = [peerProfile?.firstName, peerProfile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const hasBothProfileNames =
    !!String(peerProfile?.firstName || "").trim() &&
    !!String(peerProfile?.lastName || "").trim();

  const routeName = String(routePeerName || "").trim();
  const nicknameLabel = String(nickname || "").trim();

  const peerName =
    (hasBothProfileNames ? profileFullName : "") ||
    routeName ||
    profileFullName ||
    String(peerProfile?.firstName || "").trim() ||
    "Chat";

  const peerAvatar =
    peerProfile?.avatar ||
    routePeerAvatar ||
    "https://i.pravatar.cc/200?img=12";

  const headerName = nicknameLabel || peerName || "Chat";
  const headerSubtitle = "Private conversation";

  const nickKey = (meId: string, pid: string) =>
    meId && pid ? `RBZ_nick_${meId}_${pid}` : "";

  const myId = useMemo(() => String(me?.id || me?._id || ""), [me]);
  // Load real peer profile so header works even when route params are missing
  useEffect(() => {
    if (!peerId || !active || !token) return;

    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const r = await fetch(`${API_BASE}/users/${encodeURIComponent(peerId)}`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const j = await r.json().catch(() => ({}));
        const u = j?.user || null;

        if (!r.ok || !alive || !isActive() || !u) return;

        setPeerProfile({
          firstName: String(u.firstName || "").trim(),
          lastName: String(u.lastName || "").trim(),
          avatar: String(u.avatar || "").trim(),
        });
      } catch (e) {
        console.log("❌ peer profile load failed", e);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [peerId, active, isActive, token]);
  useEffect(() => {
    if (!myId || !peerId) return;

    const key = nickKey(myId, peerId);
    if (!key) return;
    let alive = true;
    (async () => {
      const n = (await SecureStore.getItemAsync(key)) || "";
      if (alive) setNickname(n);
    })();
    return () => { alive = false; };
  }, [myId, peerId]);
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.peerId !== peerId) return;
      setNickname(e.detail.nickname || "");
    };

    globalThis.addEventListener?.("rbz:nickname:update", handler);
    return () => {
      globalThis.removeEventListener?.("rbz:nickname:update", handler);
    };
  }, [peerId]);

  return {
    me,
    myId,
    peerName,
    peerAvatar,
    nicknameLabel,
    headerName,
    headerSubtitle,
  };
}

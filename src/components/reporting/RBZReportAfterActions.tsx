/**
 * ============================================================================
 * 📁 File: src/components/reporting/RBZReportAfterActions.tsx
 * 🎯 Purpose: Reusable RomBuzz mobile post-report safety actions
 *
 * Use:
 * - Rendered inside RBZReportSheet after a report is successfully submitted.
 * - Offers contextual next steps like Block user, Block creator, Unmatch, or Done.
 * - Keeps block/unmatch API logic out of big screens so reporting stays reusable.
 *
 * Safety behavior:
 * - Block uses POST /api/block with { targetId }.
 * - Unmatch uses POST /api/unmatch/:userId.
 * - Unmatch is only shown for profile reports.
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { API_BASE } from "@/src/config/api";
import type { RBZReportTarget } from "@/src/components/reporting/RBZReportSheet";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  c5: "#9d174d",

  white: "#ffffff",
  bg: "#fafafc",
  ink: "#111827",
  muted: "#6b7280",
  soft: "#f7f7fb",
  line: "rgba(17,24,39,0.10)",
  cardBg: "#ffffff",
  error: "#ef4444",
  success: "#22c55e",
};

type Props = {
  target: RBZReportTarget | null;
  report?: any;
  onDone: () => void;
};

function getTargetUserId(target: RBZReportTarget | null) {
  return String(target?.reportedUserId || target?.targetOwnerId || "").trim();
}

function getBlockLabel(target: RBZReportTarget | null) {
  if (target?.targetType === "post" || target?.targetType === "reel") {
    return "Block creator";
  }

  if (target?.targetType === "microbuzz") {
    return "Block user";
  }

  if (target?.targetType === "chat_conversation" || target?.targetType === "chat_message") {
    return "Block user";
  }

  return "Block user";
}

function getContextText(target: RBZReportTarget | null) {
  if (target?.targetType === "profile") {
    return "You can block or unmatch this person now.";
  }

  if (target?.targetType === "post" || target?.targetType === "reel") {
    return "You can block this creator so you do not have to see or interact with them.";
  }

  if (target?.targetType === "chat_conversation" || target?.targetType === "chat_message") {
    return "You can block this person to stop future messages.";
  }

  if (target?.targetType === "microbuzz") {
    return "You can block this person to avoid future MicroBuzz contact.";
  }

  return "You can take a safety action now, or simply close this.";
}

async function parseResponseError(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}));
  return String(data?.message || data?.error || fallback);
}

export default function RBZReportAfterActions({ target, report, onDone }: Props) {
  const [blocking, setBlocking] = useState(false);
  const [unmatching, setUnmatching] = useState(false);

   const targetUserId = useMemo(() => getTargetUserId(target), [target]);
  const blockLabel = useMemo(() => getBlockLabel(target), [target]);
  const contextText = useMemo(() => getContextText(target), [target]);

  const canBlock = !!targetUserId;
  const canUnmatch =
    target?.targetType === "profile" &&
    !!targetUserId &&
    target?.evidenceSnapshot?.allowUnmatch !== false;

  const handleBlock = async () => {
    if (!targetUserId || blocking || unmatching) return;

    Alert.alert(
      blockLabel,
      "This person will not be able to message or interact with you.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: blockLabel,
          style: "destructive",
          onPress: async () => {
            try {
              setBlocking(true);

              const token = await SecureStore.getItemAsync("RBZ_TOKEN");

              const res = await fetch(`${API_BASE}/block`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: token ? `Bearer ${token}` : "",
                },
                body: JSON.stringify({ targetId: targetUserId }),
              });

              if (!res.ok) {
                throw new Error(await parseResponseError(res, "Block failed"));
              }

              Alert.alert("Blocked", "This user has been blocked.");
              onDone();
            } catch (e: any) {
              Alert.alert("Block failed", e?.message || "Failed to block user");
            } finally {
              setBlocking(false);
            }
          },
        },
      ]
    );
  };

  const handleUnmatch = async () => {
    if (!targetUserId || blocking || unmatching) return;

    Alert.alert(
      "Unmatch",
      "This will remove your match connection with this person.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            try {
              setUnmatching(true);

              const token = await SecureStore.getItemAsync("RBZ_TOKEN");

              const res = await fetch(`${API_BASE}/unmatch/${encodeURIComponent(targetUserId)}`, {
                method: "POST",
                headers: {
                  Authorization: token ? `Bearer ${token}` : "",
                },
              });

              if (!res.ok) {
                throw new Error(await parseResponseError(res, "Unmatch failed"));
              }

              Alert.alert("Unmatched", "You are no longer connected with this user.");
              onDone();
            } catch (e: any) {
              Alert.alert("Unmatch failed", e?.message || "Failed to unmatch");
            } finally {
              setUnmatching(false);
            }
          },
        },
      ]
    );
  };

  const busy = blocking || unmatching;

  return (
    <View style={styles.wrap}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark" size={28} color={RBZ.white} />
      </View>

      <Text style={styles.title}>Report submitted</Text>
      <Text style={styles.subtitle}>
        Thanks for helping keep RomBuzz safe. Our safety team will review this report.
      </Text>

      <View style={styles.previewCard}>
        {target?.avatar ? (
          <Image source={{ uri: target.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="shield-checkmark" size={22} color={RBZ.c2} />
          </View>
        )}

        <View style={styles.previewText}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {target?.title || "Reported user"}
          </Text>
          <Text style={styles.previewSubtitle} numberOfLines={2}>
            {contextText}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {canBlock ? (
          <Pressable
            onPress={handleBlock}
            disabled={busy}
            style={[styles.actionButton, styles.blockButton, busy && styles.disabledButton]}
          >
            {blocking ? (
              <ActivityIndicator size="small" color={RBZ.white} />
            ) : (
              <Ionicons name="ban-outline" size={19} color={RBZ.white} />
            )}
            <Text style={styles.blockText}>{blocking ? "Blocking..." : blockLabel}</Text>
          </Pressable>
        ) : null}

        {canUnmatch ? (
          <Pressable
            onPress={handleUnmatch}
            disabled={busy}
            style={[styles.actionButton, styles.unmatchButton, busy && styles.disabledButton]}
          >
            {unmatching ? (
              <ActivityIndicator size="small" color={RBZ.c1} />
            ) : (
              <Ionicons name="heart-dislike-outline" size={19} color={RBZ.c1} />
            )}
            <Text style={styles.unmatchText}>
              {unmatching ? "Unmatching..." : "Unmatch"}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onDone}
          disabled={busy}
          style={[styles.actionButton, styles.doneButton, busy && styles.disabledButton]}
        >
          <Ionicons name="checkmark-circle-outline" size={19} color={RBZ.ink} />
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 18,
    paddingBottom: 6,
    alignItems: "center",
  },

  successIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.success,
    shadowColor: RBZ.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 8,
  },

  title: {
    marginTop: 16,
    color: RBZ.ink,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    color: RBZ.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 8,
  },

  previewCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(216,52,95,0.07)",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.12)",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: RBZ.soft,
  },

  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.18)",
  },

  previewText: {
    flex: 1,
    minWidth: 0,
  },

  previewTitle: {
    color: RBZ.ink,
    fontSize: 15,
    fontWeight: "900",
  },

  previewSubtitle: {
    marginTop: 4,
    color: RBZ.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  actions: {
    width: "100%",
    marginTop: 18,
    gap: 10,
  },

  actionButton: {
    minHeight: 50,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  blockButton: {
    backgroundColor: RBZ.error,
    shadowColor: RBZ.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },

  unmatchButton: {
    backgroundColor: "rgba(177,18,60,0.08)",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.18)",
  },

  doneButton: {
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },

  disabledButton: {
    opacity: 0.65,
  },

  blockText: {
    color: RBZ.white,
    fontSize: 14,
    fontWeight: "900",
  },

  unmatchText: {
    color: RBZ.c1,
    fontSize: 14,
    fontWeight: "900",
  },

  doneText: {
    color: RBZ.ink,
    fontSize: 14,
    fontWeight: "900",
  },

});
/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/blocking.tsx
 * 🎯 Purpose: Blocking settings screen
 *
 * Use:
 * - Lists users blocked by the current user.
 * - Lets the current user search blocked profiles by name, email, or user id.
 * - Lets the current user unblock someone.
 *
 * Notes:
 * - Reporting does NOT belong here.
 * - Reports should happen contextually from profile, chat, LetsBuzz, MicroBuzz,
 *   or Social Stats where the app knows exactly who/content is being reported.
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Card,
  RBZ,
  ScreenShell,
  SectionTitle,
  SmallText,
} from "../../../src/components/settings/_ui";
import { rbzFetch } from "../../../src/lib/_rbzApi";

function normalizeBlockedUser(block: any, index: number) {
  const user = block?.user || {};
  const id = String(user?.id ?? user?._id ?? block?.to ?? block?.targetId ?? index);

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    String(user?.name || "").trim() ||
    `User ${id}`;

  const email = String(user?.email || "").trim();
  const avatar = String(user?.avatar || user?.photoUrl || user?.profilePhoto || "").trim();

  return {
    raw: block,
    id,
    name,
    email,
    avatar,
  };
}

export default function BlockingSafety() {
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);

    try {
      const j = await rbzFetch<{ blocks: any[] }>("/blocks");
      setBlocked(Array.isArray(j?.blocks) ? j.blocks : []);
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Failed to load blocked users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const normalizedBlocked = useMemo(() => {
    return blocked.map((block, index) => normalizeBlockedUser(block, index));
  }, [blocked]);

  const filteredBlocked = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return normalizedBlocked;

    return normalizedBlocked.filter((item) => {
      const haystack = `${item.name} ${item.email} ${item.id}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [normalizedBlocked, search]);

  const unblock = async (targetId: string) => {
    if (!targetId || unblockingId) return;

    try {
      setUnblockingId(targetId);

      await rbzFetch("/unblock", {
        method: "POST",
        body: { targetId },
      });

      setBlocked((prev) =>
        prev.filter((item, index) => {
          const normalized = normalizeBlockedUser(item, index);
          return String(normalized.id) !== String(targetId);
        })
      );
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Failed to unblock");
    } finally {
      setUnblockingId("");
    }
  };

  const confirmUnblock = (targetId: string, name: string) => {
    Alert.alert("Unblock user?", `Unblock ${name}? They may be able to interact with you again.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        style: "destructive",
        onPress: () => unblock(targetId),
      },
    ]);
  };

  return (
    <ScreenShell title="Blocking">
      <SectionTitle>Blocked users</SectionTitle>

      <Card>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="ban-outline" size={22} color={RBZ.c2} />
          </View>

          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Manage blocked profiles</Text>
            <Text style={styles.heroSub}>
              Blocked users cannot contact or interact with you on RomBuzz.
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={RBZ.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search blocked users"
            placeholderTextColor={RBZ.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />

          {search.trim() ? (
            <Pressable onPress={() => setSearch("")} hitSlop={10} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={RBZ.muted} />
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={RBZ.c2} />
            <Text style={styles.centerText}>Loading blocked users...</Text>
          </View>
        ) : normalizedBlocked.length ? (
          <View style={styles.listWrap}>
            {filteredBlocked.length ? (
              filteredBlocked.map((item) => {
                const isUnblocking = unblockingId === item.id;

                return (
                  <View key={item.id} style={styles.blockRow}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Ionicons name="person" size={20} color={RBZ.c2} />
                      </View>
                    )}

                    <View style={styles.userTextWrap}>
                      <Text style={styles.blockName} numberOfLines={1}>
                        {item.name}
                      </Text>

                      <Text style={styles.blockSub} numberOfLines={1}>
                        {item.email || `User ID: ${item.id}`}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => confirmUnblock(item.id, item.name)}
                      disabled={!!unblockingId}
                      style={[styles.unblockBtn, isUnblocking && styles.unblockBtnDisabled]}
                    >
                      {isUnblocking ? (
                        <ActivityIndicator size="small" color={RBZ.c2} />
                      ) : (
                        <Text style={styles.unblockText}>Unblock</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={28} color={RBZ.muted} />
                <Text style={styles.emptyTitle}>No matching blocked users</Text>
                <Text style={styles.emptySub}>
                  Try searching by name, email, or user id.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={30} color={RBZ.c2} />
            <Text style={styles.emptyTitle}>No blocked users</Text>
            <Text style={styles.emptySub}>
              Anyone you block will appear here with an unblock option.
            </Text>
          </View>
        )}

        <SmallText>
          You can unblock someone anytime. Reporting is handled from profiles, chats,
          LetsBuzz, MicroBuzz, and other relevant screens.
        </SmallText>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(216,52,95,0.07)",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.12)",
    marginBottom: 14,
  },

  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.16)",
  },

  heroTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  heroTitle: {
    color: RBZ.text,
    fontSize: 15,
    fontWeight: "900",
  },

  heroSub: {
    color: RBZ.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 3,
  },

  searchBox: {
    minHeight: 48,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: RBZ.line,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    minHeight: 46,
    color: RBZ.text,
    fontSize: 14,
    fontWeight: "800",
    paddingVertical: 0,
  },

  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  centerState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  centerText: {
    color: RBZ.muted,
    fontSize: 13,
    fontWeight: "800",
  },

  listWrap: {
    gap: 10,
  },

  blockRow: {
    flexDirection: "row",
    gap: 11,
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: RBZ.line,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: RBZ.soft,
  },

  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216,52,95,0.08)",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.14)",
  },

  userTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  blockName: {
    color: RBZ.text,
    fontSize: 14,
    fontWeight: "900",
  },

  blockSub: {
    color: RBZ.muted,
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },

  unblockBtn: {
    minWidth: 84,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(177,18,60,0.08)",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.24)",
  },

  unblockBtnDisabled: {
    opacity: 0.65,
  },

  unblockText: {
    color: RBZ.c2,
    fontSize: 13,
    fontWeight: "900",
  },

  emptyState: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: RBZ.line,
  },

  emptyTitle: {
    color: RBZ.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },

  emptySub: {
    color: RBZ.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
});
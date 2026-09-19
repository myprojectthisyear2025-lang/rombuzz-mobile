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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenShell, SectionTitle, SmallText } from "../../../src/components/settings/_ui";
import { rbzFetch } from "../../../src/lib/_rbzApi";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import type { RomBuzzColors } from "@/src/design/rombuzzTheme";
import { SettingsButton, SettingsNotice } from "@/src/components/settings/SettingsControls";
import { useSettingsAlert } from "@/src/components/settings/SettingsDialog";

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
  const { colors } = useRomBuzzTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const alert = useSettingsAlert();
  const [loadError, setLoadError] = useState("");
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const j = await rbzFetch<{ blocks: any[] }>("/blocks");
      setBlocked(Array.isArray(j?.blocks) ? j.blocks : []);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load blocked users");
      alert("Failed", e?.message || "Failed to load blocked users");
    } finally {
      setLoading(false);
    }
  }, [alert]);

  useEffect(() => {
    load();
  }, [load]);

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
        }),
      );
    } catch (e: any) {
      alert("Failed", e?.message || "Failed to unblock");
    } finally {
      setUnblockingId("");
    }
  };

  const confirmUnblock = (targetId: string, name: string) => {
    alert("Unblock user?", `Unblock ${name}? They may be able to interact with you again.`, [
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
      <SmallText>Blocked users cannot contact or interact with you on RomBuzz.</SmallText>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.iconMuted} />
        <TextInput
          accessibilityLabel="Search blocked users"
          value={search}
          onChangeText={setSearch}
          placeholder="Search blocked users"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.brand}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {search.trim() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setSearch("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color={colors.iconMuted} />
          </Pressable>
        ) : null}
      </View>
      {loading ? (
        <SettingsNotice loading>Loading blocked users…</SettingsNotice>
      ) : loadError ? (
        <>
          <SettingsNotice error>{loadError}</SettingsNotice>
          <SettingsButton label="Try again" variant="secondary" onPress={load} />
        </>
      ) : normalizedBlocked.length ? (
        <View>
          {filteredBlocked.length ? (
            filteredBlocked.map((item) => {
              const isUnblocking = unblockingId === item.id;
              return (
                <View key={item.id} style={styles.blockRow}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Ionicons name="person-outline" size={20} color={colors.iconMuted} />
                    </View>
                  )}
                  <View style={styles.userText}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.detail} numberOfLines={1}>
                      {item.email || `User ID: ${item.id}`}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Unblock ${item.name}`}
                    accessibilityState={{ disabled: !!unblockingId, busy: isUnblocking }}
                    onPress={() => confirmUnblock(item.id, item.name)}
                    disabled={!!unblockingId}
                    style={({ pressed }) => [styles.unblock, (pressed || !!unblockingId) && styles.disabled]}
                  >
                    {isUnblocking ? (
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                      <Text style={styles.unblockText}>Unblock</Text>
                    )}
                  </Pressable>
                </View>
              );
            })
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={26} color={colors.iconMuted} />
              <Text style={styles.emptyTitle}>No matching blocked users</Text>
              <Text style={styles.emptyText}>Try searching by name, email, or user id.</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="shield-checkmark-outline" size={28} color={colors.iconMuted} />
          <Text style={styles.emptyTitle}>No blocked users</Text>
          <Text style={styles.emptyText}>Anyone you block will appear here with an unblock option.</Text>
        </View>
      )}
      <SmallText>
        You can unblock someone anytime. Reporting is handled from profiles, chats, LetsBuzz, MicroBuzz, and
        other relevant screens.
      </SmallText>
    </ScreenShell>
  );
}

function createStyles(colors: RomBuzzColors) {
  return StyleSheet.create({
    searchBox: {
      minHeight: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      paddingLeft: 14,
      paddingRight: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginTop: 20,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 14,
      fontFamily: RBZFont.medium,
      paddingVertical: 13,
    },
    clearButton: { width: 44, minHeight: 48, alignItems: "center", justifyContent: "center" },
    blockRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceMuted },
    avatarFallback: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    userText: { flex: 1, minWidth: 100 },
    name: { color: colors.text, fontSize: 14, fontFamily: RBZFont.semiBold },
    detail: { color: colors.textSecondary, fontSize: 12, fontFamily: RBZFont.regular, marginTop: 3 },
    unblock: {
      minHeight: 44,
      minWidth: 80,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    unblockText: { color: colors.text, fontSize: 12.5, fontFamily: RBZFont.semiBold },
    disabled: { opacity: 0.55 },
    empty: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 38, gap: 8 },
    emptyTitle: {
      color: colors.text,
      fontSize: 15,
      fontFamily: RBZFont.bold,
      textAlign: "center",
      marginTop: 4,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 19,
      fontFamily: RBZFont.regular,
      textAlign: "center",
    },
  });
}

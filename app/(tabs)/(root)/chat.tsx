/**
 * ============================================================
 * 📁 File: app/(tabs)/chat.tsx
 * 🎯 Screen: RomBuzz Mobile — Chat List (Instagram-style)
 *
 * FLOW:
 *  - Loads matched users from GET /matches (same as web)
 *  - Joins all match rooms (so edits/deletes/reactions broadcast work)
 *  - Shows last message preview + unread badge
 *  - Tap user → opens /chat/[peerId]
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { useRomBuzzTypography } from "@/src/design/rombuzzTypography";
import { fullName, safeId, safePreviewText } from "@/src/features/chat/list/chatListPresentation";
import { useChatListActions } from "@/src/features/chat/list/useChatListActions";
import { useChatListFilter, useChatListInbox } from "@/src/features/chat/list/useChatListInbox";
import { useChatListRealtime } from "@/src/features/chat/list/useChatListRealtime";
import { useChatListState } from "@/src/features/chat/list/useChatListState";
import { useChatListStyles } from "@/src/features/chat/list/useChatListStyles";
import { useChatListUnread } from "@/src/features/chat/list/useChatListUnread";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fontsLoaded = useRomBuzzTypography();

  const {
    colors,
    statusBarStyle,
  } = useRomBuzzTheme();

  const styles = useChatListStyles();

  // Preserve the original lifecycle effect order across the extracted hooks.
  const state = useChatListState();
  const {
    loading, refreshing, nickMap, filtered, pinnedPeers, mutedPeers, alertPeers,
    manualUnreadPeers, actionPeer, setActionPeer, query, setQuery, onlineMap,
    unreadMap, myId, stableAvatarUrl,
  } = state;
  const reconcileFromServer = useChatListUnread(state);
  const { loadChats } = useChatListInbox(state, router, reconcileFromServer);
  useChatListRealtime(state, reconcileFromServer);
  useChatListFilter(state);
  const {
    togglePinPeer, toggleMutePeer, toggleAlertPeer, toggleReadPeer,
    confirmDeletePeerChat, confirmUnmatchPeer, openChat,
  } = useChatListActions(state, router);

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={colors.background}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={colors.background}
      />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>
              Chats
            </Text>

            <Text style={styles.headerSubtitle}>
              Your conversations, all in one place.
            </Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons
            name="search"
            size={18}
            color={colors.iconMuted}
          />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search matches"
            placeholderTextColor={colors.textMuted}
            style={styles.search}
          />
        </View>
      </View>

      <FlatList
        style={styles.list}
          data={filtered}
          keyExtractor={(m) => String(safeId(m))}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadChats("refresh")}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: 90 + insets.bottom,
            },
          ]}
          removeClippedSubviews
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          ListEmptyComponent={
            loading ? (
              <View style={styles.empty}>
                <ActivityIndicator
                  color={colors.brand}
                />

                <Text style={styles.emptySub}>
                  Loading chats…
                </Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={42}
                  color={colors.iconMuted}
                />

                <Text style={styles.emptyTitle}>
                  No chats yet
                </Text>

                <Text style={styles.emptySub}>
                  Once you match, your conversations will appear here.
                </Text>
              </View>
            )
          }
          renderItem={({ item: m }) => {
            const pid = safeId(m);
            const online = !!onlineMap[pid];
            const unread = unreadMap[pid] || 0;
            const pinned = pinnedPeers.includes(pid);
            const muted = mutedPeers.includes(pid);
            const alertOn = alertPeers.includes(pid);

            return (
              <Pressable
                key={pid}
                onPress={() => openChat(m)}
                onLongPress={() => setActionPeer(m)}
                delayLongPress={280}
                style={({ pressed }) => [
                  styles.row,
                  pinned
                    ? styles.rowPinned
                    : null,
                  pressed
                    ? styles.rowPressed
                    : null,
                ]}
              >
                <View style={styles.avatarWrap}>
                  <Image
                    source={{
                      uri: stableAvatarUrl(m),
                    }}
                    style={styles.avatar}
                  />

                  {online ? (
                    <View
                      style={styles.onlineDot}
                    />
                  ) : null}
                </View>

                <View style={styles.mid}>
                  <View style={styles.topLine}>
                    <Text
                      style={[
                        styles.name,
                        unread > 0
                          ? styles.nameUnread
                          : null,
                      ]}
                      numberOfLines={1}
                    >
                      {nickMap[pid] ||
                        fullName(m)}
                    </Text>

                    <View style={styles.rowFlags}>
                      {pinned ? (
                        <Ionicons
                          name="pin"
                          size={14}
                          color={colors.brand}
                        />
                      ) : null}

                      {muted ? (
                        <Ionicons
                          name="notifications-off"
                          size={14}
                          color={colors.iconMuted}
                        />
                      ) : null}

                      {alertOn ? (
                        <Ionicons
                          name="radio"
                          size={14}
                          color={colors.brand}
                        />
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.bottomLine}>
                    <Text
                      style={[
                        styles.preview,
                        unread > 0
                          ? styles.previewUnread
                          : null,
                      ]}
                      numberOfLines={1}
                    >
                      {safePreviewText(
                        m?.lastMessage,
                        myId
                      )}
                    </Text>

                    {unread > 0 ? (
                      <View style={styles.badge}>
                        <Text
                          style={
                            styles.badgeText
                          }
                        >
                          {unread > 99
                            ? "99+"
                            : unread}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
                }}
              />

          <Modal
        visible={!!actionPeer}
        transparent
        animationType="fade"
        onRequestClose={() => setActionPeer(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setActionPeer(null)}>
          <Pressable
            style={[
              styles.actionSheet,
              { paddingBottom: Math.max(28, 18 + insets.bottom) },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {actionPeer ? (
              <>
                <View style={styles.sheetHandle} />

                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {nickMap[safeId(actionPeer)] || fullName(actionPeer)}
                </Text>

                <Pressable style={styles.sheetAction} onPress={() => togglePinPeer(actionPeer).catch(() => {})}>
                  <Ionicons
                    name={pinnedPeers.includes(safeId(actionPeer)) ? "pin" : "pin-outline"}
                    size={21}
                    color={colors.icon}
                  />
                  <Text style={styles.sheetActionText}>
                    {pinnedPeers.includes(safeId(actionPeer)) ? "Unpin" : "Pin"}
                  </Text>
                </Pressable>

                <Pressable style={styles.sheetAction} onPress={() => toggleMutePeer(actionPeer).catch(() => {})}>
                  <Ionicons
                    name={mutedPeers.includes(safeId(actionPeer)) ? "notifications" : "notifications-off-outline"}
                    size={21}
                    color={colors.icon}
                  />
                  <Text style={styles.sheetActionText}>
                    {mutedPeers.includes(safeId(actionPeer)) ? "Unmute" : "Mute"}
                  </Text>
                </Pressable>

                <Pressable style={styles.sheetAction} onPress={() => toggleReadPeer(actionPeer).catch(() => {})}>
                  <Ionicons
                    name={(unreadMap[safeId(actionPeer)] || manualUnreadPeers.includes(safeId(actionPeer))) ? "mail-open-outline" : "mail-unread-outline"}
                    size={21}
                    color={colors.icon}
                  />
                  <Text style={styles.sheetActionText}>
                    {(unreadMap[safeId(actionPeer)] || manualUnreadPeers.includes(safeId(actionPeer))) ? "Mark as read" : "Mark as unread"}
                  </Text>
                </Pressable>

                <Pressable style={styles.sheetAction} onPress={() => toggleAlertPeer(actionPeer).catch(() => {})}>
                  <Ionicons
                    name={alertPeers.includes(safeId(actionPeer)) ? "radio" : "radio-outline"}
                    size={21}
                    color={colors.icon}
                  />
                  <Text style={styles.sheetActionText}>
                    {alertPeers.includes(safeId(actionPeer)) ? "Remove online alert" : "Set alert"}
                  </Text>
                </Pressable>

                <Pressable style={styles.sheetActionDanger} onPress={() => confirmUnmatchPeer(actionPeer)}>
                  <Ionicons
                    name="ban-outline"
                    size={21}
                    color={colors.danger}
                  />
                  <Text style={styles.sheetActionDangerText}>Unmatch</Text>
                </Pressable>

                <Pressable style={styles.sheetActionDanger} onPress={() => confirmDeletePeerChat(actionPeer)}>
                  <Ionicons
                    name="trash-outline"
                    size={21}
                    color={colors.danger}
                  />
                  <Text style={styles.sheetActionDangerText}>Delete chat</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

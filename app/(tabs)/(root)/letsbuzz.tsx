/**
 * ============================================================================
 * 📁 File: app/(tabs)/letsbuzz.tsx
 * 🎯 Screen: LetsBuzz (2 tabs) → Posts + Reels
 *
 * Uses:
 *  - <LetsBuzzPosts />
 *  - <LetsBuzzReels />
 *  - <LetsBuzzReelsFullscreen />
 *
 * What changed:
 *  - Removed fullscreen toggle pill
 *  - Added simple expand button in same row as Let'sBuzz
 *  - Expand button only appears on Reels tab
 *  - Fullscreen still hides header + tabs and opens the fullscreen wrapper
 * ============================================================================
 */

import LetsBuzzPosts from "@/src/components/letsbuzz/LetsBuzzPosts";
import LetsBuzzReels from "@/src/components/letsbuzz/LetsBuzzReels";
import LetsBuzzReelsFullscreen from "@/src/components/letsbuzz/LetsBuzzReelsFullscreen";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  DeviceEventEmitter,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "posts" | "reels";

type HeaderExpandButtonProps = {
  visible: boolean;
  onPress: () => void;
  color: string;
};

function HeaderExpandButton({
  visible,
  onPress,
  color,
}: HeaderExpandButtonProps) {
  if (!visible) return <View style={styles.headerActionPlaceholder} />;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.headerExpandButton,
        pressed && styles.headerExpandButtonPressed,
      ]}
    >
      <Ionicons name="expand-outline" size={20} color={color} />
    </Pressable>
  );
}

export default function LetsBuzzScreen() {
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useRomBuzzTheme();

  const {
    post,
    targetType,
    ownerId,
    openComments,
    commentId,
    parentId,
    replyId,
  } = useLocalSearchParams<{
    post?: string;
    targetType?: string;
    ownerId?: string;
    openComments?: string;
    commentId?: string;
    parentId?: string;
    replyId?: string;
  }>();

  const targetPostId = post ? String(post) : undefined;
  const deepLinkTargetType = targetType ? String(targetType) : "";
  const deepLinkOwnerId = ownerId ? String(ownerId) : "";
  const deepLinkOpenComments = String(openComments || "") === "1";
  const deepLinkCommentId = commentId ? String(commentId) : "";
  const deepLinkParentId = parentId ? String(parentId) : "";
  const deepLinkReplyId = replyId ? String(replyId) : "";

  const [tab, setTab] = useState<TabKey>("posts");
  const [reelsFullscreen, setReelsFullscreen] = useState(false);

  useEffect(() => {
    if (targetPostId) setTab("posts");
  }, [targetPostId]);

  useEffect(() => {
    if (tab !== "reels" && reelsFullscreen) {
      setReelsFullscreen(false);
    }
  }, [tab, reelsFullscreen]);

  useEffect(() => {
    const active = tab === "reels" && reelsFullscreen;

    DeviceEventEmitter.emit("rbz:letsbuzz:fullscreen", {
      active,
    });

    return () => {
      if (active) {
        DeviceEventEmitter.emit("rbz:letsbuzz:fullscreen", {
          active: false,
        });
      }
    };
  }, [tab, reelsFullscreen]);

  const TabBar = useMemo(() => {
    return (
      <View
        style={[
          styles.tabSection,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <TouchableOpacity
            onPress={() => setTab("posts")}
            activeOpacity={0.7}
            style={[
              styles.tabButton,
              tab === "posts" && styles.tabButtonActive,
            ]}
          >
            <Ionicons
              name={tab === "posts" ? "newspaper" : "newspaper-outline"}
              size={22}
              color={tab === "posts" ? colors.brand : colors.iconMuted}
            />

            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                tab === "posts" && [
                  styles.tabTextActive,
                  { color: colors.brand },
                ],
              ]}
            >
              Posts
            </Text>

            {tab === "posts" ? (
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: colors.brand },
                ]}
              />
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab("reels")}
            activeOpacity={0.7}
            style={[
              styles.tabButton,
              tab === "reels" && styles.tabButtonActive,
            ]}
          >
            <Ionicons
              name={tab === "reels" ? "play-circle" : "play-circle-outline"}
              size={22}
              color={tab === "reels" ? colors.brand : colors.iconMuted}
            />

            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                tab === "reels" && [
                  styles.tabTextActive,
                  { color: colors.brand },
                ],
              ]}
            >
              Reels
            </Text>

            {tab === "reels" ? (
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: colors.brand },
                ]}
              />
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [colors, tab]);

  if (tab === "reels" && reelsFullscreen) {
    return (
      <View style={styles.fullscreenContainer}>
        <StatusBar hidden />
               <LetsBuzzReelsFullscreen
          targetPostId={targetPostId}
          targetType={deepLinkTargetType}
          ownerId={deepLinkOwnerId}
          openComments={deepLinkOpenComments}
          commentId={deepLinkCommentId}
          parentId={deepLinkParentId}
          replyId={deepLinkReplyId}
          onClose={() => setReelsFullscreen(false)}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={colors.background}
        hidden={false}
      />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            Let'sBuzz
          </Text>

          <HeaderExpandButton
            visible={tab === "reels"}
            onPress={() => setReelsFullscreen(true)}
            color={colors.brand}
          />
        </View>
      </View>

      {TabBar}

      <View
        style={[
          styles.content,
          { backgroundColor: colors.background },
        ]}
      >
        {tab === "posts" ? (
          <LetsBuzzPosts
            targetPostId={targetPostId}
            targetType={deepLinkTargetType}
            ownerId={deepLinkOwnerId}
            openComments={deepLinkOpenComments}
            commentId={deepLinkCommentId}
            parentId={deepLinkParentId}
            replyId={deepLinkReplyId}
          />
        ) : (
          <LetsBuzzReels
            targetPostId={targetPostId}
            targetType={deepLinkTargetType}
            ownerId={deepLinkOwnerId}
            openComments={deepLinkOpenComments}
            commentId={deepLinkCommentId}
            parentId={deepLinkParentId}
            replyId={deepLinkReplyId}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },

  headerRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 26,
    fontFamily: RBZFont.extraBold,
    letterSpacing: -0.4,
  },

  headerActionPlaceholder: {
    width: 30,
    height: 30,
  },

  headerExpandButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  headerExpandButtonPressed: {
    opacity: 0.7,
  },

  tabSection: {
    borderBottomWidth: 1,
  },

  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 6,
    position: "relative",
  },

  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 7,
    borderRadius: 12,
  },

  tabButtonActive: {
    backgroundColor: "transparent",
  },

  tabText: {
    fontSize: 15,
    fontFamily: RBZFont.semiBold,
  },

  tabTextActive: {
    fontFamily: RBZFont.semiBold,
  },

  activeIndicator: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    width: 54,
    height: 3,
    borderRadius: 3,
  },

  content: {
    flex: 1,
  },
});
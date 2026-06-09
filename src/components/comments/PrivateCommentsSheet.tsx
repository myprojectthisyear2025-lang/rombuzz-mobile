/**
 * ============================================================================
 * 📁 File: src/components/comments/PrivateCommentsSheet.tsx
 * 🎯 Purpose: Reusable private comments bottom sheet for RomBuzz.
 *
 * Used by:
 *  - LetsBuzz posts / reels
 *  - ViewProfile media actions
 *  - Profile gallery insights
 *
 * Privacy rule:
 *  - Only the media/post owner and the comment author can see each comment.
 *  - Backend enforces visibility.
 *  - This component only renders the comments returned by the backend.
 *
 * Supports:
 *  - targetType="gallery_media" → profile/gallery-backed media comments
 *  - targetType="buzz_post"     → legacy LetsBuzz post comments
 *
 * UX:
 *  - Always shows real commenter name/avatar, never "You"
 *  - Tapping own name/avatar opens own profile
 *  - Tapping another user's name/avatar opens ViewProfile
 *  - Add / edit / delete / reply
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE } from "@/src/config/api";

type TargetType = "gallery_media" | "buzz_post";

type PrivateCommentUser = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  avatarUrl?: string;
  photoUrl?: string;
  profilePic?: string;
  photos?: any[];
};

type PrivateComment = {
  id: string;
  userId: string;
  text: string;
  imageUrl?: string;
  photoUrl?: string;
  mediaUrl?: string;
  attachmentUrl?: string;
  parentId?: string | null;
  replyToCommentId?: string | null;
  replyToUserId?: string | null;
  createdAt?: any;
  updatedAt?: any;
  editedAt?: any;
  author?: PrivateCommentUser;
  canEdit?: boolean;
  canDelete?: boolean;
  canReply?: boolean;
  reactions?: Record<string, string>;
  myReaction?: string | null;
  reactionCounts?: Record<string, number>;
  totalReactions?: number;
  [key: string]: any;
};
type Props = {
  visible: boolean;
  onClose: () => void;

  targetType: TargetType;
  targetId: string;
  ownerId: string;
  currentUserId: string;

  ownerUser?: PrivateCommentUser | null;

  title?: string;
  subtitle?: string;

  // Notification deep-link focus support
  initialCommentId?: string;
  initialParentId?: string;
  initialReplyId?: string;

  onChanged?: (comments: PrivateComment[]) => void | Promise<void>;
};

const PREMIUM = {
  primary: "#6C63FF",
  secondary: "#FF6584",
  accent: "#4CAF50",
  background: "#F8F9FA",
  surface: "#FFFFFF",
  text: "#2D3436",
  textLight: "#636E72",
  border: "#E9ECEF",
  shadow: "#000000",
  lock: "#FFA502",
  danger: "#FF3B30",
};

async function authHeaders() {
  const token = await SecureStore.getItemAsync("RBZ_TOKEN");

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

async function getStoredMe() {
  try {
    const raw = await SecureStore.getItemAsync("RBZ_USER");
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.user || parsed || null;
  } catch {
    return null;
  }
}

function normalizeUser(user: any, fallbackId = ""): PrivateCommentUser {
  return {
    id: String(user?.id || user?._id || fallbackId || ""),
    firstName: String(user?.firstName || "").trim(),
    lastName: String(user?.lastName || "").trim(),
    username: String(user?.username || "").trim(),
    avatar:
      user?.avatar ||
      user?.avatarUrl ||
      user?.photoUrl ||
      user?.profilePic ||
      user?.photos?.[0] ||
      "",
  };
}

function getUserId(user: any, fallback = "") {
  return String(user?.id || user?._id || user?.userId || fallback || "").trim();
}

function getUserName(user: any, fallback = "RomBuzz User") {
  const first = String(user?.firstName || "").trim();
  const last = String(user?.lastName || "").trim();
  const username = String(user?.username || "").trim();
  const full = [first, last].filter(Boolean).join(" ").trim();

  return full || username || fallback;
}

function getUserAvatar(user: any) {
  return (
    user?.avatar ||
    user?.avatarUrl ||
    user?.photoUrl ||
    user?.profilePic ||
    user?.photos?.[0] ||
    "https://via.placeholder.com/80"
  );
}

function hasRealName(user: any) {
  const first = String(user?.firstName || "").trim();
  const last = String(user?.lastName || "").trim();
  const username = String(user?.username || "").trim();
  return !!first || !!last || !!username;
}

function getMediaKeyCandidates(media: any) {
  return [
    media?.id,
    media?._id,
    media?.mediaId,
    media?.postId,

    // ✅ Cloudflare Stream reel identifiers
    media?.streamUid,
    media?.uid,
    media?.cloudflareStream?.uid,

    media?.url,
    media?.mediaUrl,
    media?.secureUrl,
    media?.secure_url,
    media?.playback?.hls,
    media?.playback?.dash,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function findMediaByTargetId(mediaList: any[], targetId: string) {
  const target = String(targetId || "").trim();
  if (!target) return null;

  return mediaList.find((media) => getMediaKeyCandidates(media).includes(target)) || null;
}

function replySeedFor(name?: string) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");
  return clean ? `@${clean} ` : "";
}

function getCommentImage(comment: any) {
  return (
    comment?.imageUrl ||
    comment?.photoUrl ||
    comment?.mediaUrl ||
    comment?.attachmentUrl ||
    ""
  );
}

function getHeartCount(comment: any) {
  const reactionCounts = comment?.reactionCounts || {};
  const reactions = comment?.reactions || {};

  const fromCounts = Number(reactionCounts["❤️"] || reactionCounts.heart || 0);
  if (fromCounts > 0) return fromCounts;

  return Object.values(reactions).filter((emoji) => String(emoji) === "❤️").length;
}

function formatCommentTime(value: any) {
  if (!value) return "";

  const raw =
    value instanceof Date
      ? value.getTime()
      : typeof value === "number"
      ? value
      : Date.parse(String(value));

  if (!Number.isFinite(raw)) return "";

  const timestamp = raw < 10000000000 ? raw * 1000 : raw;
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 10) return "now";
  if (diffSec < 60) return `${diffSec}sec ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}min ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}day${diffDay === 1 ? "" : "s"} ago`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;

  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear}y ago`;
}

async function uploadCommentPhotoToR2(localUri: string) {
  const token = await SecureStore.getItemAsync("RBZ_TOKEN");

  if (!token) {
    throw new Error("Please log in again before uploading a comment photo.");
  }

  const filename = localUri.split("/").pop() || `comment-photo-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const extension = match?.[1]?.toLowerCase() || "jpg";

  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
      ? "image/webp"
      : "image/jpeg";

  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as any);
  formData.append("purpose", "comment-photo");

  const res = await fetch(`${API_BASE}/upload-r2-file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.r2Key) {
    throw new Error(json?.error || json?.message || "Failed to upload photo.");
  }

  return String(json.r2Key || json.key || "");
}

export default function PrivateCommentsSheet({
  visible,
  onClose,
  targetType,
  targetId,
  ownerId,
  currentUserId,
  ownerUser = null,
  title = "Private Comments",
  subtitle = "Visible only to you and the post owner.",

  // Notification deep-link focus support
  initialCommentId,
  initialParentId,
  initialReplyId,

  onChanged,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

    const inputRef = useRef<TextInput | null>(null);
  const listRef = useRef<FlatList<PrivateComment> | null>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const keyboardOpen = keyboardHeight > 0;
  const deviceScreenHeight = Dimensions.get("screen").height;

  const normalSheetHeight = Math.min(
    screenHeight * 0.82,
    screenHeight - Math.max(insets.top, 20) - 12
  );

   const keyboardLiftExtra = keyboardOpen ? 47 : 0;

  const keyboardSheetHeight = Math.max(
    420,
    deviceScreenHeight - keyboardHeight - keyboardLiftExtra - Math.max(insets.top, 0)
  );

  const sheetHeight = keyboardOpen ? keyboardSheetHeight : normalSheetHeight;
  const composerBottomPadding = keyboardOpen ? 6 : Math.max(insets.bottom, 10);
  const sheetBottomGap = keyboardOpen ? keyboardHeight + keyboardLiftExtra : 0;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [comments, setComments] = useState<PrivateComment[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedPhotoUri, setSelectedPhotoUri] = useState("");
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<PrivateComment | null>(null);
  const [focusedCommentId, setFocusedCommentId] = useState("");
  const [fullScreenPhotoUrl, setFullScreenPhotoUrl] = useState("");

  const fullScreenPhotoTranslateY = useRef(new Animated.Value(0)).current;

  const closeFullScreenPhoto = useCallback(() => {
    Animated.timing(fullScreenPhotoTranslateY, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setFullScreenPhotoUrl("");
    });
  }, [fullScreenPhotoTranslateY]);

  const openFullScreenPhoto = useCallback(
    (url: string) => {
      const cleanUrl = String(url || "").trim();
      if (!cleanUrl) return;

      fullScreenPhotoTranslateY.setValue(0);
      setFullScreenPhotoUrl(cleanUrl);
    },
    [fullScreenPhotoTranslateY]
  );

  const fullScreenPhotoPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            fullScreenPhotoTranslateY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 90 || gesture.vy > 0.75) {
            closeFullScreenPhoto();
            return;
          }

          Animated.spring(fullScreenPhotoTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        },
      }),
    [closeFullScreenPhoto, fullScreenPhotoTranslateY]
  );

  const safeTargetId = useMemo(() => String(targetId || "").trim(), [targetId]);
  const safeOwnerId = useMemo(() => String(ownerId || "").trim(), [ownerId]);
  const safeMeId = useMemo(() => String(currentUserId || "").trim(), [currentUserId]);

  const parseError = useCallback(async (res: Response) => {
    try {
      const json = await res.json();
      return json?.error || json?.message || "Request failed";
    } catch {
      return "Request failed";
    }
  }, []);

    const pickCommentPhoto = useCallback(async () => {
    if (editingCommentId) {
      Alert.alert("Photo comment", "Photo upload is only available for new comments right now.");
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow photo access to upload a comment photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

          const localUri = result.assets[0].uri;

      setSelectedPhotoUri(localUri);
      setSelectedPhotoUrl("");
      setUploadingPhoto(true);

      const uploadedKey = await uploadCommentPhotoToR2(localUri);

      setSelectedPhotoUrl(uploadedKey);
    } catch (error: any) {
      setSelectedPhotoUri("");
      setSelectedPhotoUrl("");
      Alert.alert(
        "Photo upload",
        error?.message ? String(error.message) : "Failed to pick or upload photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  }, [editingCommentId]);

  const openAuthorProfile = useCallback(
    (authorId?: string) => {
      const id = String(authorId || "").trim();
      if (!id) return;

      onClose();

      if (String(id) === String(safeMeId)) {
        router.push("/(tabs)/profile" as any);
        return;
      }

      router.push({
        pathname: "/(tabs)/view-profile",
        params: { userId: id },
      } as any);
    },
    [onClose, router, safeMeId]
  );

  const fetchUserById = useCallback(
    async (userId: string, headers: Record<string, string>) => {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}`, { headers });
        const json = await res.json().catch(() => null);
        return normalizeUser(json?.user || json || {}, userId);
      } catch {
        return normalizeUser({}, userId);
      }
    },
    []
  );

  const enrichComments = useCallback(
    async (
      rawComments: any[],
      fallbackOwnerUser: any,
      headers: Record<string, string>
    ): Promise<PrivateComment[]> => {
      const storedMe = await getStoredMe();
      const ownerAuthor = normalizeUser(fallbackOwnerUser || ownerUser, safeOwnerId);
      const meAuthor = normalizeUser(storedMe, safeMeId);

      const missingAuthorIds: string[] = Array.from(
        new Set<string>(
          rawComments
            .map((comment: any) => String(comment?.userId || ""))
            .filter(Boolean)
            .filter((id: string) => id !== String(safeOwnerId))
            .filter((id: string) => id !== String(safeMeId))
            .filter((id: string) => {
              const existing = rawComments.find(
                (comment: any) => String(comment?.userId || "") === id
              )?.author;

              return !hasRealName(existing);
            })
        )
      );

      const fetchedAuthors: Array<[string, PrivateCommentUser]> = await Promise.all(
        missingAuthorIds.map(async (id): Promise<[string, PrivateCommentUser]> => {
          const user = await fetchUserById(id, headers);
          return [id, user];
        })
      );

      const authorMap = new Map<string, PrivateCommentUser>(fetchedAuthors);

      return rawComments.map((comment: any) => {
        const uid = String(comment?.userId || "");
        const backendAuthor = hasRealName(comment?.author)
          ? normalizeUser(comment.author, uid)
          : null;

        const author =
          backendAuthor ||
          (uid === String(safeOwnerId)
            ? ownerAuthor
            : uid === String(safeMeId)
            ? meAuthor
            : authorMap.get(uid) || normalizeUser({}, uid));

            const reactions =
          comment?.reactions && typeof comment.reactions === "object"
            ? comment.reactions
            : {};

        const reactionCounts =
          comment?.reactionCounts && typeof comment.reactionCounts === "object"
            ? comment.reactionCounts
            : {
                "❤️": Object.values(reactions).filter(
                  (emoji) => String(emoji) === "❤️"
                ).length,
              };

        return {
          ...comment,
          id: String(comment?.id || comment?._id || ""),
          userId: uid,
          text: String(comment?.text || comment?.body || comment?.comment || ""),
          parentId: comment?.parentId ? String(comment.parentId) : null,
          author,
          reactions,
          myReaction: comment?.myReaction || reactions?.[safeMeId] || null,
          reactionCounts,
          totalReactions:
            Number(comment?.totalReactions || 0) ||
            Object.keys(reactions || {}).length,
          canEdit: Boolean(comment?.canEdit ?? uid === String(safeMeId)),
          canDelete: Boolean(
            comment?.canDelete ||
              uid === String(safeMeId) ||
              String(safeOwnerId) === String(safeMeId)
          ),
          canReply: Boolean(
            comment?.canReply ||
              uid === String(safeMeId) ||
              String(safeOwnerId) === String(safeMeId)
          ),
        };
      });
    },
    [fetchUserById, ownerUser, safeMeId, safeOwnerId]
  );

  const orderThreadedComments = useCallback((list: PrivateComment[]) => {
    const topLevel = list
      .filter((comment) => !comment?.parentId)
      .sort((a, b) => Number(a?.createdAt || 0) - Number(b?.createdAt || 0));

    const replies = list
      .filter((comment) => !!comment?.parentId)
      .sort((a, b) => Number(a?.createdAt || 0) - Number(b?.createdAt || 0));

    const output: PrivateComment[] = [];

    for (const parent of topLevel) {
      output.push(parent);

      const childReplies = replies.filter(
        (reply) => String(reply?.parentId || "") === String(parent.id)
      );

      for (const reply of childReplies) {
        output.push(reply);
      }
    }

    const orphanReplies = replies.filter(
      (reply) => !topLevel.some((parent) => String(parent.id) === String(reply.parentId))
    );

    for (const orphan of orphanReplies) {
      output.push(orphan);
    }

    return output;
  }, []);

  const loadComments = useCallback(async () => {
    if (!visible || !safeTargetId || !safeOwnerId) return;

    setLoading(true);

    try {
      const headers = await authHeaders();

      if (targetType === "gallery_media") {
        const res = await fetch(
          `${API_BASE}/media/${safeOwnerId}/comments?mediaId=${encodeURIComponent(
            safeTargetId
          )}`,
          { headers }
        );

        if (!res.ok) throw new Error(await parseError(res));

        const json = await res.json();
        const rawComments = Array.isArray(json?.comments) ? json.comments : [];
        const enriched = await enrichComments(rawComments, ownerUser, headers);
        const ordered = orderThreadedComments(enriched);

        setComments(ordered);
        await onChanged?.(ordered);
        return;
      }

      const res = await fetch(`${API_BASE}/buzz/posts/${safeTargetId}/comments`, {
        headers,
      });

      if (!res.ok) throw new Error(await parseError(res));

      const json = await res.json();
      const rawComments = Array.isArray(json?.comments) ? json.comments : [];
      const enriched = await enrichComments(rawComments, ownerUser, headers);
      const ordered = orderThreadedComments(enriched);

      setComments(ordered);
      await onChanged?.(ordered);
    } catch (error: any) {
      Alert.alert(
        "Comments",
        error?.message ? String(error.message) : "Failed to load comments."
      );
    } finally {
      setLoading(false);
    }
  }, [
    enrichComments,
    onChanged,
    orderThreadedComments,
    ownerUser,
    parseError,
    safeOwnerId,
    safeTargetId,
    targetType,
    visible,
  ]);

  useEffect(() => {
    if (!visible) return;

    setDraft("");
    setEditingCommentId(null);
    setReplyingTo(null);
    loadComments();
  }, [loadComments, visible]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      const nextHeight = Number(event?.endCoordinates?.height || 0);
      setKeyboardHeight(nextHeight);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (!comments.length) return;

    const targetFocusId = String(
      initialReplyId || initialCommentId || initialParentId || ""
    ).trim();

    if (!targetFocusId) return;

    const idx = comments.findIndex(
      (comment) => String(comment?.id || "") === targetFocusId
    );

    if (idx < 0) return;

    setFocusedCommentId(targetFocusId);

    const scrollTimer = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.25,
        });
      } catch {
        try {
          listRef.current?.scrollToOffset({
            offset: Math.max(0, idx * 96),
            animated: true,
          });
        } catch {}
      }
    }, 250);

    const clearTimer = setTimeout(() => {
      setFocusedCommentId((current) =>
        current === targetFocusId ? "" : current
      );
    }, 3200);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [
    visible,
    comments,
    initialCommentId,
    initialParentId,
    initialReplyId,
  ]);

  const refreshLatestComments = useCallback(async () => {
    if (!visible || !safeTargetId || !safeOwnerId || refreshing) return;

    setRefreshing(true);

    try {
      await loadComments();
    } finally {
      setRefreshing(false);
    }
  }, [loadComments, refreshing, safeOwnerId, safeTargetId, visible]);

  const resetComposer = useCallback(() => {
    setDraft("");
    setSelectedPhotoUri("");
    setSelectedPhotoUrl("");
    setUploadingPhoto(false);
    setEditingCommentId(null);
    setReplyingTo(null);
  }, []);

    const sendComment = useCallback(async () => {
    const text = draft.trim();
    const imageUrl = String(selectedPhotoUrl || "").trim();

    if ((!text && !imageUrl) || !safeTargetId || !safeOwnerId || uploadingPhoto) return;

    try {
      const headers = await authHeaders();

      if (targetType === "gallery_media") {
        if (editingCommentId) {
          const res = await fetch(
            `${API_BASE}/media/${safeOwnerId}/comment/${editingCommentId}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({
                mediaId: safeTargetId,
                text,
              }),
            }
          );

          if (!res.ok) throw new Error(await parseError(res));

          resetComposer();
          await loadComments();
          return;
        }

        const textToSend =
          replyingTo && !text.startsWith("@")
            ? `${replySeedFor(replyingTo.name)}${text}`
            : text;

             const res = await fetch(`${API_BASE}/media/${safeOwnerId}/comment`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            mediaId: safeTargetId,
            text: textToSend,
            imageUrl: imageUrl || null,
            photoUrl: imageUrl || null,
            parentId: replyingTo ? String(replyingTo.id) : null,
          }),
        });
        if (!res.ok) throw new Error(await parseError(res));

        resetComposer();
        await loadComments();
        return;
      }

      if (editingCommentId) {
        const res = await fetch(
          `${API_BASE}/buzz/posts/${safeTargetId}/comments/${editingCommentId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ text }),
          }
        );

        if (!res.ok) throw new Error(await parseError(res));

        resetComposer();
        await loadComments();
        return;
      }

      const textToSend =
        replyingTo && !text.startsWith("@") ? `${replySeedFor(replyingTo.name)}${text}` : text;

         const res = await fetch(`${API_BASE}/buzz/posts/${safeTargetId}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          text: textToSend,
          imageUrl: imageUrl || null,
          photoUrl: imageUrl || null,
          parentId: replyingTo ? String(replyingTo.id) : null,
        }),
      });

      if (!res.ok) throw new Error(await parseError(res));

      resetComposer();
      await loadComments();
    } catch (error: any) {
      Alert.alert(
        "Comments",
        error?.message ? String(error.message) : "Failed to send comment."
      );
    }
    }, [
    draft,
    editingCommentId,
    loadComments,
    parseError,
    replyingTo,
    resetComposer,
    safeOwnerId,
    safeTargetId,
    selectedPhotoUrl,
    targetType,
    uploadingPhoto,
  ]);
  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!safeTargetId || !safeOwnerId) return;

      try {
        const headers = await authHeaders();

        if (targetType === "gallery_media") {
          const res = await fetch(`${API_BASE}/media/${safeOwnerId}/comment/${commentId}`, {
            method: "DELETE",
            headers,
            body: JSON.stringify({ mediaId: safeTargetId }),
          });

          if (!res.ok) throw new Error(await parseError(res));

          if (editingCommentId === String(commentId)) resetComposer();
          if (replyingTo?.id === String(commentId)) resetComposer();

          await loadComments();
          return;
        }

        const res = await fetch(`${API_BASE}/buzz/posts/${safeTargetId}/comments/${commentId}`, {
          method: "DELETE",
          headers,
        });

        if (!res.ok) throw new Error(await parseError(res));

        if (editingCommentId === String(commentId)) resetComposer();
        if (replyingTo?.id === String(commentId)) resetComposer();

        await loadComments();
      } catch (error: any) {
        Alert.alert(
          "Comments",
          error?.message ? String(error.message) : "Failed to delete comment."
        );
      }
    },
    [
      editingCommentId,
      loadComments,
      parseError,
      replyingTo,
      resetComposer,
      safeOwnerId,
      safeTargetId,
      targetType,
    ]
  );

   const toggleCommentHeart = useCallback(
    async (comment: PrivateComment) => {
      const commentId = String(comment?.id || "").trim();
      if (!commentId || !safeTargetId || !safeOwnerId) return;

      const alreadyLiked = String(comment?.myReaction || "") === "❤️";

      try {
        const headers = await authHeaders();

        if (targetType === "gallery_media") {
          const res = await fetch(
            `${API_BASE}/media/${safeOwnerId}/comment/${commentId}/react`,
            {
              method: alreadyLiked ? "DELETE" : "POST",
              headers,
              body: JSON.stringify({
                mediaId: safeTargetId,
                emoji: "❤️",
              }),
            }
          );

          if (!res.ok) throw new Error(await parseError(res));

          await loadComments();
          return;
        }

        const res = await fetch(
          `${API_BASE}/buzz/posts/${safeTargetId}/comments/${commentId}/react`,
          {
            method: alreadyLiked ? "DELETE" : "POST",
            headers,
            body: alreadyLiked ? undefined : JSON.stringify({ emoji: "❤️" }),
          }
        );

        if (!res.ok) throw new Error(await parseError(res));

        await loadComments();
      } catch (error: any) {
        Alert.alert(
          "Comment like",
          error?.message ? String(error.message) : "Failed to update comment like."
        );
      }
    },
    [loadComments, parseError, safeOwnerId, safeTargetId, targetType]
  );

  const openActionMenu = useCallback((comment: PrivateComment, name: string) => {
    setSelectedComment(comment);
    setActionMenuVisible(true);
  }, []);

  const handleAction = useCallback((action: string) => {
    if (!selectedComment) return;

    const authorName = getUserName(selectedComment.author || {});

    switch (action) {
      case "reply":
        setEditingCommentId(null);
        setReplyingTo({ id: String(selectedComment.id), name: authorName });
        setDraft(replySeedFor(authorName));
        break;
      case "edit":
        setReplyingTo(null);
        setEditingCommentId(String(selectedComment.id));
        setDraft(String(selectedComment.text || ""));
        break;
      case "delete":
        Alert.alert(
          "Delete Comment",
          "Are you sure you want to delete this comment?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteComment(String(selectedComment.id)) }
          ]
        );
        break;
    }

    setActionMenuVisible(false);
    setSelectedComment(null);
  }, [selectedComment, deleteComment]);

  const renderComment = useCallback(
    ({ item }: { item: PrivateComment }) => {
      const author = item.author || {};
      const authorId = String(item.userId || getUserId(author));
      const authorName = getUserName(author);
      const avatarUri = getUserAvatar(author);
      const isReply = !!item.parentId;

      const parentComment = isReply
        ? comments.find((comment) => String(comment.id) === String(item.parentId))
        : null;

         const parentAuthor = parentComment?.author || {};
      const parentAuthorName = parentComment ? getUserName(parentAuthor) : "User";

                const hasActions = item.canEdit || item.canDelete || item.canReply;
      const likedByMe = String(item?.myReaction || "") === "❤️";
      const heartCount = getHeartCount(item);
      const commentTime = formatCommentTime(item?.createdAt || item?.updatedAt);
      const isFocusedComment = String(item?.id || "") === String(focusedCommentId || "");

      return (
        <View
          style={[
            styles.commentRow,
            isReply ? styles.replyCommentRow : null,
            isFocusedComment ? styles.focusedCommentRow : null,
          ]}
        >
          <TouchableOpacity
            onPress={() => openAuthorProfile(authorId)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: avatarUri }} style={styles.commentAvatar} />
          </TouchableOpacity>

          <View style={styles.commentBody}>
            <View style={styles.commentTopRow}>
                        <TouchableOpacity
                onPress={() => openAuthorProfile(authorId)}
                activeOpacity={0.75}
                style={styles.commentAuthorPressable}
              >
                <View style={styles.commentNameTimeRow}>
                  <Text style={styles.commentName} numberOfLines={1}>
                    {authorName}
                  </Text>

                  {commentTime ? (
                    <Text style={styles.commentTime} numberOfLines={1}>
                      {commentTime}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>

              {hasActions && (
                <TouchableOpacity
                  onPress={() => openActionMenu(item, authorName)}
                  hitSlop={10}
                  style={styles.menuButton}
                >
                  <View style={styles.menuDots}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {isReply ? (
              <Text style={styles.replyMetaText}>Replied to {parentAuthorName}</Text>
            ) : null}

          {String(item.text || "").trim() ? (
              <Text style={styles.commentText}>{item.text}</Text>
            ) : null}

                 {getCommentImage(item) ? (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.commentImageWrap}
                onPress={() => openFullScreenPhoto(getCommentImage(item))}
              >
                <Image source={{ uri: getCommentImage(item) }} style={styles.commentImage} />
              </TouchableOpacity>
            ) : null}

            <View style={styles.commentReactionRow}>
              <TouchableOpacity
                onPress={() => toggleCommentHeart(item)}
                activeOpacity={0.75}
                hitSlop={8}
                style={[
                  styles.commentHeartButton,
                  likedByMe ? styles.commentHeartButtonActive : null,
                ]}
              >
                <Ionicons
                  name={likedByMe ? "heart" : "heart-outline"}
                  size={15}
                  color={likedByMe ? PREMIUM.danger : PREMIUM.textLight}
                />

                {heartCount > 0 ? (
                  <Text
                    style={[
                      styles.commentHeartCount,
                      likedByMe ? styles.commentHeartCountActive : null,
                    ]}
                  >
                    {heartCount}
                  </Text>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
      },
    [
      comments,
      focusedCommentId,
      openAuthorProfile,
      openActionMenu,
      openFullScreenPhoto,
      toggleCommentHeart,
    ]
  );
    return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTapArea} onPress={onClose} />

                 <View
            style={[
              styles.sheet,
              {
                height: sheetHeight,
                marginBottom: sheetBottomGap,
              },
            ]}
          >
            <LinearGradient
              colors={[PREMIUM.primary, PREMIUM.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerGradient}
            >
              <View style={styles.sheetHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.lockIconContainer}>
                    <Ionicons name="lock-closed" size={16} color={PREMIUM.surface} />
                  </View>
                  <View style={styles.sheetTitleWrap}>
                    <Text style={styles.sheetTitle}>{title}</Text>
                    <View style={styles.privateBadge}>
                      <Ionicons name="eye-off" size={12} color={PREMIUM.surface} />
                      <Text style={styles.privateHint}>Private</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color={PREMIUM.surface} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

           <FlatList
              ref={listRef}
              data={comments}
              keyExtractor={(item) => String(item.id)}
              style={styles.list}
              contentContainerStyle={comments.length ? styles.listContent : styles.emptyContent}
              renderItem={renderComment}
              extraData={focusedCommentId}
              scrollEnabled
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refreshLatestComments}
                  tintColor={PREMIUM.primary}
                  colors={[PREMIUM.primary, PREMIUM.secondary]}
                />
              }
              ListFooterComponent={<View style={styles.listFooterSpace} />}
              ListEmptyComponent={
                <View style={styles.center}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="chatbubble-ellipses-outline" size={48} color={PREMIUM.textLight} />
                  </View>
                  <Text style={styles.emptyText}>
                    {loading ? "Loading comments…" : "No private comments yet."}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {!loading && "Your private conversations will appear here"}
                  </Text>
                </View>
              }
            />

            {editingCommentId || replyingTo ? (
              <View style={styles.composeModeRow}>
                <View style={styles.composeModeLeft}>
                  <Ionicons 
                    name={editingCommentId ? "create-outline" : "return-up-back-outline"} 
                    size={14} 
                    color={PREMIUM.primary} 
                  />
                  <Text style={styles.composeModeText}>
                    {editingCommentId
                      ? "Editing comment"
                      : replyingTo
                      ? `Replying to ${replyingTo.name}`
                      : ""}
                  </Text>
                </View>

                <TouchableOpacity onPress={resetComposer}>
                  <Text style={styles.composeModeCancel}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : null}

                    <View
              style={[
                styles.inputContainer,
                { paddingBottom: composerBottomPadding },
              ]}
            >
              {selectedPhotoUri ? (
                <View style={styles.selectedPhotoPreviewRow}>
                  <Image source={{ uri: selectedPhotoUri }} style={styles.selectedPhotoPreview} />

                  <View style={styles.selectedPhotoInfo}>
                    <Text style={styles.selectedPhotoTitle}>
                      {uploadingPhoto ? "Uploading photo…" : "Photo ready"}
                    </Text>
                    <Text style={styles.selectedPhotoSubtitle}>
                      {uploadingPhoto
                        ? "Please wait before sending."
                        : "This photo will be sent with your private comment."}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPhotoUri("");
                      setSelectedPhotoUrl("");
                      setUploadingPhoto(false);
                    }}
                    hitSlop={10}
                    style={styles.removePhotoButton}
                  >
                    <Ionicons name="close" size={16} color={PREMIUM.surface} />
                  </TouchableOpacity>
                </View>
              ) : null}

                <View style={styles.inputRow}>
                <View style={styles.leftComposerActions}>
                  <TouchableOpacity
                    onPress={pickCommentPhoto}
                    hitSlop={8}
                    style={styles.composerIconButton}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="image-outline" size={22} color={PREMIUM.primary} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  ref={inputRef}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={
                    editingCommentId
                      ? "Edit your private comment…"
                      : replyingTo
                      ? "Write your reply…"
                      : "Write a private comment…"
                  }
                  placeholderTextColor={PREMIUM.textLight}
                  style={styles.input}
                  multiline
                />

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    ((!draft.trim() && !selectedPhotoUrl) || uploadingPhoto) ? styles.sendBtnDisabled : null,
                  ]}
                  onPress={sendComment}
                  disabled={(!draft.trim() && !selectedPhotoUrl) || uploadingPhoto}
                >
                  <LinearGradient
                    colors={[PREMIUM.primary, PREMIUM.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendBtnInner}
                  >
                    <Ionicons name="send" size={18} color={PREMIUM.surface} />
                  </LinearGradient>
                 </TouchableOpacity>
              </View>
            </View>
                 </View>
        </View>
      </Modal>

      <Modal
        visible={!!fullScreenPhotoUrl}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeFullScreenPhoto}
      >
        <View style={styles.fullScreenPhotoBackdrop}>
          <Pressable style={styles.fullScreenPhotoCloseLayer} onPress={closeFullScreenPhoto} />

          <Animated.View
            {...fullScreenPhotoPanResponder.panHandlers}
            style={[
              styles.fullScreenPhotoContent,
              {
                transform: [{ translateY: fullScreenPhotoTranslateY }],
              },
            ]}
          >
            <Image
              source={{ uri: fullScreenPhotoUrl }}
              style={styles.fullScreenPhotoImage}
              resizeMode="contain"
            />

            <View style={styles.fullScreenPhotoTopBar}>
              <TouchableOpacity
                onPress={closeFullScreenPhoto}
                hitSlop={12}
                style={styles.fullScreenPhotoCloseButton}
              >
                <Ionicons name="close" size={22} color={PREMIUM.surface} />
              </TouchableOpacity>
            </View>

            <View style={styles.fullScreenPhotoHintWrap}>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Custom Action Menu Modal */}
      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <Pressable 
          style={styles.actionMenuBackdrop} 
          onPress={() => setActionMenuVisible(false)}
        >
          <View style={styles.actionMenuContainer}>
            <View style={styles.actionMenu}>
              {selectedComment?.canReply && (
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => handleAction("reply")}
                >
                  <Ionicons name="return-up-back-outline" size={20} color={PREMIUM.primary} />
                  <Text style={styles.actionMenuItemText}>Reply</Text>
                </TouchableOpacity>
              )}
              
              {selectedComment?.canEdit && (
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => handleAction("edit")}
                >
                  <Ionicons name="create-outline" size={20} color={PREMIUM.primary} />
                  <Text style={styles.actionMenuItemText}>Edit</Text>
                </TouchableOpacity>
              )}
              
              {selectedComment?.canDelete && (
                <TouchableOpacity
                  style={[styles.actionMenuItem, styles.actionMenuItemDanger]}
                  onPress={() => handleAction("delete")}
                >
                  <Ionicons name="trash-outline" size={20} color={PREMIUM.danger} />
                  <Text style={[styles.actionMenuItemText, styles.actionMenuItemTextDanger]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.actionMenuDivider} />
              
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => setActionMenuVisible(false)}
              >
                <Ionicons name="close-outline" size={20} color={PREMIUM.textLight} />
                <Text style={[styles.actionMenuItemText, styles.actionMenuItemTextCancel]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  backdropTapArea: {
    ...StyleSheet.absoluteFillObject,
  },

   sheet: {
    backgroundColor: PREMIUM.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: PREMIUM.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },

  headerGradient: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  lockIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  sheetTitleWrap: {
    gap: 4,
  },

  sheetTitle: {
    color: PREMIUM.surface,
    fontSize: 18,
    fontWeight: "700",
  },

  privateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  privateHint: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "500",
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  list: {
    flex: 1,
  },

   listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },

  listFooterSpace: {
    height: 22,
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PREMIUM.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyText: {
    color: PREMIUM.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },

  emptySubtext: {
    color: PREMIUM.textLight,
    fontSize: 13,
    marginTop: 4,
  },

  commentRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  replyCommentRow: {
    marginLeft: 32,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: PREMIUM.primary + "20",
  },

  focusedCommentRow: {
    backgroundColor: PREMIUM.primary + "12",
    borderRadius: 16,
    marginHorizontal: 10,
  },

  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PREMIUM.border,
  },

  commentBody: {
    flex: 1,
  },

  commentTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  commentAuthorPressable: {
    flex: 1,
    paddingRight: 8,
  },

  commentNameTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexShrink: 1,
  },

  commentName: {
    color: PREMIUM.text,
    fontWeight: "700",
    fontSize: 14,
    flexShrink: 1,
  },

  commentTime: {
    color: PREMIUM.textLight,
    fontSize: 11,
    fontWeight: "500",
  },

  replyMetaText: {
    color: PREMIUM.primary,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 2,
    fontWeight: "500",
  },

  commentText: {
    color: PREMIUM.text,
    marginTop: 4,
    lineHeight: 20,
    fontSize: 14,
  },

  commentReactionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  commentHeartButton: {
    minHeight: 28,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: PREMIUM.border,
  },

  commentHeartButtonActive: {
    backgroundColor: PREMIUM.danger + "12",
  },

  commentHeartCount: {
    color: PREMIUM.textLight,
    fontSize: 12,
    fontWeight: "700",
  },

  commentHeartCountActive: {
    color: PREMIUM.danger,
  },

  menuButton: {
    padding: 8,
    marginRight: -8,
  },

  menuDots: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: PREMIUM.textLight,
  },

  composeModeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: PREMIUM.border,
    borderRadius: 12,
  },

  composeModeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  composeModeText: {
    color: PREMIUM.primary,
    fontSize: 12,
    fontWeight: "600",
  },

  composeModeCancel: {
    color: PREMIUM.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PREMIUM.border,
    backgroundColor: PREMIUM.surface,
  },

   inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  leftComposerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 2,
  },

  composerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PREMIUM.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    backgroundColor: PREMIUM.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: PREMIUM.text,
    fontSize: 14,
    maxHeight: 100,
  },

  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: PREMIUM.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  sendBtnDisabled: {
    opacity: 0.45,
  },

  sendBtnInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedPhotoPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: PREMIUM.border,
  },

  selectedPhotoPreview: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: PREMIUM.surface,
  },

  selectedPhotoInfo: {
    flex: 1,
  },

  selectedPhotoTitle: {
    color: PREMIUM.text,
    fontSize: 13,
    fontWeight: "700",
  },

  selectedPhotoSubtitle: {
    color: PREMIUM.textLight,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },

  removePhotoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PREMIUM.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  commentImageWrap: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    alignSelf: "flex-start",
    backgroundColor: PREMIUM.border,
  },

  commentImage: {
    width: 180,
    height: 180,
    borderRadius: 14,
    resizeMode: "cover",
  },

  fullScreenPhotoBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullScreenPhotoCloseLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  fullScreenPhotoContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  fullScreenPhotoImage: {
    width: "100%",
    height: "100%",
  },

  fullScreenPhotoTopBar: {
    position: "absolute",
    top: 48,
    right: 18,
    left: 18,
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  fullScreenPhotoCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullScreenPhotoHintWrap: {
    position: "absolute",
    bottom: 42,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  fullScreenPhotoHint: {
    color: PREMIUM.surface,
    fontSize: 12,
    fontWeight: "600",
  },

  // Action Menu Styles
  actionMenuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  actionMenuContainer: {
    width: "80%",
    maxWidth: 280,
  },

  actionMenu: {
    backgroundColor: PREMIUM.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: PREMIUM.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },

  actionMenuItemDanger: {
    borderTopWidth: 0,
  },

  actionMenuItemText: {
    fontSize: 16,
    color: PREMIUM.text,
    fontWeight: "500",
  },

  actionMenuItemTextDanger: {
    color: PREMIUM.danger,
  },

  actionMenuItemTextCancel: {
    color: PREMIUM.textLight,
    fontWeight: "400",
  },

  actionMenuDivider: {
    height: 1,
    backgroundColor: PREMIUM.border,
    marginVertical: 4,
  },
});
/**
 * ============================================================
 * 📁 File: src/components/chat/ChatUploadPreview.tsx
 * 🎯 Purpose: Modern full-screen chat media upload preview
 *
 * Owns UI only:
 *  - Full-screen photo/video preview before sending
 *  - Top cancel + download/save controls
 *  - Bottom same-height composer/control row
 *  - One-tap cycle: keep → view once → view twice
 *  - Gift locked media controls
 *  - Video mute/unmute, duration, pause/play
 *
 * Does NOT upload.
 * Does NOT post chat messages.
 * Does NOT touch sockets.
 * Does NOT change Cloudflare R2 / Stream behavior.
 * ============================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#f5f6fa",
  line: "rgba(17,24,39,0.10)",
  lineDark: "rgba(255,255,255,0.18)",
  glass: "rgba(0,0,0,0.42)",
};

export type ChatPreviewMode = "keep" | "once" | "twice";

export type PickedChatMedia = {
  uri: string;
  mediaType: "image" | "video";
  width?: number;
  height?: number;
  duration?: number;
};

export type ChatAttachPayload = {
  type: "media";
  url: string;
  mediaType: "image" | "video";
  duration?: number;
  previewMuted?: boolean;
  ephemeral?: {
    mode: ChatPreviewMode;
    maxViews?: 1 | 2;
  };
  gift?: {
    locked: boolean;
    priceBC?: number;
    amount?: number;
    currency?: "BC";
  };
  overlayText?: string;
};

export type ChatUploadPreviewSendPayload = Omit<ChatAttachPayload, "url"> & {
  localUri: string;
};

type Props = {
  visible: boolean;
  selected: PickedChatMedia | null;
  sending?: boolean;
  onCancel: () => void;
  onSend: (payload: ChatUploadPreviewSendPayload) => Promise<void> | void;
};

function formatDuration(msOrSeconds?: number) {
  const raw = Number(msOrSeconds || 0);
  if (!Number.isFinite(raw) || raw <= 0) return "0:00";

  const totalSeconds = raw > 1000 ? Math.floor(raw / 1000) : Math.floor(raw);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function nextMode(current: ChatPreviewMode): ChatPreviewMode {
  if (current === "keep") return "once";
  if (current === "once") return "twice";
  return "keep";
}

function modeIcon(mode: ChatPreviewMode): keyof typeof Ionicons.glyphMap {
  if (mode === "once") return "eye-outline";
  if (mode === "twice") return "repeat-outline";
  return "chatbubble-ellipses-outline";
}

function modeTinyBadge(mode: ChatPreviewMode) {
  if (mode === "once") return "1";
  if (mode === "twice") return "2";
  return "";
}

function modeLabel(mode: ChatPreviewMode) {
  if (mode === "once") return "View once";
  if (mode === "twice") return "View twice";
  return "Keep";
}

export default function ChatUploadPreview({
  visible,
  selected,
  sending = false,
  onCancel,
  onSend,
}: Props) {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video | null>(null);

  const [mode, setMode] = useState<ChatPreviewMode>("keep");
  const [giftLocked, setGiftLocked] = useState(false);
  const [giftPriceText, setGiftPriceText] = useState("");
  const [messageText, setMessageText] = useState("");

  const [videoMuted, setVideoMuted] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoDurationMs, setVideoDurationMs] = useState(0);
  const [videoPositionMs, setVideoPositionMs] = useState(0);
  const [downloadBusy, setDownloadBusy] = useState(false);

  const isVideo = selected?.mediaType === "video";

  const maxViews = useMemo(() => {
    if (mode === "once") return 1;
    if (mode === "twice") return 2;
    return undefined;
  }, [mode]);

  const giftPriceBC = useMemo(() => {
    const raw = String(giftPriceText || "").replace(/[^\d]/g, "");
    const n = Math.floor(Number(raw) || 0);

    if (n <= 0) return 0;
    return Math.min(n, 10000);
  }, [giftPriceText]);

  const videoTimeLabel = useMemo(() => {
    const total =
      videoDurationMs ||
      (Number(selected?.duration || 0) > 1000
        ? Number(selected?.duration || 0)
        : Number(selected?.duration || 0) * 1000);

    return `${formatDuration(videoPositionMs)} / ${formatDuration(total)}`;
  }, [videoDurationMs, videoPositionMs, selected?.duration]);

  useEffect(() => {
    if (!visible) {
      setMode("keep");
      setGiftLocked(false);
      setGiftPriceText("");
      setMessageText("");
      setVideoMuted(true);
      setVideoPlaying(true);
      setVideoDurationMs(0);
      setVideoPositionMs(0);
      setDownloadBusy(false);
      return;
    }

    setMode("keep");
    setGiftLocked(false);
    setGiftPriceText("");
    setMessageText("");
    setVideoMuted(true);
    setVideoPlaying(true);
    setVideoDurationMs(0);
    setVideoPositionMs(0);
    setDownloadBusy(false);
  }, [visible, selected?.uri]);

  const submit = async () => {
    if (!selected?.uri || sending) return;

    if (giftLocked && giftPriceBC <= 0) {
      Alert.alert(
        "Set unlock price",
        "Enter the BuzzCoin price needed to unlock this media."
      );
      return;
    }

     await onSend({
      type: "media",
      mediaType: selected.mediaType,
      duration: selected.duration,
      previewMuted: selected.mediaType === "video" ? !!videoMuted : false,
      ephemeral: {
        mode,
        maxViews: maxViews as any,
      },
      gift: {
        locked: !!giftLocked,
        priceBC: giftLocked ? giftPriceBC : 0,
        amount: giftLocked ? giftPriceBC : 0,
        currency: "BC",
      },
      overlayText: messageText.trim(),
      localUri: selected.uri,
    });
  };

  const saveToPhone = async () => {
    if (!selected?.uri || downloadBusy) return;

    try {
      setDownloadBusy(true);

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission?.granted) {
        Alert.alert(
          "Permission needed",
          "Allow photo library access to save this media to your phone."
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(selected.uri);

      Alert.alert(
        "Saved",
        isVideo ? "Video saved to your phone." : "Photo saved to your phone."
      );
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Could not save this media.");
    } finally {
      setDownloadBusy(false);
    }
  };

  const toggleVideoPlayback = async () => {
    if (!isVideo) return;

    try {
      if (videoPlaying) {
        await videoRef.current?.pauseAsync();
        setVideoPlaying(false);
      } else {
        await videoRef.current?.playAsync();
        setVideoPlaying(true);
      }
    } catch {
      setVideoPlaying((prev) => !prev);
    }
  };

  const onVideoStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setVideoPlaying(!!status.isPlaying);
    setVideoPositionMs(status.positionMillis || 0);

    if (typeof status.durationMillis === "number") {
      setVideoDurationMs(status.durationMillis);
    }
  };

  const toggleGift = () => {
    setGiftLocked((prev) => {
      const next = !prev;
      if (!next) setGiftPriceText("");
      return next;
    });
  };

  return (
    <Modal visible={visible && !!selected} animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.root}>
          <View
            style={[
              styles.mediaStage,
              {
                paddingTop: Math.max(insets.top + 8, 18),
              },
            ]}
          >
            <View style={styles.mediaFrame}>
              {isVideo ? (
                <Pressable style={styles.mediaPressable} onPress={toggleVideoPlayback}>
                  <Video
                    ref={videoRef}
                    source={{ uri: selected?.uri || "" }}
                    style={styles.media}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    isLooping
                    isMuted={videoMuted}
                    useNativeControls={false}
                    progressUpdateIntervalMillis={250}
                    onPlaybackStatusUpdate={onVideoStatus}
                  />

                  <View style={styles.centerPlayButton}>
                    <Ionicons
                      name={videoPlaying ? "pause" : "play"}
                      size={25}
                      color={RBZ.white}
                    />
                  </View>
                </Pressable>
              ) : (
                <Image
                  source={{ uri: selected?.uri || "" }}
                  style={styles.media}
                  resizeMode="contain"
                />
              )}

              <View style={styles.topActions}>
                <Pressable onPress={onCancel} style={styles.topIconButton} disabled={sending}>
                  <Ionicons name="close" size={20} color={RBZ.white} />
                </Pressable>

                <Pressable
                  onPress={saveToPhone}
                  style={styles.topIconButton}
                  disabled={downloadBusy}
                >
                  {downloadBusy ? (
                    <ActivityIndicator color={RBZ.white} size="small" />
                  ) : (
                    <Ionicons name="download-outline" size={20} color={RBZ.white} />
                  )}
                </Pressable>
              </View>

              {isVideo ? (
                <>
                  <Pressable
                    onPress={() => setVideoMuted((prev) => !prev)}
                    style={styles.videoMuteButton}
                  >
                    <Ionicons
                      name={videoMuted ? "volume-mute" : "volume-high"}
                      size={18}
                      color={RBZ.white}
                    />
                  </Pressable>

                  <View style={styles.videoDurationPill}>
                    <Text style={styles.videoDurationText}>{videoTimeLabel}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.footer,
              {
                paddingBottom: Math.max(insets.bottom, 10),
              },
            ]}
          >
            {giftLocked ? (
              <View style={styles.giftPricePanel}>
                <View style={styles.giftPriceLeft}>
                  <Ionicons name="gift-outline" size={17} color={RBZ.c2} />
                  <Text style={styles.giftPriceTitle}>Unlock price</Text>
                </View>

                <View style={styles.priceInputWrap}>
                  <TextInput
                    value={giftPriceText}
                    onChangeText={(txt) => setGiftPriceText(txt.replace(/[^\d]/g, ""))}
                    placeholder="100"
                    placeholderTextColor="rgba(17,24,39,0.35)"
                    keyboardType="number-pad"
                    style={styles.priceInput}
                    maxLength={5}
                  />
                  <Text style={styles.priceUnit}>BC</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.bottomBar}>
              <Pressable
                onPress={() => setMode((prev) => nextMode(prev))}
                style={[
                  styles.squareButton,
                  mode !== "keep" ? styles.activeSquareButton : null,
                ]}
              >
                <Ionicons
                  name={modeIcon(mode)}
                  size={21}
                  color={mode === "keep" ? RBZ.c2 : RBZ.white}
                />

                {modeTinyBadge(mode) ? (
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>{modeTinyBadge(mode)}</Text>
                  </View>
                ) : null}
              </Pressable>

              <Pressable
                onPress={toggleGift}
                style={[
                  styles.squareButton,
                  giftLocked ? styles.activeSquareButton : null,
                ]}
              >
                <Ionicons
                  name={giftLocked ? "lock-closed" : "gift-outline"}
                  size={21}
                  color={giftLocked ? RBZ.white : RBZ.c2}
                />
              </Pressable>

              <View style={styles.composerWrap}>
                <TextInput
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Message..."
                  placeholderTextColor="rgba(17,24,39,0.36)"
                  style={styles.composerInput}
                  maxLength={180}
                  multiline={false}
                  returnKeyType="done"
                />
              </View>

              <Pressable
                onPress={submit}
                style={styles.sendButton}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color={RBZ.white} size="small" />
                ) : (
                  <Ionicons name="paper-plane-outline" size={22} color={RBZ.white} />
                )}
              </Pressable>
            </View>

            <Text style={styles.modeHintText}>{modeLabel(mode)}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const CONTROL_H = 46;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: RBZ.white,
  },
  root: {
    flex: 1,
    backgroundColor: RBZ.white,
  },

  mediaStage: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 8,
    backgroundColor: RBZ.white,
  },
  mediaFrame: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },
  mediaPressable: {
    flex: 1,
  },
  media: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  topActions: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: RBZ.lineDark,
    alignItems: "center",
    justifyContent: "center",
  },

  centerPlayButton: {
    position: "absolute",
    alignSelf: "center",
    top: "46%",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(0,0,0,0.36)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoMuteButton: {
    position: "absolute",
    left: 12,
    bottom: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: RBZ.lineDark,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 25,
  },
  videoDurationPill: {
    position: "absolute",
    right: 12,
    bottom: 12,
    minWidth: 86,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: RBZ.lineDark,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 25,
  },
  videoDurationText: {
    color: RBZ.white,
    fontSize: 12,
    fontWeight: "900",
  },

  footer: {
    backgroundColor: RBZ.white,
    paddingTop: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(17,24,39,0.06)",
  },
  giftPricePanel: {
    minHeight: 46,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: RBZ.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  giftPriceLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  giftPriceTitle: {
    color: RBZ.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  priceInputWrap: {
    width: 104,
    height: 34,
    borderRadius: 14,
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: RBZ.line,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
  },
  priceInput: {
    flex: 1,
    color: RBZ.ink,
    fontSize: 14,
    fontWeight: "900",
    paddingVertical: 0,
  },
  priceUnit: {
    color: RBZ.gray,
    fontSize: 10,
    fontWeight: "900",
  },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  squareButton: {
    width: CONTROL_H,
    height: CONTROL_H,
    borderRadius: 16,
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
  },
  activeSquareButton: {
    backgroundColor: RBZ.c2,
    borderColor: RBZ.c2,
  },
  modeBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: RBZ.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  modeBadgeText: {
    color: RBZ.c2,
    fontSize: 9,
    fontWeight: "900",
  },
  composerWrap: {
    flex: 1,
    height: CONTROL_H,
    borderRadius: 17,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: RBZ.line,
    paddingHorizontal: 13,
    justifyContent: "center",
  },
  composerInput: {
    flex: 1,
    color: RBZ.ink,
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 0,
  },
  sendButton: {
    width: CONTROL_H,
    height: CONTROL_H,
    borderRadius: 23,
    backgroundColor: RBZ.c2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: RBZ.c2,
    shadowOpacity: 0.18,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modeHintText: {
    marginTop: 5,
    textAlign: "center",
    color: RBZ.gray,
    fontSize: 11,
    fontWeight: "800",
  },
});
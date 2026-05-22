/**
 * ============================================================
 * 📁 File: src/components/chat/ChatPlusModal.tsx
 * 🎯 Purpose: RomBuzz Chat "➕" Attach Modal (IG-style)
 *
 * Updated Behavior (Requested):
 *  - When opened, immediately launches the system gallery picker
 *  - First time: asks permission → then opens gallery right away
 *  - After permission granted: opens gallery immediately with no prompts
 *  - Cancel picker → closes modal cleanly
 *
 * Notes:
 *  - Uses expo-image-picker (NOT expo-media-library) to avoid Android manifest crashes
 *  - Keeps preview + send payload logic unchanged
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as ScreenCapture from "expo-screen-capture";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#f5f6fa",
  line: "rgba(0,0,0,0.10)",
};

type Mode = "keep" | "once" | "twice";

type PickedMedia = {
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
  ephemeral?: {
    mode: Mode;
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

export default function ChatPlusModal({
  visible,
  onClose,
  onSendPayload,
}: {
  visible: boolean;
  onClose: () => void;
  onSendPayload: (
    payload: Omit<ChatAttachPayload, "url"> & { localUri: string }
  ) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PickedMedia | null>(null);

  // Preview controls
  const [mode, setMode] = useState<Mode>("keep");
  const [giftLocked, setGiftLocked] = useState(false);
  const [giftPriceText, setGiftPriceText] = useState("");
  const [overlayText, setOverlayText] = useState("");
  const [typingText, setTypingText] = useState(false);

  // Prevent double-launch when `visible` re-renders
  const launchedRef = useRef(false);

  const screenW = Dimensions.get("window").width;
  const col = 3;
  const gap = 8;
  const tileW = useMemo(() => {
    const sidePad = 12;
    const totalGap = gap * (col - 1);
    return Math.floor((screenW - sidePad * 2 - totalGap) / col);
  }, [screenW]);

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

  // Prevent screenshot/screenrecord ONLY while preview open
  useEffect(() => {
    (async () => {
      try {
        if (selected) {
          await ScreenCapture.preventScreenCaptureAsync();
        } else {
          await ScreenCapture.allowScreenCaptureAsync();
        }
      } catch {
        // ignore if platform blocks it
      }
    })();

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, [selected]);

   const resetAll = () => {
    setSelected(null);
    setMode("keep");
    setGiftLocked(false);
    setGiftPriceText("");
    setOverlayText("");
    setTypingText(false);
    setLoading(false);
  };

  const closeAll = () => {
    resetAll();
    onClose();
  };

  // ✅ When modal opens: request permission (if needed) + open system gallery immediately
  useEffect(() => {
    if (!visible) {
      launchedRef.current = false;
      return;
    }

    if (launchedRef.current) return;
    launchedRef.current = true;

    (async () => {
      try {
        setLoading(true);

        // Ask once (OS will not re-prompt after granted)
        const current = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!current?.granted) {
          const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!req?.granted) {
            setLoading(false);
            Alert.alert("Gallery", "Permission is required to access your photos.");
            closeAll();
            return;
          }
        }

        // Open system picker immediately
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 1,
          allowsMultipleSelection: false,
          selectionLimit: 1,
        });

        // Cancel → close modal
        if ((res as any)?.canceled) {
          setLoading(false);
          closeAll();
          return;
        }

        const asset = (res as any)?.assets?.[0];
        if (!asset?.uri) {
          setLoading(false);
          closeAll();
          return;
        }

        const isVideo = asset?.type === "video";

        setSelected({
          uri: asset.uri,
          mediaType: isVideo ? "video" : "image",
          width: asset.width,
          height: asset.height,
          duration: asset.duration,
        });

        setLoading(false);
      } catch (e: any) {
        setLoading(false);
        Alert.alert("Gallery", e?.message || "Failed to open gallery");
        closeAll();
      }
    })();
  }, [visible]);

  const sendNow = async () => {
    if (!selected?.uri) return;

    if (giftLocked && giftPriceBC <= 0) {
      Alert.alert("Set unlock price", "Enter the BuzzCoin price needed to unlock this media.");
      return;
    }

    const payload = {
      type: "media" as const,
      mediaType: selected.mediaType,
      ephemeral: {
        mode,
        maxViews: maxViews as any,
      },
      gift: {
        locked: !!giftLocked,
        priceBC: giftLocked ? giftPriceBC : 0,
        amount: giftLocked ? giftPriceBC : 0,
        currency: "BC" as const,
      },
      overlayText: overlayText?.trim() ? overlayText.trim() : "",
      localUri: selected.uri,
    };

    try {
      setLoading(true);
      await onSendPayload(payload);
      resetAll();
      onClose();
    } catch (e: any) {
      Alert.alert("Send failed", e?.message || "Try again");
    } finally {
      setLoading(false);
    }
  };

  const ModePill = ({ id, label }: { id: Mode; label: string }) => {
    const active = mode === id;
    return (
      <Pressable
        onPress={() => setMode(id)}
        style={[
          styles.pill,
          active ? { backgroundColor: RBZ.c4, borderColor: "transparent" } : null,
        ]}
      >
        <Text style={[styles.pillText, active ? { color: RBZ.white } : null]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={closeAll}>
      <Pressable style={styles.backdrop} onPress={closeAll}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Send media</Text>
            <Pressable onPress={closeAll} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={RBZ.white} />
            </Pressable>
          </View>

          {/* Body (we no longer render a gallery grid — system picker opens immediately) */}
          {!selected ? (
            <View style={{ paddingVertical: 18, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 10, color: RBZ.gray, fontWeight: "700" }}>
                Opening gallery…
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
              {/* Keep some space so sheet doesn’t feel broken while preview opens */}
              <View style={styles.grid}>
                <View
                  style={[
                    styles.tile,
                    { width: tileW, height: tileW, opacity: 0.35 },
                  ]}
                />
                <View
                  style={[
                    styles.tile,
                    { width: tileW, height: tileW, opacity: 0.22 },
                  ]}
                />
                <View
                  style={[
                    styles.tile,
                    { width: tileW, height: tileW, opacity: 0.15 },
                  ]}
                />
              </View>
            </View>
          )}

                {/* Preview full screen */}
          <Modal visible={!!selected} animationType="slide" onRequestClose={resetAll}>
            <KeyboardAvoidingView
              style={styles.previewWrap}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              {/* media */}
              {selected?.mediaType === "video" ? (
                <Video
                  source={{ uri: selected.uri }}
                  style={styles.previewMedia}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                />
              ) : (
                <Image
                  source={{ uri: selected?.uri || "" }}
                  style={styles.previewMedia}
                  resizeMode="contain"
                />
              )}

              {/* top actions */}
              <View style={styles.previewTop}>
                <Pressable onPress={resetAll} style={styles.previewTopBtn}>
                  <Ionicons name="close" size={18} color={RBZ.white} />
                </Pressable>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => Alert.alert("Crop", "Crop UI (v2) — wiring ready")}
                    style={styles.previewTopBtn}
                  >
                    <Ionicons name="crop" size={18} color={RBZ.white} />
                  </Pressable>

                  <Pressable onPress={() => setTypingText((p) => !p)} style={styles.previewTopBtn}>
                    <Ionicons name="text" size={18} color={RBZ.white} />
                  </Pressable>
                </View>
              </View>

              {/* text overlay input */}
              {typingText ? (
                <View style={styles.textOverlayPanel}>
                  <Text style={styles.textOverlayTitle}>Add text</Text>
                  <TextInput
                    value={overlayText}
                    onChangeText={setOverlayText}
                    placeholder="Type something…"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={styles.textOverlayInput}
                  />
                </View>
              ) : null}

              {/* bottom controls */}
              <View style={styles.previewBottom}>
                <View style={styles.modeRow}>
                  <ModePill id="keep" label="Keep" />
                  <ModePill id="once" label="View once" />
                  <ModePill id="twice" label="View twice" />
                </View>

                <View style={styles.giftLockPanel}>
                  <View style={styles.giftLockTopRow}>
                    <Pressable
                      onPress={() => setGiftLocked((p) => !p)}
                      style={[
                        styles.giftBtn,
                        giftLocked ? { backgroundColor: RBZ.c1, borderColor: "transparent" } : null,
                      ]}
                    >
                      <Ionicons name="gift" size={16} color={giftLocked ? RBZ.white : RBZ.c1} />
                      <Text style={[styles.giftText, giftLocked ? { color: RBZ.white } : null]}>
                        Gift media
                      </Text>
                    </Pressable>

                    {giftLocked ? (
                      <View style={styles.pricePreviewPill}>
                        <Ionicons name="diamond" size={13} color={RBZ.c2} />
                        <Text style={styles.pricePreviewText}>{giftPriceBC || 0} BC</Text>
                      </View>
                    ) : null}
                  </View>

                  {giftLocked ? (
                    <View style={styles.priceInputRow}>
                      <Ionicons name="lock-closed" size={16} color={RBZ.c2} />
                      <TextInput
                        value={giftPriceText}
                        onChangeText={(txt) => setGiftPriceText(txt.replace(/[^\d]/g, ""))}
                        placeholder="Unlock price"
                        placeholderTextColor="rgba(255,255,255,0.52)"
                        keyboardType="number-pad"
                        style={styles.priceInput}
                        maxLength={5}
                      />
                      <Text style={styles.priceUnit}>BC</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.bottomRow}>
                  <View style={styles.sendHintWrap}>
                    <Text style={styles.hint}>
                      {giftLocked
                        ? "Receiver must pay once to unlock forever."
                        : mode === "keep"
                        ? "Stays in chat."
                        : mode === "once"
                        ? "Opens once, then locks."
                        : "Opens twice, then locks."}
                    </Text>
                  </View>

                  <Pressable onPress={sendNow} style={styles.sendNowBtn} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color={RBZ.white} />
                    ) : (
                      <>
                        <Ionicons name={giftLocked ? "lock-closed" : "send"} size={16} color={RBZ.white} />
                        <Text style={styles.sendNowText}>
                          {giftLocked ? "Send locked" : "Send"}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: RBZ.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: RBZ.line,
    overflow: "hidden",
  },
  sheetHeader: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: RBZ.soft,
    borderBottomWidth: 1,
    borderBottomColor: RBZ.line,
  },
  sheetTitle: { fontSize: 15, fontWeight: "900", color: RBZ.ink },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 12,
  },
  tile: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
    justifyContent: "center",
  },

  previewWrap: { flex: 1, backgroundColor: "#000" },
  previewMedia: { flex: 1, width: "100%", height: "100%" },

  previewTop: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 24,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewTopBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  textOverlayPanel: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 90,
    left: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 18,
    padding: 12,
  },
  textOverlayTitle: { color: RBZ.white, fontWeight: "900", marginBottom: 8 },
  textOverlayInput: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
    color: RBZ.white,
    fontWeight: "800",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  previewBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Platform.OS === "ios" ? 26 : 18,
    paddingHorizontal: 14,
    gap: 12,
  },
  modeRow: { flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 12, fontWeight: "900", color: RBZ.white },

   bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  giftLockPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.26)",
    padding: 10,
    gap: 10,
  },
  giftLockTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  giftBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  giftText: { color: RBZ.white, fontWeight: "900" },
  pricePreviewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  pricePreviewText: {
    color: RBZ.c2,
    fontSize: 12,
    fontWeight: "900",
  },
  priceInputRow: {
    height: 46,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  priceInput: {
    flex: 1,
    color: RBZ.white,
    fontSize: 16,
    fontWeight: "900",
    paddingVertical: 0,
  },
  priceUnit: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "900",
  },
  sendHintWrap: {
    flex: 1,
  },

  sendNowBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    height: 44,
    minWidth: 120,
    borderRadius: 14,
    backgroundColor: RBZ.c2,
  },
  sendNowText: { color: RBZ.white, fontWeight: "900" },

  hint: {
    textAlign: "left",
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
});
 
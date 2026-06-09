/**
 * ============================================================
 * 📁 File: src/components/chat/ChatPlusModal.tsx
 * 🎯 Purpose: RomBuzz Chat "➕" gallery picker launcher
 *
 * What this file owns:
 *  - Opens system gallery immediately
 *  - Stores the selected local asset
 *  - Keeps screen-capture protection while preview is open
 *  - Passes selected media into ChatUploadPreview
 *
 * What this file does NOT own anymore:
 *  - Preview layout/UI
 *  - Upload logic
 *  - Socket/message posting
 * ============================================================
 */

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as ScreenCapture from "expo-screen-capture";

import ChatUploadPreview, {
  type ChatAttachPayload,
  type PickedChatMedia,
} from "@/src/components/chat/ChatUploadPreview";

const RBZ = {
  c2: "#d8345f",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#f5f6fa",
  line: "rgba(0,0,0,0.10)",
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
  const [selected, setSelected] = useState<PickedChatMedia | null>(null);

  const launchedRef = useRef(false);

  const resetAll = () => {
    setSelected(null);
    setLoading(false);
  };

  const closeAll = () => {
    resetAll();
    onClose();
  };

  useEffect(() => {
    (async () => {
      try {
        if (selected) {
          await ScreenCapture.preventScreenCaptureAsync();
        } else {
          await ScreenCapture.allowScreenCaptureAsync();
        }
      } catch {
        // ignore if platform blocks screen-capture control
      }
    })();

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, [selected]);

  useEffect(() => {
    if (!visible) {
      launchedRef.current = false;
      resetAll();
      return;
    }

    if (launchedRef.current) return;
    launchedRef.current = true;

    (async () => {
      try {
        setLoading(true);

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

        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 1,
          allowsMultipleSelection: false,
          selectionLimit: 1,
        });

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
          uri: String(asset.uri),
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

  const sendSelected = async (
    payload: Omit<ChatAttachPayload, "url"> & { localUri: string }
  ) => {
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

  return (
    <>
      <Modal
        visible={visible && !selected}
        transparent
        animationType="fade"
        onRequestClose={closeAll}
      >
        <Pressable style={styles.backdrop} onPress={closeAll}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <ActivityIndicator />
            <Text style={styles.loadingTitle}>Opening gallery…</Text>
            <Text style={styles.loadingSub}>Choose a photo or video to send.</Text>
          </Pressable>
        </Pressable>
      </Modal>

      <ChatUploadPreview
        visible={visible && !!selected}
        selected={selected}
        sending={loading}
        onCancel={closeAll}
        onSend={sendSelected}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.36)",
    justifyContent: "flex-end",
  },
  sheet: {
    margin: 12,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: RBZ.line,
    alignItems: "center",
  },
  loadingTitle: {
    marginTop: 12,
    color: RBZ.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  loadingSub: {
    marginTop: 5,
    color: RBZ.gray,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
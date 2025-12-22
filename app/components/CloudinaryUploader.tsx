/**
 * ============================================================================
 * 📁 File: app/components/CloudinaryUploader.tsx
 * 🎯 Purpose: Pick a photo from gallery, let OS editor crop it, upload to
 *             Cloudinary, then return the final URL.
 *
 * HOW IT WORKS:
 *   - When `visible` becomes true:
 *       → asks for gallery permission
 *       → opens image picker with cropping (allowsEditing: true)
 *   - Shows a preview of the chosen image.
 *   - "Use this photo" → uploads to Cloudinary with your PUBLIC env vars:
 *       EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
 *       EXPO_PUBLIC_CLOUDINARY_PRESET
 *   - Calls `onUploaded(secureUrl)` on success, then `onClose()`.
 *
 * IMPORTANT:
 *   - No WebView. No react-native-webview. No RNCWebView crash.
 * ============================================================================
 */

import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type CloudinaryUploaderProps = {
  visible: boolean;
  onUploaded?: (url: string) => void;
  onClose?: () => void;
};

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET;

const CloudinaryUploader: React.FC<CloudinaryUploaderProps> = ({
  visible,
  onUploaded,
  onClose,
}) => {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // When the modal opens, immediately launch the gallery picker
  useEffect(() => {
    if (visible) {
      pickImage();
    } else {
      setLocalUri(null);
      setUploading(false);
    }
  }, [visible]);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow photo access for RomBuzz in your phone settings."
        );
        onClose?.();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // built-in crop/rotate editor
        quality: 0.9,
      });

      if (result.canceled) {
        onClose?.();
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert("Error", "Could not read the selected image.");
        onClose?.();
        return;
      }

      setLocalUri(asset.uri);
    } catch (err) {
      console.error("Image picker error", err);
      Alert.alert("Error", "Could not open your gallery.");
      onClose?.();
    }
  };

  const uploadToCloudinary = async () => {
    if (!localUri) return;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      Alert.alert(
        "Cloudinary not configured",
        "Missing EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME or EXPO_PUBLIC_CLOUDINARY_PRESET."
      );
      onClose?.();
      return;
    }

    try {
      setUploading(true);

      const data = new FormData();
      data.append("file", {
        uri: localUri,
        type: "image/jpeg",
        name: "rombuzz-photo.jpg",
      } as any);
      data.append("upload_preset", UPLOAD_PRESET as string);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );

      const json = await res.json();

      if (!res.ok || !json.secure_url) {
        console.error("Cloudinary error", json);
        throw new Error("Upload failed");
      }

      onUploaded?.(json.secure_url as string);
      onClose?.();
    } catch (err) {
      console.error("Cloudinary upload error", err);
      Alert.alert(
        "Upload failed",
        "Something went wrong while uploading. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {!localUri ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" />
              <Text style={styles.subtitle}>Opening your photos…</Text>
            </View>
          ) : (
            <>
              <Image source={{ uri: localUri }} style={styles.preview} />
              <Text style={styles.subtitle}>
                Crop/adjust in the system editor, then confirm to use this photo.
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={pickImage}
                  disabled={uploading}
                >
                  <Text style={styles.secondaryText}>Pick another</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={uploadToCloudinary}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryText}>Use this photo</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={uploading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "88%",
    borderRadius: 20,
    padding: 20,
    backgroundColor: "#fff",
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  preview: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "#f2f2f2",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ff4f81",
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 14,
    color: "#444",
  },
  cancelButton: {
    marginTop: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 13,
    color: "#999",
  },
});

export default CloudinaryUploader;

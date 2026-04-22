/**
 * ============================================================================
 * 📁 File: app/auth/register-full/steps/Step4Photos.tsx
 * 🎯 Step 4 — Photos (min 2)
 *
 * PURPOSE:
 *   - User picks photos from gallery (no manual URL typing).
 *   - Each chosen image is uploaded to Cloudinary.
 *   - We store the secure URLs in form.photos.
 *   - First photo becomes avatar (unless user sets another).
 *   - Allows removing a photo + setting avatar.
 *
 * PROPS:
 *   - form
 *   - setField
 *   - canNext
 *   - onNext
 *   - onBack
 * ============================================================================
 */

import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import CloudinaryUploader from "../../../components/CloudinaryUploader";
import { RegisterForm } from "../index";

const MIN_PHOTOS = 2;
const MAX_PHOTOS = 6;

export type Step4Props = {
  form: RegisterForm;
  setField: <K extends keyof RegisterForm>(
    key: K,
    value: RegisterForm[K]
  ) => void;
  canNext: boolean;
  onNext: () => void;
  onBack: () => void;
};

function Step4Photos({ form, setField, canNext, onNext, onBack }: Step4Props) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;

  // Local editable copy of photos
  const [photos, setPhotos] = useState<string[]>(
    form.photos && form.photos.length > 0 ? form.photos : ["", ""]
  );

  const [uploaderVisible, setUploaderVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sanitizePhotoUrls = (items: string[]) =>
    items
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .slice(0, MAX_PHOTOS);

  const syncPhotos = (next: string[]) => {
    // Ensure we don't exceed MAX_PHOTOS
    const trimmed = next.slice(0, MAX_PHOTOS);
    setPhotos(trimmed);
    setField("photos", sanitizePhotoUrls(trimmed));

    // If no avatar yet but we have a non-empty first photo, make it avatar
    if (!form.avatar && trimmed[0] && trimmed[0].trim()) {
      setField("avatar", trimmed[0].trim());
    }
  };

  const updatePhotoAt = (index: number, value: string) => {
    const next = [...photos];
    next[index] = value;
    syncPhotos(next);
  };

  const addSlot = () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Max photos reached",
        `You can add up to ${MAX_PHOTOS} photos.`
      );
      return;
    }
    syncPhotos([...photos, ""]);
  };

  const removeSlot = (index: number) => {
    const next = photos.filter((_, i) => i !== index);

    if (next.length < MIN_PHOTOS) {
      Alert.alert(
        "Need more photos",
        `Please keep at least ${MIN_PHOTOS} photo${MIN_PHOTOS > 1 ? "s" : ""}.`
      );
      return;
    }

    syncPhotos(next);
  };

  const setAvatarFrom = (url: string) => {
    if (!url.trim()) return;
    setField("avatar", url.trim());
    Alert.alert(
      "Avatar updated",
      "This photo is now your main profile picture."
    );
  };

  const openUploaderForIndex = (index: number) => {
    setActiveIndex(index);
    setUploaderVisible(true);
  };

  const handleUploaded = (url: string) => {
    if (activeIndex == null) return;
    updatePhotoAt(activeIndex, url);
    setActiveIndex(null);
    setUploaderVisible(false);
  };

  const handleCloseUploader = () => {
    setActiveIndex(null);
    setUploaderVisible(false);
  };

  const handleNext = () => {
    const filledCount = photos.filter((p) => p.trim()).length;

    if (filledCount < MIN_PHOTOS) {
      Alert.alert(
        "Add more photos",
        `Please add at least ${MIN_PHOTOS} good photos so others can see you.`
      );
      return;
    }

    if (!form.avatar && photos[0] && photos[0].trim()) {
      setField("avatar", photos[0].trim());
    }

    onNext();
  };

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isSmallScreen && styles.contentSmall,
        ]}
      >
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>
          Add at least {MIN_PHOTOS} clear photos. Tap a slot to choose from your
          gallery. First one becomes your profile photo (you can change it).
        </Text>

              {photos.map((url, index) => {
          const isAvatar = !!url.trim() && form.avatar === url;
          const canRemoveThis = photos.length > MIN_PHOTOS && index >= MIN_PHOTOS;

          return (
            <View key={index} style={styles.photoCard}>
              <View style={styles.photoHeader}>
                <View style={styles.photoIndex}>
                  <Text style={styles.photoIndexText}>{index + 1}</Text>
                </View>
                {isAvatar && <Text style={styles.avatarTag}>Profile photo</Text>}
              </View>

              <TouchableOpacity
                style={[
                  styles.imageBox,
                  isAvatar && styles.imageBoxAvatar,
                ]}
                onPress={() => openUploaderForIndex(index)}
              >
                {url ? (
                  <Image source={{ uri: url }} style={styles.imagePreview} />
                ) : (
                  <Text style={styles.imagePlaceholder}>
                    Tap to choose from gallery
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={[
                    styles.avatarButton,
                    isAvatar && styles.avatarButtonActive,
                  ]}
                  onPress={() => setAvatarFrom(url)}
                >
                  <Text
                    style={[
                      styles.avatarButtonText,
                      isAvatar && styles.avatarButtonTextActive,
                    ]}
                  >
                    {isAvatar ? "Avatar ✓" : "Make avatar"}
                  </Text>
                </TouchableOpacity>

                {canRemoveThis && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeSlot(index)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}


        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity style={styles.addSlotButton} onPress={addSlot}>
            <Text style={styles.addSlotText}>+ Add another photo</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, !canNext && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canNext}
          >
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CloudinaryUploader
        visible={uploaderVisible}
        onUploaded={handleUploaded}
        onClose={handleCloseUploader}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  contentSmall: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
   photoCard: {
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f5d0de",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  photoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  photoIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffe2ee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  photoIndexText: {
    fontWeight: "700",
    color: "#ff2f6e",
  },
  avatarTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ffe2ee",
    color: "#ff2f6e",
    fontSize: 11,
    fontWeight: "600",
  },
  imageBox: {
    borderWidth: 1,
    borderColor: "#f1f1f1",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
    minHeight: 90,
    justifyContent: "center",
  },
  imageBoxAvatar: {
    borderColor: "#ff2f6e",
    backgroundColor: "#fff5fa",
  },
  imagePlaceholder: {
    fontSize: 14,
    color: "#999",
  },
  imagePreview: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    resizeMode: "cover",
  },
  photoActions: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  avatarButton: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ff4f81",
    alignItems: "center",
  },
  avatarButtonActive: {
    backgroundColor: "#ff4f81",
  },
  avatarButtonText: {
    fontSize: 12,
    color: "#ff4f81",
    fontWeight: "600",
  },
  avatarButtonTextActive: {
    color: "#fff",
  },
  removeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    fontSize: 12,
    color: "#666",
  },

  addSlotButton: {
    marginTop: 8,
    marginBottom: 18,
  },
  addSlotText: {
    fontSize: 14,
    color: "#007aff",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  backButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  backText: {
    fontSize: 14,
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ff4f81",
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
});

export default Step4Photos;

/**
 * ============================================================================
 * 📁 File: app/auth/register-full/steps/Step4Photos.tsx
 * 🎯 Step 4 — Photos (min 2)
 *
 * PURPOSE:
 *   - User enters photo URLs exactly like web version expects.
 *   - First photo becomes avatar (unless user sets another).
 *   - Allows removing a photo + setting avatar.
 *
 * FUTURE UPGRADE:
 *   - Can replace text-input URL with camera/upload later.
 *
 * PROPS:
 *   - form
 *   - addPhotoUrl(url)
 *   - removePhotoUrl(url)
 *   - setAvatar(url)
 *   - canNext
 *   - onNext
 *   - onBack
 * ============================================================================
 */

import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { RegisterForm } from "../index";

type Props = {
  form: RegisterForm;
  addPhotoUrl: (url: string) => void;
  removePhotoUrl: (url: string) => void;
  setAvatar: (url: string) => void;
  canNext: boolean;
  onNext: () => void;
  onBack: () => void;
};

export default function Step4Photos({
  form,
  addPhotoUrl,
  removePhotoUrl,
  setAvatar,
  canNext,
  onNext,
  onBack,
}: Props) {
  const [pendingUrl, setPendingUrl] = useState("");

  const submitPhoto = () => {
    if (!pendingUrl.trim()) return;
    addPhotoUrl(pendingUrl.trim());
    setPendingUrl("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Photos</Text>
      <Text style={styles.subtitle}>
        Add at least <Text style={styles.bold}>2 photos</Text>.  
        First photo becomes avatar (you can change it).
      </Text>

      {/* Add new photo URL */}
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Enter image URL (Cloudinary / HTTPS)"
          placeholderTextColor="#888"
          value={pendingUrl}
          onChangeText={setPendingUrl}
        />
        <TouchableOpacity style={styles.addBtn} onPress={submitPhoto}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Grid */}
      {form.photos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 6 }}
        >
          {form.photos.map((url) => {
            const isAvatar = form.avatar === url;
            return (
              <View key={url} style={styles.photoCard}>
                <Image
                  source={{ uri: url }}
                  style={[styles.photo, isAvatar && styles.avatarBorder]}
                />

                {/* Avatar label */}
                {isAvatar && (
                  <View style={styles.avatarTag}>
                    <Text style={styles.avatarTagText}>Avatar</Text>
                  </View>
                )}

                {/* Buttons */}
                <View style={styles.btnRow}>
                  {!isAvatar && (
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => setAvatar(url)}
                    >
                      <Text style={styles.smallBtnText}>Set avatar</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => removePhotoUrl(url)}
                  >
                    <Text style={styles.smallBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.emptyMsg}>No photos yet.</Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
          disabled={!canNext}
          onPress={onNext}
        >
          <Text style={styles.nextText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =============================
// 🎨 Styles
// =============================
const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
    marginBottom: 8,
  },
  bold: { fontWeight: "700" },
  row: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: "#ff2f6e",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 10,
  },
  addText: {
    color: "#fff",
    fontWeight: "600",
  },
  photoCard: {
    marginRight: 10,
    position: "relative",
  },
  photo: {
    width: 120,
    height: 150,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  avatarBorder: {
    borderColor: "#ff2f6e",
  },
  avatarTag: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#ff2f6e",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  avatarTagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  btnRow: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallBtn: {
    backgroundColor: "#ffffffbb",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  smallBtnText: {
    fontSize: 10,
    color: "#444",
  },
  emptyMsg: {
    marginTop: 6,
    fontSize: 13,
    color: "#777",
  },
  footer: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  backText: {
    fontSize: 14,
    color: "#444",
  },
  nextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#ff2f6e",
  },
  nextBtnDisabled: {
    backgroundColor: "#ccc",
  },
  nextText: {
    color: "#fff",
    fontWeight: "700",
  },
});

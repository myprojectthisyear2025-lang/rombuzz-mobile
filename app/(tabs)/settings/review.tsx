/**
 * File: app/(tabs)/settings/review.tsx
 * Purpose: Send a private star rating, issue report, and optional media to RomBuzz Support.
 */
import { Card, ScreenShell, SectionTitle } from "@/src/components/settings/_ui";
import { SettingsButton } from "@/src/components/settings/SettingsControls";
import { useSettingsAlert } from "@/src/components/settings/SettingsDialog";
import { API_BASE } from "@/src/config/api";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import React, { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export default function ReviewSettings() {
  const { colors } = useRomBuzzTheme();
  const alert = useSettingsAlert();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [attachment, setAttachment] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sending, setSending] = useState(false);

  const styles = useMemo(
    () => ({
      hint: {
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 14,
      },
      stars: {
        flexDirection: "row" as const,
        justifyContent: "center" as const,
        gap: 12,
        paddingVertical: 8,
      },
      starButton: { padding: 4 },
      field: {
        minHeight: 140,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 14,
        color: colors.text,
        backgroundColor: colors.surface,
        fontSize: 15,
        textAlignVertical: "top" as const,
      },
      attachRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 10,
        marginTop: 14,
      },
      attachButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: colors.surfaceMuted,
      },
      attachName: {
        flex: 1,
        color: colors.textSecondary,
        fontSize: 13,
      },
      privacy: {
        color: colors.textMuted,
        fontSize: 12,
        lineHeight: 18,
        marginTop: 14,
      },
    }),
    [colors],
  );

  async function chooseAttachment() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const file = result.assets[0];

    if (file.fileSize && file.fileSize > MAX_ATTACHMENT_BYTES) {
      alert("File too large", "Choose a photo or video that is 10 MB or smaller.");
      return;
    }

    setAttachment(file);
  }

  async function sendReview() {
    if (!rating) {
      return alert("Choose a rating", "Select between one and five stars.");
    }

    if (comment.trim().length < 5) {
      return alert(
        "Add a little detail",
        "Please describe the issue in at least 5 characters.",
      );
    }

    setSending(true);

    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const form = new FormData();

      form.append("rating", String(rating));
      form.append("comment", comment.trim());

      if (attachment) {
        form.append(
          "attachment",
          {
            uri: attachment.uri,
            name:
              attachment.fileName ||
              `rombuzz-feedback.${attachment.type === "video" ? "mp4" : "jpg"}`,
            type:
              attachment.mimeType ||
              (attachment.type === "video" ? "video/mp4" : "image/jpeg"),
          } as any,
        );
      }

      const response = await fetch(`${API_BASE}/cupid-support/reviews`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: form,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Could not send your feedback.");
      }

      setRating(0);
      setComment("");
      setAttachment(null);
      alert("Feedback sent", "Thanks. Your private report was emailed to RomBuzz Support.");
    } catch (error: any) {
      alert(
        "Could not send feedback",
        error?.message || "Please try again when you have an internet connection.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <ScreenShell title="Send feedback">
      <SectionTitle>How was your experience?</SectionTitle>
      <Card>
        <Text style={styles.hint}>
          Choose a rating, then tell us what happened or what we can improve.
        </Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`${value} stars`}
              accessibilityState={{ selected: rating === value }}
              onPress={() => setRating(value)}
              style={styles.starButton}
            >
              <Ionicons
                name={value <= rating ? "star" : "star-outline"}
                size={34}
                color={value <= rating ? colors.brand : colors.textMuted}
              />
            </Pressable>
          ))}
        </View>

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Describe the issue or share your feedback…"
          placeholderTextColor={colors.textMuted}
          maxLength={2500}
          multiline
          style={styles.field}
          editable={!sending}
        />

        <View style={styles.attachRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach a photo or video"
            onPress={() => void chooseAttachment()}
            style={styles.attachButton}
          >
            <Ionicons name="add" size={28} color={colors.brand} />
          </Pressable>

          <Text numberOfLines={2} style={styles.attachName}>
            {attachment?.fileName ||
              (attachment
                ? "Photo or video attached"
                : "Add a screenshot, photo, or video (max 10 MB)")}
          </Text>

          {attachment ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove attachment"
              onPress={() => setAttachment(null)}
            >
              <Ionicons name="close-circle" size={22} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.privacy}>
          Private: this report and its attachment are emailed to RomBuzz Support
          and are not posted on your profile.
        </Text>

        <View style={{ marginTop: 18 }}>
          <SettingsButton
            label={sending ? "Sending feedback…" : "Send privately"}
            onPress={sendReview}
            disabled={sending}
            busy={sending}
          />
        </View>
      </Card>
    </ScreenShell>
  );
}
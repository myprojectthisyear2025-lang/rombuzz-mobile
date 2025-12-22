/**
 * ============================================================================
 * 📁 File: app/auth/register-full/steps/Step6Summary.tsx
 * 🎯 Step 6 — Review Summary & Finish
 *
 * PURPOSE:
 *   - Shows a summary of everything user entered.
 *   - Matches the final confirmation screen in web Register.jsx.
 *   - Finish button triggers parent.onFinish() which:
 *       → calls /auth/register-full
 *       → saves token + user
 *       → redirects to /tabs
 *
 * PROPS:
 *   - email
 *   - form
 *   - error
 *   - busy
 *   - onBack
 *   - onFinish
 * ============================================================================
 */


import { Audio, AVPlaybackStatus } from "expo-av";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LOOKING_FOR, RegisterForm } from "../index";

type Props = {
  email: string;
  form: RegisterForm;
  error: string;
  busy: boolean;
  onBack: () => void;
  onFinish: () => void; // will redirect to homepage
};

export default function Step6Summary({
  email,
  form,
  error,
  busy,
  onBack,
  onFinish,
}: Props) {
  const router = useRouter();

  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [loadingSound, setLoadingSound] = React.useState(false);
  const [duration, setDuration] = React.useState<number | null>(null);

  // -----------------------------
  // 🎤 LOAD + PLAY / PAUSE LOGIC
  // -----------------------------
  const handlePlayPause = async () => {
    try {
      if (!form.voiceUrl) return;

      if (!sound) {
        setLoadingSound(true);

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: form.voiceUrl },
          { shouldPlay: true }
        );

        setSound(newSound);
        setIsPlaying(true);

        // Playback status handler
        newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;

          if (status.durationMillis) {
            setDuration(status.durationMillis);
          }

          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });

        setLoadingSound(false);
      } else {
        const st = await sound.getStatusAsync();
        if (st.isLoaded && st.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.log("Audio error:", err);
    }
  };

  React.useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  // -----------------------------
  // 🎯 FINISH BUTTON → Homepage
  // -----------------------------
  const finishAndGoHome = async () => {
  await onFinish(); // parent controls navigation
};


  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Review & Finish</Text>

      <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.summaryCard}>
          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Name:</Text> {form.firstName} {form.lastName}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Email:</Text> {email}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Gender:</Text> {form.gender}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>DOB:</Text> {form.dob}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Looking for:</Text>{" "}
            {LOOKING_FOR.find((x) => x.key === form.lookingFor)?.label}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Interested in:</Text>{" "}
            {form.interestedIn.join(", ")}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Age range:</Text> {form.ageMin}–{form.ageMax}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Distance:</Text>{" "}
            {form.distance >= 1000 ? "1000+ miles" : `${form.distance} miles`}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Interests:</Text>{" "}
            {form.interests.join(", ")}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Photos:</Text> {form.photos.length}
          </Text>

          {/* 🎤 Voice Preview */}
          {form.voiceUrl && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.rowItem}>
                <Text style={styles.bold}>Voice Intro:</Text>
              </Text>

              <TouchableOpacity
                style={styles.voicePlayBtn}
                onPress={handlePlayPause}
                disabled={loadingSound}
              >
                <Text style={styles.voicePlayText}>
                  {isPlaying ? "⏸ Pause" : "▶️ Play"}
                </Text>
              </TouchableOpacity>

              {duration && (
                <Text style={styles.voiceDuration}>
                  Duration: {(duration / 1000).toFixed(1)}s
                </Text>
              )}
            </View>
          )}

          {form.phone ? (
            <Text style={styles.rowItem}>
              <Text style={styles.bold}>Phone:</Text> {form.phone}
            </Text>
          ) : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} disabled={busy}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.finishBtn, busy && styles.finishBtnDisabled]}
          onPress={finishAndGoHome}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.finishText}>Finish & Create My RomBuzz →</Text>
          )}
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
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: "#ffe6ef",
    padding: 12,
    borderRadius: 14,
  },
  rowItem: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  bold: {
    fontWeight: "700",
  },
  error: {
    color: "#d10000",
    marginTop: 10,
    fontSize: 13,
  },
  footer: {
    marginTop: 18,
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
  finishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#ff2f6e",
    flexShrink: 1,
  },
  finishBtnDisabled: {
    backgroundColor: "#aaa",
  },
  finishText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  voicePlayBtn: {
    marginTop: 4,
    backgroundColor: "#ff2f6e",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  voicePlayText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  voiceDuration: {
    marginTop: 4,
    fontSize: 12,
    color: "#555",
  },
});

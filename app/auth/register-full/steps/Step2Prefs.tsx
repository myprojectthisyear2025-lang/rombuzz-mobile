
/**
 * ============================================================================
 * 📁 File: app/auth/register-full/steps/Step2Prefs.tsx
 * 🎯 Step 2 — Preferences + Interests (merged)
 *
 * PURPOSE:
 *   - Lets user choose:
 *       • Age range (ageMin, ageMax) via slider
 *       • Distance in miles via slider
 *       • Up to 5 interests (merged from old Step 3)
 *
 * PROPS:
 *   - form
 *   - setField
 *   - canNext
 *   - onNext
 *   - onBack
 * ============================================================================
 */

import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { Audio } from "expo-av";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { INTEREST_OPTIONS, RegisterForm } from "../index";
// Local state for adding custom interest

type Props = {
  form: RegisterForm;
  setField: (key: keyof RegisterForm, value: any) => void;
  canNext: boolean;
  onNext: () => void;
  onBack: () => void;
};

export default function Step2Prefs({
  form,
  setField,
  canNext,
  onNext,
  onBack,
}: Props) {
  const [showAdd, setShowAdd] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // ===== Voice intro state =====
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordedUri, setRecordedUri] = React.useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = React.useState(0);
  const [voiceError, setVoiceError] = React.useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = React.useState(false);
  const [previewDurationSec, setPreviewDurationSec] = React.useState<number>(
    Number(form.voiceDurationSec || 0)
  );

  const timerRef = React.useRef<any>(null);
  const recordingRef = React.useRef<Audio.Recording | null>(null);
  const previewSoundRef = React.useRef<Audio.Sound | null>(null);


  // Dataset for auto-suggest
  const SUGGEST_DATA = [
    ...INTEREST_OPTIONS,
    "Entrepreneurship", "AI", "Sushi", "Pilates", "Boxing",
    "Luxury Travel", "Makeup", "Vegan Food", "Photography",
    "Interior Design", "Self Improvement", "Gym", "Space",
    "Memes", "Podcasts", "Motivation", "K-pop", "Anime",
  ];

  // Filter suggestions
  const filtered =
    search.length > 0
      ? SUGGEST_DATA.filter((x) =>
          x.toLowerCase().includes(search.toLowerCase())
        )
      : [];

  // local helper to toggle interests (max 5)
  const toggleInterestChip = (value: string) => {
    const s = new Set(form.interests);
    if (s.has(value)) {
      s.delete(value);
    } else {
      if (s.size >= 5) return; // max 5
      s.add(value);
    }
    setField("interests", Array.from(s));
  };

  // ========== VOICE INTRO HELPERS ==========

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordSeconds(0);
  };

  const cleanupPreviewSound = async () => {
    try {
      if (previewSoundRef.current) {
        await previewSoundRef.current.unloadAsync();
        previewSoundRef.current = null;
      }
    } catch {}
    setIsPlayingPreview(false);
  };

  const startRecording = async () => {
    try {
      setVoiceError(null);
      await cleanupPreviewSound();

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setVoiceError("Microphone permission is required to record your voice intro.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      if (recordingRef.current) return;

      setRecordedUri(null);
      setRecordSeconds(0);
      setPreviewDurationSec(0);

      // Starting another recording invalidates any previously
      // accepted voice intro.
      setField("voiceUrl", "");
      setField("voiceDurationSec", 0);

      const nextRecording = new Audio.Recording();

      await nextRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      await nextRecording.startAsync();

      recordingRef.current = nextRecording;
      setIsRecording(true);

      const startedAt = Date.now();

      timerRef.current = setInterval(async () => {
        const elapsed = Math.min(
          60,
          Math.floor((Date.now() - startedAt) / 1000)
        );

        setRecordSeconds(elapsed);

        if (elapsed >= 60) {
          try {
            clearInterval(timerRef.current);
            timerRef.current = null;
            await stopRecording();
          } catch {}
        }
      }, 250);
    } catch (err: any) {
      console.error("startRecording error", err);
      setVoiceError("Could not start recording. Please try again.");
      setIsRecording(false);
      recordingRef.current = null;
    }
  };

  const stopRecording = async () => {
    const currentRecording = recordingRef.current;
    if (!currentRecording) return;

    try {
      const status = await currentRecording.getStatusAsync();

      const nextDurationSec = Math.max(
        1,
        Math.min(60, Math.round((status?.durationMillis || 0) / 1000))
      );

      resetTimer();

      await currentRecording.stopAndUnloadAsync();

      const uri = currentRecording.getURI();

      recordingRef.current = null;

      if (uri) {
        // Keep the finished recording LOCAL first.
        // The user must be able to listen before accepting it.
        setRecordedUri(uri);
        setPreviewDurationSec(nextDurationSec);

        // Do NOT set form.voiceUrl yet.
        // That happens only after the user taps "Use & Upload".
        setField("voiceUrl", "");
        setField("voiceDurationSec", 0);
      } else {
        setVoiceError("Recording failed, please try again.");
      }
    } catch (err: any) {
      console.error("stopRecording error", err);
      setVoiceError("Could not stop recording. Please try again.");
    } finally {
      setIsRecording(false);
      recordingRef.current = null;
    }
  };

  const playPreview = async () => {
    try {
      const uri = recordedUri || form.voiceUrl;
      if (!uri) return;

      setVoiceError(null);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      if (isPlayingPreview && previewSoundRef.current) {
        await previewSoundRef.current.pauseAsync();
        setIsPlayingPreview(false);
        return;
      }

      if (previewSoundRef.current) {
        const status = await previewSoundRef.current.getStatusAsync();

        if (status.isLoaded) {
          const duration = status.durationMillis || 0;
          const position = status.positionMillis || 0;

          if (duration > 0 && position >= duration - 250) {
            await previewSoundRef.current.setPositionAsync(0);
          }

          await previewSoundRef.current.setIsMutedAsync(false);
          await previewSoundRef.current.setVolumeAsync(1);
          await previewSoundRef.current.playAsync();

          setIsPlayingPreview(true);
          return;
        }
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          isMuted: false,
          volume: 1,
          progressUpdateIntervalMillis: 250,
        }
      );

      previewSoundRef.current = sound;

      // Explicitly start playback only after the local recording
      // has successfully loaded.
      await sound.setIsMutedAsync(false);
      await sound.setVolumeAsync(1);
      await sound.setPositionAsync(0);
      await sound.playAsync();

      setIsPlayingPreview(true);

      if (status?.isLoaded && status.durationMillis && !previewDurationSec) {
        setPreviewDurationSec(Math.max(1, Math.round(status.durationMillis / 1000)));
      }

      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;

        if (s.durationMillis && !previewDurationSec) {
          setPreviewDurationSec(Math.max(1, Math.round(s.durationMillis / 1000)));
        }

        if (s.didJustFinish) {
          setIsPlayingPreview(false);
        }
      });
    } catch (err: any) {
      console.error("playPreview error", err);
      setVoiceError("Could not play the voice intro.");
      setIsPlayingPreview(false);
    }
  };

  const useVoiceForUpload = async () => {
    if (!recordedUri) {
      setVoiceError("Record your voice intro first.");
      return;
    }

    const duration = Math.max(
      1,
      Math.min(
        60,
        Number(previewDurationSec || recordSeconds || 0)
      )
    );

    // Confirm this LOCAL recording for signup.
    // register-full/index.tsx will upload this URI through the
    // authenticated R2 voice-intro flow after account creation.
    setField("voiceUrl", recordedUri);
    setField("voiceDurationSec", duration);

    setVoiceError(null);
  };

  const deleteVoice = async () => {
    await cleanupPreviewSound();
    resetTimer();

    setRecordedUri(null);
    recordingRef.current = null;
    setIsRecording(false);
    setVoiceError(null);
    setPreviewDurationSec(0);

    setField("voiceUrl", "");
    setField("voiceDurationSec", 0);
  };

  const rerecordVoice = async () => {
    await deleteVoice();
  };

  const formatSeconds = (sec: number) => {
    const s = Math.max(0, Math.min(sec, 60));
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  React.useEffect(() => {
    return () => {
      resetTimer();
      cleanupPreviewSound();

      recordingRef.current
        ?.stopAndUnloadAsync()
        .catch(() => {});

      recordingRef.current = null;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Preferences</Text>

      {/* Age range */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Preferred age range</Text>
          <Text style={styles.value}>
            {form.ageMin}–{form.ageMax}
          </Text>
        </View>

        <MultiSlider
          values={[form.ageMin, form.ageMax]}
          min={18}
          max={100}
          step={1}
          sliderLength={260}
          onValuesChange={(vals) => {
            setField("ageMin", vals[0]);
            setField("ageMax", vals[1]);
          }}
          selectedStyle={{ backgroundColor: "#ff2f6e" }}
          markerStyle={{
            height: 22,
            width: 22,
            backgroundColor: "#ff2f6e",
            borderRadius: 20,
          }}
        />
      </View>

      {/* Distance */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Distance preference</Text>
          <Text style={styles.value}>{form.distance} miles</Text>
        </View>

        <MultiSlider
          values={[form.distance]}
          min={1}
          max={100}
          step={1}
          sliderLength={260}
          onValuesChange={(vals) => {
            setField("distance", vals[0]);
          }}
          selectedStyle={{ backgroundColor: "#ff2f6e" }}
          markerStyle={{
            height: 22,
            width: 22,
            backgroundColor: "#ff2f6e",
            borderRadius: 20,
          }}
        />
      </View>

  {/* Interests (merged + manual add with auto-suggest) */}
<View style={styles.card}>
  <Text style={styles.label}>Interests</Text>
  <Text style={styles.subtitle}>
    Pick up to <Text style={{ fontWeight: "700" }}>5</Text> things you love.
  </Text>

  {/* Existing chips */}
  <ScrollView
    style={styles.chipsScroll}
    contentContainerStyle={styles.chipsContainer}
  >
    {INTEREST_OPTIONS.map((i) => {
      const active = form.interests.includes(i);
      return (
        <TouchableOpacity
          key={i}
          style={[styles.chip, active && styles.chipActive]}
          onPress={() => toggleInterestChip(i)}
        >
          <Text
            style={[
              styles.chipText,
              active && styles.chipTextActive,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    })}

    {/* + Add Interest button */}
    {!showAdd && (
      <TouchableOpacity
        style={styles.addChip}
        onPress={() => setShowAdd(true)}
      >
        <Text style={styles.addChipText}>+ Add Interest</Text>
      </TouchableOpacity>
    )}
  </ScrollView>

  {/* Text input for adding interest */}
  {showAdd && (
    <View style={styles.addBox}>
      <Text style={styles.addLabel}>Add custom interest</Text>

      <TextInput
        style={styles.addInput}
        placeholder="Type something..."
        placeholderTextColor="#999"
        value={search}
onChangeText={(v: string) => setSearch(v)}
      />

      {/* Auto-suggest dropdown */}
      {filtered.length > 0 && (
        <View style={styles.suggestBox}>
          {filtered.map((s) => {
            const active = form.interests.includes(s);
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.suggestItem,
                  active && styles.suggestItemSelected,
                ]}
                onPress={() => {
                  toggleInterestChip(s);
                  setSearch("");
                  setShowAdd(false);
                }}
              >
                <Text
                  style={[
                    styles.suggestText,
                    active && styles.suggestTextSelected,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Cancel Add button */}
      <TouchableOpacity
        onPress={() => {
          setShowAdd(false);
          setSearch("");
        }}
        style={styles.cancelAddBtn}
      >
        <Text style={styles.cancelAddText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  )}
</View>

      {/* Voice Intro (optional) */}
      <View style={styles.card}>
        <View style={styles.voiceHeaderRow}>
          <Text style={styles.label}>Voice intro (optional)</Text>
          <View style={styles.voiceBadge}>
            <Text style={styles.voiceBadgeText}>≤ 60s</Text>
          </View>
        </View>

        <Text style={styles.voiceSubtitle}>
          Record a short hello that will appear on your profile. Keep it natural and be yourself.
        </Text>

        {voiceError ? (
          <Text style={styles.voiceErrorText}>
            {voiceError}
          </Text>
        ) : null}

        <View style={styles.voiceCenter}>
          <TouchableOpacity
            style={[
              styles.voiceMicOuter,
              isRecording && styles.voiceMicOuterActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={styles.voiceMicInner}>
              <Text style={styles.voiceMicIcon}>
                {isRecording ? "■" : "🎤"}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.voiceStateText}>
            {isRecording
              ? "Recording..."
              : recordedUri && form.voiceUrl === recordedUri
              ? "Voice intro selected"
              : recordedUri
              ? "Listen before uploading"
              : "Tap to record your voice"}
          </Text>

          <Text style={styles.voiceTimer}>
            {isRecording
              ? `${formatSeconds(recordSeconds)} / 01:00`
              : `${formatSeconds(
                  previewDurationSec || form.voiceDurationSec || 0
                )} / 01:00`}
          </Text>
        </View>

        <View style={styles.voiceActionsRow}>
          {recordedUri ? (
            <TouchableOpacity
              style={styles.voiceSecondaryBtn}
              disabled={isRecording}
              onPress={playPreview}
            >
              <Text style={styles.voiceSecondaryText}>
                {isPlayingPreview ? "Pause" : "▶ Play"}
              </Text>
            </TouchableOpacity>
          ) : null}

          {recordedUri ? (
            <TouchableOpacity
              style={styles.voiceSecondaryBtn}
              disabled={isRecording}
              onPress={rerecordVoice}
            >
              <Text style={styles.voiceSecondaryText}>
                ↻ Retry
              </Text>
            </TouchableOpacity>
          ) : null}

          {recordedUri ? (
            <TouchableOpacity
              style={styles.voiceSecondaryBtn}
              disabled={isRecording}
              onPress={deleteVoice}
            >
              <Text style={styles.voiceSecondaryText}>
                Delete
              </Text>
            </TouchableOpacity>
          ) : null}

          {recordedUri && form.voiceUrl !== recordedUri ? (
            <TouchableOpacity
              style={styles.voicePrimaryBtn}
              disabled={isRecording}
              onPress={useVoiceForUpload}
            >
              <Text style={styles.voicePrimaryText}>
                Use & Upload
              </Text>
            </TouchableOpacity>
          ) : null}

          {recordedUri && form.voiceUrl === recordedUri ? (
            <View style={styles.voiceSavedPill}>
              <Text style={styles.voiceSavedText}>
                Ready to upload ✓
              </Text>
            </View>
          ) : null}
        </View>
      </View>

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
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 10,
    marginVertical: 4,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  half: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginBottom: 6,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  chipsScroll: {
  marginTop: 4,
},

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: "#ff2f6e",
    borderColor: "#ff2f6e",
  },
  chipText: {
    fontSize: 12,
    color: "#444",
  },
  chipTextActive: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backBtn: {
    paddingHorizontal: 12,
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
    backgroundColor: "#af1a47ff",
  },
  nextBtnDisabled: {
    backgroundColor: "#ccc",
  },
  nextText: {
    color: "#fff",
    fontWeight: "700",
  },
  addChip: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  backgroundColor: "#fff",
  borderRadius: 999,
  borderWidth: 1,
  borderColor: "#bbb",
  marginTop: 6,
},
addChipText: {
  color: "#ff2f6e",
  fontWeight: "700",
  fontSize: 12,
},

addBox: {
  marginTop: 10,
},
addLabel: {
  fontSize: 12,
  color: "#666",
  marginBottom: 4,
},
addInput: {
  backgroundColor: "#fff",
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#ddd",
  paddingHorizontal: 10,
  paddingVertical: 8,
  marginBottom: 6,
},

suggestBox: {
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  maxHeight: 140,
  overflow: "hidden",
},
suggestItem: {
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderBottomColor: "#eee",
  borderBottomWidth: 1,
},
suggestItemSelected: {
  backgroundColor: "#ffeff5",
},
suggestText: {
  fontSize: 13,
  color: "#444",
},
suggestTextSelected: {
  color: "#ff2f6e",
  fontWeight: "700",
},

  cancelAddBtn: {
    paddingVertical: 6,
    alignSelf: "flex-end",
  },
  cancelAddText: {
    color: "#999",
    fontSize: 12,
  },

  // ===== Voice styles =====
  voiceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  voiceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#ffe2ee",
  },
  voiceBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#af1a47ff",
  },
  voiceSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  voiceErrorText: {
    fontSize: 12,
    color: "#c53030",
    marginBottom: 8,
  },
  voiceCenter: {
    alignItems: "center",
    marginVertical: 8,
  },
  voiceMicOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#ffb3ca",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "#ffeef5",
  },
  voiceMicOuterActive: {
    borderColor: "#ff2f6e",
    backgroundColor: "#ffe2ee",
  },
  voiceMicInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff2f6e",
  },
  voiceMicIcon: {
    fontSize: 24,
    color: "#fff",
  },
  voiceStateText: {
    fontSize: 13,
    color: "#444",
    marginBottom: 2,
  },
  voiceTimer: {
    fontSize: 12,
    color: "#777",
  },
  voiceActionsRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  voicePrimaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ff2f6e",
  },
  voicePrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  voiceSecondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  voiceSecondaryText: {
    fontSize: 12,
    color: "#444",
  },
  voiceSavedPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e6ffed",
  },
  voiceSavedText: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "600",
  },
});


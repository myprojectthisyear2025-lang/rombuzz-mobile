/**
 * ============================================================
 * 📁 File: src/components/chat/VoiceRecorderButton.tsx
 * 🎯 Purpose: Record + preview + upload voice message
 *
 * WHAT THIS VERSION FIXES:
 *  - fixes "Cannot unload a Recording that has already been unloaded"
 *  - adds pause / resume while recording
 *  - shows live duration while recording
 *  - shows preview duration before sending
 *  - lets sender play/pause recorded audio before sending
 *
 * IMPORTANT:
 *  - this file only controls recording + pre-send preview
 *  - receiver-side/sender-side in-chat playback UI needs AudioBubble/chat file changes
 * ============================================================
 */

import { uploadToCloudinaryUnsigned } from "@/src/config/uploadMedia";
import { Ionicons } from "@expo/vector-icons";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const RBZ = {
  c1: "#b1123c",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  line: "rgba(17,24,39,0.08)",
  soft: "rgba(0,0,0,0.06)",
};

function formatMs(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function VoiceRecorderButton({
  onSend,
}: {
  onSend: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewDurationMs, setPreviewDurationMs] = useState(0);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewPositionMs, setPreviewPositionMs] = useState(0);

  const busyRef = useRef(false);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    return () => {
      const activeRecording = recordingRef.current;
      recordingRef.current = null;
      if (activeRecording) {
        activeRecording.stopAndUnloadAsync().catch(() => {});
      }

      const activeSound = soundRef.current;
      soundRef.current = null;
      if (activeSound) {
        activeSound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const resetPreview = async () => {
    const activeSound = soundRef.current;
    soundRef.current = null;
    setSound(null);
    setIsPreviewPlaying(false);
    setPreviewPositionMs(0);

    if (activeSound) {
      try {
        await activeSound.unloadAsync();
      } catch {}
    }

    setPreviewUri(null);
    setPreviewDurationMs(0);
  };

  const ensureAudioModeForRecording = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  };

  const ensureAudioModeForPlayback = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  };

  const start = async () => {
    try {
      if (busyRef.current) return;

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Microphone permission is needed.");
        return;
      }

      await resetPreview();
      await ensureAudioModeForRecording();

          const r = new Audio.Recording();

      r.setOnRecordingStatusUpdate((status) => {
        setRecordingMs(status.durationMillis ?? 0);

        const paused =
          !status.isDoneRecording &&
          (status.canRecord === false || status.isRecording === false) &&
          (status.durationMillis ?? 0) > 0;

        setIsRecordingPaused(paused);
      });

      await r.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await r.startAsync();

      recordingRef.current = r;
      setRecording(r);
      setRecordingMs(0);
      setIsRecordingPaused(false);
    } catch (e) {
      Alert.alert("Recording failed", "Try again.");
    }
  };

  const pauseRecording = async () => {
    const active = recordingRef.current;
    if (!active || busyRef.current) return;

    try {
      await active.pauseAsync();
      setIsRecordingPaused(true);
    } catch {
      Alert.alert("Pause failed", "Could not pause recording.");
    }
  };

  const resumeRecording = async () => {
    const active = recordingRef.current;
    if (!active || busyRef.current) return;

    try {
      await active.startAsync();
      setIsRecordingPaused(false);
    } catch {
      Alert.alert("Resume failed", "Could not resume recording.");
    }
  };

  const stopToPreview = async () => {
    const active = recordingRef.current;
    if (!active || busyRef.current) return;
    busyRef.current = true;

    try {
      recordingRef.current = null;
      setRecording(null);
      setIsRecordingPaused(false);

      await active.stopAndUnloadAsync();
      const uri = active.getURI();

      if (!uri) {
        throw new Error("No audio file");
      }

      setPreviewUri(uri);

      const { sound: createdSound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        (playbackStatus) => {
          if (!playbackStatus.isLoaded) return;

          setPreviewPositionMs(playbackStatus.positionMillis ?? 0);
          setPreviewDurationMs(playbackStatus.durationMillis ?? 0);
          setIsPreviewPlaying(playbackStatus.isPlaying ?? false);

          if (playbackStatus.didJustFinish) {
            setIsPreviewPlaying(false);
            setPreviewPositionMs(0);
            createdSound.setPositionAsync(0).catch(() => {});
          }
        }
      );

      soundRef.current = createdSound;
      setSound(createdSound);
      setPreviewDurationMs(status.isLoaded ? status.durationMillis ?? 0 : 0);
      setPreviewPositionMs(0);
    } catch (e) {
      Alert.alert("Voice message failed", "Try again.");
    } finally {
      busyRef.current = false;
    }
  };

  const togglePreviewPlayback = async () => {
    const activeSound = soundRef.current;
    if (!activeSound || busyRef.current) return;

    try {
      await ensureAudioModeForPlayback();
      const status = await activeSound.getStatusAsync();
      if (!status.isLoaded) return;

      if (status.didJustFinish || (status.durationMillis && status.positionMillis >= status.durationMillis)) {
        await activeSound.setPositionAsync(0);
      }

      if (status.isPlaying) {
        await activeSound.pauseAsync();
        setIsPreviewPlaying(false);
      } else {
        await activeSound.playAsync();
        setIsPreviewPlaying(true);
      }
    } catch {
      Alert.alert("Playback failed", "Could not play preview.");
    }
  };

  const discardAll = async () => {
    const activeRecording = recordingRef.current;
    recordingRef.current = null;
    setRecording(null);
    setIsRecordingPaused(false);
    setRecordingMs(0);

    if (activeRecording) {
      try {
        await activeRecording.stopAndUnloadAsync();
      } catch {}
    }

    await resetPreview();
    setOpen(false);
  };

  const sendPreview = async () => {
    if (!previewUri || busyRef.current) return;
    busyRef.current = true;

    try {
      const activeSound = soundRef.current;
      if (activeSound) {
        try {
          await activeSound.stopAsync();
        } catch {}
      }

      const url = await uploadToCloudinaryUnsigned(previewUri, "audio");
      await resetPreview();

      setRecordingMs(0);
      setOpen(false);
      onSend(url);
    } catch (e) {
      Alert.alert("Voice message failed", "Try again.");
    } finally {
      busyRef.current = false;
    }
  };

  const renderMainAction = () => {
    if (recording) {
      return (
        <>
          <Pressable
            style={[styles.recordBtn, styles.pauseBtn]}
            onPress={isRecordingPaused ? resumeRecording : pauseRecording}
          >
            <Ionicons
              name={isRecordingPaused ? "play" : "pause"}
              size={22}
              color={RBZ.white}
            />
            <Text style={styles.btnText}>
              {isRecordingPaused ? "Resume" : "Pause"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.recordBtn, styles.stop]}
            onPress={stopToPreview}
          >
            <Ionicons name="stop" size={22} color={RBZ.white} />
            <Text style={styles.btnText}>Stop</Text>
          </Pressable>
        </>
      );
    }

    if (previewUri) {
      return (
        <>
          <Pressable
            style={[styles.recordBtn, styles.previewBtn]}
            onPress={togglePreviewPlayback}
          >
            <Ionicons
              name={isPreviewPlaying ? "pause" : "play"}
              size={22}
              color={RBZ.white}
            />
            <Text style={styles.btnText}>
              {isPreviewPlaying ? "Pause Preview" : "Play Preview"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.recordBtn, styles.sendBtn]}
            onPress={sendPreview}
          >
            <Ionicons name="send" size={20} color={RBZ.white} />
            <Text style={styles.btnText}>Send Voice</Text>
          </Pressable>
        </>
      );
    }

    return (
      <Pressable style={[styles.recordBtn, styles.start]} onPress={start}>
        <Ionicons name="radio-button-on" size={24} color={RBZ.white} />
        <Text style={styles.btnText}>Start Recording</Text>
      </Pressable>
    );
  };

  return (
    <>
      <Pressable style={styles.iconBtn} onPress={() => setOpen(true)}>
        <Ionicons name="mic" size={20} color={RBZ.white} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={discardAll}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Voice message</Text>

            {!recording && !previewUri ? (
              <Text style={styles.sub}>
                Tap start to record a voice message.
              </Text>
            ) : null}

            {recording ? (
              <View style={styles.infoBox}>
                <View style={styles.rowBetween}>
                  <Text style={styles.infoLabel}>
                    {isRecordingPaused ? "Paused" : "Recording"}
                  </Text>
                  <Text style={styles.infoValue}>{formatMs(recordingMs)}</Text>
                </View>
              </View>
            ) : null}

            {previewUri ? (
              <View style={styles.infoBox}>
                <View style={styles.rowBetween}>
                  <Text style={styles.infoLabel}>Recorded duration</Text>
                  <Text style={styles.infoValue}>
                    {formatMs(previewDurationMs)}
                  </Text>
                </View>

                <View style={styles.rowBetween}>
                  <Text style={styles.infoLabel}>Preview position</Text>
                  <Text style={styles.infoValue}>
                    {formatMs(previewPositionMs)}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.actions}>{renderMainAction()}</View>

            <Pressable style={styles.cancel} onPress={discardAll}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(181,23,158,0.18)",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: RBZ.ink,
  },
  sub: {
    marginTop: 6,
    fontSize: 13,
    color: RBZ.muted,
    lineHeight: 18,
  },
  infoBox: {
    marginTop: 14,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: RBZ.line,
    gap: 8,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: RBZ.muted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "900",
    color: RBZ.ink,
  },
  actions: {
    marginTop: 14,
    gap: 10,
  },
  recordBtn: {
    minHeight: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  start: {
    backgroundColor: RBZ.c4,
  },
  stop: {
    backgroundColor: RBZ.c1,
  },
  pauseBtn: {
    backgroundColor: "#7c3aed",
  },
  previewBtn: {
    backgroundColor: "#2563eb",
  },
  sendBtn: {
    backgroundColor: "#059669",
  },
  btnText: {
    color: RBZ.white,
    fontWeight: "900",
    fontSize: 14,
  },
  cancel: {
    marginTop: 10,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.soft,
  },
  cancelText: {
    color: RBZ.ink,
    fontWeight: "800",
  },
});
/**
 * ============================================================
 * 📁 File: src/components/chat/VoiceRecorderButton.tsx
 * 🎯 Purpose: Record + upload voice message
 * ============================================================
 */

import { uploadToCloudinaryUnsigned } from "@/src/config/uploadMedia";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";

const RBZ = {
  c1: "#b1123c",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
};

export default function VoiceRecorderButton({
  onSend,
}: {
  onSend: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      try {
        recording?.stopAndUnloadAsync();
      } catch {}
    };
  }, [recording]);

  const start = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Microphone permission is needed.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const r = new Audio.Recording();
      await r.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await r.startAsync();
      setRecording(r);
    } catch (e) {
      Alert.alert("Recording failed", "Try again.");
    }
  };

  const stopAndSend = async () => {
    if (!recording || busyRef.current) return;
    busyRef.current = true;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setOpen(false);

      if (!uri) throw new Error("No audio file");

      const url = await uploadToCloudinaryUnsigned(uri, "audio");
      onSend(url);
    } catch (e) {
      Alert.alert("Voice message failed", "Try again.");
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <>
      <Pressable style={styles.iconBtn} onPress={() => setOpen(true)}>
        <Ionicons name="mic" size={20} color={RBZ.white} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Voice message</Text>

            <Pressable
              style={[
                styles.recordBtn,
                recording ? styles.stop : styles.start,
              ]}
              onPress={recording ? stopAndSend : start}
            >
              <Ionicons
                name={recording ? "stop" : "radio-button-on"}
                size={24}
                color={RBZ.white}
              />
              <Text style={styles.btnText}>
                {recording ? "Stop & Send" : "Start Recording"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancel}
              onPress={() => {
                setRecording(null);
                setOpen(false);
              }}
            >
              <Text style={{ color: RBZ.ink, fontWeight: "800" }}>
                Cancel
              </Text>
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
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    color: RBZ.ink,
    marginBottom: 12,
  },
  recordBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  start: { backgroundColor: RBZ.c4 },
  stop: { backgroundColor: RBZ.c1 },
  btnText: { color: RBZ.white, fontWeight: "900" },
  cancel: {
    marginTop: 10,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
});

/**
 * ============================================================================
 * 📁 File: app/auth/register-full/steps/Step5Optional.tsx
 * 🎯 Step 5 — Optional Phone + Voice Intro
 *
 * PURPOSE:
 *   - User can add a phone number (optional)
 *   - User can paste a voice recording URL (optional)
 *   - Matches web Register.jsx optional step.
 *
 * FUTURE UPGRADE:
 *   - Implement real audio recording using Expo Audio.
 *
 * PROPS:
 *   - form
 *   - setField
 *   - onNext
 *   - onBack
 * ============================================================================
 */

import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { RegisterForm } from "../index";

type Props = {
  form: RegisterForm;
  setField: (key: keyof RegisterForm, value: any) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step5Optional({ form, setField, onNext, onBack }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Optional Extras</Text>

      {/* Phone */}
      <Text style={styles.label}>Phone number (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter phone number"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(v) => setField("phone", v)}
      />

      {/* Voice */}
      <Text style={[styles.label, { marginTop: 12 }]}>
        Voice intro URL (optional)
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Paste voice recording URL"
        placeholderTextColor="#999"
        value={form.voiceUrl}
        onChangeText={(v) => setField("voiceUrl", v)}
      />

      <Text style={styles.subNote}>
        A short hello (≤60 sec) helps break the ice. You can add this later too.
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextBtn}
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
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
  },
  subNote: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
  },
  footer: {
    marginTop: 20,
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
  nextText: {
    color: "#fff",
    fontWeight: "700",
  },
});

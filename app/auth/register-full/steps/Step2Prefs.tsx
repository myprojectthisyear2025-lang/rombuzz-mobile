/**
 * ============================================================================
 * 📁 File: app/auth/register-full/steps/Step2Prefs.tsx
 * 🎯 Step 2 — Preferences
 *
 * PURPOSE:
 *   - Lets user choose:
 *       • Age range (ageMin, ageMax)
 *       • Distance in miles
 *       • Visibility mode (auto, limited, full, hidden)
 *   - Mirrors Step 2 in web Register.jsx.
 *
 * PROPS:
 *   - form
 *   - setField
 *   - canNext
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
import { RegisterForm, VISIBILITY_MODES } from "../index";

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
  const pickVisibility = (key: string) => setField("visibilityMode", key);

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
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.smallLabel}>Min age</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(form.ageMin)}
              onChangeText={(v) =>
                setField("ageMin", Math.max(18, Math.min(Number(v) || 18, form.ageMax)))
              }
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.smallLabel}>Max age</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(form.ageMax)}
              onChangeText={(v) =>
                setField(
                  "ageMax",
                  Math.min(100, Math.max(Number(v) || form.ageMin, form.ageMin))
                )
              }
            />
          </View>
        </View>
      </View>

      {/* Distance */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Distance preference</Text>
          <Text style={styles.value}>
            {form.distance >= 1000 ? "1000+ miles" : `${form.distance} miles`}
          </Text>
        </View>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(form.distance)}
          onChangeText={(v) =>
            setField("distance", Math.max(0, Math.min(Number(v) || 0, 1000)))
          }
        />
      </View>

      {/* Visibility */}
      <View style={styles.card}>
        <Text style={styles.label}>Profile visibility</Text>
        <View style={styles.chipRow}>
          {VISIBILITY_MODES.map((v) => {
            const active = form.visibilityMode === v.key;
            return (
              <TouchableOpacity
                key={v.key}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                ]}
                onPress={() => pickVisibility(v.key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {v.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
  smallLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
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

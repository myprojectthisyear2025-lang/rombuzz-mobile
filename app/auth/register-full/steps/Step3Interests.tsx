/**
 * ============================================================================
 * 📁 File: app/auth/register-full/steps/Step3Interests.tsx
 * 🎯 Step 3 — Interests
 *
 * PURPOSE:
 *   - Lets user pick up to 5 interests from predefined list.
 *   - Mirrors Step 3 in web Register.jsx.
 *
 * PROPS:
 *   - form
 *   - toggleInterestChip
 *   - canNext
 *   - onNext
 *   - onBack
 * ============================================================================
 */

import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { INTEREST_OPTIONS, RegisterForm } from "../index";

type Props = {
  form: RegisterForm;
  toggleInterestChip: (value: string) => void;
  canNext: boolean;
  onNext: () => void;
  onBack: () => void;
};

export default function Step3Interests({
  form,
  toggleInterestChip,
  canNext,
  onNext,
  onBack,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Interests</Text>
      <Text style={styles.subtitle}>
        Pick up to <Text style={{ fontWeight: "700" }}>5</Text> things you love.
      </Text>

      <ScrollView
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContainer}
      >
        {INTEREST_OPTIONS.map((i) => {
          const active = form.interests.includes(i);
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.chip,
                active && styles.chipActive,
              ]}
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
      </ScrollView>

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
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  chipsScroll: {
    flex: 1,
    maxHeight: 260,
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
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

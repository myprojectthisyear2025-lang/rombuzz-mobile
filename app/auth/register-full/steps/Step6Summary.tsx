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

import React from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LOOKING_FOR, RegisterForm, VISIBILITY_MODES } from "../index";

type Props = {
  email: string;
  form: RegisterForm;
  error: string;
  busy: boolean;
  onBack: () => void;
  onFinish: () => void;
};

export default function Step6Summary({
  email,
  form,
  error,
  busy,
  onBack,
  onFinish,
}: Props) {
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
            <Text style={styles.bold}>Visibility:</Text>{" "}
            {VISIBILITY_MODES.find((v) => v.key === form.visibilityMode)?.label}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Interests:</Text>{" "}
            {form.interests.join(", ")}
          </Text>

          <Text style={styles.rowItem}>
            <Text style={styles.bold}>Photos:</Text> {form.photos.length}
          </Text>

          {form.phone ? (
            <Text style={styles.rowItem}>
              <Text style={styles.bold}>Phone:</Text> {form.phone}
            </Text>
          ) : null}

          {form.voiceUrl ? (
            <Text style={styles.rowItem}>
              <Text style={styles.bold}>Voice intro:</Text> Added
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
          onPress={onFinish}
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
});

/**
 * ============================================================================
 * 📁 File: app/auth/register-full/steps/Step1Basic.tsx
 * 🎯 Step 1 — Basic Info
 *
 * PURPOSE:
 *   - Collects the core user info:
 *       firstName, lastName, password, confirm password,
 *       gender, date of birth, lookingFor, interestedIn.
 *   - This matches Step 1 in web `Register.jsx`.
 *
 * PROPS:
 *   - form        → current RegisterForm state
 *   - setField    → (key, value) updater from parent
 *   - dobInvalid  → boolean flag for invalid DOB / under 18
 *   - canNext     → boolean; controls "Next" enabled/disabled
 *   - onNext      → callback to go to Step 2
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
import { GENDERS, LOOKING_FOR, RegisterForm } from "../index";

type Props = {
  form: RegisterForm;
  setField: (key: keyof RegisterForm, value: any) => void;
  dobInvalid: boolean;
  canNext: boolean;
  onNext: () => void;
};

export default function Step1Basic({
  form,
  setField,
  dobInvalid,
  canNext,
  onNext,
}: Props) {
  const toggleInterested = (key: string) => {
    const set = new Set(form.interestedIn);
    set.has(key) ? set.delete(key) : set.add(key);
    setField("interestedIn", Array.from(set));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Basic info</Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.half]}
          placeholder="First name"
          placeholderTextColor="#999"
          value={form.firstName}
          onChangeText={(v) => setField("firstName", v)}
        />
        <TextInput
          style={[styles.input, styles.half]}
          placeholder="Last name"
          placeholderTextColor="#999"
          value={form.lastName}
          onChangeText={(v) => setField("lastName", v)}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        placeholderTextColor="#999"
        secureTextEntry
        value={form.password}
        onChangeText={(v) => setField("password", v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor="#999"
        secureTextEntry
        value={form.confirm}
        onChangeText={(v) => setField("confirm", v)}
      />

      <View style={styles.row}>
        {/* Gender */}
        <View style={[styles.col, styles.half]}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((g) => {
              const active = form.gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.chip,
                    active && styles.chipActive,
                  ]}
                  onPress={() => setField("gender", g)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* DOB */}
        <View style={[styles.col, styles.half]}>
          <Text style={styles.label}>Date of birth</Text>
          <TextInput
            style={[
              styles.inputSmall,
              dobInvalid && styles.inputInvalid,
            ]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#aaa"
            value={form.dob}
            onChangeText={(v) => setField("dob", v)}
          />
          {dobInvalid && (
            <Text style={styles.error}>
              Please enter a valid date (18+ only).
            </Text>
          )}
        </View>
      </View>

      {/* Looking For */}
      <View style={styles.block}>
        <Text style={styles.label}>What are you looking for?</Text>
        <View style={styles.chipRow}>
          {LOOKING_FOR.map((opt) => {
            const active = form.lookingFor === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                ]}
                onPress={() => setField("lookingFor", opt.key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Interested In */}
      <View style={styles.block}>
        <Text style={styles.label}>Interested in</Text>
        <View style={styles.chipRow}>
          {["male", "female", "other"].map((key) => {
            const active = form.interestedIn.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                ]}
                onPress={() => toggleInterested(key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {key[0].toUpperCase() + key.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Next */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canNext && styles.nextButtonDisabled,
          ]}
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
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  col: {
    flexDirection: "column",
  },
  half: {
    flex: 1,
  },
  input: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  inputSmall: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    fontSize: 14,
    marginTop: 4,
  },
  inputInvalid: {
    borderWidth: 1,
    borderColor: "#ff3366",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  block: {
    marginTop: 6,
    marginBottom: 4,
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
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    fontSize: 11,
    color: "#ff3366",
    marginTop: 2,
  },
  footerRow: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  nextButton: {
    backgroundColor: "#ff2f6e",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  nextButtonDisabled: {
    backgroundColor: "#ccc",
  },
  nextText: {
    color: "#fff",
    fontWeight: "700",
  },
});

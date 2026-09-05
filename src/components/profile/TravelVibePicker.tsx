/**
 * ============================================================================
 * 📁 File: src/components/profile/TravelVibePicker.tsx
 * 🎯 Purpose: Premium multi-select picker for RomBuzz Travel Vibe.
 *
 * - Maximum 5 selections
 * - Safe-area aware on iOS + Android
 * - Scrolls inside the popup only
 * - Reusable from Profile without bloating ProfileInfoTab.tsx
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    MAX_TRAVEL_VIBES,
    TRAVEL_VIBE_OPTIONS,
} from "../../constants/travelVibes";

type Props = {
  visible: boolean;
  selected?: string[];
  onClose: () => void;
  onSave: (values: string[]) => void;
};

export default function TravelVibePicker({
  visible,
  selected = [],
  onClose,
  onSave,
}: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setDraft(
        Array.isArray(selected)
          ? selected.slice(0, MAX_TRAVEL_VIBES)
          : []
      );
    }
  }, [selected, visible]);

  const toggle = (value: string) => {
    setDraft((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      if (current.length >= MAX_TRAVEL_VIBES) {
        return current;
      }

      return [...current, value];
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Travel Vibe</Text>
              <Text style={styles.subtitle}>
                Choose up to {MAX_TRAVEL_VIBES}
              </Text>
            </View>

            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons
                name="close"
                size={26}
                color="#111827"
              />
            </Pressable>
          </View>

          <Text style={styles.counter}>
            {draft.length}/{MAX_TRAVEL_VIBES} selected
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.options}
          >
            {TRAVEL_VIBE_OPTIONS.map((option) => {
              const active = draft.includes(option);
              const disabled =
                !active &&
                draft.length >= MAX_TRAVEL_VIBES;

              return (
                <Pressable
                  key={option}
                  onPress={() => toggle(option)}
                  style={[
                    styles.chip,
                    active && styles.chipActive,
                    disabled && styles.chipDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {option}
                  </Text>

                  {active ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#ffffff"
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={() => onSave(draft)}
            style={styles.saveButton}
          >
            <Text style={styles.saveText}>
              Save Travel Vibe
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  sheet: {
    maxHeight: "86%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },

  counter: {
    marginTop: 16,
    marginBottom: 10,
    color: "#b1123c",
    fontWeight: "700",
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 20,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  chipActive: {
    backgroundColor: "#d8345f",
    borderColor: "#d8345f",
  },

  chipDisabled: {
    opacity: 0.4,
  },

  chipText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },

  chipTextActive: {
    color: "#ffffff",
  },

  saveButton: {
    marginTop: 8,
    backgroundColor: "#b1123c",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },

  saveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});
/**
 * ============================================================================
 * 📁 File: src/components/profile/ProfileSingleChoicePicker.tsx
 * 🎯 Purpose: Reusable single-choice profile picker with custom typing.
 *
 * - Keeps manual/custom typing.
 * - Displays predefined options below the input.
 * - One saved selection/value only.
 * - Scrollable + safe-area friendly on iOS and Android.
 * ============================================================================
 */

import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ProfileChoiceOption } from "../../constants/profileBeliefs";

type Props = {
  visible: boolean;
  title: string;
  placeholder?: string;
  value?: string;
  options: ProfileChoiceOption[];
  RBZ: any;
  onClose: () => void;
  onSave: (value: string) => void;
};

export default function ProfileSingleChoicePicker({
  visible,
  title,
  placeholder,
  value,
  options,
  RBZ,
  onClose,
  onSave,
}: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (visible) {
      setDraft(String(value || "").trim());
    }
  }, [visible, value]);

  const normalizedDraft = draft.trim().toLowerCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: Math.max(insets.bottom, 16),
              maxHeight: "86%",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: RBZ.text,
              }}
            >
              {title}
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: RBZ.muted,
                marginTop: 5,
                marginBottom: 14,
              }}
            >
              Type your own answer or choose one below.
            </Text>

            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder || "Type here..."}
              placeholderTextColor={RBZ.muted}
              autoCapitalize="words"
              autoCorrect={false}
              style={{
                minHeight: 48,
                borderWidth: 1,
                borderColor: RBZ.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                fontSize: 16,
                color: RBZ.text,
                backgroundColor: "#f8f9fa",
              }}
            />

            <ScrollView
              style={{
                maxHeight: 320,
                marginTop: 18,
              }}
              contentContainerStyle={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                paddingBottom: 8,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => {
                const active =
                  normalizedDraft === option.value.toLowerCase() ||
                  normalizedDraft === option.label.toLowerCase();

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setDraft(option.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active
                        ? RBZ.primary
                        : RBZ.border,
                      backgroundColor: active
                        ? RBZ.primary + "12"
                        : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: active ? "700" : "500",
                        color: active
                          ? RBZ.primary
                          : RBZ.text,
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 18,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: "#f8f9fa",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: RBZ.text,
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onSave(draft.trim())}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: RBZ.primary,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
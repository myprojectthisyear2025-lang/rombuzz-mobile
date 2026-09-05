/**
 * ============================================================================
 * 📁 File: src/components/profile/LanguagePickerModal.tsx
 * 🎯 Purpose: Profile language picker for RomBuzz.
 *
 * - Keeps manual language typing.
 * - Shows popular language choices below the input.
 * - Supports up to 5 selected languages.
 * - Designed for iOS + Android with a scrollable modal.
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const MAX_LANGUAGES = 5;

const POPULAR_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Mandarin Chinese",
  "Cantonese",
  "Hindi",
  "Arabic",
  "Bengali",
  "Russian",
  "Japanese",
  "Korean",
  "Turkish",
  "Vietnamese",
  "Thai",
  "Indonesian",
  "Malay",
  "Urdu",
  "Punjabi",
  "Nepali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Dutch",
  "Swedish",
  "Polish",
  "Greek",
  "Hebrew",
  "Persian",
];

type Props = {
  visible: boolean;
  selected: string[];
  RBZ: any;
  onClose: () => void;
  onSave: (values: string[]) => void;
};

export default function LanguagePickerModal({
  visible,
  selected,
  RBZ,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!visible) return;

    setDraft(
      Array.from(
        new Set(
          (Array.isArray(selected) ? selected : [])
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        )
      ).slice(0, MAX_LANGUAGES)
    );

    setInput("");
  }, [visible, selected]);

  const selectedLower = useMemo(
    () => new Set(draft.map((value) => value.toLowerCase())),
    [draft]
  );

  const addValues = (raw: string) => {
    const candidates = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!candidates.length) return;

    const next = [...draft];

    for (const candidate of candidates) {
      const exists = next.some(
        (value) => value.toLowerCase() === candidate.toLowerCase()
      );

      if (exists) continue;

      if (next.length >= MAX_LANGUAGES) {
        Alert.alert(
          "Maximum reached",
          `You can choose up to ${MAX_LANGUAGES} languages.`
        );
        break;
      }

      next.push(candidate);
    }

    setDraft(next);
    setInput("");
  };

  const toggleLanguage = (language: string) => {
    const exists = selectedLower.has(language.toLowerCase());

    if (exists) {
      setDraft((current) =>
        current.filter(
          (value) => value.toLowerCase() !== language.toLowerCase()
        )
      );
      return;
    }

    if (draft.length >= MAX_LANGUAGES) {
      Alert.alert(
        "Maximum reached",
        `You can choose up to ${MAX_LANGUAGES} languages.`
      );
      return;
    }

    setDraft((current) => [...current, language]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            maxHeight: "85%",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: RBZ.text,
            }}
          >
            Languages
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: RBZ.muted,
              marginTop: 6,
              marginBottom: 14,
            }}
          >
            Choose up to 5 languages.
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: RBZ.border,
              borderRadius: 12,
              backgroundColor: "#f8f9fa",
              paddingLeft: 12,
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => addValues(input)}
              placeholder="Type a language..."
              placeholderTextColor={RBZ.muted}
              autoCapitalize="words"
              returnKeyType="done"
              style={{
                flex: 1,
                minHeight: 48,
                fontSize: 16,
                color: RBZ.text,
              }}
            />

            <TouchableOpacity
              onPress={() => addValues(input)}
              disabled={!input.trim()}
              style={{ padding: 12 }}
            >
              <Ionicons
                name="add-circle"
                size={25}
                color={input.trim() ? RBZ.primary : RBZ.muted}
              />
            </TouchableOpacity>
          </View>

          {!!draft.length && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 14,
              }}
            >
              {draft.map((language) => (
                <TouchableOpacity
                  key={language}
                  onPress={() => toggleLanguage(language)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: RBZ.primary + "15",
                    borderWidth: 1,
                    borderColor: RBZ.primary + "35",
                  }}
                >
                  <Text
                    style={{
                      color: RBZ.primary,
                      fontWeight: "600",
                    }}
                  >
                    {language}
                  </Text>

                  <Ionicons
                    name="close"
                    size={15}
                    color={RBZ.primary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: RBZ.text,
              marginTop: 20,
              marginBottom: 10,
            }}
          >
            Popular languages
          </Text>

          <ScrollView
            style={{ maxHeight: 280 }}
            contentContainerStyle={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              paddingBottom: 8,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {POPULAR_LANGUAGES.map((language) => {
              const active = selectedLower.has(language.toLowerCase());

              return (
                <TouchableOpacity
                  key={language}
                  onPress={() => toggleLanguage(language)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
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
                      color: active
                        ? RBZ.primary
                        : RBZ.text,
                      fontWeight: active ? "600" : "400",
                    }}
                  >
                    {language}
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
              onPress={() => onSave(draft.slice(0, MAX_LANGUAGES))}
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
    </Modal>
  );
}
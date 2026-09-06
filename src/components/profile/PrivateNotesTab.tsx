/**
 * Path: src/components/profile/PrivateNotesTab.tsx
 * Purpose: Profile → Private Notes private journal UI and note CRUD controller.
 * Used by: Profile screen Private Notes tab.
 */

import { API_BASE } from "@/src/config/api";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { privateNotesStyles as styles } from "@/src/features/profile/privateNotes/privateNotes.styles";

import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Note = {
  _id: string;
  text: string;
  createdAt: number | string;
  updatedAt?: number | string;
};

async function authFetch(
  path: string,
  options: RequestInit = {}
) {
  const token =
    await SecureStore.getItemAsync(
      "RBZ_TOKEN"
    );

  const res = await fetch(
    `${API_BASE}${path}`,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data?.error ||
        "Request failed"
    );
  }

  return data;
}

function formatNoteDate(
  value?: number | string
) {
  if (!value) return "";

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

export default function PrivateNotesTab() {
  const { colors, isDark } =
    useRomBuzzTheme();

  const insets =
    useSafeAreaInsets();

  const [notes, setNotes] =
    useState<Note[]>([]);

  const [
    editorOpen,
    setEditorOpen,
  ] = useState(false);

  const [
    editingNote,
    setEditingNote,
  ] = useState<Note | null>(null);

  const [text, setText] =
    useState("");

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const data =
        await authFetch(
          "/profile/notes"
        );

      setNotes(data.notes || []);
    } catch (err) {
      console.error(
        "❌ Failed to load notes",
        err
      );
    }
  };

  const openWrite = () => {
    setEditingNote(null);
    setText("");
    setEditorOpen(true);
  };

  const openEdit = (
    note: Note
  ) => {
    setEditingNote(note);
    setText(note.text);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingNote(null);
    setText("");
  };

 const saveNote = () => {
  if (!text.trim()) {
    Alert.alert(
      "Private Notes",
      "Write something before saving."
    );

    return;
  }

  // Capture current editor values before closing it.
  const nextText = text;
  const noteBeingEdited = editingNote;
  const now = Date.now();

  // ============================================================
  // EDIT EXISTING NOTE
  // ============================================================
  if (noteBeingEdited) {
    const previousNote = noteBeingEdited;

    const optimisticNote: Note = {
      ...noteBeingEdited,
      text: nextText,
      updatedAt: now,
    };

    // Update UI immediately.
    setNotes((prev) =>
      prev.map((note) =>
        note._id === noteBeingEdited._id
          ? optimisticNote
          : note
      )
    );

    // Close editor immediately — no API wait.
    closeEditor();

    // Persist in background.
    void authFetch(
      `/profile/notes/${noteBeingEdited._id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          text: nextText,
        }),
      }
    )
      .then((data) => {
        if (!data?.note) return;

        // Replace optimistic note with MongoDB response.
        setNotes((prev) =>
          prev.map((note) =>
            note._id === noteBeingEdited._id
              ? data.note
              : note
          )
        );
      })
      .catch(() => {
        // Roll back only this note if save failed.
        setNotes((prev) =>
          prev.map((note) =>
            note._id === noteBeingEdited._id
              ? previousNote
              : note
          )
        );

        Alert.alert(
          "Private Notes",
          "Failed to save note. Your previous version was restored."
        );
      });

    return;
  }

  // ============================================================
  // CREATE NEW NOTE
  // ============================================================
  const tempId =
    `temp-note-${now}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

  const optimisticNote: Note = {
    _id: tempId,
    text: nextText,
    createdAt: now,
    updatedAt: now,
  };

  // Show it immediately.
  setNotes((prev) => [
    optimisticNote,
    ...prev,
  ]);

  // Close editor immediately — no API wait.
  closeEditor();

  // Persist in background.
  void authFetch(
    "/profile/notes",
    {
      method: "POST",
      body: JSON.stringify({
        text: nextText,
      }),
    }
  )
    .then((data) => {
      if (!data?.note) return;

      // Replace temporary note with real MongoDB note.
      setNotes((prev) =>
        prev.map((note) =>
          note._id === tempId
            ? data.note
            : note
        )
      );
    })
    .catch(() => {
      // Remove only the temporary note if save failed.
      setNotes((prev) =>
        prev.filter(
          (note) =>
            note._id !== tempId
        )
      );

      Alert.alert(
        "Private Notes",
        "Failed to save note. Please try again."
      );
    });
};

  const deleteNote = (
    note: Note
  ) => {
    Alert.alert(
      "Delete note?",
      "This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await authFetch(
                `/profile/notes/${note._id}`,
                {
                  method:
                    "DELETE",
                }
              );

              setNotes(
                (prev) =>
                  prev.filter(
                    (item) =>
                      item._id !==
                      note._id
                  )
              );
            } catch {
              Alert.alert(
                "Error",
                "Failed to delete note"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headingWrap}>
          <View
            style={[
              styles.privateIcon,
              {
                backgroundColor:
                  colors.surfaceMuted,
              },
            ]}
          >
            <Ionicons
              name="lock-closed"
              size={13}
              color={colors.brand}
            />
          </View>

          <View style={styles.headingText}>
            <Text
              style={[
                styles.title,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Private Notes
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              Only you can see these.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={openWrite}
          hitSlop={6}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor:
                colors.brand,
            },
            pressed && {
              opacity: 0.72,
            },
          ]}
        >
          <Ionicons
            name="add"
            size={20}
            color={colors.white}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.content,
          notes.length === 0 &&
            styles.emptyContent,
        ]}
      >
        {notes.length === 0 ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor:
                    colors.surfaceMuted,
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={25}
                color={
                  colors.iconMuted
                }
              />
            </View>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Your private space
            </Text>

            <Text
              style={[
                styles.emptySubtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Save thoughts, reminders or
              anything you want to keep to
              yourself.
            </Text>

            <Pressable
              onPress={openWrite}
              style={[
                styles.emptyAction,
                {
                  backgroundColor:
                    colors.brand,
                },
              ]}
            >
              <Ionicons
                name="add"
                size={17}
                color={colors.white}
              />

              <Text
                style={
                  styles.emptyActionText
                }
              >
                New note
              </Text>
            </Pressable>
          </View>
        ) : (
          notes.map((note) => {
            const displayDate =
              formatNoteDate(
                note.updatedAt ||
                  note.createdAt
              );

            return (
              <Pressable
                key={note._id}
                onPress={() =>
                  openEdit(note)
                }
                style={({ pressed }) => [
                  styles.noteRow,
                  {
                    backgroundColor:
                      colors.surface,

                    borderColor:
                      colors.border,
                  },
                  pressed && {
                    opacity: 0.72,
                  },
                ]}
              >
                <View
                  style={
                    styles.noteMain
                  }
                >
                  <Text
                    style={[
                      styles.noteText,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                    numberOfLines={4}
                  >
                    {note.text}
                  </Text>

                  {!!displayDate && (
                    <Text
                      style={[
                        styles.noteDate,
                        {
                          color:
                            colors.textMuted,
                        },
                      ]}
                    >
                      {displayDate}
                    </Text>
                  )}
                </View>

                <View
                  style={
                    styles.noteActions
                  }
                >
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={
                      colors.iconMuted
                    }
                  />

                  <Pressable
                    onPress={() =>
                      deleteNote(note)
                    }
                    hitSlop={10}
                    style={[
                      styles.deleteButton,
                      {
                        backgroundColor:
                          colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={15}
                      color={
                        colors.danger
                      }
                    />
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={editorOpen}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={
          closeEditor
        }
      >
        <StatusBar
          style={
            isDark
              ? "light"
              : "dark"
          }
        />

        <KeyboardAvoidingView
          style={[
            styles.editorScreen,
            {
              backgroundColor:
                colors.background,
            },
          ]}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View
            style={[
              styles.editorSafe,
              {
                paddingTop:
                  insets.top,
                paddingBottom:
                  insets.bottom,
              },
            ]}
          >
            <View
              style={[
                styles.editorHeader,
                {
                  borderBottomColor:
                    colors.border,
                },
              ]}
            >
              <Pressable
                onPress={closeEditor}
                style={
                  styles.editorSide
                }
              >
                <Text
                  style={[
                    styles.cancelText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Text
                style={[
                  styles.editorTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {editingNote
                  ? "Edit note"
                  : "New note"}
              </Text>

              <Pressable
                onPress={saveNote}
                style={[
                  styles.editorSide,
                  styles.editorRight,
                ]}
              >
                <Text
                  style={[
                    styles.saveText,
                    {
                      color:
                        colors.brand,
                    },
                  ]}
                >
                  Save
                </Text>
              </Pressable>
            </View>

            <View
              style={
                styles.editorBody
              }
            >
              <View
                style={
                  styles.editorPrivacy
                }
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={12}
                  color={
                    colors.textMuted
                  }
                />

                <Text
                  style={[
                    styles.editorPrivacyText,
                    {
                      color:
                        colors.textMuted,
                    },
                  ]}
                >
                  Only visible to you
                </Text>
              </View>

              <TextInput
                value={text}
                onChangeText={setText}
                autoFocus
                placeholder="Write whatever is on your mind…"
                placeholderTextColor={
                  colors.textMuted
                }
                multiline
                textAlignVertical="top"
                style={[
                  styles.input,
                  {
                    color:
                      colors.text,
                  },
                ]}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
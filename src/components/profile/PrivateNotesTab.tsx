/**
 * ============================================================================
 * 📁 File: src/components/profile/PrivateNotesTab.tsx
 * 🎯 Purpose: Profile → Private Notes (Diary-style, private, persistent)
 * ============================================================================
 */

import { API_BASE } from "@/src/config/api";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  muted: "#6b7280",
  line: "rgba(17,24,39,0.08)",
};

type Note = {
  _id: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
};

async function authFetch(
  path: string,
  options: RequestInit = {}
) {
  const token = await SecureStore.getItemAsync("RBZ_TOKEN");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Request failed");

  return data;
}

export default function PrivateNotesTab() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [text, setText] = useState("");

  /* ================= LOAD NOTES ================= */
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const data = await authFetch("/profile/notes");
      setNotes(data.notes || []);
    } catch (err) {
      console.error("❌ Failed to load notes", err);
    }
  };

  /* ================= EDITOR ================= */
  const openWrite = () => {
    setEditingNote(null);
    setText("");
    setEditorOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setText(note.text);
    setEditorOpen(true);
  };

  const saveNote = async () => {
    if (!text.trim()) {
      Alert.alert("Private Notes", "Write something before saving.");
      return;
    }

    try {
      if (editingNote) {
        const data = await authFetch(
          `/profile/notes/${editingNote._id}`,
          {
            method: "PUT",
            body: JSON.stringify({ text }),
          }
        );

        setNotes((prev) =>
          prev.map((n) =>
            n._id === editingNote._id ? data.note : n
          )
        );
      } else {
        const data = await authFetch("/profile/notes", {
          method: "POST",
          body: JSON.stringify({ text }),
        });

        setNotes((prev) => [data.note, ...prev]);
      }

      setEditorOpen(false);
      setEditingNote(null);
      setText("");
    } catch {
      Alert.alert("Error", "Failed to save note");
    }
  };

  const deleteNote = (note: Note) => {
    Alert.alert("Delete note?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await authFetch(`/profile/notes/${note._id}`, {
              method: "DELETE",
            });
            setNotes((prev) =>
              prev.filter((n) => n._id !== note._id)
            );
          } catch {
            Alert.alert("Error", "Failed to delete note");
          }
        },
      },
    ]);
  };

  /* ================= UI ================= */
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>   Private Notes</Text>

        <Pressable onPress={openWrite} style={styles.writeBtn}>
          <Ionicons name="add" size={18} color={RBZ.white} />
          <Text style={styles.writeText}>Write</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {notes.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              This is your private space.
            </Text>
            <Text style={styles.emptySub}>
              Write thoughts you don’t want to send.
            </Text>
          </View>
        )}

        {notes.map((note) => (
          <View key={note._id} style={styles.card}>
            <Text style={styles.date}>
              {new Date(note.createdAt).toLocaleDateString()}
            </Text>

            <Text style={styles.body} numberOfLines={3}>
              {note.text}
            </Text>

            <View style={styles.actions}>
              <Pressable onPress={() => openEdit(note)}>
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={RBZ.c4}
                />
              </Pressable>

              <Pressable onPress={() => deleteNote(note)}>
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={RBZ.c1}
                />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={editorOpen} animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setEditorOpen(false)}>
              <Ionicons name="close" size={22} color={RBZ.ink} />
            </Pressable>

            <Text style={styles.modalTitle}>
              {editingNote ? "Edit note" : "New note"}
            </Text>

            <Pressable onPress={saveNote}>
              <Text style={styles.save}>Save</Text>
            </Pressable>
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write freely. This stays private."
            placeholderTextColor={RBZ.muted}
            multiline
            style={styles.input}
          />
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: RBZ.ink,
  },
  writeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: RBZ.c3,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 10,
  },
  writeText: { color: RBZ.white, fontWeight: "800" },
  empty: { marginTop: 40, alignItems: "center" },
  emptyText: { fontSize: 16, fontWeight: "700", color: RBZ.ink },
  emptySub: { marginTop: 6, color: RBZ.muted },
  card: {
    backgroundColor: RBZ.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: RBZ.line,
  },
  date: { fontSize: 12, color: RBZ.muted },
  body: { fontSize: 15, lineHeight: 22, color: RBZ.ink },
  actions: { flexDirection: "row", gap: 18, justifyContent: "flex-end" },
  modalWrap: { flex: 1, padding: 16, backgroundColor: RBZ.white },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: RBZ.ink },
  save: { color: RBZ.c4, fontWeight: "800" },
  input: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: "top",
    color: RBZ.ink,
  },
});

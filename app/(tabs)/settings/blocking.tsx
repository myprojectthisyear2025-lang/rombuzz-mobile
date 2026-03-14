/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/blocking.tsx
 * 🎯 Purpose: Blocking & Safety (blocked list + unblock + report)
 * ============================================================================
 */
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { rbzFetch } from "./_rbzApi";
import { Card, RBZ, ScreenShell, SectionTitle, SmallText } from "./_ui";

export default function BlockingSafety() {
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [reportTargetId, setReportTargetId] = useState("");
  const [reportReason, setReportReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const j = await rbzFetch<{ blocks: any[] }>("/blocks");
      setBlocked(Array.isArray(j?.blocks) ? j.blocks : []);
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to load blocked users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unblock = async (targetId: string) => {
    try {
      await rbzFetch("/unblock", { method: "POST", body: { targetId } });
setBlocked((p) =>
  p.filter((x) => String(x?.user?.id ?? x?.to) !== String(targetId))
);
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to unblock");
    }
  };

  const submitReport = async () => {
    if (!reportTargetId.trim()) return Alert.alert("Missing", "Enter target user id");
    if (!reportReason.trim()) return Alert.alert("Missing", "Enter a reason");
    try {
      await rbzFetch("/report", {
        method: "POST",
        body: { targetId: reportTargetId.trim(), reason: reportReason.trim() },
      });
      setReportTargetId("");
      setReportReason("");
      Alert.alert("Submitted", "Thanks — your report was sent.");
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to submit report");
    }
  };

  return (
    <ScreenShell title="Blocking & Safety">
      <SectionTitle>Blocked users</SectionTitle>
      <Card>
        {loading ? (
          <Text style={{ color: RBZ.muted, fontWeight: "800" }}>Loading...</Text>
        ) : blocked.length ? (
     blocked.map((b, i) => {
  const user = b?.user;

  // ✅ normalize id to string (fixes TS + runtime)
  const id = String(user?.id ?? b?.to ?? i);

  const name = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : `User ${id}`;

  return (
    <View key={id} style={styles.blockRow}>

                <View style={{ flex: 1 }}>
                  <Text style={styles.blockName}>{name}</Text>
                  <Text style={styles.blockSub}>{user?.email ? user.email : `User ID: ${id}`}</Text>
                </View>

                <Pressable
                  onPress={() =>
                    Alert.alert("Unblock?", `Unblock ${name}?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Unblock", style: "destructive", onPress: () => unblock(String(id)) },
                    ])
                  }
                  style={styles.unblockBtn}
                >
                  <Text style={styles.unblockText}>Unblock</Text>
                </Pressable>
              </View>
            );
          })
        ) : (
          <Text style={{ color: RBZ.muted, fontWeight: "800" }}>
            No blocked users.
          </Text>
        )}

        <SmallText>
          These calls are backed by your API endpoints /blocks and /unblock. 
        </SmallText>
      </Card>

      <SectionTitle>Report a user</SectionTitle>
      <Card>
        <Text style={styles.label}>Target user id</Text>
        <TextInput
          value={reportTargetId}
          onChangeText={setReportTargetId}
          placeholder="e.g. user_123"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 10 }]}>Reason</Text>
        <TextInput
          value={reportReason}
          onChangeText={setReportReason}
          placeholder="Tell us what happened…"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={[styles.input, { height: 90, textAlignVertical: "top" }]}
          multiline
        />

        <Pressable onPress={submitReport} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Submit report</Text>
        </Pressable>

    <SmallText>
  {`Reports go to /report with { targetId, reason }.\nWe’ll review and take action as needed.`}
</SmallText>

      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
 blockRow: {
  flexDirection: "row",
  gap: 10,
  alignItems: "center",
  paddingVertical: 10,
  paddingHorizontal: 10,
  borderRadius: 14,
  backgroundColor: "#ffffff", // ✅ WHITE
  borderWidth: 1,
  borderColor: RBZ.line,
  marginBottom: 10,
},

  blockName: { color: RBZ.text, fontWeight: "900" },
  blockSub: { color: RBZ.muted, marginTop: 2, fontSize: 12, fontWeight: "700" },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(177,18,60,0.25)",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.35)",
  },
  unblockText: { color: RBZ.text, fontWeight: "900" },

  label: { color: RBZ.muted, fontSize: 12, fontWeight: "800", marginBottom: 6 },
 input: {
  borderWidth: 1,
  borderColor: RBZ.line,
  backgroundColor: "#ffffff", // ✅ WHITE
  borderRadius: 14,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: RBZ.text,
  fontWeight: "700",
},

  primaryBtn: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: RBZ.c2,
    borderWidth: 1,
    borderColor: RBZ.c3,
  },
  primaryText: { color: RBZ.text, fontWeight: "900" },
});

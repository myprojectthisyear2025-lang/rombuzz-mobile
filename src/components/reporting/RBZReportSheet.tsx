/**
 * ============================================================================
 * 📁 File: src/components/reporting/RBZReportSheet.tsx
 * 🎯 Purpose: Reusable RomBuzz mobile reporting sheet
 *
 * Use:
 * - Import this component into any mobile screen that needs reporting.
 * - Pass `visible`, `onClose`, and a structured `target`.
 * - This component handles:
 *   - RomBuzz themed report UI
 *   - iOS / Android / tablet friendly layout
 *   - safe-area bottom spacing
 *   - keyboard avoiding behavior
 *   - reason selection
 *   - details composer
 *   - POST /api/reports structured payload
 *
 * Backend payload sent:
 * {
 *   targetType,
 *   targetId,
 *   reportedUserId,
 *   targetOwnerId,
 *   reason,
 *   details,
 *   source,
 *   evidenceSnapshot
 * }
 * ============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE } from "@/src/config/api";
import RBZReportAfterActions from "@/src/components/reporting/RBZReportAfterActions";

const RBZ = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",

  white: "#ffffff",
  bg: "#fafafc",
  ink: "#111827",
  muted: "#6b7280",
  soft: "#f7f7fb",
  line: "rgba(17,24,39,0.10)",
  cardBg: "#ffffff",
  error: "#ef4444",
};

export type RBZReportTargetType =
  | "profile"
  | "chat_conversation"
  | "chat_message"
  | "post"
  | "reel"
  | "gallery_media"
  | "comment"
  | "reply"
  | "microbuzz"
  | "video_call"
  | "gift_transaction"
  | "other";

export type RBZReportTarget = {
  targetType: RBZReportTargetType;
  targetId: string;
  reportedUserId?: string;
  targetOwnerId?: string;

  source: string;

  title?: string;
  subtitle?: string;
  avatar?: string;

  evidenceSnapshot?: Record<string, any>;
};

type RBZReportSheetProps = {
  visible: boolean;
  target: RBZReportTarget | null;
  onClose: () => void;
  onSubmitted?: (report?: any) => void;
};

const DEFAULT_REASONS = [
  "Harassment",
  "Fake profile",
  "Inappropriate content",
  "Scam or spam",
  "Hate or abuse",
  "Underage concern",
  "Privacy or safety concern",
  "Other",
] as const;

function getReasonTitle(targetType?: RBZReportTargetType) {
  switch (targetType) {
    case "profile":
      return "Report profile";
    case "chat_conversation":
      return "Report conversation";
    case "chat_message":
      return "Report message";
    case "post":
      return "Report post";
    case "reel":
      return "Report reel";
    case "gallery_media":
      return "Report media";
    case "comment":
      return "Report comment";
    case "reply":
      return "Report reply";
    case "microbuzz":
      return "Report MicroBuzz";
    case "video_call":
      return "Report video call";
    case "gift_transaction":
      return "Report transaction";
    default:
      return "Report";
  }
}

function getHelperText(targetType?: RBZReportTargetType, title?: string) {
  const name = String(title || "").trim();

  if (targetType === "profile" && name) {
    return `Tell us what happened with ${name}. Your report stays private.`;
  }

  if (targetType === "chat_message") {
    return "Tell us what happened with this message. Your report stays private.";
  }

  if (targetType === "chat_conversation") {
    return "Tell us what happened in this conversation. Your report stays private.";
  }

  if (targetType === "video_call") {
    return "Tell us what happened during this call. Your report stays private.";
  }

  return "Tell us what happened. Your report stays private.";
}

async function getReporterName() {
  const storedMe = await SecureStore.getItemAsync("RBZ_USER");

  try {
    const parsedMe = storedMe ? JSON.parse(storedMe) : null;

    return (
      [parsedMe?.firstName, parsedMe?.lastName].filter(Boolean).join(" ").trim() ||
      String(parsedMe?.name || "").trim() ||
      ""
    );
  } catch {
    return "";
  }
}

export default function RBZReportSheet({
  visible,
  target,
  onClose,
  onSubmitted,
}: RBZReportSheetProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);

  const isTablet = width >= 768;

  const title = useMemo(() => {
    return getReasonTitle(target?.targetType);
  }, [target?.targetType]);

  const helperText = useMemo(() => {
    return getHelperText(target?.targetType, target?.title);
  }, [target?.targetType, target?.title]);

  const resetAndClose = () => {
    if (submitting) return;

    setReason("");
    setDetails("");
    setSubmittedReport(null);
    onClose();
  };

  const finishAfterReport = () => {
    setReason("");
    setDetails("");
    setSubmittedReport(null);
    onSubmitted?.(submittedReport);
    onClose();
  };

  const submitReport = async () => {
    if (!target || submitting) return;

    const trimmedReason = reason.trim();
    const trimmedDetails = details.trim();

    if (!trimmedReason) {
      Alert.alert("Choose a reason", "Please select why you are reporting this.");
      return;
    }

    try {
      setSubmitting(true);

      const token = await SecureStore.getItemAsync("RBZ_TOKEN");
      const reporterName = await getReporterName();

      const payload = {
        targetType: target.targetType,
        targetId: String(target.targetId),
        reportedUserId: target.reportedUserId ? String(target.reportedUserId) : undefined,
        targetOwnerId: target.targetOwnerId ? String(target.targetOwnerId) : undefined,
        reason: trimmedReason,
        details: trimmedDetails,
        source: target.source,
        evidenceSnapshot: {
          ...(target.evidenceSnapshot || {}),
          reportSheet: "RBZReportSheet",
          previewTitle: target.title || "",
          previewSubtitle: target.subtitle || "",
          previewAvatar: target.avatar || "",
          reporterName,
        },
      };

      const res = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

        if (!res.ok) {
        throw new Error(data?.message || data?.error || "Report failed");
      }

      setReason("");
      setDetails("");
      setSubmittedReport(data?.report || data);
    } catch (e: any) {
      Alert.alert("Report failed", e?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={resetAndClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <Pressable
          style={[
            styles.backdrop,
            {
              paddingTop: insets.top + 14,
              paddingBottom: Math.max(insets.bottom + 14, 18),
            },
          ]}
          onPress={resetAndClose}
        >
          <Pressable
            onPress={() => {}}
            style={[
              styles.sheet,
              {
                maxWidth: isTablet ? 560 : "100%",
                maxHeight: Math.min(height - insets.top - insets.bottom - 28, 680),
              },
            ]}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.iconBubble}>
                <Ionicons name="shield-checkmark" size={21} color={RBZ.white} />
              </View>

              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.helper}>{helperText}</Text>
              </View>

              <Pressable
                onPress={resetAndClose}
                disabled={submitting}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={RBZ.muted} />
              </Pressable>
            </View>

                   {submittedReport ? (
              <RBZReportAfterActions
                target={target}
                report={submittedReport}
                onDone={finishAfterReport}
              />
            ) : (
              <>
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.previewCard}>
                    {target?.avatar ? (
                      <Image source={{ uri: target.avatar }} style={styles.previewAvatar} />
                    ) : (
                      <View style={styles.previewAvatarFallback}>
                        <Ionicons name="flag" size={22} color={RBZ.c2} />
                      </View>
                    )}

                    <View style={styles.previewTextWrap}>
                      <Text style={styles.previewTitle} numberOfLines={1}>
                        {target?.title || "RomBuzz report"}
                      </Text>

                      <Text style={styles.previewSubtitle} numberOfLines={2}>
                        {target?.subtitle || "Safety review request"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sectionLabel}>Reason</Text>

                  <View style={styles.reasonGrid}>
                    {DEFAULT_REASONS.map((item) => {
                      const selected = reason === item;

                      return (
                        <Pressable
                          key={item}
                          onPress={() => setReason(item)}
                          disabled={submitting}
                          style={[
                            styles.reasonChip,
                            selected && styles.reasonChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.reasonChipText,
                              selected && styles.reasonChipTextActive,
                            ]}
                          >
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                    Details
                  </Text>

                  <TextInput
                    value={details}
                    onChangeText={setDetails}
                    placeholder="Add anything that can help our safety team review this…"
                    placeholderTextColor="rgba(107,114,128,0.75)"
                    multiline
                    textAlignVertical="top"
                    editable={!submitting}
                    style={styles.input}
                  />

                  <Text style={styles.privacyNote}>
                    Reports are private. RomBuzz may review the reported content, evidence snapshot,
                    account safety history, and related activity to make a moderation decision.
                  </Text>
                </ScrollView>

                <View style={styles.actions}>
                  <Pressable
                    onPress={resetAndClose}
                    disabled={submitting}
                    style={[styles.actionButton, styles.cancelButton]}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    onPress={submitReport}
                    disabled={submitting || !reason.trim() || !target}
                    style={[
                      styles.actionButton,
                      styles.submitButton,
                      (submitting || !reason.trim() || !target) && styles.submitButtonDisabled,
                    ]}
                  >
                    {submitting ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={RBZ.white} />
                        <Text style={styles.submitText}>Submitting</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitText}>Submit report</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.48)",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  sheet: {
    width: "100%",
    backgroundColor: RBZ.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.14)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 30,
  },

  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.16)",
    marginBottom: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(17,24,39,0.07)",
  },

  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.c2,
    shadowColor: RBZ.c2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 8,
  },

  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    color: RBZ.ink,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  helper: {
    marginTop: 4,
    color: RBZ.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17,24,39,0.04)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
  },

  scroll: {
    flexGrow: 0,
  },

  scrollContent: {
    paddingTop: 14,
    paddingBottom: 6,
  },

  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(216,52,95,0.07)",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.12)",
    marginBottom: 16,
  },

  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 19,
    backgroundColor: RBZ.soft,
  },

  previewAvatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RBZ.white,
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.18)",
  },

  previewTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  previewTitle: {
    color: RBZ.ink,
    fontSize: 15,
    fontWeight: "900",
  },

  previewSubtitle: {
    marginTop: 3,
    color: RBZ.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  sectionLabel: {
    color: RBZ.ink,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10,
  },

  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: RBZ.soft,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },

  reasonChipActive: {
    backgroundColor: RBZ.c2,
    borderColor: RBZ.c2,
  },

  reasonChipText: {
    color: RBZ.ink,
    fontSize: 12,
    fontWeight: "800",
  },

  reasonChipTextActive: {
    color: RBZ.white,
  },

  input: {
    minHeight: 116,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.10)",
    backgroundColor: "#ffffff",
    color: RBZ.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  privacyNote: {
    marginTop: 10,
    color: RBZ.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(17,24,39,0.07)",
  },

  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButton: {
    backgroundColor: "rgba(17,24,39,0.04)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },

  cancelText: {
    color: RBZ.ink,
    fontSize: 14,
    fontWeight: "800",
  },

  submitButton: {
    backgroundColor: RBZ.c2,
    shadowColor: RBZ.c2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },

  submitButtonDisabled: {
    opacity: 0.55,
  },

  submitText: {
    color: RBZ.white,
    fontSize: 14,
    fontWeight: "900",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
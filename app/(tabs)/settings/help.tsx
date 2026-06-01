/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/help.tsx
 * 🎯 Purpose: Help / FAQ + Cupid chat support
 *
 * What this page does:
 *   - Shows RomBuzz FAQ
 *   - Lets user chat with Cupid Support
 *   - Cupid asks backend:
 *       POST /api/cupid-support/chat
 *   - If Cupid cannot answer:
 *       shows support ticket form
 *   - Ticket goes to:
 *       POST /api/cupid-support/tickets
 *   - Admin can view tickets at:
 *       rombuzz.com/admin/support
 * ============================================================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Card,
  RBZ,
  ScreenShell,
  SectionTitle,
} from "../../../src/components/settings/_ui";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ||
  "https://rombuzz-api-ulyk.onrender.com/api";

type ChatMessage = {
  id: string;
  from: "user" | "cupid";
  text: string;
  showTicketButton?: boolean;
  suggestions?: string[];
};

function Q({ q, a }: { q: string; a: string }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.q}>Q: {q}</Text>
      <Text style={styles.a}>A: {a}</Text>
    </View>
  );
}

async function getAuthToken() {
  const token =
    (await AsyncStorage.getItem("RBZ_TOKEN")) ||
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("authToken")) ||
    "";

  return token;
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function HelpPage() {
  const scrollRef = useRef<ScrollView | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "cupid_welcome",
      from: "cupid",
      text:
        "Hi, I’m Cupid Support. Ask me about RomBuzz login, profile, Discover, MicroBuzz, chat, video calls, gifts, reports, blocking, privacy, or account issues.",
      suggestions: [
        "I didn’t get my OTP email",
        "Google login is not working",
        "I cannot upload my photo",
        "How do I report someone?",
      ],
    },
  ]);

  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSending, setTicketSending] = useState(false);
  const [lastTicketId, setLastTicketId] = useState("");

  const canSendChat = useMemo(() => {
    return chatInput.trim().length >= 2 && !chatSending;
  }, [chatInput, chatSending]);

  const canSubmitTicket = useMemo(() => {
    return (
      ticketSubject.trim().length >= 4 &&
      ticketMessage.trim().length >= 10 &&
      !ticketSending
    );
  }, [ticketSubject, ticketMessage, ticketSending]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }

  function openTicketFromQuestion(question: string) {
    const cleanQuestion = question.trim();

    setTicketSubject(
      cleanQuestion.length > 0
        ? cleanQuestion.slice(0, 120)
        : "Cupid Support request"
    );

    setTicketMessage(cleanQuestion);
    setTicketOpen(true);
    scrollToBottom();
  }

  async function askCupidSupport(customQuestion?: string) {
    const question = String(customQuestion || chatInput || "").trim();

    if (question.length < 2) {
      Alert.alert("Ask Cupid", "Please type your question first.");
      return;
    }

    setChatInput("");
    setChatSending(true);

    const userMessage: ChatMessage = {
      id: makeId("user"),
      from: "user",
      text: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    try {
      const token = await getAuthToken();

      if (!token) {
        Alert.alert(
          "Login required",
          "Please log in again before using Cupid Support."
        );
        return;
      }

      const res = await fetch(`${API_BASE}/cupid-support/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: question,
          screen: "settings_help",
        }),
      });

      let data: any = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Cupid request failed with status ${res.status}`
        );
      }

      const cupidMessage: ChatMessage = {
        id: makeId("cupid"),
        from: "cupid",
        text:
          data?.reply ||
          "I’m not fully sure yet. You can create a Cupid Support ticket and RomBuzz admin will help.",
        showTicketButton: Boolean(data?.showTicketButton),
        suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
      };

      setMessages((prev) => [...prev, cupidMessage]);

      if (data?.showTicketButton) {
        setTicketSubject(question.slice(0, 120));
        setTicketMessage(question);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId("cupid_error"),
          from: "cupid",
          text:
            err?.message ||
            "Cupid could not answer right now. You can create a support ticket instead.",
          showTicketButton: true,
        },
      ]);

      setTicketSubject(question.slice(0, 120));
      setTicketMessage(question);
    } finally {
      setChatSending(false);
      scrollToBottom();
    }
  }

  async function submitCupidSupportTicket() {
    const cleanSubject = ticketSubject.trim();
    const cleanMessage = ticketMessage.trim();

    if (cleanSubject.length < 4) {
      Alert.alert("Subject needed", "Please write a short subject first.");
      return;
    }

    if (cleanMessage.length < 10) {
      Alert.alert(
        "Message needed",
        "Please describe the problem with a little more detail."
      );
      return;
    }

    setTicketSending(true);

    try {
      const token = await getAuthToken();

      if (!token) {
        Alert.alert(
          "Login required",
          "Please log in again before contacting Cupid Support."
        );
        return;
      }

      const res = await fetch(`${API_BASE}/cupid-support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: cleanSubject,
          message: cleanMessage,
          screen: "settings_help",
        }),
      });

      let data: any = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Support request failed with status ${res.status}`
        );
      }

      const ticketId = data?.ticket?.id || "";
      setLastTicketId(ticketId);
      setTicketSubject("");
      setTicketMessage("");
      setTicketOpen(false);

      setMessages((prev) => [
        ...prev,
        {
          id: makeId("cupid_ticket_success"),
          from: "cupid",
          text:
            data?.message ||
            "Your support ticket has been sent. RomBuzz admin will review it.",
        },
      ]);

      Alert.alert(
        "Sent to RomBuzz Support",
        data?.message ||
          "Your support ticket has been sent. RomBuzz admin will review it."
      );
    } catch (err: any) {
      Alert.alert(
        "Could not send support ticket",
        err?.message || "Something went wrong. Please try again."
      );
    } finally {
      setTicketSending(false);
      scrollToBottom();
    }
  }

  return (
    <ScreenShell title="Help">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SectionTitle>Cupid Support</SectionTitle>

          <Card>
            <View style={styles.cupidHeader}>
              <View style={styles.cupidIcon}>
                <Text style={styles.cupidIconText}>♡</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cupidTitle}>Ask Cupid</Text>
                <Text style={styles.cupidSubtitle}>
                  Cupid answers from RomBuzz help knowledge. If Cupid cannot
                  answer, you can create a support ticket for admin.
                </Text>
              </View>
            </View>

            <View style={styles.chatBox}>
              {messages.map((item) => {
                const isUser = item.from === "user";

                return (
                  <View key={item.id} style={styles.messageBlock}>
                    <View
                      style={[
                        styles.bubble,
                        isUser ? styles.userBubble : styles.cupidBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          isUser ? styles.userBubbleText : styles.cupidBubbleText,
                        ]}
                      >
                        {item.text}
                      </Text>
                    </View>

                    {!isUser && item.showTicketButton ? (
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => openTicketFromQuestion(ticketMessage || "")}
                        style={styles.ticketButton}
                      >
                        <Text style={styles.ticketButtonText}>
                          Create Support Ticket
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {!isUser && item.suggestions?.length ? (
                      <View style={styles.suggestionsWrap}>
                        {item.suggestions.slice(0, 4).map((suggestion) => (
                          <TouchableOpacity
                            key={suggestion}
                            activeOpacity={0.85}
                            disabled={chatSending}
                            onPress={() => askCupidSupport(suggestion)}
                            style={styles.suggestionChip}
                          >
                            <Text style={styles.suggestionText}>
                              {suggestion}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}

              {chatSending ? (
                <View style={styles.typingRow}>
                  <ActivityIndicator color="#E11D48" />
                  <Text style={styles.typingText}>Cupid is checking...</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.chatInputRow}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask Cupid a RomBuzz question..."
                placeholderTextColor="#9CA3AF"
                style={styles.chatInput}
                editable={!chatSending}
                returnKeyType="send"
                onSubmitEditing={() => {
                  if (canSendChat) askCupidSupport();
                }}
              />

              <TouchableOpacity
                activeOpacity={0.88}
                disabled={!canSendChat}
                onPress={() => askCupidSupport()}
                style={[
                  styles.sendButton,
                  !canSendChat ? styles.sendButtonDisabled : null,
                ]}
              >
                {chatSending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </Card>

          {ticketOpen ? (
            <>
              <SectionTitle>Support Ticket</SectionTitle>

              <Card>
                <Text style={styles.ticketTitle}>
                  Cupid could not fully answer this. Send it to RomBuzz admin.
                </Text>

                <Text style={styles.label}>Subject</Text>
                <TextInput
                  value={ticketSubject}
                  onChangeText={setTicketSubject}
                  placeholder="Example: I cannot upload my photo"
                  placeholderTextColor="#9CA3AF"
                  maxLength={180}
                  style={styles.input}
                  editable={!ticketSending}
                />

                <Text style={styles.label}>Message</Text>
                <TextInput
                  value={ticketMessage}
                  onChangeText={setTicketMessage}
                  placeholder="Tell us what happened. Add details like screen, error, or steps."
                  placeholderTextColor="#9CA3AF"
                  maxLength={2500}
                  multiline
                  textAlignVertical="top"
                  style={[styles.input, styles.messageInput]}
                  editable={!ticketSending}
                />

                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={!canSubmitTicket}
                  onPress={submitCupidSupportTicket}
                  style={[
                    styles.submitButton,
                    !canSubmitTicket ? styles.submitButtonDisabled : null,
                  ]}
                >
                  {ticketSending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      Send Ticket to Admin
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={ticketSending}
                  onPress={() => setTicketOpen(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </Card>
            </>
          ) : null}

          {lastTicketId ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                Last ticket sent: {lastTicketId}
              </Text>
            </View>
          ) : null}

          <SectionTitle>FAQ</SectionTitle>

          <Card>
            <Q
              q="I didn’t get my OTP / verification email."
              a="Check spam/junk. Confirm your email is correct. Wait a minute and tap Resend code if available."
            />
            <Q
              q="Google login isn’t working."
              a="Use the same Google account you used before. If it continues, try email login or contact support."
            />
            <Q
              q="I’m not seeing any matches or nearby users."
              a="Make sure location is on, and your filters aren’t too strict. Try expanding age/distance."
            />
            <Q
              q="MicroBuzz shows a blank page."
              a="Refresh once, allow camera/location, and ensure internet is stable. Contact support with screenshots if needed."
            />
            <Q
              q="I want to change my email or password."
              a="Go to Settings → Account or Security. If something is missing, contact support."
            />
            <Q
              q="I think my account was hacked."
              a="Change password immediately and contact support so we can investigate."
            />
          </Card>

          <SectionTitle>Safety</SectionTitle>

          <Card>
            <Text style={styles.a}>
              For user safety issues, use in-app reporting from the user profile,
              chat, post, reel, comment, or Settings → Blocking & Safety.
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 30,
  },

  q: {
    color: RBZ.text,
    fontWeight: "900",
  },

  a: {
    color: RBZ.muted,
    marginTop: 6,
    fontWeight: "700",
    lineHeight: 18,
  },

  cupidHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cupidIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#FFE4EC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDA4AF",
  },

  cupidIconText: {
    color: "#E11D48",
    fontSize: 28,
    fontWeight: "900",
    marginTop: -2,
  },

  cupidTitle: {
    color: RBZ.text,
    fontSize: 17,
    fontWeight: "900",
  },

  cupidSubtitle: {
    color: RBZ.muted,
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  chatBox: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: "#FFF7FA",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    padding: 12,
  },

  messageBlock: {
    marginBottom: 12,
  },

  bubble: {
    maxWidth: "92%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  cupidBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FBCFE8",
  },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#E11D48",
  },

  bubbleText: {
    fontWeight: "800",
    lineHeight: 19,
  },

  cupidBubbleText: {
    color: "#111827",
  },

  userBubbleText: {
    color: "#FFFFFF",
  },

  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },

  typingText: {
    color: "#9F1239",
    fontWeight: "800",
  },

  suggestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },

  suggestionChip: {
    borderRadius: 999,
    backgroundColor: "#FFE4EC",
    borderWidth: 1,
    borderColor: "#FDA4AF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  suggestionText: {
    color: "#BE123C",
    fontSize: 12,
    fontWeight: "900",
  },

  ticketButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  ticketButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  chatInputRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  chatInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FBCFE8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111827",
    fontWeight: "800",
  },

  sendButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#E11D48",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonDisabled: {
    backgroundColor: "#FDA4AF",
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  ticketTitle: {
    color: RBZ.text,
    fontWeight: "900",
    lineHeight: 19,
  },

  label: {
    color: RBZ.text,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FBCFE8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111827",
    fontWeight: "700",
  },

  messageInput: {
    minHeight: 130,
    lineHeight: 20,
  },

  submitButton: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#E11D48",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E11D48",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  submitButtonDisabled: {
    backgroundColor: "#FDA4AF",
    shadowOpacity: 0,
    elevation: 0,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  cancelButton: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FBCFE8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: "#BE123C",
    fontWeight: "900",
    fontSize: 15,
  },

  successBox: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 12,
  },

  successText: {
    color: "#047857",
    fontWeight: "900",
  },
});
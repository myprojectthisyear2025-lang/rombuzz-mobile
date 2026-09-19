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
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Card, ScreenShell, SectionTitle } from "../../../src/components/settings/_ui";

import { Ionicons } from "@expo/vector-icons";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { SettingsButton, SettingsField, SettingsNotice } from "@/src/components/settings/SettingsControls";
import { useSettingsAlert } from "@/src/components/settings/SettingsDialog";
import { createHelpStyles } from "@/src/components/settings/help.styles";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "https://rombuzz-api-ulyk.onrender.com/api";

type ChatMessage = {
  id: string;
  from: "user" | "cupid";
  text: string;
  showTicketButton?: boolean;
  suggestions?: string[];
};

function Q({ q, a }: { q: string; a: string }) {
  const { colors } = useRomBuzzTheme();
  const styles = useMemo(() => createHelpStyles(colors), [colors]);
  return (
    <View style={styles.faq}>
      <Text style={styles.q}>{q}</Text>
      <Text style={styles.a}>{a}</Text>
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
  const { colors } = useRomBuzzTheme();
  const styles = useMemo(() => createHelpStyles(colors), [colors]);
  const alert = useSettingsAlert();
  const scrollRef = useRef<ScrollView | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "cupid_welcome",
      from: "cupid",
      text: "Hi, I’m Cupid Support. Ask me about RomBuzz login, profile, Discover, MicroBuzz, chat, video calls, gifts, reports, blocking, privacy, or account issues.",
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
    return ticketSubject.trim().length >= 4 && ticketMessage.trim().length >= 10 && !ticketSending;
  }, [ticketSubject, ticketMessage, ticketSending]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }

  function openTicketFromQuestion(question: string) {
    const cleanQuestion = question.trim();

    setTicketSubject(cleanQuestion.length > 0 ? cleanQuestion.slice(0, 120) : "Cupid Support request");

    setTicketMessage(cleanQuestion);
    setTicketOpen(true);
    scrollToBottom();
  }

  async function askCupidSupport(customQuestion?: string) {
    const question = String(customQuestion || chatInput || "").trim();

    if (question.length < 2) {
      alert("Ask Cupid", "Please type your question first.");
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
        alert("Login required", "Please log in again before using Cupid Support.");
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
        throw new Error(data?.message || data?.error || `Cupid request failed with status ${res.status}`);
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
          text: err?.message || "Cupid could not answer right now. You can create a support ticket instead.",
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
      alert("Subject needed", "Please write a short subject first.");
      return;
    }

    if (cleanMessage.length < 10) {
      alert("Message needed", "Please describe the problem with a little more detail.");
      return;
    }

    setTicketSending(true);

    try {
      const token = await getAuthToken();

      if (!token) {
        alert("Login required", "Please log in again before contacting Cupid Support.");
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
        throw new Error(data?.message || data?.error || `Support request failed with status ${res.status}`);
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
          text: data?.message || "Your support ticket has been sent. RomBuzz admin will review it.",
        },
      ]);

      alert(
        "Sent to RomBuzz Support",
        data?.message || "Your support ticket has been sent. RomBuzz admin will review it.",
      );
    } catch (err: any) {
      alert("Could not send support ticket", err?.message || "Something went wrong. Please try again.");
    } finally {
      setTicketSending(false);
      scrollToBottom();
    }
  }

  return (
    <ScreenShell title="Help & Support" scrollRef={scrollRef}>
      <SectionTitle>Cupid Support</SectionTitle>

      <Card>
        <View style={styles.cupidHeader}>
          <View style={styles.cupidIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.iconMuted} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cupidTitle}>Ask Cupid</Text>
            <Text style={styles.cupidSubtitle}>
              Cupid answers from RomBuzz help knowledge. If Cupid cannot answer, you can create a support
              ticket for admin.
            </Text>
          </View>
        </View>

        <View style={styles.chatBox}>
          {messages.map((item) => {
            const isUser = item.from === "user";

            return (
              <View key={item.id} style={styles.messageBlock}>
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.cupidBubble]}>
                  <Text
                    style={[
                      styles.bubbleText,
                      isUser ? styles.userBubbleText : styles.cupidBubbleText,
                      item.id.startsWith("cupid_error") && { color: colors.danger },
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>

                {!isUser && item.showTicketButton ? (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => openTicketFromQuestion(ticketMessage || "")}
                    accessibilityRole="button"
                    style={styles.ticketButton}
                  >
                    <Text style={styles.ticketButtonText}>Create Support Ticket</Text>
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
                        accessibilityRole="button"
                        style={[styles.suggestionChip, chatSending && styles.disabled]}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}

          {chatSending ? (
            <View style={styles.typingRow}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.typingText}>Cupid is checking...</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.chatInputRow}>
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Ask Cupid a RomBuzz question..."
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.brand}
            accessibilityLabel="Ask Cupid a question"
            style={styles.chatInput}
            editable={!chatSending}
            returnKeyType="send"
            onSubmitEditing={() => {
              if (canSendChat) askCupidSupport();
            }}
          />

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSendChat, busy: chatSending }}
            activeOpacity={0.88}
            disabled={!canSendChat}
            onPress={() => askCupidSupport()}
            style={[styles.sendButton, !canSendChat ? styles.sendButtonDisabled : null]}
          >
            {chatSending ? (
              <ActivityIndicator color={colors.textSecondary} size="small" />
            ) : (
              <Text style={[styles.sendButtonText, !canSendChat && { color: colors.textSecondary }]}>
                Send
              </Text>
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

            <SettingsField
              label="Subject"
              value={ticketSubject}
              onChangeText={setTicketSubject}
              placeholder="Example: I cannot upload my photo"
              maxLength={180}
              editable={!ticketSending}
            />
            <SettingsField
              label="Message"
              value={ticketMessage}
              onChangeText={setTicketMessage}
              placeholder="Tell us what happened. Add details like screen, error, or steps."
              maxLength={2500}
              multiline
              textAlignVertical="top"
              style={styles.messageInput}
              editable={!ticketSending}
            />
            <SettingsButton
              label={ticketSending ? "Sending ticket…" : "Send ticket to admin"}
              onPress={submitCupidSupportTicket}
              busy={ticketSending}
              disabled={!canSubmitTicket}
            />
            <SettingsButton
              label="Cancel"
              variant="secondary"
              onPress={() => setTicketOpen(false)}
              disabled={ticketSending}
            />
          </Card>
        </>
      ) : null}

      {lastTicketId ? <SettingsNotice>Last ticket sent: {lastTicketId}</SettingsNotice> : null}

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
          For user safety issues, use in-app reporting from the user profile, chat, post, reel, comment, or
          Settings → Blocking & Safety.
        </Text>
      </Card>
    </ScreenShell>
  );
}

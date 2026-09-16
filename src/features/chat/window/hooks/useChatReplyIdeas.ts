import { useState } from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/src/config/api";
import type { ChatParticipants } from "./chatWindowTypes";

type ReplyIdeasArgs = ChatParticipants & { setText: (text: string) => void };
export function useChatReplyIdeas({
  myId,
  peerId,
  roomId,
  setText,
}: ReplyIdeasArgs) {
  const [replyIdeasOpen, setReplyIdeasOpen] = useState(false);
  const [replyIdeasLoading, setReplyIdeasLoading] = useState(false);
  const [replyIdeasError, setReplyIdeasError] = useState("");
  const [replyIdeas, setReplyIdeas] = useState<
    { id: string; tone: string; text: string }[]
  >([]);
  const applyReplyIdea = (ideaText: string) => {
    const next = String(ideaText || "").trim();
    if (!next) return;

    setText(next);
    setReplyIdeasOpen(false);
    setReplyIdeasError("");
  };

  const loadReplyIdeas = async (
    mode: "natural" | "flirty" | "funny" | "safe" = "natural",
  ) => {
    if (!myId || !peerId || !roomId) return;

    setReplyIdeasLoading(true);
    setReplyIdeasError("");
    setReplyIdeasOpen(true);

    try {
      const token = await SecureStore.getItemAsync("RBZ_TOKEN");

      const r = await fetch(
        `${API_BASE}/chat/rooms/${roomId}/reply-suggestions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode,
            count: 4,
          }),
        },
      );

      const j = await r.json().catch(() => ({}));

      const list = Array.isArray(j?.suggestions) ? j.suggestions : [];

      if (list.length) {
        setReplyIdeas(
          list
            .map((x: any, i: number) => ({
              id: String(x?.id || `${mode}-${i + 1}`),
              tone: String(x?.tone || mode),
              text: String(x?.text || "").trim(),
            }))
            .filter((x: any) => x.text),
        );
        return;
      }

      // fallback if backend returns nothing
      const fallbackBase =
        mode === "flirty"
          ? [
              "You’re making this conversation dangerously easy to enjoy 😌",
              "Okay, now I need the full story because I’m curious.",
              "You’re kind of fun to talk to, not gonna lie.",
              "That actually made me smile. Tell me more.",
            ]
          : mode === "safe"
            ? [
                "That’s nice. What are you up to right now?",
                "That sounds interesting. How did that happen?",
                "Haha fair enough. What made you think that?",
                "I get that. Tell me a little more.",
              ]
            : mode === "funny"
              ? [
                  "That was suspiciously smooth 😂",
                  "Okay, I didn’t expect that answer and now I’m invested.",
                  "You might actually be trouble in the best way.",
                  "That’s funny — continue immediately.",
                ]
              : [
                  "That’s actually interesting. Tell me more.",
                  "Okay, now I’m curious — what happened next?",
                  "That sounds good. What got you into that?",
                  "Haha, fair. What are you doing right now?",
                ];

      setReplyIdeas(
        fallbackBase.map((text, i) => ({
          id: `${mode}-fallback-${i + 1}`,
          tone: mode,
          text,
        })),
      );
    } catch {
      setReplyIdeasError("Could not load reply ideas.");
      setReplyIdeas([
        {
          id: `${mode}-safe-1`,
          tone: mode,
          text: "That’s interesting — tell me more.",
        },
        {
          id: `${mode}-safe-2`,
          tone: mode,
          text: "Haha fair enough. What are you up to right now?",
        },
        {
          id: `${mode}-safe-3`,
          tone: mode,
          text: "Okay now I’m curious. What happened next?",
        },
      ]);
    } finally {
      setReplyIdeasLoading(false);
    }
  };

  return {
    replyIdeasOpen,
    setReplyIdeasOpen,
    replyIdeasLoading,
    replyIdeasError,
    replyIdeas,
    loadReplyIdeas,
    applyReplyIdea,
  };
}

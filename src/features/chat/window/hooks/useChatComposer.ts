import { useState } from "react";
import { maybeDecode } from "@/src/features/chat/thread/chatPayload";
import { buildReplySnapshot } from "@/src/features/chat/thread/chatReplyUtils";
import type { Msg, ReplySnapshot } from "@/src/features/chat/thread/chatTypes";

export function useChatComposer(closeSheet: () => void) {
  const [text, setText] = useState("");
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [composerActionsOpen, setComposerActionsOpen] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);
  const [replyingTo, setReplyingTo] = useState<ReplySnapshot | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [plusOpen, setPlusOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const startReplying = (message: Msg) => {
    const snapshot = buildReplySnapshot(message);
    if (!snapshot) return;

    setEditId(null);
    setReplyingTo(snapshot);
    setComposerExpanded(true);
    setComposerActionsOpen(false);
  };
  const startEdit = (m: Msg) => {
    const dec = maybeDecode(m);
    setReplyingTo(null);
    setEditId(m.id);
    setText(String(dec?.text || ""));
    closeSheet();
  };

  return {
    text,
    setText,
    composerExpanded,
    setComposerExpanded,
    composerActionsOpen,
    setComposerActionsOpen,
    inputHeight,
    setInputHeight,
    replyingTo,
    setReplyingTo,
    editId,
    setEditId,
    plusOpen,
    setPlusOpen,
    cameraOpen,
    setCameraOpen,
    startReplying,
    startEdit,
  };
}

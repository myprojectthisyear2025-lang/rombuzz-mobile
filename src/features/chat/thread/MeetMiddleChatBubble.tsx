// src/features/chat/thread/MeetMiddleChatBubble.tsx
//
// RomBuzz Meet in the Middle chat bubble.
//
// Purpose:
// - Dedicated UI for Meet in the Middle chat messages.
// - Handles request bubbles: pending / accepted / rejected / cancelled / expired.
// - Handles milestone cards: place_proposed / place_rejected / confirmed / completed.
// - Owns its own small Meet in the Middle HTTP actions.
// - Owns its own socket update listener for this session.
// - Keeps app/chat/[peerId].tsx from getting crowded.

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { API_BASE } from "@/src/config/api";
import { getSocket } from "@/src/lib/socket";
import { maybeDecode } from "@/src/features/chat/thread/chatPayload";
import MeetMiddleFinalChatBubble from "@/src/features/chat/thread/MeetMiddleFinalChatBubble";

// ============================================================================
// Types
// ============================================================================
export type MeetMiddleBubbleStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "expired";

export type MeetMiddleMilestoneStatus =
  | "place_proposed"
  | "place_rejected"
  | "confirmed"
  | "completed";

export type MeetMiddlePlacePayload = {
  id?: string;
  name?: string;
  category?: string;
  address?: string | null;
  coords?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
  provider?: string;
  isMidpoint?: boolean;
};

export type MeetMiddleBubblePayload = {
  kind: "request";
  type: "meet_middle_request";
  sessionId: string;
  status: MeetMiddleBubbleStatus;
  fromUserId: string;
  toUserId: string;
  fromName?: string;
  toName?: string;
  fromAvatar?: string;
  toAvatar?: string;
  createdAt?: string | number;
  expiresAt?: string | number;
};

export type MeetMiddleMilestonePayload = {
  kind: "milestone";
  type: "meet_middle_milestone";
  sessionId: string;
  status: MeetMiddleMilestoneStatus;
  selectedBy?: string;
  acceptedBy?: string;
  rejectedBy?: string;
  place?: MeetMiddlePlacePayload | null;
  createdAt?: string | number;
  updatedAt?: string | number;
};

type MeetMiddlePayload =
  | MeetMiddleBubblePayload
  | MeetMiddleMilestonePayload;

type MeetMiddleChatBubbleProps = {
  message: any;
  isMine: boolean;
  myId: string;
  peerId?: string;
  peerName: string;
  peerAvatar?: string;
  onLongPress?: () => void;
};

// ============================================================================
// Constants & Helpers
// ============================================================================
const COLORS = {
  c1: "#b1123c",
  c2: "#d8345f",
  c3: "#e9486a",
  c4: "#b5179e",
  white: "#ffffff",
  ink: "#111827",
  gray: "#6b7280",
  soft: "#fff5f8",
  line: "rgba(177,18,60,0.14)",
  green: "#059669",
  red: "#dc2626",
  amber: "#d97706",
  blue: "#2563eb",
};

const PRESSED_VIEW_STYLE: ViewStyle = {
  opacity: 0.72,
  transform: [{ scale: 0.98 }],
};

function toMs(value?: string | number): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSecondsLeft(expiresAt?: string | number): number {
  const end = toMs(expiresAt);
  if (!end) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / 1000));
}

function normalizeRequestStatus(value: any): MeetMiddleBubbleStatus {
  const raw = String(value || "").trim().toLowerCase();

  if (raw === "accepted") return "accepted";
  if (raw === "rejected" || raw === "declined") return "rejected";
  if (raw === "cancelled" || raw === "canceled") return "cancelled";
  if (raw === "expired") return "expired";

  return "pending";
}

function normalizeMilestoneStatus(value: any): MeetMiddleMilestoneStatus | "" {
  const raw = String(value || "").trim().toLowerCase();

  if (raw === "place_proposed") return "place_proposed";
  if (raw === "place_rejected") return "place_rejected";
  if (raw === "confirmed") return "confirmed";
  if (raw === "completed") return "completed";

  return "";
}

function inferMilestoneStatusFromMessage(decoded: any, milestoneRaw: any): MeetMiddleMilestoneStatus | "" {
  const directType = String(decoded?.type || "").trim().toLowerCase();
  const rawStatus = normalizeMilestoneStatus(milestoneRaw?.status || decoded?.status);

  if (rawStatus) return rawStatus;

  const text = String(decoded?.text || "").trim().toLowerCase();
  const hasMeetMiddlePayload = !!milestoneRaw?.sessionId || !!decoded?.sessionId;
  const hasPlace =
    !!milestoneRaw?.place ||
    !!decoded?.place ||
    !!milestoneRaw?.place?.name ||
    !!decoded?.place?.name;

  if (text.includes("meetup confirmed") || text.includes("you both agreed to meet")) {
    return "confirmed";
  }

  if (text.includes("was picked as a meetup spot") || text.includes("waiting for confirmation")) {
    return "place_proposed";
  }

  if (text.includes("pick another") || text.includes("not confirmed")) {
    return "place_rejected";
  }

  // Backward compatibility for older persisted final meetup messages.
  if (directType === "meetup" && hasMeetMiddlePayload && hasPlace) {
    return "confirmed";
  }

  return "";
}

function normalizePlace(place: any): MeetMiddlePlacePayload | null {
  if (!place || typeof place !== "object") return null;

  const lat = Number(place?.coords?.lat);
  const lng = Number(place?.coords?.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  return {
    id: String(place?.id || ""),
    name: String(place?.name || "Selected place").trim() || "Selected place",
    category: String(place?.category || "Place").trim() || "Place",
    address: place?.address ? String(place.address).trim() : null,
    coords: hasCoords ? { lat, lng } : null,
    provider: String(place?.provider || ""),
    isMidpoint: !!place?.isMidpoint,
  };
}

function extractPlaceNameFromText(textValue: any, status: MeetMiddleMilestoneStatus): string {
  const text = String(textValue || "").replace(/\s+/g, " ").trim();
  if (!text) return "Selected place";

  if (status === "confirmed") {
    const match = text.match(/meet at\s+(.+?)(?:\.\s*Type:|\.\s*Address:|$)/i);
    return match?.[1]?.trim() || "Selected place";
  }

  if (status === "place_proposed") {
    const match = text.match(/^(.+?)\s+was picked as a meetup spot/i);
    return match?.[1]?.trim() || "Selected place";
  }

  return "Selected place";
}

function extractLegacyMeetLine(textValue: any, label: string): string {
  const text = String(textValue || "");
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escapedLabel}:\\s*([^\\n]+)`, "i"));
  return match?.[1]?.replace(/\s+/g, " ").trim() || "";
}

function extractLegacyDirectionsCoords(textValue: any): { lat: number; lng: number } | null {
  const text = String(textValue || "");
  const match = text.match(/query=([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/i);

  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function extractLegacyMeetPlaceFromText(
  textValue: any,
  status: MeetMiddleMilestoneStatus
): MeetMiddlePlacePayload {
  return {
    id: "",
    name: extractPlaceNameFromText(textValue, status),
    category: extractLegacyMeetLine(textValue, "Type") || "Place",
    address: extractLegacyMeetLine(textValue, "Address") || null,
    coords: extractLegacyDirectionsCoords(textValue),
    provider: "legacy_chat_text",
    isMidpoint: false,
  };
}

function getDirectionsUrl(place?: MeetMiddlePlacePayload | null): string {
  const lat = Number(place?.coords?.lat);
  const lng = Number(place?.coords?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";

  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

async function openDirections(place?: MeetMiddlePlacePayload | null) {
  const lat = Number(place?.coords?.lat);
  const lng = Number(place?.coords?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Directions are not available for this meetup location.");
  }

  const placeName = encodeURIComponent(String(place?.name || "Meetup spot"));

  const iosUrl = `http://maps.apple.com/?ll=${lat},${lng}&q=${placeName}`;
  const androidUrl = `geo:${lat},${lng}?q=${lat},${lng}(${placeName})`;
  const fallbackUrl = getDirectionsUrl(place);

  const primaryUrl = Platform.OS === "ios" ? iosUrl : androidUrl;

  const canOpenPrimary = await Linking.canOpenURL(primaryUrl).catch(() => false);

  if (canOpenPrimary) {
    await Linking.openURL(primaryUrl);
    return;
  }

  if (!fallbackUrl) {
    throw new Error("Directions are not available for this meetup location.");
  }

  await Linking.openURL(fallbackUrl);
}

function getPeerIdFromRequestPayload(payload: MeetMiddleBubblePayload, myId: string): string {
  const from = String(payload.fromUserId || "");
  const to = String(payload.toUserId || "");
  const me = String(myId || "");

  if (from && from !== me) return from;
  if (to && to !== me) return to;

  return "";
}

function getPeerIdFromMessage({
  message,
  myId,
  fallbackPeerId,
}: {
  message: any;
  myId: string;
  fallbackPeerId?: string;
}): string {
  const decoded = maybeDecode(message as any);

  const from = String(decoded?.from || message?.from || "").trim();
  const to = String(decoded?.to || message?.to || "").trim();
  const me = String(myId || "").trim();

  if (from && from !== me) return from;
  if (to && to !== me) return to;

  return String(fallbackPeerId || "").trim();
}

function getRequestStatusCopy(
  status: MeetMiddleBubbleStatus,
  isMine: boolean,
  peerName: string
): string {
  if (status === "accepted") {
    return isMine
      ? `${peerName} accepted your Meet in the Middle request.`
      : "You accepted the Meet in the Middle request.";
  }

  if (status === "rejected") {
    return isMine
      ? `${peerName} rejected your Meet in the Middle request.`
      : "You rejected the Meet in the Middle request.";
  }

  if (status === "cancelled") {
    return isMine
      ? "You cancelled this Meet in the Middle request."
      : `${peerName} cancelled the Meet in the Middle request.`;
  }

  if (status === "expired") {
    return "This Meet in the Middle request expired.";
  }

  return isMine
    ? `Waiting for ${peerName} to accept.`
    : `${peerName} wants to find a halfway spot with you.`;
}

function requestStatusIcon(status: MeetMiddleBubbleStatus): string {
  if (status === "accepted") return "checkmark-circle";
  if (status === "rejected") return "close-circle";
  if (status === "cancelled") return "ban";
  if (status === "expired") return "time";
  return "heart";
}

function requestStatusColor(status: MeetMiddleBubbleStatus): string {
  if (status === "accepted") return COLORS.green;
  if (status === "rejected") return COLORS.red;
  if (status === "cancelled") return COLORS.amber;
  if (status === "expired") return COLORS.gray;
  return COLORS.c2;
}

function getMilestoneTitle(status: MeetMiddleMilestoneStatus, place?: MeetMiddlePlacePayload | null): string {
  if (status === "place_proposed") return "Meetup spot picked";
  if (status === "place_rejected") return "Pick another spot";
  if (status === "completed") return "Meetup completed";
  return "Meetup confirmed";
}

function getMilestoneCopy({
  status,
  place,
  isResponder,
  peerName,
}: {
  status: MeetMiddleMilestoneStatus;
  place?: MeetMiddlePlacePayload | null;
  isResponder: boolean;
  peerName: string;
}): string {
  const placeName = place?.isMidpoint
    ? "the private midpoint"
    : place?.name || "this spot";

  if (status === "place_proposed") {
    return isResponder
      ? `${peerName} picked ${placeName}. Confirm this spot or pick another.`
      : `Waiting for ${peerName} to confirm ${placeName}.`;
  }

  if (status === "place_rejected") {
    return `${peerName} wants to pick another meetup spot.`;
  }

  if (status === "completed") {
    return "This meetup was marked as completed.";
  }

  return `Meetup confirmed at ${placeName}.`;
}

function milestoneIcon(status: MeetMiddleMilestoneStatus): string {
  if (status === "confirmed") return "navigate-circle";
  if (status === "place_rejected") return "refresh-circle";
  if (status === "completed") return "checkmark-done-circle";
  return "location";
}

function milestoneAccent(status: MeetMiddleMilestoneStatus): string {
  if (status === "confirmed") return COLORS.green;
  if (status === "place_rejected") return COLORS.amber;
  if (status === "completed") return COLORS.blue;
  return COLORS.c2;
}

function getPlaceDirectionsQuery(place?: MeetMiddlePlacePayload | null) {
  const safePlace = place || null;

  const query = [
    safePlace?.name,
    safePlace?.address,
    safePlace?.category,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return query || "meetup spot";
}

function openMeetMiddleScreen({
  sessionId,
  peerName,
  peerAvatar,
  peerId,
  stage,
}: {
  sessionId: string;
  peerName: string;
  peerAvatar?: string;
  peerId: string;
  stage: string;
}) {
  router.push({
    pathname: "/meet-middle/[peerId]" as any,
    params: {
      peerId,
      name: peerName,
      avatar: peerAvatar || "",
      sessionId,
      stage,
      source: "chat-bubble",
    },
  });
}

// ============================================================================
// API Helpers
// ============================================================================

async function postMeetMiddleRequestAction(
  sessionId: string,
  action: "accept" | "decline" | "cancel"
) {
  const safeSessionId = String(sessionId || "").trim();

  if (!safeSessionId) {
    throw new Error("Meet request is missing session id.");
  }

  const token = await SecureStore.getItemAsync("RBZ_TOKEN");

  if (!token) {
    throw new Error("Please log in again.");
  }

  const endpoint =
    action === "accept"
      ? `${API_BASE}/meet-middle/${safeSessionId}/accept`
      : action === "decline"
        ? `${API_BASE}/meet-middle/${safeSessionId}/decline`
        : `${API_BASE}/meet-middle/${safeSessionId}/cancel`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: action === "decline" ? JSON.stringify({ reason: "rejected" }) : "{}",
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || "Could not update this meet request.");
  }

  return json;
}

async function postMeetMiddlePlaceAction(sessionId: string, action: "accept" | "reject") {
  const safeSessionId = String(sessionId || "").trim();

  if (!safeSessionId) {
    throw new Error("Meet session is missing session id.");
  }

  const token = await SecureStore.getItemAsync("RBZ_TOKEN");

  if (!token) {
    throw new Error("Please log in again.");
  }

  const endpoint =
    action === "accept"
      ? `${API_BASE}/meet-middle/${safeSessionId}/place/accept`
      : `${API_BASE}/meet-middle/${safeSessionId}/place/reject`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: "{}",
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || "Could not update this meetup spot.");
  }

  return json;
}

// ============================================================================
// Payload Extraction (Public API)
// ============================================================================

export function getMeetMiddleBubblePayload(message: any): MeetMiddlePayload | null {
  const decoded = maybeDecode(message as any);

  const requestRaw = decoded?.meetMiddleRequest || null;
  const milestoneRaw = decoded?.meetMiddle || null;

  const directType = String(decoded?.type || "").trim();
  const requestType = String(requestRaw?.type || "").trim();
  const milestoneType = String(milestoneRaw?.type || "").trim();

  const milestoneStatus = inferMilestoneStatusFromMessage(decoded, milestoneRaw);

  const isMilestone =
    directType === "meetup" ||
    milestoneType === "meet_middle_milestone" ||
    !!milestoneStatus;

   if (isMilestone) {
    const rawSessionId = String(
      milestoneRaw?.sessionId ||
        requestRaw?.sessionId ||
        decoded?.sessionId ||
        ""
    ).trim();

    const legacyMessageId = String(decoded?.id || message?.id || "").trim();
    const sessionId =
      rawSessionId ||
      (milestoneStatus === "confirmed" && legacyMessageId
        ? `legacy:${legacyMessageId}`
        : "");

    if (!sessionId || !milestoneStatus) return null;

    return {
      kind: "milestone",
      type: "meet_middle_milestone",
      sessionId,
      status: milestoneStatus,
      selectedBy: String(milestoneRaw?.selectedBy || decoded?.selectedBy || ""),
      acceptedBy: String(milestoneRaw?.acceptedBy || decoded?.acceptedBy || ""),
      rejectedBy: String(milestoneRaw?.rejectedBy || decoded?.rejectedBy || ""),
      place: normalizePlace(
        milestoneRaw?.place ||
          decoded?.place ||
          (milestoneStatus
            ? extractLegacyMeetPlaceFromText(decoded?.text, milestoneStatus)
            : null)
      ),
      createdAt: milestoneRaw?.createdAt || decoded?.createdAt || decoded?.time,
      updatedAt: milestoneRaw?.updatedAt || decoded?.updatedAt,
    };
  }

  const isRequest =
    directType === "meet_middle_request" ||
    requestType === "meet_middle_request" ||
    !!requestRaw?.fromUserId ||
    !!requestRaw?.toUserId;

  if (isRequest) {
    const sessionId = String(
      requestRaw?.sessionId ||
        decoded?.sessionId ||
        ""
    ).trim();

    if (!sessionId) return null;

    return {
      kind: "request",
      type: "meet_middle_request",
      sessionId,
      status: normalizeRequestStatus(requestRaw?.status || decoded?.status),
      fromUserId: String(requestRaw?.fromUserId || decoded?.fromUserId || decoded?.from || ""),
      toUserId: String(requestRaw?.toUserId || decoded?.toUserId || decoded?.to || ""),
      fromName: String(requestRaw?.fromName || decoded?.fromName || ""),
      toName: String(requestRaw?.toName || decoded?.toName || ""),
      fromAvatar: String(requestRaw?.fromAvatar || decoded?.fromAvatar || ""),
      toAvatar: String(requestRaw?.toAvatar || decoded?.toAvatar || ""),
      createdAt: requestRaw?.createdAt || decoded?.createdAt || decoded?.time,
      expiresAt: requestRaw?.expiresAt || decoded?.expiresAt,
    };
  }

  return null;
}

export function isMeetMiddleChatMessage(message: any): boolean {
  return !!getMeetMiddleBubblePayload(message);
}

function getMeetMiddlePayloadPriority(payload: MeetMiddlePayload): number {
  if (payload.kind === "milestone") {
    if (payload.status === "confirmed") return 600;
    if (payload.status === "completed") return 550;
    if (payload.status === "place_proposed") return 500;
    if (payload.status === "place_rejected") return 450;
    return 400;
  }

  if (payload.status === "accepted") return 300;
  if (payload.status === "pending") return 250;
  if (payload.status === "rejected") return 200;
  if (payload.status === "cancelled") return 150;
  if (payload.status === "expired") return 100;

  return 0;
}

export function collapseMeetMiddleChatMessages<T extends { id?: string }>(messages: T[]): T[] {
  const bestBySession = new Map<
    string,
    { index: number; message: T; priority: number; time: number }
  >();

  messages.forEach((message, index) => {
    const payload = getMeetMiddleBubblePayload(message);
    if (!payload?.sessionId) return;

    const time = toMs((message as any)?.updatedAt || (message as any)?.createdAt || (message as any)?.time) || index;
    const priority = getMeetMiddlePayloadPriority(payload);
    const current = bestBySession.get(payload.sessionId);

    if (!current || priority > current.priority || (priority === current.priority && time >= current.time)) {
      bestBySession.set(payload.sessionId, {
        index: current?.index ?? index,
        message,
        priority,
        time,
      });
    }
  });

  const emittedSessions = new Set<string>();

  return messages.reduce<T[]>((acc, message) => {
    const payload = getMeetMiddleBubblePayload(message);

    if (!payload?.sessionId) {
      acc.push(message);
      return acc;
    }

    if (emittedSessions.has(payload.sessionId)) {
      return acc;
    }

    emittedSessions.add(payload.sessionId);
    acc.push(bestBySession.get(payload.sessionId)?.message || message);
    return acc;
  }, []);
}

function getMeetMiddleMessageFromEvent(eventPayload: any) {
  return (
    eventPayload?.message ||
    eventPayload?.chatMessage ||
    eventPayload?.data?.message ||
    eventPayload?.data?.chatMessage ||
    eventPayload
  );
}

function getMeetMiddlePayloadFromEvent(eventPayload: any): MeetMiddlePayload | null {
  const eventMessage = getMeetMiddleMessageFromEvent(eventPayload);
  const decodedPayload = getMeetMiddleBubblePayload(eventMessage);

  if (decodedPayload) return decodedPayload;

  const session = eventPayload?.session || eventPayload?.data?.session || null;
  const sessionId = String(
    eventPayload?.sessionId ||
      session?.sessionId ||
      eventPayload?.data?.sessionId ||
      ""
  ).trim();

  if (!sessionId) return null;

  const milestoneStatus = normalizeMilestoneStatus(
    eventPayload?.status ||
      session?.status ||
      eventPayload?.data?.status
  );

  if (milestoneStatus) {
    return {
      kind: "milestone",
      type: "meet_middle_milestone",
      sessionId,
      status: milestoneStatus,
      selectedBy: String(session?.selectedBy || eventPayload?.selectedBy || ""),
      acceptedBy: String(session?.confirmedBy || eventPayload?.acceptedBy || ""),
      rejectedBy: String(eventPayload?.rejectedBy || ""),
      place: normalizePlace(
        eventPayload?.place ||
          eventPayload?.selectedPlace ||
          session?.selectedPlace ||
          null
      ),
      createdAt: eventPayload?.createdAt || session?.createdAt,
      updatedAt: eventPayload?.updatedAt,
    };
  }

  return {
    kind: "request",
    type: "meet_middle_request",
    sessionId,
    status: normalizeRequestStatus(
      eventPayload?.status ||
        session?.status ||
        eventPayload?.data?.status
    ),
    fromUserId: String(
      eventPayload?.fromUserId ||
        session?.requestedBy ||
        session?.fromUserId ||
        ""
    ),
    toUserId: String(
      eventPayload?.toUserId ||
        session?.peerId ||
        session?.toUserId ||
        ""
    ),
    fromName: "",
    toName: "",
    fromAvatar: "",
    toAvatar: "",
    createdAt: eventPayload?.createdAt || session?.createdAt,
    expiresAt: eventPayload?.expiresAt || session?.expiresAt,
  };
}

// ============================================================================
// Main Component
// ============================================================================

export default function MeetMiddleChatBubble({
  message,
  isMine,
  myId,
  peerId,
  peerName,
  peerAvatar,
  onLongPress,
}: MeetMiddleChatBubbleProps) {
  const initialPayload = useMemo(() => getMeetMiddleBubblePayload(message), [message]);

  const safePeerId = useMemo(
    () =>
      getPeerIdFromMessage({
        message,
        myId,
        fallbackPeerId: peerId,
      }),
    [message, myId, peerId]
  );
  const [payload, setPayload] = useState<MeetMiddlePayload | null>(initialPayload);
  const [busyAction, setBusyAction] = useState<
    "" | "accept" | "decline" | "cancel" | "acceptSpot" | "rejectSpot"
  >("");
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return initialPayload?.kind === "request"
      ? getSecondsLeft(initialPayload.expiresAt)
      : 0;
  });

  useEffect(() => {
    setPayload(initialPayload);
    setSecondsLeft(
      initialPayload?.kind === "request"
        ? getSecondsLeft(initialPayload.expiresAt)
        : 0
    );
  }, [initialPayload]);

  const sessionId = String(payload?.sessionId || "");

  // Socket listener for real-time updates
  useEffect(() => {
    if (!sessionId) return;

    let mounted = true;
    let socket: any = null;

    const onMeetMiddleUpdate = (eventPayload: any) => {
      const updatedPayload = getMeetMiddlePayloadFromEvent(eventPayload);

      if (!updatedPayload) return;
      if (String(updatedPayload.sessionId) !== String(sessionId)) return;
      if (!mounted) return;

      setPayload((prev) => {
        if (!prev || prev.kind !== updatedPayload.kind) {
          return updatedPayload;
        }

        if (updatedPayload.kind === "request" && prev.kind === "request") {
          return {
            ...prev,
            ...updatedPayload,
            fromName: updatedPayload.fromName || prev.fromName || "",
            toName: updatedPayload.toName || prev.toName || "",
            fromAvatar: updatedPayload.fromAvatar || prev.fromAvatar || "",
            toAvatar: updatedPayload.toAvatar || prev.toAvatar || "",
            fromUserId: updatedPayload.fromUserId || prev.fromUserId || "",
            toUserId: updatedPayload.toUserId || prev.toUserId || "",
            expiresAt: updatedPayload.expiresAt || prev.expiresAt,
          };
        }

        if (updatedPayload.kind === "milestone" && prev.kind === "milestone") {
          return {
            ...prev,
            ...updatedPayload,
            place: updatedPayload.place || prev.place || null,
          };
        }

        return updatedPayload;
      });

      if (updatedPayload.kind === "request") {
        setSecondsLeft(getSecondsLeft(updatedPayload.expiresAt));
      }
    };

    (async () => {
      try {
        socket = await getSocket();
        if (!mounted || !socket) return;

        socket.on("chat:meetMiddle:update", onMeetMiddleUpdate);
        socket.on("meetMiddle:accepted", onMeetMiddleUpdate);
        socket.on("meetMiddle:declined", onMeetMiddleUpdate);
        socket.on("meetMiddle:cancelled", onMeetMiddleUpdate);
        socket.on("meetMiddle:expired", onMeetMiddleUpdate);
        socket.on("meetMiddle:place:selected", onMeetMiddleUpdate);
        socket.on("meetMiddle:place:confirmation-needed", onMeetMiddleUpdate);
        socket.on("meetMiddle:place:rejected", onMeetMiddleUpdate);
        socket.on("meetMiddle:final-confirmed", onMeetMiddleUpdate);
      } catch {}
    })();

    return () => {
      mounted = false;

      if (!socket) return;

      socket.off("chat:meetMiddle:update", onMeetMiddleUpdate);
      socket.off("meetMiddle:accepted", onMeetMiddleUpdate);
      socket.off("meetMiddle:declined", onMeetMiddleUpdate);
      socket.off("meetMiddle:cancelled", onMeetMiddleUpdate);
      socket.off("meetMiddle:expired", onMeetMiddleUpdate);
      socket.off("meetMiddle:place:selected", onMeetMiddleUpdate);
      socket.off("meetMiddle:place:confirmation-needed", onMeetMiddleUpdate);
      socket.off("meetMiddle:place:rejected", onMeetMiddleUpdate);
      socket.off("meetMiddle:final-confirmed", onMeetMiddleUpdate);
    };
  }, [sessionId]);

  // Countdown timer for pending requests
  useEffect(() => {
    if (payload?.kind !== "request") return;

    const pending = payload.status === "pending";
    if (!pending) return;

    setSecondsLeft(getSecondsLeft(payload.expiresAt));

    const timer = setInterval(() => {
      const next = getSecondsLeft(payload.expiresAt);
      setSecondsLeft(next);

      if (next <= 0 && sessionId) {
        clearInterval(timer);
        setPayload((prev) =>
          prev?.kind === "request"
            ? {
                ...prev,
                status: "expired",
              }
            : prev
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [payload, sessionId]);

  const runRequestAction = async (action: "accept" | "decline" | "cancel") => {
    if (!sessionId || busyAction || payload?.kind !== "request") return;

    setBusyAction(action);

    try {
      const json = await postMeetMiddleRequestAction(sessionId, action);
      const updatedPayload = getMeetMiddlePayloadFromEvent(json);

      if (updatedPayload) {
        setPayload(updatedPayload);
      } else {
        setPayload((prev) =>
          prev?.kind === "request"
            ? {
                ...prev,
                status:
                  action === "accept"
                    ? "accepted"
                    : action === "decline"
                      ? "rejected"
                      : "cancelled",
              }
            : prev
        );
      }

      if (action === "accept") {
        const targetPeerId = getPeerIdFromRequestPayload(payload as MeetMiddleBubblePayload, myId);

        openMeetMiddleScreen({
          sessionId,
          peerName,
          peerAvatar,
          peerId: targetPeerId,
          stage: "location-consent",
        });
      }
    } catch (err: any) {
      Alert.alert(
        "Meet in the Middle",
        err?.message || "Could not update this meet request."
      );
    } finally {
      setBusyAction("");
    }
  };

  const runPlaceAction = async (action: "accept" | "reject") => {
    if (!sessionId || busyAction || payload?.kind !== "milestone") return;

    setBusyAction(action === "accept" ? "acceptSpot" : "rejectSpot");

    try {
      const json = await postMeetMiddlePlaceAction(sessionId, action);
      const updatedPayload = getMeetMiddlePayloadFromEvent(json);

      if (updatedPayload) {
        setPayload(updatedPayload);
      }

        if (action === "reject") {
        openMeetMiddleScreen({
          sessionId,
          peerName,
          peerAvatar,
          peerId: safePeerId,
          stage: "map-stage",
        });
      }
    } catch (err: any) {
      Alert.alert(
        "Meet in the Middle",
        err?.message || "Could not update this meetup spot."
      );
    } finally {
      setBusyAction("");
    }
  };

  if (!payload) return null;

  // --------------------------------------------------------------------------
  // Milestone (Meetup spot) UI
  // --------------------------------------------------------------------------
   if (payload.kind === "milestone") {
    const place = payload.place || null;
    const selectedByMe = String(payload.selectedBy || "") === String(myId);
    const isResponder = payload.status === "place_proposed" && !selectedByMe;
    const accent = milestoneAccent(payload.status);
    const title = getMilestoneTitle(payload.status, place);
       const copy = getMilestoneCopy({
      status: payload.status,
      place,
      isResponder,
      peerName,
    });
    const peerIdFromMessage = safePeerId;

    if (payload.status === "confirmed") {
      return (
        <MeetMiddleFinalChatBubble
          place={place}
          peerName={peerName}
          isMine={isMine}
          onLongPress={onLongPress}
        />
      );
    }

    return (
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={260}
        style={[
          styles.outer,
          isMine ? styles.outerMine : styles.outerPeer,
        ]}
      >
             <View
          style={[
            styles.card,
            isMine ? styles.cardMine : styles.cardPeer,
          ]}
        >
          <View style={styles.topRow}>
            <LinearGradient
              colors={[COLORS.c2, COLORS.c4]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <Ionicons name={milestoneIcon(payload.status) as any} size={22} color={COLORS.white} />
            </LinearGradient>

            <View style={styles.titleWrap}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.statusLine}>
                <Ionicons name="sparkles" size={13} color={accent} />
                <Text style={[styles.statusText, { color: accent }]}>
                  {payload.status === "place_rejected"
                    ? "Pick another"
                    : payload.status === "completed"
                      ? "Completed"
                      : "Waiting for confirmation"}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.bodyText}>{copy}</Text>

          {place?.name ? (
            <View style={styles.placeBox}>
              <View style={styles.placeIconWrap}>
                <Ionicons name="business" size={16} color={COLORS.c2} />
              </View>

              <View style={styles.placeTextWrap}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeMeta} numberOfLines={2}>
                  {[place.category, place.address].filter(Boolean).join(" • ") || "Meetup spot"}
                </Text>
              </View>
            </View>
          ) : null}

          {isResponder ? (
            <View style={styles.receiverActions}>
              <Pressable
                onPress={() => runPlaceAction("reject")}
                disabled={!!busyAction}
                style={({ pressed }) => [
                  styles.rejectButton,
                  pressed ? PRESSED_VIEW_STYLE : null,
                  !!busyAction && styles.disabled,
                ]}
              >
                <Ionicons name="refresh" size={17} color={COLORS.red} />
                <Text style={styles.rejectButtonText}>
                  {busyAction === "rejectSpot" ? "Opening..." : "Pick another"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => runPlaceAction("accept")}
                disabled={!!busyAction}
                style={({ pressed }) => [
                  styles.acceptButton,
                  pressed ? PRESSED_VIEW_STYLE : null,
                  !!busyAction && styles.disabled,
                ]}
              >
                <Ionicons name="checkmark" size={17} color={COLORS.white} />
                <Text style={styles.acceptButtonText}>
                  {busyAction === "acceptSpot" ? "Accepting..." : "Accept spot"}
                </Text>
              </Pressable>
            </View>
          ) : null}

               {payload.status === "place_rejected" ? (
            <Pressable
              onPress={() =>
                openMeetMiddleScreen({
                  sessionId,
                  peerName,
                  peerAvatar,
                  peerId: peerIdFromMessage,
                  stage: "map-stage",
                })
              }
              style={({ pressed }) => [
                styles.openButton,
                pressed ? PRESSED_VIEW_STYLE : null,
              ]}
            >
              <Ionicons name="map" size={17} color={COLORS.white} />
              <Text style={styles.openButtonText}>Pick another spot</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  }

  // --------------------------------------------------------------------------
  // Request UI
  // --------------------------------------------------------------------------
  const status = payload.status || "pending";
  const pending = status === "pending";
  const copy = getRequestStatusCopy(status, isMine, peerName);
  const iconName = requestStatusIcon(status);
  const accent = requestStatusColor(status);

  const showSenderActions = pending && isMine;
  const showReceiverActions = pending && !isMine;

  const avatarUri = isMine
    ? payload.toAvatar || peerAvatar || ""
    : payload.fromAvatar || peerAvatar || "";

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={260}
      style={[
        styles.outer,
        isMine ? styles.outerMine : styles.outerPeer,
      ]}
    >
      <View
        style={[
          styles.card,
          isMine ? styles.cardMine : styles.cardPeer,
        ]}
      >
        <View style={styles.topRow}>
          <LinearGradient
            colors={[COLORS.c2, COLORS.c4]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <View style={styles.peopleRow}>
              <Ionicons name="person" size={13} color={COLORS.white} />
              <View style={styles.centerDot}>
                <Ionicons name="heart" size={9} color={COLORS.c2} />
              </View>
              <Ionicons name="person" size={13} color={COLORS.white} />
            </View>
          </LinearGradient>

          <View style={styles.titleWrap}>
            <Text style={styles.title}>Meet in the Middle</Text>
            <View style={styles.statusLine}>
              <Ionicons name={iconName as any} size={13} color={accent} />
              <Text style={[styles.statusText, { color: accent }]}>
                {pending ? "Request pending" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          </View>

          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={16} color={COLORS.c2} />
            </View>
          )}
        </View>

        <Text style={styles.bodyText}>{copy}</Text>

        {pending ? (
          <View style={styles.timerPill}>
            <Ionicons name="timer-outline" size={14} color={COLORS.c1} />
            <Text style={styles.timerText}>
              Expires in {secondsLeft}s
            </Text>
          </View>
        ) : null}

        {showSenderActions ? (
          <Pressable
            onPress={() => runRequestAction("cancel")}
            disabled={!!busyAction}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed ? PRESSED_VIEW_STYLE : null,
              !!busyAction && styles.disabled,
            ]}
          >
            <Ionicons name="close-circle" size={17} color={COLORS.red} />
            <Text style={styles.cancelButtonText}>
              {busyAction === "cancel" ? "Cancelling..." : "Cancel request"}
            </Text>
          </Pressable>
        ) : null}

        {showReceiverActions ? (
          <View style={styles.receiverActions}>
            <Pressable
              onPress={() => runRequestAction("decline")}
              disabled={!!busyAction}
              style={({ pressed }) => [
                styles.rejectButton,
                pressed ? PRESSED_VIEW_STYLE : null,
                !!busyAction && styles.disabled,
              ]}
            >
              <Ionicons name="close" size={17} color={COLORS.red} />
              <Text style={styles.rejectButtonText}>
                {busyAction === "decline" ? "Rejecting..." : "Reject"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => runRequestAction("accept")}
              disabled={!!busyAction}
              style={({ pressed }) => [
                styles.acceptButton,
                pressed ? PRESSED_VIEW_STYLE : null,
                !!busyAction && styles.disabled,
              ]}
            >
              <Ionicons name="checkmark" size={17} color={COLORS.white} />
              <Text style={styles.acceptButtonText}>
                {busyAction === "accept" ? "Accepting..." : "Accept"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  outer: {
    maxWidth: "82%",
    marginVertical: 4,
  },
  outerMine: {
    alignSelf: "flex-end",
  },
  outerPeer: {
    alignSelf: "flex-start",
  },
  card: {
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#b1123c",
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  confirmedCard: {
    borderColor: "rgba(5,150,105,0.24)",
    backgroundColor: "#F0FDF4",
  },
  cardMine: {
    backgroundColor: "#FFF7FA",
    borderColor: "rgba(216,52,95,0.18)",
  },
  cardPeer: {
    backgroundColor: COLORS.white,
    borderColor: "rgba(177,18,60,0.14)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  peopleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  centerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: 10,
  },
  title: {
    color: COLORS.ink,
    fontSize: 14.5,
    fontWeight: "900",
  },
  statusLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: "900",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f3f4f6",
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF0F6",
    alignItems: "center",
    justifyContent: "center",
  },
  bodyText: {
    color: "#5b2536",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 10,
  },
  placeBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.10)",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  placeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF0F6",
    alignItems: "center",
    justifyContent: "center",
  },
  placeTextWrap: {
    flex: 1,
  },
  placeName: {
    color: COLORS.ink,
    fontSize: 13.5,
    fontWeight: "900",
  },
  placeMeta: {
    color: COLORS.gray,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  timerPill: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFF0F6",
    borderWidth: 1,
    borderColor: "rgba(216,52,95,0.14)",
  },
  timerText: {
    color: COLORS.c1,
    fontSize: 12,
    fontWeight: "900",
  },
  cancelButton: {
    marginTop: 12,
    minHeight: 40,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cancelButtonText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: "900",
  },
  receiverActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 9,
  },
  rejectButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rejectButtonText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: "900",
  },
  acceptButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: COLORS.c2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },
  openButton: {
    marginTop: 12,
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: COLORS.c2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  directionsButton: {
    backgroundColor: COLORS.green,
  },
  openButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.65,
  },
}) as Record<string, any>;
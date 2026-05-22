/**
 * ============================================================
 * 📁 Location: src/api/gifts.ts
 * 🎁 Purpose: API client for the modular RomBuzz Gifts + BuzzCoin system.
 *
 * Used by:
 *  - src/hooks/gifts/useGiftCatalog.ts
 *  - src/hooks/gifts/useBuzzCoinWallet.ts
 *  - src/hooks/gifts/useSendGift.ts
 *  - src/hooks/gifts/useGiftSummary.ts
 *
 * What this file does:
 *  - Reads the saved RomBuzz auth token from SecureStore.
 *  - Calls the live backend gift routes:
 *      GET  /api/gifts/catalog
 *      GET  /api/gifts/wallet
 *      GET  /api/gifts/ledger
 *      GET  /api/gifts/summary
 *      GET  /api/gifts/transactions
 *      POST /api/gifts/send
 *  - Never sends trusted price to backend.
 *
 * Important:
 *  - The backend is the source of truth for gift price and validation.
 *  - Frontend sends giftId, placement, targetType, targetId, and receiverId only.
 * ============================================================
 */

import * as SecureStore from "expo-secure-store";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "https://rombuzz-api-ulyk.onrender.com";

export type GiftPlacement =
  | "reels"
  | "posts"
  | "profile_media"
  | "chat"
  | "buzzpoke"
  | "microbuzz"
  | "match_celebration"
  | "streak"
  | "universal";

export type GiftTransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded";

export type BackendGiftConfig = {
  giftId: string;
  priceBC: number;
  category: string;
  rarity: string;
  animated: boolean;
  enabled: boolean;
  premiumOnly: boolean;
  seasonalOnly: boolean;
  allowedPlacements: GiftPlacement[];
};

export type BuzzCoinWallet = {
  userId: string;
  balanceBC: number;
  pendingBC: number;
  earnedBC: number;
  locked: boolean;
  lockReason: string;
  updatedAt?: string;
};

export type GiftSummaryGiftItem = {
  giftId: string;
  count: number;
  totalBC: number;
  lastGiftAt?: string;
};

export type GiftSummaryRecentGift = {
  giftId: string;
  transactionId?: string;
  priceBC?: number;
  sentAt?: string;
};

export type GiftSummaryUser = {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
};

export type GiftSummaryViewerRole = "owner" | "gifter" | "viewer";

export type GiftSummaryRow = {
  senderId: string;
  user?: GiftSummaryUser | null;
  totalCount: number;
  totalBC: number;
  lastGiftAt?: string;
  gifts: GiftSummaryGiftItem[];
  recentGifts?: GiftSummaryRecentGift[];
};

export type GiftSummaryResponse = {
  ok: boolean;
  viewerRole: GiftSummaryViewerRole;
  receiverId: string;
  targetType: string;
  targetId: string;
  totalCount: number;
  totalBC: number;
  rows: GiftSummaryRow[];
  transactions?: GiftTransaction[];
};

export type GiftTransaction = {
  _id?: string;
  id: string;
  transactionId: string;
  senderId: string;
  receiverId: string;
  giftId: string;
  priceBC: number;
  placement: GiftPlacement;
  targetType: string;
  targetId: string;
  status: GiftTransactionStatus;
  failureReason?: string;
  refundedAt?: string | null;
  appPlatform?: string;
  appVersion?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type SendGiftInput = {
  receiverId: string;
  giftId: string;
  placement: GiftPlacement;
  targetType: string;
  targetId: string;
  appPlatform?: string;
  appVersion?: string;
  metadata?: Record<string, unknown>;
};

async function getToken(): Promise<string> {
  const token = await SecureStore.getItemAsync("RBZ_TOKEN");
  if (!token) {
    throw new Error("You must be logged in to use gifts.");
  }
  return token;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Gift request failed with status ${res.status}`;

    const err = new Error(message) as Error & {
      status?: number;
      code?: string;
      payload?: unknown;
    };

    err.status = res.status;
    err.code = data?.error;
    err.payload = data;
    throw err;
  }

  return data as T;
}

export async function getGiftCatalog(): Promise<{
  ok: boolean;
  gifts: BackendGiftConfig[];
}> {
  return apiFetch("/api/gifts/catalog");
}

export async function getBuzzCoinWallet(): Promise<{
  ok: boolean;
  wallet: BuzzCoinWallet;
}> {
  return apiFetch("/api/gifts/wallet");
}

export async function getBuzzCoinLedger(limit = 50): Promise<{
  ok: boolean;
  ledger: any[];
}> {
  return apiFetch(`/api/gifts/ledger?limit=${encodeURIComponent(String(limit))}`);
}

export async function sendGift(input: SendGiftInput): Promise<{
  ok: boolean;
  transaction: GiftTransaction;
  summary: GiftSummaryRow;
  giftId: string;
  priceBC: number;
  transactionId: string;
}> {
  return apiFetch("/api/gifts/send", {
    method: "POST",
    body: JSON.stringify({
      receiverId: input.receiverId,
      giftId: input.giftId,
      placement: input.placement,
      targetType: input.targetType,
      targetId: input.targetId,
      appPlatform: input.appPlatform || "mobile",
      appVersion: input.appVersion || "",
      metadata: input.metadata || {},
    }),
  });
}

export async function getGiftSummary(params: {
  receiverId?: string;
  targetType?: string;
  targetId?: string;
  includeTransactions?: boolean;
}): Promise<GiftSummaryResponse> {
  const query = new URLSearchParams();

  if (params.receiverId) query.set("receiverId", params.receiverId);
  if (params.targetType) query.set("targetType", params.targetType);
  if (params.targetId) query.set("targetId", params.targetId);
  if (params.includeTransactions) query.set("includeTransactions", "true");

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/api/gifts/summary${suffix}`);
}

export async function getGiftTransactions(params?: {
  role?: "all" | "sent" | "received";
  limit?: number;
}): Promise<{
  ok: boolean;
  transactions: GiftTransaction[];
}> {
  const query = new URLSearchParams();
  query.set("role", params?.role || "all");
  query.set("limit", String(params?.limit || 50));

  return apiFetch(`/api/gifts/transactions?${query.toString()}`);
}

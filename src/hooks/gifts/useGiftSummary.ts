/**
 * ============================================================
 * 📁 Location: src/hooks/gifts/useGiftSummary.ts
 * 📊 Purpose: React hook for loading gift summary/counts for a target.
 *
 * Used by:
 *  - GiftSummaryBar
 *  - Future owner insights screens
 *
 * What this file does:
 *  - Calls GET /api/gifts/summary.
 *  - Normalizes backend summary rows into gift-level rows.
 *  - Can be reused for posts, reels, profile media, chat, BuzzPoke, etc.
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getGiftSummary } from "../../api/gifts";

export type GiftSummaryDisplayRow = {
  giftId: string;
  count: number;
  totalBC: number;
  lastGiftAt?: string;
};

function normalizeGiftSummaryRows(res: any): GiftSummaryDisplayRow[] {
  const byGiftId = new Map<string, GiftSummaryDisplayRow>();

  const addGift = (input: any) => {
    const giftId = String(input?.giftId || "").trim();

    if (!giftId) {
      return;
    }

    const count = Number(input?.count ?? input?.totalCount ?? 0);
    const totalBC = Number(input?.totalBC ?? 0);
    const lastGiftAt =
      input?.lastGiftAt ||
      input?.latestGiftedAt ||
      input?.sentAt ||
      undefined;

    const existing = byGiftId.get(giftId);

    if (!existing) {
      byGiftId.set(giftId, {
        giftId,
        count: Number.isFinite(count) ? count : 0,
        totalBC: Number.isFinite(totalBC) ? totalBC : 0,
        lastGiftAt,
      });
      return;
    }

    existing.count += Number.isFinite(count) ? count : 0;
    existing.totalBC += Number.isFinite(totalBC) ? totalBC : 0;

    if (
      lastGiftAt &&
      (!existing.lastGiftAt ||
        new Date(lastGiftAt).getTime() > new Date(existing.lastGiftAt).getTime())
    ) {
      existing.lastGiftAt = lastGiftAt;
    }
  };

  if (Array.isArray(res?.summary)) {
    res.summary.forEach(addGift);
  }

  if (Array.isArray(res?.rows)) {
    res.rows.forEach((row: any) => {
      if (Array.isArray(row?.gifts)) {
        row.gifts.forEach(addGift);
      }
    });
  }

  return Array.from(byGiftId.values()).sort((a, b) => {
    const countDiff = Number(b.count || 0) - Number(a.count || 0);

    if (countDiff !== 0) {
      return countDiff;
    }

    return Number(b.totalBC || 0) - Number(a.totalBC || 0);
  });
}

export function useGiftSummary(params: {
  receiverId?: string;
  targetType?: string;
  targetId?: string;
  autoLoad?: boolean;
}) {
  const {
    receiverId,
    targetType,
    targetId,
    autoLoad = true,
  } = params;

  const [summary, setSummary] = useState<GiftSummaryDisplayRow[]>([]);
  const [serverTotalCount, setServerTotalCount] = useState<number | null>(null);
  const [serverTotalBC, setServerTotalBC] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(autoLoad));
  const [error, setError] = useState<string>("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getGiftSummary({
        receiverId,
        targetType,
        targetId,
      });

      setSummary(normalizeGiftSummaryRows(res));

      setServerTotalCount(
        typeof res?.totalCount === "number" ? res.totalCount : null
      );

      setServerTotalBC(
        typeof res?.totalBC === "number" ? res.totalBC : null
      );
    } catch (err: any) {
      setError(err?.message || "Failed to load gift summary.");
      setSummary([]);
      setServerTotalCount(null);
      setServerTotalBC(null);
    } finally {
      setLoading(false);
    }
  }, [receiverId, targetType, targetId]);

  useEffect(() => {
    if (autoLoad) {
      reload();
    }
  }, [autoLoad, reload]);

  const computedTotalCount = useMemo(
    () => summary.reduce((sum, row) => sum + Number(row.count || 0), 0),
    [summary]
  );

  const computedTotalBC = useMemo(
    () => summary.reduce((sum, row) => sum + Number(row.totalBC || 0), 0),
    [summary]
  );

  return {
    summary,
    loading,
    error,
    reload,
    totalCount: serverTotalCount ?? computedTotalCount,
    totalBC: serverTotalBC ?? computedTotalBC,
  };
}
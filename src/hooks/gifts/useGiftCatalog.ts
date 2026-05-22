/**
 * ============================================================
 * 📁 Location: src/hooks/gifts/useGiftCatalog.ts
 * 🎁 Purpose: React hook for loading the backend gift catalog.
 *
 * Used by:
 *  - GiftPicker
 *  - Any screen that needs server-safe gift availability
 *
 * What this file does:
 *  - Calls GET /api/gifts/catalog.
 *  - Stores loading/error state.
 *  - Can filter gifts by placement.
 *
 * Note:
 *  - The pretty frontend metadata still lives in src/config/rombuzzGifts.ts.
 *  - Backend catalog is used to know what the server currently allows.
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackendGiftConfig,
  GiftPlacement,
  getGiftCatalog,
} from "../../api/gifts";

export function useGiftCatalog(autoLoad = true) {
  const [gifts, setGifts] = useState<BackendGiftConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(autoLoad));
  const [error, setError] = useState<string>("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getGiftCatalog();
      setGifts(Array.isArray(res.gifts) ? res.gifts : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load gifts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      reload();
    }
  }, [autoLoad, reload]);

  const enabledGifts = useMemo(
    () => gifts.filter((gift) => gift.enabled),
    [gifts]
  );

  const getBackendGiftsByPlacement = useCallback(
    (placement: GiftPlacement) => {
      return enabledGifts.filter((gift) =>
        Array.isArray(gift.allowedPlacements)
          ? gift.allowedPlacements.includes(placement)
          : false
      );
    },
    [enabledGifts]
  );

  return {
    gifts,
    enabledGifts,
    loading,
    error,
    reload,
    getBackendGiftsByPlacement,
  };
}

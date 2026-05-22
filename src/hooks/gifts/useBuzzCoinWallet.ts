/**
 * ============================================================
 * 📁 Location: src/hooks/gifts/useBuzzCoinWallet.ts
 * 🪙 Purpose: React hook for the user's BuzzCoin wallet balance.
 *
 * Used by:
 *  - GiftBalancePill
 *  - GiftPicker
 *  - Future BuzzCoin purchase screen
 *
 * What this file does:
 *  - Calls GET /api/gifts/wallet.
 *  - Stores wallet/loading/error state.
 *  - Exposes reload() so gift sends can refresh the balance.
 * ============================================================
 */

import { useCallback, useEffect, useState } from "react";
import { BuzzCoinWallet, getBuzzCoinWallet } from "../../api/gifts";

export function useBuzzCoinWallet(autoLoad = true) {
  const [wallet, setWallet] = useState<BuzzCoinWallet | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(autoLoad));
  const [error, setError] = useState<string>("");

   const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getBuzzCoinWallet();
      setWallet(res.wallet);

      return res.wallet;
    } catch (err: any) {
      setError(err?.message || "Failed to load BuzzCoin wallet.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      reload();
    }
  }, [autoLoad, reload]);

  return {
    wallet,
    balanceBC: Number(wallet?.balanceBC || 0),
    pendingBC: Number(wallet?.pendingBC || 0),
    earnedBC: Number(wallet?.earnedBC || 0),
    locked: Boolean(wallet?.locked),
    lockReason: wallet?.lockReason || "",
    loading,
    error,
    reload,
    setWallet,
  };
}

/**
 * ============================================================
 * 📁 Location: src/hooks/gifts/useSendGift.ts
 * 🎁 Purpose: React hook for sending one gift through the modular backend.
 *
 * Used by:
 *  - GiftPicker
 *  - Future quick gift buttons
 *
 * What this file does:
 *  - Calls POST /api/gifts/send.
 *  - Tracks sending/error/success state.
 *  - Never sends priceBC from frontend.
 * ============================================================
 */

import { useCallback, useState } from "react";
import {
  GiftSummaryRow,
  GiftTransaction,
  SendGiftInput,
  sendGift as sendGiftRequest,
} from "../../api/gifts";

export function useSendGift() {
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [lastTransaction, setLastTransaction] =
    useState<GiftTransaction | null>(null);
  const [lastSummary, setLastSummary] = useState<GiftSummaryRow | null>(null);

  const send = useCallback(async (input: SendGiftInput) => {
    try {
      setSending(true);
      setError("");

      const res = await sendGiftRequest(input);

      setLastTransaction(res.transaction);
      setLastSummary(res.summary);

      return res;
    } catch (err: any) {
      const message = err?.message || "Failed to send gift.";
      setError(message);
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError("");
    setLastTransaction(null);
    setLastSummary(null);
  }, []);

  return {
    send,
    sending,
    error,
    lastTransaction,
    lastSummary,
    reset,
  };
}

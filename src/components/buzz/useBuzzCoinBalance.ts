/**
 * ============================================================================
 * 📁 File: src/components/buzz/useBuzzCoinBalance.ts
 * 🎯 Purpose: Load real spendable BuzzCoin balance for premium Buzz UI
 *
 * Used by:
 * - BuzzTypePicker.tsx
 * - BuzzPokeCard.tsx
 *
 * What this does:
 * - Uses the same wallet hook used by the Wallet screen.
 * - Reads spendable balance from balanceBC.
 * - Keeps paid Buzz balance display synced with the real wallet balance.
 * - Updates local balance immediately after premium Buzz send response.
 * ============================================================================
 */

import { useBuzzCoinWallet } from "@/src/hooks/gifts/useBuzzCoinWallet";
import { useCallback, useMemo, useState } from "react";

function extractBalanceBC(data: any) {
  const possible = [
    data?.balanceBC,
    data?.wallet?.balanceBC,
    data?.wallet?.balance,
    data?.wallet?.spendableBalance,
    data?.balance,
    data?.spendableBalance,
    data?.buzzCoin,
    data?.buzzCoins,
  ];

  for (const item of possible) {
    const n = Number(item);
    if (Number.isFinite(n)) return n;
  }

  return null;
}

export function useBuzzCoinBalance() {
  const {
    balanceBC,
    loading,
    reload,
    setWallet,
  } = useBuzzCoinWallet(false);

  const [localSpendableBalance, setLocalSpendableBalance] =
    useState<number | null>(null);

  const spendableBalance = useMemo(() => {
    if (localSpendableBalance !== null) return localSpendableBalance;
    return Number(balanceBC || 0);
  }, [balanceBC, localSpendableBalance]);

  const loadSpendableBalance = useCallback(async () => {
    try {
      const walletRes = await reload();

      const nextBalance =
        extractBalanceBC(walletRes) ??
        extractBalanceBC({ wallet: walletRes }) ??
        Number(balanceBC || 0);

      setLocalSpendableBalance(nextBalance);
      return nextBalance;
    } catch {
      setLocalSpendableBalance(null);
      return null;
    }
  }, [balanceBC, reload]);

  const updateSpendableBalanceFromPayload = useCallback(
    (data: any) => {
      const nextBalance = extractBalanceBC(data);

      if (nextBalance !== null) {
        setLocalSpendableBalance(nextBalance);

        if (data?.wallet && typeof setWallet === "function") {
          setWallet({
            ...data.wallet,
            balanceBC: nextBalance,
          });
        }
      }

      return nextBalance;
    },
    [setWallet]
  );

  return {
    spendableBalance,
    balanceLoading: loading,
    loadSpendableBalance,
    updateSpendableBalanceFromPayload,
    setSpendableBalance: setLocalSpendableBalance,
  };
}
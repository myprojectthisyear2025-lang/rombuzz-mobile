/**
 * ============================================================================
 * 📁 File: src/components/buzz/useBuzzSelection.ts
 * 🎯 Purpose: Save/load remembered premium Buzz choice per matched user
 *
 * Used by:
 * - src/components/profile/BuzzPokeCard.tsx
 *
 * What this does:
 * - Keeps Normal Buzz as default.
 * - Remembers paid Buzz choice per receiver.
 * - Supports quick-send paid Buzz only when user intentionally checked remember.
 * ============================================================================
 */

import {
  getBuzzTypeById,
  type BuzzType,
  type BuzzTypeId,
} from "@/src/config/buzzTypes";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";

type SavedBuzzChoice = {
  selectedBuzzTypeId: BuzzTypeId;
  quickSendPaidBuzz: boolean;
};

export function useBuzzSelection(userId: string) {
  const [selectedBuzzTypeId, setSelectedBuzzTypeId] =
    useState<BuzzTypeId>("normal");
  const [quickSendPaidBuzz, setQuickSendPaidBuzz] = useState(false);
  const [selectionLoaded, setSelectionLoaded] = useState(false);

  const storageKey = useMemo(() => {
    return `RBZ_BUZZ_CHOICE:${String(userId || "")}`;
  }, [userId]);

  const selectedBuzzType = useMemo(() => {
    return getBuzzTypeById(selectedBuzzTypeId);
  }, [selectedBuzzTypeId]);

  const loadSelection = useCallback(async () => {
    if (!userId) {
      setSelectedBuzzTypeId("normal");
      setQuickSendPaidBuzz(false);
      setSelectionLoaded(true);
      return;
    }

    try {
      const raw = await SecureStore.getItemAsync(storageKey);

      if (!raw) {
        setSelectedBuzzTypeId("normal");
        setQuickSendPaidBuzz(false);
        setSelectionLoaded(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<SavedBuzzChoice>;
      const nextType = getBuzzTypeById(parsed.selectedBuzzTypeId);

      setSelectedBuzzTypeId(nextType.id);
      setQuickSendPaidBuzz(Boolean(parsed.quickSendPaidBuzz && nextType.isPaid));
      setSelectionLoaded(true);
    } catch {
      setSelectedBuzzTypeId("normal");
      setQuickSendPaidBuzz(false);
      setSelectionLoaded(true);
    }
  }, [storageKey, userId]);

  const saveSelection = useCallback(
    async (type: BuzzType, quickSend: boolean) => {
      const payload: SavedBuzzChoice = {
        selectedBuzzTypeId: type.id,
        quickSendPaidBuzz: Boolean(quickSend && type.isPaid),
      };

      setSelectedBuzzTypeId(payload.selectedBuzzTypeId);
      setQuickSendPaidBuzz(payload.quickSendPaidBuzz);

      try {
        await SecureStore.setItemAsync(storageKey, JSON.stringify(payload));
      } catch {
        // Do not block Buzz flow if local storage fails.
      }
    },
    [storageKey]
  );

  const resetSelection = useCallback(async () => {
    setSelectedBuzzTypeId("normal");
    setQuickSendPaidBuzz(false);

    try {
      await SecureStore.deleteItemAsync(storageKey);
    } catch {
      // Ignore local storage cleanup failure.
    }
  }, [storageKey]);

  useEffect(() => {
    loadSelection();
  }, [loadSelection]);

  return {
    selectedBuzzType,
    selectedBuzzTypeId,
    quickSendPaidBuzz,
    selectionLoaded,
    saveSelection,
    resetSelection,
    reloadSelection: loadSelection,
  };
}
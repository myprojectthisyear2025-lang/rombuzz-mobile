/**
 * Path: src/features/chat/purchasedMedia/usePurchasedMediaStyles.ts
 * Purpose: Compose the theme-aware style modules used by Purchased Media.
 */

import { useMemo } from "react";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

import { createPurchasedMediaOverlayStyles } from "./purchasedMediaOverlayStyles";
import { createPurchasedMediaShellStyles } from "./purchasedMediaShellStyles";

export function usePurchasedMediaStyles() {
  const { colors } = useRomBuzzTheme();

  return useMemo(
    () => ({
      ...createPurchasedMediaShellStyles(colors),
      ...createPurchasedMediaOverlayStyles(colors),
    }),
    [colors]
  );
}
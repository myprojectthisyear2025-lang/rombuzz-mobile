/**
 * Path: src/features/chat/sharedMedia/useSharedMediaStyles.ts
 * Purpose: Compose the theme-aware style modules used by Shared Media.
 */

import { useMemo } from "react";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

import { createSharedMediaOverlayStyles } from "./sharedMediaOverlayStyles";
import { createSharedMediaShellStyles } from "./sharedMediaShellStyles";

export function useSharedMediaStyles() {
  const { colors } = useRomBuzzTheme();

  return useMemo(
    () => ({
      ...createSharedMediaShellStyles(colors),
      ...createSharedMediaOverlayStyles(colors),
    }),
    [colors]
  );
}
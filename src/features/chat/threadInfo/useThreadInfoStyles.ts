/**
 * Path: src/features/chat/threadInfo/useThreadInfoStyles.ts
 * Purpose: Compose the theme-aware style modules used by Chat Thread Info.
 */

import { useMemo } from "react";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

import { createThreadInfoSectionStyles } from "./threadInfoSectionStyles";
import { createThreadInfoShellStyles } from "./threadInfoShellStyles";

export function useThreadInfoStyles() {
  const { colors } = useRomBuzzTheme();

  return useMemo(
    () => ({
      ...createThreadInfoShellStyles(colors),
      ...createThreadInfoSectionStyles(colors),
    }),
    [colors]
  );
}
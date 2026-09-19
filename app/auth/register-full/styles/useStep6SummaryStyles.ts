/**
 * Path: app/auth/register-full/steps/styles/useStep6SummaryStyles.ts
 * Purpose: Connects the Step 6 review UI to the active RomBuzz theme.
 */

import { useMemo } from "react";

import {
  useRomBuzzTheme,
} from "@/src/design/RomBuzzThemeProvider";

import {
  createStep6SummaryStyles,
} from "./createStep6SummaryStyles";

export function useStep6SummaryStyles() {
  const { colors } = useRomBuzzTheme();

  const styles = useMemo(
    () =>
      createStep6SummaryStyles(
        colors
      ),
    [colors]
  );

  return {
    styles,
    colors,
  };
}
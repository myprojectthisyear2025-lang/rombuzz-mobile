/**
 * Path: src/features/discover/useDiscoverVisuals.ts
 * Purpose: Connect Discover styles to the shared RomBuzz Light/Dark/System theme.
 * Used by: app/(tabs)/discover.tsx.
 */

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { useMemo } from "react";

import { createDiscoverCardStyles } from "./discoverCard.styles";
import { createDiscoverScreenStyles } from "./discoverScreen.styles";

export function useDiscoverVisuals(
  cardWidth: number,
  cardHeight: number
) {
  const { colors } = useRomBuzzTheme();

  const screenStyles = useMemo(
    () => createDiscoverScreenStyles(colors),
    [colors]
  );

  const cardStyles = useMemo(
    () =>
      createDiscoverCardStyles(
        colors,
        cardWidth,
        cardHeight
      ),
    [cardHeight, cardWidth, colors]
  );

  const styles = useMemo(
    () => ({
      ...screenStyles,
      ...cardStyles,
    }),
    [cardStyles, screenStyles]
  );

  return {
    colors,
    styles,
  };
}
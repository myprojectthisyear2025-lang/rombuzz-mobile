/**
 * Path: src/features/meetMiddle/meetMiddleVisuals.ts
 * Purpose: Shared RomBuzz theme aliases and gradients for Meet in the Middle UI.
 */

import { useMemo } from "react";

import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";

export type MeetMiddlePalette = {
  c1: string;
  c2: string;
  c3: string;
  c4: string;

  white: string;
  ink: string;
  gray: string;
  muted: string;

  soft: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;

  line: string;
  lineStrong: string;

  icon: string;
  iconMuted: string;
  overlay: string;

  danger: string;
  dangerSoft: string;
  dangerText: string;

  brandSoft: string;

  green: string;
  greenSoft: string;
  softGreen: string;
  greenText: string;

  red: string;
  amber: string;
  blue: string;

  shadow: string;

  screenGradient:
    readonly [
      string,
      string,
      string
    ];

  cardGradient:
    readonly [
      string,
      string
    ];

  greenGradient:
    readonly [
      string,
      string
    ];
};

export function useMeetMiddlePalette() {
  const {
    colors,
    isDark,
  } = useRomBuzzTheme();

  return useMemo<MeetMiddlePalette>(
    () => ({
      c1: colors.brandPressed,
      c2: colors.brand,

      c3: isDark
        ? "#FF5D84"
        : "#FF4777",

      c4: isDark
        ? "#FF4777"
        : "#E23869",

      white: colors.white,

      ink: colors.text,
      gray: colors.textSecondary,
      muted: colors.textMuted,

      soft: colors.background,
      surface: colors.surface,
      surfaceRaised:
        colors.surfaceRaised,
      surfaceMuted:
        colors.surfaceMuted,

      line: colors.border,
      lineStrong:
        colors.borderStrong,

      icon: colors.icon,
      iconMuted:
        colors.iconMuted,

      overlay: colors.overlay,

      danger: colors.danger,

      dangerSoft: isDark
        ? "rgba(255,99,105,0.12)"
        : "#FEF2F2",

      dangerText: isDark
        ? "#FF9DA2"
        : "#991B1B",

      brandSoft:
        colors.brandSoft,

      green: isDark
        ? "#48D597"
        : "#059669",

      greenSoft: isDark
        ? "rgba(72,213,151,0.12)"
        : "#ECFDF5",

      softGreen: isDark
        ? "rgba(72,213,151,0.12)"
        : "#ECFDF5",

      greenText: isDark
        ? "#9BE7C3"
        : "#065F46",

      red: colors.danger,

      amber: isDark
        ? "#F4B860"
        : "#D97706",

      blue: isDark
        ? "#6EA8FF"
        : "#2563EB",

      shadow: "#000000",

      screenGradient: isDark
        ? [
            "#0F1012",
            "#121318",
            "#17131A",
          ]
        : [
            "#FCFCFD",
            "#FFF8FA",
            "#FDF7FF",
          ],

      cardGradient: isDark
        ? [
            colors.surfaceRaised,
            colors.surface,
          ]
        : [
            colors.surface,
            "#FFF7FA",
          ],

      greenGradient: isDark
        ? [
            "#36C987",
            "#22996A",
          ]
        : [
            "#10B981",
            "#059669",
          ],
    }),
    [
      colors,
      isDark,
    ]
  );
}
/**
 * Path: src/design/rombuzzDesign.ts
 * Purpose: Shared RomBuzz visual tokens for the 2026 mobile redesign.
 * Used by: Redesigned screens and small UI components, starting with Home.
 */

export const RBZDesign = {
  color: {
    brand: "#F52E64",
    brandPressed: "#DC2557",
    ink: "#17171C",
    inkMuted: "#686870",
    inkSoft: "#92929A",
    canvas: "#FCFCFD",
    surface: "#FFFFFF",
    surfaceMuted: "#F4F4F6",
    surfaceStrong: "#1D1D22",
    surfaceStrongPressed: "#29292F",
    line: "#E9E9ED",
    lineStrong: "#DDDEE3",
    white: "#FFFFFF",
    success: "#1F8A57",
  },

  radius: {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    round: 999,
  },

  space: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
  },

  type: {
    display: 30,
    title: 22,
    section: 18,
    body: 15,
    small: 13,
    tiny: 11,
  },
} as const;
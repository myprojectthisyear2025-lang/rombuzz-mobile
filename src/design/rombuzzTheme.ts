/**
 * Path: src/design/rombuzzTheme.ts
 * Purpose: Semantic light/dark color palettes for the RomBuzz mobile app.
 * Used by: RomBuzzThemeProvider and every screen migrated to the new design system.
 */

export type RomBuzzResolvedTheme =
  | "light"
  | "dark";

export type RomBuzzThemeMode =
  | "light"
  | "dark"
  | "system";

export type RomBuzzColors = {
  brand: string;
  brandPressed: string;
  brandSoft: string;

  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;

  text: string;
  textSecondary: string;
  textMuted: string;

  border: string;
  borderStrong: string;

  icon: string;
  iconMuted: string;

  tabBar: string;
  tabBarBorder: string;

  overlay: string;
  white: string;
  danger: string;
};

const LIGHT: RomBuzzColors = {
  brand: "#F52E64",
  brandPressed: "#DC2557",
  brandSoft: "rgba(245,46,100,0.10)",

  background: "#FCFCFD",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceMuted: "#F4F4F6",

  text: "#17171C",
  textSecondary: "#686870",
  textMuted: "#92929A",

  border: "#E9E9ED",
  borderStrong: "#DDDEE3",

  icon: "#17171C",
  iconMuted: "#74747D",

  tabBar: "#FFFFFF",
  tabBarBorder: "#ECECF0",

  overlay: "rgba(8,8,11,0.64)",
  white: "#FFFFFF",
  danger: "#E5484D",
};

const DARK: RomBuzzColors = {
  brand: "#F52E64",
  brandPressed: "#FF4777",
  brandSoft: "rgba(245,46,100,0.14)",

  background: "#0F1012",
  surface: "#17181C",
  surfaceRaised: "#1D1E23",
  surfaceMuted: "#24252A",

  text: "#F7F7F8",
  textSecondary: "#B7B8BF",
  textMuted: "#858790",

  border: "#2A2C32",
  borderStrong: "#373941",

  icon: "#F2F3F5",
  iconMuted: "#8D9098",

  tabBar: "#121316",
  tabBarBorder: "#26282D",

  overlay: "rgba(5,5,8,0.68)",
  white: "#FFFFFF",
  danger: "#FF6369",
};

export function getRomBuzzColors(
  theme: RomBuzzResolvedTheme
): RomBuzzColors {
  return theme === "dark"
    ? DARK
    : LIGHT;
}
/**
 * Path: src/design/rombuzzTypography.ts
 * Purpose: Shared RomBuzz Manrope font names and font loader.
 * Used by: Redesigned RomBuzz screens, beginning with the Home screen.
 */

import {
    useFonts,
} from "@expo-google-fonts/manrope/useFonts";

import {
    Manrope_400Regular,
} from "@expo-google-fonts/manrope/400Regular";

import {
    Manrope_500Medium,
} from "@expo-google-fonts/manrope/500Medium";

import {
    Manrope_600SemiBold,
} from "@expo-google-fonts/manrope/600SemiBold";

import {
    Manrope_700Bold,
} from "@expo-google-fonts/manrope/700Bold";

import {
    Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope/800ExtraBold";

export const RBZFont = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semiBold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extraBold: "Manrope_800ExtraBold",
} as const;

export function useRomBuzzTypography() {
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  return loaded;
}
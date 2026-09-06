/**
 * Path: src/design/RomBuzzThemeProvider.tsx
 * Purpose: Global RomBuzz appearance state with Light, Dark, and System modes.
 * Used by: The root app layout and all theme-aware RomBuzz screens/components.
 */

import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Appearance,
  type ColorSchemeName,
} from "react-native";

import {
  getRomBuzzColors,
  type RomBuzzColors,
  type RomBuzzResolvedTheme,
  type RomBuzzThemeMode,
} from "@/src/design/rombuzzTheme";

const STORAGE_KEY =
  "RBZ_APPEARANCE_MODE";

type ThemeContextValue = {
  mode: RomBuzzThemeMode;
  resolvedTheme: RomBuzzResolvedTheme;
  isDark: boolean;
  colors: RomBuzzColors;
  statusBarStyle:
    | "light-content"
    | "dark-content";
  setMode: (
    mode: RomBuzzThemeMode
  ) => Promise<void>;
};

const ThemeContext =
  createContext<ThemeContextValue | null>(
    null
  );

function resolveTheme(
  mode: RomBuzzThemeMode,
  systemScheme: ColorSchemeName
): RomBuzzResolvedTheme {
  if (mode === "dark") {
    return "dark";
  }

  if (mode === "light") {
    return "light";
  }

  return systemScheme === "dark"
    ? "dark"
    : "light";
}

function isValidMode(
  value: string | null
): value is RomBuzzThemeMode {
  return (
    value === "light" ||
    value === "dark" ||
    value === "system"
  );
}

export function RomBuzzThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // TEMP: Dark-mode visual testing.
  // Change back to "light" after Home is approved.
  const [mode, setModeState] =
    useState<RomBuzzThemeMode>("dark");

  const [
    systemScheme,
    setSystemScheme,
  ] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    SecureStore.getItemAsync(
      STORAGE_KEY
    )
      .then((saved) => {
        if (isValidMode(saved)) {
          setModeState(saved);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const subscription =
      Appearance.addChangeListener(
        ({ colorScheme }) => {
          setSystemScheme(colorScheme);
        }
      );

    return () => {
      subscription.remove();
    };
  }, []);

  const setMode = useCallback(
    async (
      nextMode: RomBuzzThemeMode
    ) => {
      setModeState(nextMode);

      try {
        await SecureStore.setItemAsync(
          STORAGE_KEY,
          nextMode
        );
      } catch {}
    },
    []
  );

  const resolvedTheme =
    resolveTheme(mode, systemScheme);

  const value = useMemo(() => {
    const isDark =
      resolvedTheme === "dark";

    return {
      mode,
      resolvedTheme,
      isDark,
      colors:
        getRomBuzzColors(
          resolvedTheme
        ),

      statusBarStyle: isDark
        ? "light-content"
        : "dark-content",

      setMode,
    } satisfies ThemeContextValue;
  }, [
    mode,
    resolvedTheme,
    setMode,
  ]);

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useRomBuzzTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useRomBuzzTheme must be used inside RomBuzzThemeProvider"
    );
  }

  return context;
}
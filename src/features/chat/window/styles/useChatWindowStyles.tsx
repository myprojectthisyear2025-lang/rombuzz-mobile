import React, { createContext, useContext, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { createComposerStyles } from "./chatComposerStyles";
import { createMediaStyles } from "./chatMediaStyles";
import { createMessageStyles } from "./chatMessageStyles";
import { createSheetsStyles } from "./chatSheetsStyles";
import { createShellStyles } from "./chatShellStyles";

/** Shared visual tokens; all message and sheet colors follow app appearance. */
function useCreateChatWindowStyles() {
  const { colors } = useRomBuzzTheme();
  const { width } = useWindowDimensions();
  const BUBBLE_MAX_W = Math.floor(width * 0.72);

  return useMemo(
    () => ({
      colors,
      BUBBLE_MAX_W,
      RBZ: {
        c1: colors.brand,
        c2: colors.brand,
        c3: colors.brandPressed,
        c4: colors.brand,
        white: colors.white,
        ink: colors.text,
        gray: colors.textSecondary,
        soft: colors.surfaceMuted,
        line: colors.border,
      },
      styles: {
        ...createShellStyles(colors, BUBBLE_MAX_W),
        ...createComposerStyles(colors, BUBBLE_MAX_W),
        ...createMessageStyles(colors, BUBBLE_MAX_W),
        ...createMediaStyles(colors, BUBBLE_MAX_W),
        ...createSheetsStyles(colors, BUBBLE_MAX_W),
      },
    }),
    [colors, BUBBLE_MAX_W],
  );
}

const ChatStyleContext = createContext<ReturnType<
  typeof useCreateChatWindowStyles
> | null>(null);

/** Build one style table per screen, rather than one per rendered bubble. */
export function ChatWindowStyleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useCreateChatWindowStyles();
  return (
    <ChatStyleContext.Provider value={value}>
      {children}
    </ChatStyleContext.Provider>
  );
}

export function useChatWindowStyles() {
  const styles = useContext(ChatStyleContext);
  if (!styles)
    throw new Error("Chat styles must be used inside ChatWindowStyleProvider.");
  return styles;
}

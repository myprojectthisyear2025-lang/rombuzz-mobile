import { createContext, useContext } from "react";
import type { ChatWindowController } from "./useChatWindowController";

export const ChatWindowContext = createContext<ChatWindowController | null>(
  null,
);

export function useChatWindow(): ChatWindowController {
  const controller = useContext(ChatWindowContext);
  if (!controller)
    throw new Error("Chat components must be inside ChatWindowScreen.");
  return controller;
}

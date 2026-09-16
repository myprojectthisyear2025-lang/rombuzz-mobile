import React from "react";
import { ChatWindowContext } from "./ChatWindowContext";
import { ChatWindowView } from "./ChatWindowView";
import { useChatWindowController } from "./useChatWindowController";
import { ChatWindowStyleProvider } from "./styles/useChatWindowStyles";

/** Main mobile chat screen: connects the controller to the themed thread UI. */
export default function ChatWindowScreen() {
  const controller = useChatWindowController();
  return (
    <ChatWindowContext.Provider value={controller}>
      <ChatWindowStyleProvider>
        <ChatWindowView />
      </ChatWindowStyleProvider>
    </ChatWindowContext.Provider>
  );
}

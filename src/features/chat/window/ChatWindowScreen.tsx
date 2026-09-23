import { withPerfScreen, usePerfContent } from "@/src/performance/diagnostics/screens";
import React from "react";
import { ChatWindowContext } from "./ChatWindowContext";
import { ChatWindowView } from "./ChatWindowView";
import { useChatWindowController } from "./useChatWindowController";
import { ChatWindowStyleProvider } from "./styles/useChatWindowStyles";

/** Main mobile chat screen: connects the controller to the themed thread UI. */
function ChatWindowScreen() {
  const controller = useChatWindowController();
  usePerfContent("chat-open", !controller.loading || controller.messages.length > 0, controller.messages.length, controller.messages);
  return (
    <ChatWindowContext.Provider value={controller}>
      <ChatWindowStyleProvider>
        <ChatWindowView />
      </ChatWindowStyleProvider>
    </ChatWindowContext.Provider>
  );
}

export default withPerfScreen(ChatWindowScreen, "chat-open");

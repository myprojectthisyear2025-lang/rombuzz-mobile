import type { Dispatch, SetStateAction } from "react";
import type { Msg } from "@/src/features/chat/thread/chatTypes";

export type SetMessages = Dispatch<SetStateAction<Msg[]>>;
export type ChatParticipants = { myId: string; peerId: string; roomId: string };

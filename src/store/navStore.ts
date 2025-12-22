/**
 * ============================================================
 * 📁 File: store/navStore.ts
 * 🎯 Central Navigation UI Store (Heartbeat Navigation)
 * ============================================================
 */
import { create } from "zustand";

type NavState = {
  hasUnreadChat: boolean;
  hasNewSocial: boolean;
  hasNotification: boolean;

  profileComplete: boolean;
  avatarUrl?: string;

  isIdle: boolean;

  setUnreadChat: (v: boolean) => void;
  setNewSocial: (v: boolean) => void;
  setNotification: (v: boolean) => void;
  setProfileComplete: (v: boolean) => void;
  setAvatarUrl: (url?: string) => void;
  setIdle: (v: boolean) => void;
};

export const useNavStore = create<NavState>((set) => ({
  hasUnreadChat: false,
  hasNewSocial: false,
  hasNotification: false,

  profileComplete: false,
  avatarUrl: undefined,

  isIdle: true,

  setUnreadChat: (v: boolean) => set({ hasUnreadChat: v }),
  setNewSocial: (v: boolean) => set({ hasNewSocial: v }),
  setNotification: (v: boolean) => set({ hasNotification: v }),
  setProfileComplete: (v: boolean) => set({ profileComplete: v }),
  setAvatarUrl: (url?: string) => set({ avatarUrl: url }),
  setIdle: (v: boolean) => set({ isIdle: v }),
}));


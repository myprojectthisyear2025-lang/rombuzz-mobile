/**
 * ============================================================
 * 📁 File: src/features/onboarding/firstSignupTourSteps.ts
 * 🎯 Purpose: Define the one-time RomBuzz feature-tour content.
 *
 * Usage:
 *   FirstSignupTour renders these steps in order after signup.
 * ============================================================
 */

export const FIRST_SIGNUP_TOUR_STEPS = [
  {
    id: "home",
    title: "Home",
    description:
      "Your RomBuzz starting point. Jump into Microbuzz, matching, community features, chats, and your profile from here.",
    useLogo: true,
  },
  {
    id: "discover",
    title: "Discover",
    description:
      "Browse people tuned to your preferences. Buzz someone you like or keep discovering new matches.",
    icon: "compass" as const,
  },
  {
    id: "microbuzz",
    title: "MicroBuzz",
    description:
      "Find real-time nearby activity when you want a faster, more immediate way to connect.",
    icon: "flash" as const,
  },
  {
    id: "letsbuzz",
    title: "Let'sBuzz",
    description:
      "See posts and activities of your matches, share moments, gift, and interact beyond the matching deck.",
    icon: "heart" as const,
  },
  {
    id: "chat",
    title: "Chat",
    description:
      "Keep conversations going with your matches. Unread activity appears on the chat icon.",
    icon: "chatbubble-ellipses" as const,
  },
  {
    id: "social",
    title: "Social",
    description:
      "The flame opens your social stats, including likes, matches, and other profile activity.",
    icon: "flame" as const,
  },
  {
    id: "notifications",
    title: "Notifications",
    description:
      "The bell keeps important RomBuzz activity together so you can quickly see what changed.",
    icon: "notifications" as const,
  },
  {
    id: "profile",
    title: "Profile",
    description:
      "Manage your photos, profile details, settings, and the way other people see you on RomBuzz.",
    icon: "person-circle" as const,
  },
] as const;
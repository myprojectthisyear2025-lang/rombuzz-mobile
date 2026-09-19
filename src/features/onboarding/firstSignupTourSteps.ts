/**
 * Path: src/features/onboarding/firstSignupTourSteps.ts
 * Purpose: Current RomBuzz feature-tour content and preview metadata.
 */

import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type FirstSignupTourPreview =
  | "home"
  | "discover"
  | "microbuzz"
  | "letsbuzz"
  | "chat"
  | "social"
  | "notifications"
  | "profile";

export type FirstSignupTourStep = {
  id: FirstSignupTourPreview;
  kicker: string;
  title: string;
  description: string;
  hint: string;

  icon:
    ComponentProps<
      typeof Ionicons
    >["name"];

  preview:
    FirstSignupTourPreview;
};

export const FIRST_SIGNUP_TOUR_STEPS:
  readonly FirstSignupTourStep[] =
[
  {
    id: "home",
    kicker:
      "YOUR STARTING POINT",
    title: "Home",
    description:
      "Your launchpad for MicroBuzz, Discover, chats, your profile, and the activity that matters.",
    hint:
      "Tap a feature card or shortcut to jump in.",
    icon: "home",
    preview: "home",
  },

  {
    id: "discover",
    kicker:
      "FIND YOUR VIBE",
    title: "Discover",
    description:
      "See people tuned to your preferences. Skip, Buzz, or open a profile before deciding.",
    hint:
      "Use the three actions at the bottom of each card.",
    icon: "sparkles",
    preview: "discover",
  },

  {
    id: "microbuzz",
    kicker:
      "GO LIVE NEARBY",
    title: "MicroBuzz",
    description:
      "Go live nearby when you want a faster, more spontaneous way to connect in the moment.",
    hint:
      "Turn on location, scan nearby energy, then Buzz someone.",
    icon: "flash",
    preview: "microbuzz",
  },

  {
    id: "letsbuzz",
    kicker:
      "BEYOND THE MATCH",
    title: "Let’sBuzz",
    description:
      "Keep up with matched people through Posts and Reels, then react, comment, share, or gift.",
    hint:
      "Switch between Posts and Reels from the top tabs.",
    icon: "radio",
    preview: "letsbuzz",
  },

  {
    id: "chat",
    kicker:
      "KEEP IT GOING",
    title: "Chat",
    description:
      "Your matched conversations live here, with search, unread activity, and online presence.",
    hint:
      "Tap a match to open the conversation.",
    icon:
      "chatbubble-ellipses",
    preview: "chat",
  },

  {
    id: "social",
    kicker:
      "YOUR SOCIAL PULSE",
    title: "Social Stats",
    description:
      "See Likes You, Likes Sent, Matches, and profile views in one curiosity-driven snapshot.",
    hint:
      "Open Likes You, Likes Sent, or Matches to see the people behind it.",
    icon: "flame",
    preview: "social",
  },

  {
    id: "notifications",
    kicker:
      "STAY IN THE LOOP",
    title: "Notifications",
    description:
      "Important Buzzes, likes, gifts, comments, matches, and other activity are collected here.",
    hint:
      "Use the filters to focus on the activity you care about.",
    icon:
      "notifications",
    preview:
      "notifications",
  },

  {
    id: "profile",
    kicker:
      "MAKE IT YOURS",
    title: "Profile",
    description:
      "Manage how you show up with your Gallery, About details, private notes, preview, and settings.",
    hint:
      "Keep your profile fresh so people see the best version of you.",
    icon: "person",
    preview: "profile",
  },
] as const;
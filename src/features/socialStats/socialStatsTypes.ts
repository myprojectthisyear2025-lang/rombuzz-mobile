/**
 * Path: src/features/socialStats/socialStatsTypes.ts
 * Purpose: Shared types for the redesigned Social Stats screen and list modal.
 */

export type SocialStatsTab =
  | "liked"
  | "likedYou"
  | "matches";

export type SocialStatsCounts = {
  likedCount: number;
  likedYouCount: number;
  matchCount: number;
  viewsToday: number;
  viewsTotal: number;
};

export type SocialStatsUser = {
  id?: string;
  _id?: string;
  userId?: string;

  firstName?: string;
  lastName?: string;
  name?: string;

  age?: number;
  location?: string;
  gender?: string;
  bio?: string;

  avatar?: string;
  verified?: boolean;

  [key: string]: any;
};

export const EMPTY_SOCIAL_STATS:
  SocialStatsCounts = {
  likedCount: 0,
  likedYouCount: 0,
  matchCount: 0,
  viewsToday: 0,
  viewsTotal: 0,
};

export function socialUserId(
  user: SocialStatsUser
) {
  return String(
    user?.id ||
      user?._id ||
      user?.userId ||
      ""
  );
}
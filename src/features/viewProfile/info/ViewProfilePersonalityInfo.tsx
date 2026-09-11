/**
 * Path: src/features/viewProfile/info/ViewProfilePersonalityInfo.tsx
 * Purpose: Read-only Favorites, Vibe, Interests, and Hobbies chip sections for View Profile.
 * Used by: app/(tabs)/view-profile.tsx only.
 */

import React from "react";

import ViewProfileChipField from "./ViewProfileChipField";

import ViewProfileInfoSection from "./ViewProfileInfoSection";

import {
    hasViewProfileValue,
} from "./viewProfileInfoFormat";

type Props = {
  user: any;
};

export default function ViewProfilePersonalityInfo({
  user,
}: Props) {
  return (
    <>
      {hasViewProfileValue(
        user?.favoriteMusic,
        user?.favoriteMovies
      ) && (
        <ViewProfileInfoSection
          title="Favorites"
        >
          <ViewProfileChipField
            label="Music"
            values={
              user?.favoriteMusic
            }
          />

          <ViewProfileChipField
            label="Movies/Shows"
            values={
              user?.favoriteMovies
            }
          />
        </ViewProfileInfoSection>
      )}

      {hasViewProfileValue(
        user?.vibeTags,
        user?.likes,
        user?.dislikes
      ) && (
        <ViewProfileInfoSection
          title="Vibe"
        >
          <ViewProfileChipField
            label="Vibe tags"
            values={
              user?.vibeTags
            }
          />

          <ViewProfileChipField
            label="Likes"
            values={
              user?.likes
            }
            tone="positive"
          />

          <ViewProfileChipField
            label="Dislikes"
            values={
              user?.dislikes
            }
            tone="negative"
          />
        </ViewProfileInfoSection>
      )}

      {hasViewProfileValue(
        user?.interests,
        user?.hobbies
      ) && (
        <ViewProfileInfoSection
          title="Interests & Hobbies"
        >
          <ViewProfileChipField
            label="Interests"
            values={
              user?.interests
            }
          />

          <ViewProfileChipField
            label="Hobbies"
            values={
              user?.hobbies
            }
          />
        </ViewProfileInfoSection>
      )}
    </>
  );
}
/**
 * Path: src/features/discoverProfile/DiscoverProfileDetails.tsx
 * Purpose: Lifestyle, background, beliefs, interests, preferences, and hobbies for Discover Profile.
 * Used by: DiscoverProfileScreen.tsx only.
 */

import { zodiacDisplayValue } from "@/src/constants/profileBeliefs";
import React from "react";
import {
    DiscoverProfileChipField,
    DiscoverProfileInfoRow,
    DiscoverProfileSection,
} from "./DiscoverProfileFields";
import {
    discoverText,
    showDiscoverField,
} from "./discoverProfilePrivacy";

export default function DiscoverProfileDetails({
  user,
}: {
  user: any;
}) {
  const lifestyleVisible = [
    "bodyType",
    "fitnessLevel",
    "smoking",
    "drinking",
    "workoutFrequency",
    "diet",
    "sleepSchedule",
  ].some((field) =>
    showDiscoverField(
      user,
      field,
      user?.[field]
    )
  );

  const backgroundVisible = [
    "educationLevel",
    "school",
    "jobTitle",
    "company",
    "languages",
  ].some((field) =>
    showDiscoverField(
      user,
      field,
      user?.[field]
    )
  );

  const beliefVisible = [
    "religion",
    "politicalViews",
    "zodiac",
  ].some((field) =>
    showDiscoverField(
      user,
      field,
      user?.[field]
    )
  );

  const preferenceVisible = [
    "favoriteMusic",
    "favoriteMovies",
    "petsPreference",
    "likes",
    "dislikes",
  ].some((field) =>
    showDiscoverField(
      user,
      field,
      user?.[field]
    )
  );

  return (
    <>
      {lifestyleVisible && (
        <DiscoverProfileSection title="Lifestyle">
          {showDiscoverField(user, "bodyType", user.bodyType) && (
            <DiscoverProfileInfoRow label="Body type" value={discoverText(user.bodyType)} />
          )}

          {showDiscoverField(user, "fitnessLevel", user.fitnessLevel) && (
            <DiscoverProfileInfoRow label="Fitness level" value={discoverText(user.fitnessLevel)} />
          )}

          {showDiscoverField(user, "smoking", user.smoking) && (
            <DiscoverProfileInfoRow label="Smoking" value={discoverText(user.smoking)} />
          )}

          {showDiscoverField(user, "drinking", user.drinking) && (
            <DiscoverProfileInfoRow label="Drinking" value={discoverText(user.drinking)} />
          )}

          {showDiscoverField(user, "workoutFrequency", user.workoutFrequency) && (
            <DiscoverProfileInfoRow label="Workout" value={discoverText(user.workoutFrequency)} />
          )}

          {showDiscoverField(user, "diet", user.diet) && (
            <DiscoverProfileInfoRow label="Diet" value={discoverText(user.diet)} />
          )}

          {showDiscoverField(user, "sleepSchedule", user.sleepSchedule) && (
            <DiscoverProfileInfoRow label="Sleep schedule" value={discoverText(user.sleepSchedule)} />
          )}
        </DiscoverProfileSection>
      )}

      {backgroundVisible && (
        <DiscoverProfileSection title="Background">
          {showDiscoverField(user, "educationLevel", user.educationLevel) && (
            <DiscoverProfileInfoRow label="Education" value={discoverText(user.educationLevel)} />
          )}

          {showDiscoverField(user, "school", user.school) && (
            <DiscoverProfileInfoRow label="School" value={discoverText(user.school)} />
          )}

          {showDiscoverField(user, "jobTitle", user.jobTitle) && (
            <DiscoverProfileInfoRow label="Job title" value={discoverText(user.jobTitle)} />
          )}

          {showDiscoverField(user, "company", user.company) && (
            <DiscoverProfileInfoRow label="Company" value={discoverText(user.company)} />
          )}

          {showDiscoverField(user, "languages", user.languages) && (
            <DiscoverProfileChipField label="Languages" values={user.languages} />
          )}
        </DiscoverProfileSection>
      )}

      {beliefVisible && (
        <DiscoverProfileSection title="Beliefs & identity">
          {showDiscoverField(user, "religion", user.religion) && (
            <DiscoverProfileInfoRow label="Religion" value={discoverText(user.religion)} />
          )}

          {showDiscoverField(user, "politicalViews", user.politicalViews) && (
            <DiscoverProfileInfoRow label="Political views" value={discoverText(user.politicalViews)} />
          )}

          {showDiscoverField(user, "zodiac", user.zodiac) && (
            <DiscoverProfileInfoRow label="Zodiac" value={zodiacDisplayValue(user.zodiac)} />
          )}
        </DiscoverProfileSection>
      )}

      {Array.isArray(user?.interests) &&
        user.interests.length > 0 && (
          <DiscoverProfileSection title="Interests">
            <DiscoverProfileChipField
              label="Into"
              values={user.interests}
            />
          </DiscoverProfileSection>
        )}

      {preferenceVisible && (
        <DiscoverProfileSection title="Preferences">
          {showDiscoverField(user, "favoriteMusic", user.favoriteMusic) && (
            <DiscoverProfileChipField label="Favorite music" values={user.favoriteMusic} />
          )}

          {showDiscoverField(user, "favoriteMovies", user.favoriteMovies) && (
            <DiscoverProfileChipField label="Movies & shows" values={user.favoriteMovies} />
          )}

          {showDiscoverField(user, "petsPreference", user.petsPreference) && (
            <DiscoverProfileInfoRow label="Pet preference" value={discoverText(user.petsPreference)} />
          )}

          {showDiscoverField(user, "likes", user.likes) && (
            <DiscoverProfileChipField
              label="Likes"
              values={user.likes}
              tone="positive"
            />
          )}

          {showDiscoverField(user, "dislikes", user.dislikes) && (
            <DiscoverProfileChipField
              label="Dislikes"
              values={user.dislikes}
              tone="negative"
            />
          )}
        </DiscoverProfileSection>
      )}

      {Array.isArray(user?.hobbies) &&
        user.hobbies.length > 0 && (
          <DiscoverProfileSection title="Hobbies">
            <DiscoverProfileChipField
              label="Enjoys"
              values={user.hobbies}
            />
          </DiscoverProfileSection>
        )}
    </>
  );
}
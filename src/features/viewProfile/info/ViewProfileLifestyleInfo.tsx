/**
 * Path: src/features/viewProfile/info/ViewProfileLifestyleInfo.tsx
 * Purpose: Read-only Lifestyle, Background, and Beliefs sections for View Profile.
 * Used by: app/(tabs)/view-profile.tsx only.
 */

import {
  zodiacDisplayValue,
} from "@/src/constants/profileBeliefs";

import React from "react";

import ViewProfileChipField from "./ViewProfileChipField";

import ViewProfileCompactField, {
  ViewProfileInfoGrid,
} from "./ViewProfileCompactField";

import ViewProfileInfoSection from "./ViewProfileInfoSection";

import {
  hasViewProfileValue,
  viewProfileTitle,
} from "./viewProfileInfoFormat";

type Props = {
  user: any;
};

export default function ViewProfileLifestyleInfo({
  user,
}: Props) {
  return (
    <>
      {hasViewProfileValue(
        user?.smoking,
        user?.drinking,
        user?.workoutFrequency,
        user?.diet,
        user?.sleepSchedule,
        user?.petsPreference
      ) && (
        <ViewProfileInfoSection
          title="Lifestyle"
        >
          <ViewProfileInfoGrid>
            {!!user?.smoking && (
              <ViewProfileCompactField
                icon="cloud-outline"
                label="Smoking"
                value={viewProfileTitle(
                  user.smoking
                )}
              />
            )}

            {!!user?.drinking && (
              <ViewProfileCompactField
                icon="wine-outline"
                label="Drinking"
                value={viewProfileTitle(
                  user.drinking
                )}
              />
            )}

            {!!user?.workoutFrequency && (
              <ViewProfileCompactField
                icon="barbell-outline"
                label="Workout"
                value={viewProfileTitle(
                  user.workoutFrequency
                )}
              />
            )}

            {!!user?.diet && (
              <ViewProfileCompactField
                icon="restaurant-outline"
                label="Diet"
                value={viewProfileTitle(
                  user.diet
                )}
              />
            )}

            {!!user?.sleepSchedule && (
              <ViewProfileCompactField
                icon="moon-outline"
                label="Sleep"
                value={viewProfileTitle(
                  user.sleepSchedule
                )}
              />
            )}

            {!!user?.petsPreference && (
              <ViewProfileCompactField
                icon="paw-outline"
                label="Pets"
                value={viewProfileTitle(
                  user.petsPreference
                )}
              />
            )}
          </ViewProfileInfoGrid>
        </ViewProfileInfoSection>
      )}

      {hasViewProfileValue(
        user?.educationLevel,
        user?.school,
        user?.jobTitle,
        user?.company,
        user?.languages
      ) && (
        <ViewProfileInfoSection
          title="Background"
        >
          <ViewProfileInfoGrid>
            {!!user?.educationLevel && (
              <ViewProfileCompactField
                icon="book-outline"
                label="Education"
                value={viewProfileTitle(
                  user.educationLevel
                )}
              />
            )}

            {!!user?.school && (
              <ViewProfileCompactField
                icon="school-outline"
                label="School"
                value={viewProfileTitle(
                  user.school
                )}
              />
            )}

            {!!user?.jobTitle && (
              <ViewProfileCompactField
                icon="briefcase-outline"
                label="Job title"
                value={viewProfileTitle(
                  user.jobTitle
                )}
              />
            )}

            {!!user?.company && (
              <ViewProfileCompactField
                icon="business-outline"
                label="Company"
                value={viewProfileTitle(
                  user.company
                )}
              />
            )}
          </ViewProfileInfoGrid>

          <ViewProfileChipField
            label="Languages"
            values={
              user?.languages
            }
            titleCase
          />
        </ViewProfileInfoSection>
      )}

      {hasViewProfileValue(
        user?.religion,
        user?.politicalViews,
        user?.zodiac
      ) && (
        <ViewProfileInfoSection
          title="Beliefs"
        >
          <ViewProfileInfoGrid>
            {!!user?.religion && (
              <ViewProfileCompactField
                icon="compass-outline"
                label="Religion"
                value={viewProfileTitle(
                  user.religion
                )}
              />
            )}

            {!!user?.politicalViews && (
              <ViewProfileCompactField
                icon="flag-outline"
                label="Political views"
                value={viewProfileTitle(
                  user.politicalViews
                )}
              />
            )}

            {!!user?.zodiac && (
              <ViewProfileCompactField
                icon="sparkles-outline"
                label="Zodiac"
                value={zodiacDisplayValue(
                  user.zodiac
                )}
              />
            )}
          </ViewProfileInfoGrid>
        </ViewProfileInfoSection>
      )}
    </>
  );
}
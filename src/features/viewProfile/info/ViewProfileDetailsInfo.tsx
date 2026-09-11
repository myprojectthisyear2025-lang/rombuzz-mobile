/**
 * Path: src/features/viewProfile/info/ViewProfileDetailsInfo.tsx
 * Purpose: Read-only Basics, Identity, Dating, Location, and Body sections for View Profile.
 * Used by: app/(tabs)/view-profile.tsx only.
 */

import {
  lookingForLabelFromValue,
} from "@/src/constants/lookingFor";

import {
  relationshipStyleLabelFromValue,
} from "@/src/constants/relationshipStyles";

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

export default function ViewProfileDetailsInfo({
  user,
}: Props) {
  return (
    <>
      {hasViewProfileValue(
        user?.city,
        user?.gender,
        user?.orientation,
        user?.lookingFor,
        user?.height
      ) && (
        <ViewProfileInfoSection
          title="Basics"
        >
          <ViewProfileInfoGrid>
            {!!user?.city && (
              <ViewProfileCompactField
                icon="location-outline"
                label="City"
                value={user.city}
              />
            )}

            {!!user?.gender && (
              <ViewProfileCompactField
                icon="person-outline"
                label="Gender"
                value={viewProfileTitle(
                  user.gender
                )}
              />
            )}

            {!!user?.orientation && (
              <ViewProfileCompactField
                icon="heart-outline"
                label="Orientation"
                value={viewProfileTitle(
                  user.orientation
                )}
              />
            )}

            {!!user?.lookingFor && (
              <ViewProfileCompactField
                icon="search-outline"
                label="Looking for"
                value={lookingForLabelFromValue(
                  user.lookingFor
                )}
              />
            )}

            {!!user?.height && (
              <ViewProfileCompactField
                icon="resize-outline"
                label="Height"
                value={user.height}
              />
            )}
          </ViewProfileInfoGrid>
        </ViewProfileInfoSection>
      )}

      {!!user?.pronouns && (
        <ViewProfileInfoSection
          title="Identity"
        >
          <ViewProfileInfoGrid>
            <ViewProfileCompactField
              icon="chatbubble-ellipses-outline"
              label="Pronouns"
              value={viewProfileTitle(
                user.pronouns
              )}
            />
          </ViewProfileInfoGrid>
        </ViewProfileInfoSection>
      )}

      {!!user?.relationshipStyle && (
        <ViewProfileInfoSection
          title="Dating"
        >
          <ViewProfileInfoGrid>
            <ViewProfileCompactField
              icon="heart-outline"
              label="Relationship style"
              value={relationshipStyleLabelFromValue(
                user.relationshipStyle
              )}
            />
          </ViewProfileInfoGrid>
        </ViewProfileInfoSection>
      )}

      {hasViewProfileValue(
        user?.country,
        user?.hometown,
        user?.travelVibes
      ) && (
        <ViewProfileInfoSection
          title="Location"
        >
          <ViewProfileInfoGrid>
            {!!user?.country && (
              <ViewProfileCompactField
                icon="globe-outline"
                label="Country"
                value={viewProfileTitle(
                  user.country
                )}
              />
            )}

            {!!user?.hometown && (
              <ViewProfileCompactField
                icon="home-outline"
                label="Hometown"
                value={viewProfileTitle(
                  user.hometown
                )}
              />
            )}
          </ViewProfileInfoGrid>

          <ViewProfileChipField
            label="Travel Vibe"
            values={
              user?.travelVibes
            }
            titleCase
          />
        </ViewProfileInfoSection>
      )}

      {hasViewProfileValue(
        user?.bodyType,
        user?.fitnessLevel
      ) && (
        <ViewProfileInfoSection
          title="Body & Basics"
        >
          <ViewProfileInfoGrid>
            {!!user?.bodyType && (
              <ViewProfileCompactField
                icon="body-outline"
                label="Body type"
                value={viewProfileTitle(
                  user.bodyType
                )}
              />
            )}

            {!!user?.fitnessLevel && (
              <ViewProfileCompactField
                icon="fitness-outline"
                label="Fitness level"
                value={viewProfileTitle(
                  user.fitnessLevel
                )}
              />
            )}
          </ViewProfileInfoGrid>
        </ViewProfileInfoSection>
      )}
    </>
  );
}
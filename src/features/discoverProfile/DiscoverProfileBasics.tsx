/**
 * Path: src/features/discoverProfile/DiscoverProfileBasics.tsx
 * Purpose: Preserve the existing Basics and Travel vibe fields after Overview was slimmed down.
 * Used by: DiscoverProfileScreen.tsx only.
 */

import {
  lookingForLabelFromValue,
} from "@/src/constants/lookingFor";

import {
  relationshipStyleLabelFromValue,
} from "@/src/constants/relationshipStyles";

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

export default function DiscoverProfileBasics({
  user,
}: {
  user: any;
}) {
  return (
    <>
      <DiscoverProfileSection title="Basics">
        {showDiscoverField(
          user,
          "pronouns",
          user.pronouns
        ) && (
          <DiscoverProfileInfoRow
            label="Pronouns"
            value={discoverText(
              user.pronouns
            )}
          />
        )}

        {showDiscoverField(
          user,
          "city",
          user.city
        ) && (
          <DiscoverProfileInfoRow
            label="City"
            value={discoverText(
              user.city
            )}
          />
        )}

        {showDiscoverField(
          user,
          "country",
          user.country
        ) && (
          <DiscoverProfileInfoRow
            label="Country"
            value={discoverText(
              user.country
            )}
          />
        )}

        {showDiscoverField(
          user,
          "hometown",
          user.hometown
        ) && (
          <DiscoverProfileInfoRow
            label="Hometown"
            value={discoverText(
              user.hometown
            )}
          />
        )}

        {showDiscoverField(
          user,
          "gender",
          user.gender
        ) && (
          <DiscoverProfileInfoRow
            label="Gender"
            value={discoverText(
              user.gender
            )}
          />
        )}

        {showDiscoverField(
          user,
          "orientation",
          user.orientation
        ) && (
          <DiscoverProfileInfoRow
            label="Orientation"
            value={discoverText(
              user.orientation
            )}
          />
        )}

        {showDiscoverField(
          user,
          "lookingFor",
          user.lookingFor
        ) && (
          <DiscoverProfileInfoRow
            label="Looking for"
            value={
              lookingForLabelFromValue(
                user.lookingFor
              )
            }
          />
        )}

        {showDiscoverField(
          user,
          "relationshipStyle",
          user.relationshipStyle
        ) && (
          <DiscoverProfileInfoRow
            label="Relationship style"
            value={
              relationshipStyleLabelFromValue(
                user.relationshipStyle
              )
            }
          />
        )}

        {showDiscoverField(
          user,
          "height",
          user.height
        ) && (
          <DiscoverProfileInfoRow
            label="Height"
            value={discoverText(
              user.height
            )}
          />
        )}
      </DiscoverProfileSection>

      {showDiscoverField(
        user,
        "travelVibes",
        user.travelVibes
      ) && (
        <DiscoverProfileSection title="Travel vibe">
          <DiscoverProfileChipField
            label="Travel style"
            values={
              user.travelVibes
            }
          />
        </DiscoverProfileSection>
      )}
    </>
  );
}
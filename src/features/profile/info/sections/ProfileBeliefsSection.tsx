/**
 * Path: src/features/profile/info/sections/ProfileBeliefsSection.tsx
 * Purpose: Displays religion, political views, and zodiac profile fields.
 * Used by: src/components/profile/ProfileInfoTab.tsx.
 */

import {
    zodiacDisplayValue,
} from "@/src/constants/profileBeliefs";

import React from "react";

import ProfileInfoRow from "../ProfileInfoRow";
import ProfileInfoSection from "../ProfileInfoSection";

type BeliefField =
  | "religion"
  | "politicalViews"
  | "zodiac";

type Props = {
  form: any;
  setProfileChoiceOpen: (
    value: BeliefField | null
  ) => void;
};

const asText = (value: any) =>
  value === null ||
  value === undefined
    ? ""
    : String(value);

export default function ProfileBeliefsSection({
  form,
  setProfileChoiceOpen,
}: Props) {
  return (
    <ProfileInfoSection title="Beliefs">
      <ProfileInfoRow
        label="Religion"
        value={asText(
          form?.religion
        )}
        onPress={() =>
          setProfileChoiceOpen(
            "religion"
          )
        }
      />

      <ProfileInfoRow
        label="Political views"
        value={asText(
          form?.politicalViews
        )}
        onPress={() =>
          setProfileChoiceOpen(
            "politicalViews"
          )
        }
      />

      <ProfileInfoRow
        label="Zodiac"
        value={zodiacDisplayValue(
          form?.zodiac
        )}
        onPress={() =>
          setProfileChoiceOpen(
            "zodiac"
          )
        }
      />
    </ProfileInfoSection>
  );
}
/**
 * Path: src/features/profile/info/sections/ProfileBodyBasicsSection.tsx
 * Purpose: Displays Body & Basics fields using the existing picker orchestration.
 * Used by: src/components/profile/ProfileInfoTab.tsx.
 */

import React from "react";

import ProfileInfoRow from "../ProfileInfoRow";
import ProfileInfoSection from "../ProfileInfoSection";

const BODY_TYPE_OPTIONS = [
  "Slim",
  "Average",
  "Athletic",
  "Curvy",
  "Muscular",
  "A little extra",
  "Prefer not to say",
];

const FITNESS_LEVEL_OPTIONS = [
  "Not active",
  "Sometimes",
  "Active",
  "Very active",
];

type Props = {
  form: any;
  toTitle: (value?: string) => string;
  setEditingField: (value: any) => void;
  setSelectOpen: (value: any) => void;
};

export default function ProfileBodyBasicsSection({
  form,
  toTitle,
  setEditingField,
  setSelectOpen,
}: Props) {
  return (
    <ProfileInfoSection title="Body & Basics">
      <ProfileInfoRow
        label="Body type"
        value={toTitle(
          form?.bodyType
        )}
        onPress={() => {
          setEditingField("bodyType");

          setSelectOpen({
            field: "bodyType",
            title: "Body type",
            options:
              BODY_TYPE_OPTIONS,
            value: toTitle(
              form?.bodyType
            ),
          });
        }}
      />

      <ProfileInfoRow
        label="Fitness level"
        value={toTitle(
          form?.fitnessLevel
        )}
        onPress={() => {
          setEditingField(
            "fitnessLevel"
          );

          setSelectOpen({
            field: "fitnessLevel",
            title: "Fitness level",
            options:
              FITNESS_LEVEL_OPTIONS,
            value: toTitle(
              form?.fitnessLevel
            ),
          });
        }}
      />
    </ProfileInfoSection>
  );
}
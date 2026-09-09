/**
 * Path: src/features/profile/info/sections/ProfileIdentitySection.tsx
 * Purpose: Extracted Identity profile rows using the existing picker orchestration.
 * Used by: ProfileInfoTab.
 */

import React from "react";
import ProfileInfoRow from "../ProfileInfoRow";
import ProfileInfoSection from "../ProfileInfoSection";

const PRONOUN_OPTIONS = [
  "He/Him",
  "She/Her",
  "They/Them",
  "Custom",
];

type Props = {
  form: any;
  toTitle: (value?: string) => string;
  setEditingField: (value: any) => void;
  setSelectOpen: (value: any) => void;
};

export default function ProfileIdentitySection({
  form,
  toTitle,
  setEditingField,
  setSelectOpen,
}: Props) {
  return (
    <ProfileInfoSection title="Identity">
      <ProfileInfoRow
        label="Pronouns"
        value={toTitle(
          form.pronouns
        )}
        onPress={() => {
          setEditingField("pronouns");

          setSelectOpen({
            field: "pronouns",
            title: "Pronouns",
            options:
              PRONOUN_OPTIONS,
            value: toTitle(
              form.pronouns
            ),
          });
        }}
      />
    </ProfileInfoSection>
  );
}
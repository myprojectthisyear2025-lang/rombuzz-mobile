/**
 * Path: src/features/profile/info/sections/ProfileDatingSection.tsx
 * Purpose: Displays Dating profile fields while reusing existing picker state.
 * Used by: src/components/profile/ProfileInfoTab.tsx.
 */

import {
    RELATIONSHIP_STYLE_OPTIONS,
    relationshipStyleLabelFromValue,
} from "@/src/constants/relationshipStyles";

import React from "react";

import ProfileInfoRow from "../ProfileInfoRow";
import ProfileInfoSection from "../ProfileInfoSection";

type Props = {
  form: any;
  setEditingField: (value: any) => void;
  setSelectOpen: (value: any) => void;
};

export default function ProfileDatingSection({
  form,
  setEditingField,
  setSelectOpen,
}: Props) {
  const relationship =
    relationshipStyleLabelFromValue(
      form?.relationshipStyle
    );

  return (
    <ProfileInfoSection title="Dating">
      <ProfileInfoRow
        label="Relationship"
        value={relationship}
        onPress={() => {
          setEditingField(
            "relationshipStyle"
          );

          setSelectOpen({
            field: "relationshipStyle",
            title: "Relationship",
            options:
              RELATIONSHIP_STYLE_OPTIONS.map(
                (option) =>
                  option.label
              ),
            value: relationship,
          });
        }}
      />
    </ProfileInfoSection>
  );
}
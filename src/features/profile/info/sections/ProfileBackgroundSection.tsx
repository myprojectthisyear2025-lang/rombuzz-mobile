/**
 * Path: src/features/profile/info/sections/ProfileBackgroundSection.tsx
 * Purpose: Displays education, work, school, and language profile fields.
 * Used by: src/components/profile/ProfileInfoTab.tsx.
 */

import React from "react";

import ProfileInfoChipField from "../ProfileInfoChipField";
import ProfileInfoRow from "../ProfileInfoRow";
import ProfileInfoSection from "../ProfileInfoSection";

const EDUCATION_OPTIONS = [
  "High school",
  "College",
  "Undergraduate",
  "Graduate",
  "PhD",
  "Trade school",
  "Prefer not to say",
];

type Props = {
  form: any;
  toTitle: (
    value?: string
  ) => string;

  setEditingField: (
    value: any
  ) => void;

  setSelectOpen: (
    value: any
  ) => void;

  setTextOpen: (
    value: any
  ) => void;

  setLanguagePickerOpen: (
    value: boolean
  ) => void;
};

const asText = (
  value: any
) =>
  value === null ||
  value === undefined
    ? ""
    : String(value);

export default function ProfileBackgroundSection({
  form,
  toTitle,
  setEditingField,
  setSelectOpen,
  setTextOpen,
  setLanguagePickerOpen,
}: Props) {
  return (
    <ProfileInfoSection title="Background">
      <ProfileInfoRow
        label="Education"
        value={toTitle(
          form?.educationLevel
        )}
        onPress={() => {
          setEditingField(
            "educationLevel"
          );

          setSelectOpen({
            field:
              "educationLevel",
            title:
              "Education level",
            options:
              EDUCATION_OPTIONS,
            value: toTitle(
              form?.educationLevel
            ),
          });
        }}
      />

      <ProfileInfoRow
        label="School"
        value={toTitle(
          form?.school
        )}
        onPress={() => {
          setTextOpen({
            field: "school",
            title:
              "School / University",
            value: asText(
              form?.school
            ),
            placeholder:
              "e.g., UCLA",
          });
        }}
      />

      <ProfileInfoRow
        label="Job title"
        value={toTitle(
          form?.jobTitle
        )}
        onPress={() => {
          setTextOpen({
            field: "jobTitle",
            title: "Job title",
            value: asText(
              form?.jobTitle
            ),
            placeholder:
              "e.g., Software Engineer",
          });
        }}
      />

      <ProfileInfoRow
        label="Company"
        value={toTitle(
          form?.company
        )}
        onPress={() => {
          setTextOpen({
            field: "company",
            title:
              "Company / Workplace",
            value: asText(
              form?.company
            ),
            placeholder:
              "e.g., Google",
          });
        }}
      />

      <ProfileInfoChipField
        label="Languages"
        values={
          form?.languages
        }
        placeholder="Add languages"
        onPress={() =>
          setLanguagePickerOpen(
            true
          )
        }
      />
    </ProfileInfoSection>
  );
}
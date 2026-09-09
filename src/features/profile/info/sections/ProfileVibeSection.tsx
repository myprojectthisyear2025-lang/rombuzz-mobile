/**
 * Path: src/features/profile/info/sections/ProfileVibeSection.tsx
 * Purpose: Displays and edits Vibe Tags, Likes, and Dislikes using responsive chips.
 * Used by: src/components/profile/ProfileInfoTab.tsx.
 */

import React from "react";

import ProfileInfoChipField from "../ProfileInfoChipField";
import ProfileInfoSection from "../ProfileInfoSection";
import ProfileVibeChoiceGrid from "../ProfileVibeChoiceGrid";

import {
  DISLIKE_OPTIONS,
  LIKE_OPTIONS,
  VIBE_TAG_OPTIONS,
} from "../ProfileVibeOptions";

type Props = {
  form: any;
  editingField: any;

  setEditingField: (
    value: any
  ) => void;

  setSelectOpen: (
    value: any
  ) => void;

  setForm: (
    updater: any
  ) => void;

  saveSingleField: (
    payload: any
  ) => void;
};

const safeArray = (
  value: any
): string[] =>
  Array.isArray(value)
    ? value.filter(Boolean)
    : [];

export default function ProfileVibeSection({
  form,
  editingField,
  setEditingField,
  setSelectOpen,
  setForm,
  saveSingleField,
}: Props) {
  const activeField:
    | "likes"
    | "dislikes"
    | null =
    editingField === "likes" ||
    editingField === "dislikes"
      ? editingField
      : null;

  const toggleValue = (
    field: "likes" | "dislikes",
    value: string
  ) => {
    setForm((prev: any) => {
      const current =
        safeArray(prev?.[field]);

      const exists =
        current.includes(value);

      if (exists) {
        return {
          ...prev,
          [field]:
            current.filter(
              (item) =>
                item !== value
            ),
        };
      }

      if (current.length >= 10) {
        return prev;
      }

      return {
        ...prev,
        [field]: [
          ...current,
          value,
        ],
      };
    });
  };

  const saveActiveField = () => {
    if (!activeField) return;

    saveSingleField({
      [activeField]:
        safeArray(
          form?.[activeField]
        ),
    });

    setEditingField(null);
  };

  return (
    <ProfileInfoSection title="Vibe">
      {activeField && (
        <ProfileVibeChoiceGrid
          title={
            activeField === "likes"
              ? "Select Likes (max 10)"
              : "Select Dislikes (max 10)"
          }
          options={
            activeField === "likes"
              ? LIKE_OPTIONS
              : DISLIKE_OPTIONS
          }
          selected={safeArray(
            form?.[activeField]
          )}
          tone={
            activeField === "likes"
              ? "positive"
              : "negative"
          }
          onToggle={(value) =>
            toggleValue(
              activeField,
              value
            )
          }
          onSave={
            saveActiveField
          }
        />
      )}

      <ProfileInfoChipField
        label="Vibe tags"
        values={safeArray(
          form?.vibeTags
        )}
        placeholder="Add vibe tags"
        onPress={() => {
          setSelectOpen({
            field: "vibeTags",
            title: "Vibe tags",
            options:
              VIBE_TAG_OPTIONS,
            value: safeArray(
              form?.vibeTags
            ),
            multi: true,
          });
        }}
      />

      <ProfileInfoChipField
        label="Likes"
        values={safeArray(
          form?.likes
        )}
        placeholder="Add likes"
        tone="positive"
        onPress={() =>
          setEditingField("likes")
        }
      />

      <ProfileInfoChipField
        label="Dislikes"
        values={safeArray(
          form?.dislikes
        )}
        placeholder="Add dislikes"
        tone="negative"
        onPress={() =>
          setEditingField(
            "dislikes"
          )
        }
      />
    </ProfileInfoSection>
  );
}
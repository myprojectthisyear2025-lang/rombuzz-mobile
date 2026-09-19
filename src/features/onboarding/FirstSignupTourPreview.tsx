/**
 * Path: src/features/onboarding/FirstSignupTourPreview.tsx
 * Purpose: Route each Tour step to its lightweight current-product preview.
 */

import React from "react";

import type {
  FirstSignupTourPreview as PreviewKey,
} from "./firstSignupTourSteps";

import FirstSignupTourPreviewPrimary from "./FirstSignupTourPreviewPrimary";
import FirstSignupTourPreviewSecondary from "./FirstSignupTourPreviewSecondary";

export default function FirstSignupTourPreview({
  preview,
}: {
  preview: PreviewKey;
}) {
  if (
    preview === "home" ||
    preview === "discover" ||
    preview === "microbuzz" ||
    preview === "letsbuzz"
  ) {
    return (
      <FirstSignupTourPreviewPrimary
        preview={preview}
      />
    );
  }

  return (
    <FirstSignupTourPreviewSecondary
      preview={preview}
    />
  );
}
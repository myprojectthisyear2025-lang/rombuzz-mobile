/**
 * Path: src/features/onboarding/FirstSignupTourPreview.tsx
 * Purpose: Route all eight tour pages to their redesigned product previews.
 * Previews use bundled artwork, fictional content, and the active theme.
 * No preview performs navigation, network requests, or account actions.
 */

import React from "react";
import FirstSignupTourChatPreview from "./FirstSignupTourChatPreview";
import FirstSignupTourDiscoverPreview from "./FirstSignupTourDiscoverPreview";
import FirstSignupTourHomePreview from "./FirstSignupTourHomePreview";
import FirstSignupTourLetsBuzzPreview from "./FirstSignupTourLetsBuzzPreview";
import FirstSignupTourMicroBuzzPreview from "./FirstSignupTourMicroBuzzPreview";
import FirstSignupTourNotificationsPreview from "./FirstSignupTourNotificationsPreview";
import FirstSignupTourProfilePreview from "./FirstSignupTourProfilePreview";
import FirstSignupTourSocialPreview from "./FirstSignupTourSocialPreview";
import type {
  FirstSignupTourPreview as PreviewKey,
} from "./firstSignupTourSteps";

export default function FirstSignupTourPreview({
  preview,
}: {
  preview: PreviewKey;
}) {
  switch (preview) {
    case "home":
      return <FirstSignupTourHomePreview />;
    case "discover":
      return <FirstSignupTourDiscoverPreview />;
    case "microbuzz":
      return <FirstSignupTourMicroBuzzPreview />;
    case "letsbuzz":
      return <FirstSignupTourLetsBuzzPreview />;
    case "chat":
      return <FirstSignupTourChatPreview />;
    case "social":
      return <FirstSignupTourSocialPreview />;
    case "notifications":
      return <FirstSignupTourNotificationsPreview />;
    case "profile":
      return <FirstSignupTourProfilePreview />;
    default:
      return null;
  }
}
/**
 * Path: app/(tabs)/discover-profile.tsx
 * Purpose: Route entry for the standalone pre-match Discover Profile experience,
 * including the read-only owner profile preview mode.
 * Used by: Discover deck profile navigation and Profile Preview.
 */

import DiscoverProfileScreen from "@/src/features/discoverProfile/DiscoverProfileScreen";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";

export default function DiscoverProfileRoute() {
  const params = useLocalSearchParams<{
    id: string;
    preview?: string;
    returnTo?: string;
    source?: string;
    profilePreviewMode?: string;
  }>();

  const userId = String(params.id || "");

  const returnTo = params.returnTo
    ? decodeURIComponent(String(params.returnTo))
    : "/(tabs)/discover";

  const previewUser = useMemo(() => {
    if (!params.preview) return null;

    try {
      return JSON.parse(
        decodeURIComponent(String(params.preview))
      );
    } catch {
      return null;
    }
  }, [params.preview]);

  const isProfilePreview =
    params.profilePreviewMode === "before";

  return (
    <DiscoverProfileScreen
      userId={userId}
      returnTo={returnTo}
      previewUser={previewUser}
      profilePreviewMode={
        isProfilePreview ? "before" : undefined
      }
    />
  );
}
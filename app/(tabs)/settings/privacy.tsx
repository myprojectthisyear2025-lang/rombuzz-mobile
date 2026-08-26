/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/privacy.tsx
 * 🎯 Purpose: Privacy settings screen for RomBuzz.
 *
 * V1:
 * - Visibility privacy toggles are intentionally hidden until backend support
 *   is implemented so the app does not present non-functional controls.
 * ============================================================================
 */

import React from "react";
import {
  Card,
  ScreenShell,
  SectionTitle,
  SmallText,
} from "../../../src/components/settings/_ui";

export default function PrivacySettings() {
  return (
    <ScreenShell title="Privacy">
      <SectionTitle>Privacy</SectionTitle>

      <Card>
        <SmallText>
          Additional privacy controls will be available in a future update.
        </SmallText>
      </Card>
    </ScreenShell>
  );
}
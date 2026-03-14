/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/privacy.tsx
 * 🎯 Purpose: Privacy settings (UI-first; backend wiring can be added as needed)
 * ============================================================================
 */
import React, { useState } from "react";
import { Card, ScreenShell, SectionTitle, SmallText, ToggleRow } from "./_ui";

export default function PrivacySettings() {
  const [incognito, setIncognito] = useState(false);
  const [showOnline, setShowOnline] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

  return (
    <ScreenShell title="Privacy">
      <SectionTitle>Visibility</SectionTitle>
      <Card>
        <ToggleRow icon="eye-off-outline" label="Incognito mode" value={incognito} onChange={setIncognito} />
        <ToggleRow icon="radio-outline" label="Show online status" value={showOnline} onChange={setShowOnline} />
        <ToggleRow icon="navigate-outline" label="Show distance" value={showDistance} onChange={setShowDistance} />

        <SmallText>
          This page is safe UI-first. If you want these to persist, tell me which backend fields you want to store them in.
        </SmallText>
      </Card>
    </ScreenShell>
  );
}

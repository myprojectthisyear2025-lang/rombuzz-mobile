/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/notifications.tsx
 * 🎯 Purpose: Notifications toggles (same as web, placeholder wiring note)
 * ============================================================================
 */
import React, { useState } from "react";
import { Card, ScreenShell, SectionTitle, SmallText, ToggleRow } from "./_ui";

export default function NotificationSettings() {
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(true);

  return (
    <ScreenShell title="Notifications">
      <SectionTitle>Preferences</SectionTitle>
      <Card>
        <ToggleRow icon="mail-outline" label="Email notifications" value={email} onChange={setEmail} />
        <ToggleRow icon="notifications-outline" label="Push notifications" value={push} onChange={setPush} />
        <SmallText>
          Your web page says to wire these to your notifications API later, so this matches that behavior for now.
        </SmallText>
      </Card>
    </ScreenShell>
  );
}

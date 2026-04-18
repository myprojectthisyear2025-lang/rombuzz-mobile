/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/help.tsx
 * 🎯 Purpose: Help / FAQ (mobile version of web Help content)
 * ============================================================================
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, RBZ, ScreenShell, SectionTitle } from "../../../src/components/settings/_ui";

function Q({ q, a }: { q: string; a: string }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.q}>Q: {q}</Text>
      <Text style={styles.a}>A: {a}</Text>
    </View>
  );
}

export default function HelpPage() {
  return (
    <ScreenShell title="Help">
      <SectionTitle>FAQ</SectionTitle>
      <Card>
        <Q
          q="I didn’t get my OTP / verification email."
          a="Check spam/junk. Confirm your email is correct. Wait a minute and tap Resend code if available."
        />
        <Q
          q="Google login isn’t working."
          a="Use the same Google account you used before. If it continues, try email login or contact support."
        />
        <Q
          q="I’m not seeing any matches or nearby users."
          a="Make sure location is on, and your filters aren’t too strict. Try expanding age/distance."
        />
        <Q
          q="MicroBuzz shows a blank page."
          a="Refresh once, allow camera/location, and ensure internet is stable. Contact support with screenshots if needed."
        />
        <Q
          q="I want to change my email or password."
          a="Go to Settings → Account or Security. If something is missing, contact support."
        />
        <Q
          q="I think my account was hacked."
          a="Change password immediately and contact support so we can investigate."
        />
      </Card>

      <SectionTitle>Support</SectionTitle>
      <Card>
        <Text style={styles.a}>
          If you still need help, use in-app reporting (Settings → Blocking & Safety)
          or contact support with screenshots.
        </Text>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  q: { color: RBZ.text, fontWeight: "900" },
  a: { color: RBZ.muted, marginTop: 6, fontWeight: "700", lineHeight: 18 },
});

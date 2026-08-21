/**
 * ============================================================
 * 📁 File: app/sentry-test.tsx
 * 🎯 Purpose: Verify RomBuzz mobile Sentry reporting.
 *
 * Available automatically in development builds.
 * Production builds redirect away unless explicitly enabled.
 * ============================================================
 */

import { Sentry } from "@/src/monitoring/sentry";
import { Redirect } from "expo-router";
import React, { useState } from "react";
import {
  Button,
  SafeAreaView,
  Text,
  View,
} from "react-native";

export default function SentryTestScreen() {
  const [status, setStatus] = useState("Ready");

  const enabled =
    __DEV__ ||
    process.env.EXPO_PUBLIC_SENTRY_TEST_ENABLED === "true";

  if (!enabled) {
    return <Redirect href="/" />;
  }

  const sendTestError = async () => {
    setStatus("Sending test error...");

    const eventId = Sentry.captureException(
      new Error("RomBuzz mobile Sentry verification test")
    );

    await Sentry.flush();

    setStatus(`Sent: ${eventId}`);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          padding: 24,
          justifyContent: "center",
          gap: 18,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700" }}>
          Sentry Test
        </Text>

        <Text>{status}</Text>

        <Button
          title="Send Sentry Test Error"
          onPress={sendTestError}
        />
      </View>
    </SafeAreaView>
  );
}
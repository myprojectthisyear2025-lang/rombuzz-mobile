/**
 * ============================================================
 * 📁 Location: app/gift-test.tsx
 * 🎁 Purpose: Temporary hidden RomBuzz gift test screen.
 *
 * Used by:
 *  - Developer-only testing before wiring gifts into LetsBuzz,
 *    ViewProfile, Chat, BuzzPoke, or MicroBuzz.
 *
 * What this file does:
 *  - Lets you enter a receiverId.
 *  - Opens the reusable GiftPicker.
 *  - Sends a gift using the modular gift frontend/backend system.
 *
 * Important:
 *  - This screen is temporary.
 *  - It does not affect existing app screens.
 *  - Remove this file later before production release if you do not
 *    want users to access it.
 * ============================================================
 */

import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import GiftPicker from "../src/components/gifts/GiftPicker";
import GiftBalancePill from "../src/components/gifts/GiftBalancePill";
import { useBuzzCoinWallet } from "../src/hooks/gifts/useBuzzCoinWallet";

export default function GiftTestScreen() {
  const [receiverId, setReceiverId] = useState("a0-zpXvVB");
  const [targetId, setTargetId] = useState("mobile_gift_test_target_001");
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [lastSent, setLastSent] = useState<{
    giftId: string;
    transactionId: string;
    priceBC: number;
  } | null>(null);

  const {
    balanceBC,
    locked,
    loading,
    error,
    reload,
  } = useBuzzCoinWallet(true);

  function openGiftPicker() {
    if (!receiverId.trim()) {
      Alert.alert("Missing receiverId", "Enter a real receiverId first.");
      return;
    }

    if (!targetId.trim()) {
      Alert.alert("Missing targetId", "Enter a test targetId first.");
      return;
    }

    setGiftPickerOpen(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>‹ Back</Text>
            </Pressable>

            <Text style={styles.title}>Gift Test Screen</Text>
            <Text style={styles.subtitle}>
              Temporary hidden screen for testing the new RomBuzz gift module.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Wallet</Text>

            <View style={styles.walletRow}>
              <GiftBalancePill
                balanceBC={balanceBC}
                loading={loading}
                locked={locked}
                error={error}
              />

              <Pressable onPress={reload} style={styles.refreshButton}>
                <Text style={styles.refreshText}>Refresh</Text>
              </Pressable>
            </View>

            <Text style={styles.helper}>
              If your balance is too low, use the protected backend test-credit
              route from PowerShell again.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Receiver</Text>

            <Text style={styles.label}>receiverId</Text>
            <TextInput
              value={receiverId}
              onChangeText={setReceiverId}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Enter receiver user id"
              placeholderTextColor="#A77C92"
              style={styles.input}
            />

            <Text style={styles.label}>targetId</Text>
            <TextInput
              value={targetId}
              onChangeText={setTargetId}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Enter test target id"
              placeholderTextColor="#A77C92"
              style={styles.input}
            />

            <Text style={styles.helper}>
              Current default receiverId is Kendal from your Discover test:
              a0-zpXvVB.
            </Text>
          </View>

          <Pressable onPress={openGiftPicker} style={styles.mainButton}>
            <Text style={styles.mainButtonText}>Open Gift Picker</Text>
          </Pressable>

          {lastSent && (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Last gift sent ✅</Text>
              <Text style={styles.successLine}>giftId: {lastSent.giftId}</Text>
              <Text style={styles.successLine}>
                priceBC: {lastSent.priceBC}
              </Text>
              <Text style={styles.successLine}>
                transactionId: {lastSent.transactionId}
              </Text>
            </View>
          )}
        </ScrollView>

        <GiftPicker
          visible={giftPickerOpen}
          onClose={() => setGiftPickerOpen(false)}
          receiverId={receiverId.trim()}
          placement="universal"
          targetType="mobile_gift_test"
          targetId={targetId.trim()}
          title="Test RomBuzz Gift"
          subtitle="Send a test gift through the new modular gift system."
          onSent={async (payload) => {
            setLastSent(payload);
            await reload();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF7FB",
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 18,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#7B174C",
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: "900",
    color: "#351024",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5B73",
    lineHeight: 20,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,105,180,0.16)",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#351024",
    marginBottom: 12,
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  refreshButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#351024",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "900",
    color: "#5A1238",
  },
  input: {
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "#FFF7FB",
    borderWidth: 1,
    borderColor: "rgba(255,105,180,0.22)",
    color: "#351024",
    fontSize: 14,
    fontWeight: "700",
  },
  helper: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5B73",
    lineHeight: 18,
  },
  mainButton: {
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: "#FF4FA3",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  mainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  successCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(230,255,240,0.95)",
    borderWidth: 1,
    borderColor: "rgba(0,150,80,0.16)",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#075C36",
    marginBottom: 8,
  },
  successLine: {
    fontSize: 13,
    fontWeight: "700",
    color: "#075C36",
    marginTop: 3,
  },
});
/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/manage-account.tsx
 * 🎯 Purpose: Deactivate/Delete account (separate page, mobile UX)
 * ============================================================================
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { Card, RBZ, ScreenShell, SectionTitle, SmallText } from "../../../src/components/settings/_ui";
import { rbzFetch } from "../../../src/lib/_rbzApi";

export default function ManageAccount() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = useMemo(() => (params?.mode === "delete" ? "delete" : "deactivate"), [params]);

  const [busy, setBusy] = useState(false);

  const hardLogout = async () => {
    await SecureStore.deleteItemAsync("RBZ_TOKEN");
    await SecureStore.deleteItemAsync("RBZ_USER");
    router.replace("/start");
  };

  const doDeactivate = async () => {
    setBusy(true);
    try {
      await rbzFetch("/account/deactivate", { method: "PATCH" });
      Alert.alert("Deactivated", "Your account has been deactivated.");
      await hardLogout();
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to deactivate");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await rbzFetch("/account/delete", { method: "DELETE" });
      Alert.alert("Deleted", "Your account has been deleted.");
      await hardLogout();
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Failed to delete");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell title={mode === "delete" ? "Delete account" : "Deactivate account"}>
      <SectionTitle>Important</SectionTitle>
      <Card>
        {mode === "delete" ? (
          <>
            <Text style={styles.big}>Deleting is permanent.</Text>
            <SmallText>
              This removes your account and data. You can’t undo this.
            </SmallText>
          </>
        ) : (
          <>
            <Text style={styles.big}>Deactivate hides your profile.</Text>
            <SmallText>
              You can return later by logging in again (depending on your backend policy).
            </SmallText>
          </>
        )}

        <Pressable
          onPress={() =>
            Alert.alert(
              mode === "delete" ? "Delete account?" : "Deactivate account?",
              mode === "delete"
                ? "This cannot be undone."
                : "You can reactivate later by logging in.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: mode === "delete" ? "Delete" : "Deactivate",
                  style: "destructive",
                  onPress: mode === "delete" ? doDelete : doDeactivate,
                },
              ]
            )
          }
          style={[styles.dangerBtn, mode === "delete" && { backgroundColor: "rgba(177,18,60,0.35)" }]}
          disabled={busy}
        >
          <Text style={styles.dangerText}>
            {busy ? "Working..." : mode === "delete" ? "Delete now" : "Deactivate now"}
          </Text>
        </Pressable>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  big: { color: RBZ.text, fontWeight: "900", fontSize: 15 },
  dangerBtn: {
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(216,52,95,0.28)",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.35)",
  },
  dangerText: { color: RBZ.text, fontWeight: "900" },
});

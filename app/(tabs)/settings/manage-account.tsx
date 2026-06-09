/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/manage-account.tsx
 * 🎯 Purpose: Delete account page for RomBuzz mobile settings.
 *
 * What this page does:
 * - Shows a permanent delete warning.
 * - Calls /account/delete-preview before deletion.
 * - If the account has BuzzCoins / pending / earned balance, asks the user to
 *   confirm forfeiture before deleting.
 * - Calls DELETE /account/delete.
 * - Sends confirmForfeit only when the user accepted the balance warning.
 * - Clears local auth and sends the user back to /start after deletion.
 *
 * Backend endpoints used:
 * - GET    /account/delete-preview
 * - DELETE /account/delete
 * ============================================================================
 */

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Card,
  RBZ,
  ScreenShell,
  SectionTitle,
  SmallText,
} from "../../../src/components/settings/_ui";
import { rbzFetch } from "../../../src/lib/_rbzApi";

type DeletePreview = {
  success?: boolean;
  holdDays?: number;
  deleteAfter?: string;
  wallet?: {
    balanceBC?: number;
    pendingBC?: number;
    earnedBC?: number;
    totalBC?: number;
    hasBalance?: boolean;
  };
  requiresForfeitConfirmation?: boolean;
};

function safeNumber(value: any) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatBC(value: any) {
  return `${safeNumber(value).toLocaleString()} BC`;
}

export default function ManageAccount() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const hardLogout = async () => {
    await SecureStore.deleteItemAsync("RBZ_TOKEN");
    await SecureStore.deleteItemAsync("RBZ_USER");

    // Keep old fallback keys clean too, in case older app builds used them.
    await SecureStore.deleteItemAsync("token").catch(() => {});
    await SecureStore.deleteItemAsync("user").catch(() => {});

    router.replace("/start");
  };

  const deleteAccount = async (confirmForfeit: boolean) => {
    setBusy(true);

    try {
      await rbzFetch("/account/delete", {
        method: "DELETE",
        body: confirmForfeit ? { confirmForfeit: true } : {},
      });

      Alert.alert(
        "Account Deleted",
        "Your RomBuzz account has been deleted. You can use the email again after 7-days hold period.",
        [
          {
            text: "OK",
            onPress: () => {
              hardLogout();
            },
          },
        ],
      );
    } catch (e: any) {
      const code = String(e?.code || e?.error || "").trim();

      if (code === "BUZZCOIN_FORFEIT_CONFIRMATION_REQUIRED") {
        const wallet = e?.wallet || {};
        showForfeitConfirm(wallet);
        return;
      }

      Alert.alert("Failed", e?.message || "Failed to delete account.");
    } finally {
      setBusy(false);
    }
  };

  const showForfeitConfirm = (wallet: DeletePreview["wallet"]) => {
    const balanceBC = safeNumber(wallet?.balanceBC);
    const pendingBC = safeNumber(wallet?.pendingBC);
    const earnedBC = safeNumber(wallet?.earnedBC);
    const totalBC = safeNumber(wallet?.totalBC || balanceBC + pendingBC + earnedBC);

    Alert.alert(
      "Forfeit BuzzCoins?",
      [
        "You still have BuzzCoins or creator balance on this account.",
        "",
        `Spendable: ${formatBC(balanceBC)}`,
        `Pending: ${formatBC(pendingBC)}`,
        `Earned: ${formatBC(earnedBC)}`,
        `Total: ${formatBC(totalBC)}`,
        "",
        "If you delete your account, this balance will be permanently forfeited and cannot be restored.",
      ].join("\n"),
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "I understand, delete",
          style: "destructive",
          onPress: () => deleteAccount(true),
        },
      ],
    );
  };

  const confirmNormalDelete = () => {
    Alert.alert(
      "Delete account?",
      [
        "This is permanent. There is no restore option.",
        "",
        "Your profile, matches, chats, posts, notifications, Discover presence, MicroBuzz presence, Let’sBuzz activity, Meet in the Middle sessions, and video call history will disappear from RomBuzz.",
        "",
        "You will be able to use the email again after 7-days hold period. After that your account will disappear completely.",
      ].join("\n"),
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () => deleteAccount(false),
        },
      ],
    );
  };

  const startDeleteFlow = async () => {
    if (busy || previewLoading) return;

    setPreviewLoading(true);

    try {
      const preview = await rbzFetch<DeletePreview>("/account/delete-preview", {
        method: "GET",
      });

      const wallet = preview?.wallet || {};
      const requiresForfeit =
        preview?.requiresForfeitConfirmation === true ||
        wallet?.hasBalance === true ||
        safeNumber(wallet?.totalBC) > 0 ||
        safeNumber(wallet?.balanceBC) > 0 ||
        safeNumber(wallet?.pendingBC) > 0 ||
        safeNumber(wallet?.earnedBC) > 0;

      if (requiresForfeit) {
        showForfeitConfirm(wallet);
        return;
      }

      confirmNormalDelete();
    } catch (e: any) {
      Alert.alert(
        "Failed",
        e?.message || "Could not prepare account deletion. Please try again.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const isWorking = busy || previewLoading;

  return (
    <ScreenShell title="Delete account">
      <SectionTitle>Important</SectionTitle>

      <Card>
        <View style={styles.warningBadge}>
          <Text style={styles.warningIcon}>⚠️</Text>
        </View>

        <Text style={styles.big}>Deleting is permanent.</Text>

        <SmallText>
          Your account will disappear from RomBuzz immediately. Your email will
          be held for 7 days before you can use the email again.
        </SmallText>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What gets removed?</Text>

          <Text style={styles.infoText}>
            Profile, photos, matches, chats, messages, notifications, Discover,
            MicroBuzz, Let’sBuzz activity, Meet in the Middle sessions, and video
            call history.
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>BuzzCoin balance</Text>

          <Text style={styles.infoText}>
            If your account has any BuzzCoins, pending balance, or earned
            balance, you’ll be asked to confirm that it will be permanently
            forfeited before deletion continues.
          </Text>
        </View>

        <Pressable
          onPress={startDeleteFlow}
          style={({ pressed }) => [
            styles.dangerBtn,
            pressed && styles.pressed,
            isWorking && styles.disabledBtn,
          ]}
          disabled={isWorking}
        >
          {isWorking ? (
            <ActivityIndicator size="small" color={RBZ.text} />
          ) : (
            <Text style={styles.dangerText}>Delete now</Text>
          )}
        </Pressable>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  warningBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(177,18,60,0.10)",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.20)",
    marginBottom: 12,
  },

  warningIcon: {
    fontSize: 22,
  },

  big: {
    color: RBZ.text,
    fontWeight: "900",
    fontSize: 17,
    marginBottom: 6,
  },

  infoBox: {
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 12,
    backgroundColor: "rgba(177,18,60,0.06)",
    borderWidth: 1,
    borderColor: "rgba(177,18,60,0.12)",
  },

  infoTitle: {
    color: RBZ.text,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 4,
  },

  infoText: {
    color: RBZ.muted,
    fontSize: 12.5,
    fontWeight: "700",
    lineHeight: 18,
  },

  dangerBtn: {
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 13,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(177,18,60,0.35)",
    borderWidth: 1,
    borderColor: "rgba(233,72,106,0.45)",
  },

  dangerText: {
    color: RBZ.text,
    fontWeight: "900",
    fontSize: 14,
  },

  pressed: {
    opacity: 0.78,
  },

  disabledBtn: {
    opacity: 0.65,
  },
});
/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/manage-account.tsx
 * 🎯 Purpose: Permanent RomBuzz account deletion flow.
 *
 * Responsibilities:
 * - Load deletion preview before destructive confirmation.
 * - Show BuzzCoin / creator-balance forfeiture when applicable.
 * - Start the backend's irreversible pending-deletion lifecycle.
 * - Clear local authentication after deletion begins.
 * - Keep user-facing copy aligned with the backend's 7-day hold and retries.
 *
 * Backend endpoints:
 * - GET    /account/delete-preview
 * - DELETE /account/delete
 * ============================================================================
 */

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";

import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRomBuzzTheme } from "@/src/design/RomBuzzThemeProvider";
import { RBZFont } from "@/src/design/rombuzzTypography";
import { SettingsButton } from "@/src/components/settings/SettingsControls";
import { useSettingsAlert } from "@/src/components/settings/SettingsDialog";

import { Card, ScreenShell, SectionTitle, SmallText } from "../../../src/components/settings/_ui";

import { rbzFetch } from "../../../src/lib/_rbzApi";

type DeleteResult = {
  cleanup?: {
    apple?: {
      revoked?: boolean;
      manualRevocationRequired?: boolean;
    };
  };
};

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
  const { colors } = useRomBuzzTheme();
  const alert = useSettingsAlert();
  const router = useRouter();

  const [busy, setBusy] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);

  const hardLogout = async () => {
    await Promise.allSettled([
      SecureStore.deleteItemAsync("RBZ_TOKEN"),

      SecureStore.deleteItemAsync("RBZ_USER"),

      SecureStore.deleteItemAsync("token"),

      SecureStore.deleteItemAsync("user"),
    ]);

    router.replace("/start");
  };

  const showForfeitConfirm = (wallet: DeletePreview["wallet"]) => {
    const balanceBC = safeNumber(wallet?.balanceBC);

    const pendingBC = safeNumber(wallet?.pendingBC);

    const earnedBC = safeNumber(wallet?.earnedBC);

    const totalBC = safeNumber(wallet?.totalBC || balanceBC + pendingBC + earnedBC);

    alert(
      "Forfeit BuzzCoins?",

      [
        "You still have BuzzCoins or creator balance on this account.",
        "",

        `Spendable: ${formatBC(balanceBC)}`,

        `Pending: ${formatBC(pendingBC)}`,

        `Earned: ${formatBC(earnedBC)}`,

        `Total: ${formatBC(totalBC)}`,

        "",

        "If you continue, this balance will be permanently forfeited and cannot be restored.",
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

  const deleteAccount = async (confirmForfeit: boolean) => {
    setBusy(true);

    try {
      const result = await rbzFetch<DeleteResult>("/account/delete", {
        method: "DELETE",

        body: confirmForfeit
          ? {
              confirmForfeit: true,
            }
          : {},
      });

      const manualAppleRevocation = result?.cleanup?.apple?.manualRevocationRequired === true;

      const deletionMessage = manualAppleRevocation
        ? [
            "Your RomBuzz profile is no longer available to other users. Your email remains on a 7-day deletion hold while final cleanup completes.",
            "",
            "This account used an older Sign in with Apple authorization. Please also remove RomBuzz from Sign in with Apple in your Apple Account settings.",
          ].join("\n")
        : "Your RomBuzz profile is no longer available to other users. Your email remains on a 7-day deletion hold while final cleanup completes.";

      alert(
        "Deletion started",

        deletionMessage,

        [
          {
            text: "OK",

            onPress: () => {
              void hardLogout();
            },
          },
        ],
      );
    } catch (e: any) {
      const code = String(e?.code || e?.error || "").trim();

      if (code === "BUZZCOIN_FORFEIT_CONFIRMATION_REQUIRED") {
        showForfeitConfirm(e?.wallet || e?.payload?.wallet || {});

        return;
      }

      alert(
        "Deletion failed",

        e?.message || "Failed to start account deletion. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmNormalDelete = () => {
    alert(
      "Delete account?",

      [
        "This is permanent. There is no restore option.",
        "",

        "Your profile will be removed from normal RomBuzz experiences immediately.",
        "",

        "RomBuzz uses a 7-day deletion hold. Final cleanup may complete after that hold if an external service cleanup must be retried.",
        "",

        "Limited safety, fraud, support, financial, or legal records may be retained where necessary.",
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
    if (busy || previewLoading) {
      return;
    }

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
      alert(
        "Deletion unavailable",

        e?.message || "Could not prepare account deletion. Please try again.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const isWorking = busy || previewLoading;

  return (
    <ScreenShell title="Delete account">
      <SectionTitle>Before you continue</SectionTitle>
      <Card>
        <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="trash-outline" size={22} color={colors.iconMuted} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Deleting is permanent.</Text>
        <SmallText>
          Your profile will disappear from normal RomBuzz experiences when deletion begins. Your email is then
          held for 7 days while final deletion processing continues.
        </SmallText>
        <View style={[styles.info, { borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>What is removed?</Text>
          <SmallText>
            Profile and supported media, matches, chats, messages, notifications, Discover presence, MicroBuzz
            data, Let&apos;sBuzz activity, Meet in the Middle sessions, and video-call history are removed or
            scheduled for cleanup through the deletion process.
          </SmallText>
        </View>
        <View style={[styles.info, { borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>What may be retained?</Text>
          <SmallText>
            Limited records may be retained where needed for safety, moderation, fraud prevention, support,
            financial/accounting, or legal obligations. Eligible retained audit records may be detached from
            the active account.
          </SmallText>
        </View>
        <View style={[styles.info, { borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>BuzzCoin balance</Text>
          <SmallText>
            If your account has BuzzCoins, pending balance, or earned balance, you will be asked to confirm
            permanent forfeiture before deletion continues.
          </SmallText>
        </View>
        <SettingsButton
          label={previewLoading ? "Preparing deletion…" : busy ? "Deleting account…" : "Delete account"}
          variant="danger"
          onPress={startDeleteFlow}
          busy={isWorking}
        />
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontFamily: RBZFont.extraBold, letterSpacing: -0.4 },
  info: { marginTop: 18, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth },
  infoTitle: { fontSize: 14, fontFamily: RBZFont.bold },
});

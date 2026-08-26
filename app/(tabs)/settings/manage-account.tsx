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

import {
  rbzFetch,
} from "../../../src/lib/_rbzApi";

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

  return Number.isFinite(n)
    ? n
    : 0;
}

function formatBC(value: any) {
  return `${safeNumber(
    value,
  ).toLocaleString()} BC`;
}

export default function ManageAccount() {
  const router = useRouter();

  const [busy, setBusy] =
    useState(false);

  const [
    previewLoading,
    setPreviewLoading,
  ] = useState(false);

  const hardLogout = async () => {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(
        "RBZ_TOKEN",
      ),

      SecureStore.deleteItemAsync(
        "RBZ_USER",
      ),

      SecureStore.deleteItemAsync(
        "token",
      ),

      SecureStore.deleteItemAsync(
        "user",
      ),
    ]);

    router.replace("/start");
  };

  const showForfeitConfirm = (
    wallet: DeletePreview["wallet"],
  ) => {
    const balanceBC =
      safeNumber(wallet?.balanceBC);

    const pendingBC =
      safeNumber(wallet?.pendingBC);

    const earnedBC =
      safeNumber(wallet?.earnedBC);

    const totalBC =
      safeNumber(
        wallet?.totalBC ||
          balanceBC +
            pendingBC +
            earnedBC,
      );

    Alert.alert(
      "Forfeit BuzzCoins?",

      [
        "You still have BuzzCoins or creator balance on this account.",
        "",

        `Spendable: ${formatBC(
          balanceBC,
        )}`,

        `Pending: ${formatBC(
          pendingBC,
        )}`,

        `Earned: ${formatBC(
          earnedBC,
        )}`,

        `Total: ${formatBC(
          totalBC,
        )}`,

        "",

        "If you continue, this balance will be permanently forfeited and cannot be restored.",
      ].join("\n"),

      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text:
            "I understand, delete",

          style: "destructive",

          onPress: () =>
            deleteAccount(true),
        },
      ],
    );
  };

  const deleteAccount = async (
    confirmForfeit: boolean,
  ) => {
    setBusy(true);

    try {
      const result =
        await rbzFetch<DeleteResult>(
          "/account/delete",
          {
            method: "DELETE",

            body: confirmForfeit
              ? {
                  confirmForfeit:
                    true,
                }
              : {},
          },
        );

      const manualAppleRevocation =
        result?.cleanup?.apple
          ?.manualRevocationRequired ===
        true;

      const deletionMessage =
        manualAppleRevocation
          ? [
              "Your RomBuzz profile is no longer available to other users. Your email remains on a 7-day deletion hold while final cleanup completes.",
              "",
              "This account used an older Sign in with Apple authorization. Please also remove RomBuzz from Sign in with Apple in your Apple Account settings.",
            ].join("\n")
          : "Your RomBuzz profile is no longer available to other users. Your email remains on a 7-day deletion hold while final cleanup completes.";

      Alert.alert(
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
      const code =
        String(
          e?.code ||
            e?.error ||
            "",
        ).trim();

      if (
        code ===
        "BUZZCOIN_FORFEIT_CONFIRMATION_REQUIRED"
      ) {
        showForfeitConfirm(
          e?.wallet ||
            e?.payload?.wallet ||
            {},
        );

        return;
      }

      Alert.alert(
        "Deletion failed",

        e?.message ||
          "Failed to start account deletion. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmNormalDelete = () => {
    Alert.alert(
      "Delete account?",

      [
        "This is permanent. There is no restore option.",
        "",

        "Your profile will be removed from normal RomBuzz experiences immediately.",
        "",

        "RomBuzz uses a 7-day deletion hold. Final cleanup may complete after that hold if an external service cleanup must be retried.",        "",

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

          onPress: () =>
            deleteAccount(false),
        },
      ],
    );
  };

  const startDeleteFlow =
    async () => {
      if (
        busy ||
        previewLoading
      ) {
        return;
      }

      setPreviewLoading(true);

      try {
        const preview =
          await rbzFetch<DeletePreview>(
            "/account/delete-preview",
            {
              method: "GET",
            },
          );

        const wallet =
          preview?.wallet || {};

        const requiresForfeit =
          preview
            ?.requiresForfeitConfirmation ===
            true ||
          wallet?.hasBalance === true ||
          safeNumber(
            wallet?.totalBC,
          ) > 0 ||
          safeNumber(
            wallet?.balanceBC,
          ) > 0 ||
          safeNumber(
            wallet?.pendingBC,
          ) > 0 ||
          safeNumber(
            wallet?.earnedBC,
          ) > 0;

        if (requiresForfeit) {
          showForfeitConfirm(
            wallet,
          );

          return;
        }

        confirmNormalDelete();
      } catch (e: any) {
        Alert.alert(
          "Deletion unavailable",

          e?.message ||
            "Could not prepare account deletion. Please try again.",
        );
      } finally {
        setPreviewLoading(
          false,
        );
      }
    };

  const isWorking =
    busy ||
    previewLoading;

  return (
    <ScreenShell title="Delete account">
      <SectionTitle>
        Important
      </SectionTitle>

      <Card>
        <View
          style={
            styles.warningBadge
          }
        >
          <Text
            style={
              styles.warningIcon
            }
          >
            ⚠️
          </Text>
        </View>

        <Text
          style={styles.big}
        >
          Deleting is permanent.
        </Text>

        <SmallText>
          Your profile will disappear
          from normal RomBuzz
          experiences when deletion
          begins. Your email is then
          held for 7 days while final
          deletion processing
          continues.
        </SmallText>

        <View
          style={styles.infoBox}
        >
          <Text
            style={
              styles.infoTitle
            }
          >
            What is removed?
          </Text>

          <Text
            style={
              styles.infoText
            }
          >
            Profile and supported
            media, matches, chats,
            messages, notifications,
            Discover presence,
            MicroBuzz data,
            Let&apos;sBuzz activity,
            Meet in the Middle
            sessions, and video-call
            history are removed or
            scheduled for cleanup
            through the deletion
            process.
          </Text>
        </View>

        <View
          style={styles.infoBox}
        >
          <Text
            style={
              styles.infoTitle
            }
          >
            What may be retained?
          </Text>

          <Text
            style={
              styles.infoText
            }
          >
            Limited records may be
            retained where needed for
            safety, moderation, fraud
            prevention, support,
            financial/accounting, or
            legal obligations.
            Eligible retained audit
            records may be detached
            from the active account.
          </Text>
        </View>

        <View
          style={styles.infoBox}
        >
          <Text
            style={
              styles.infoTitle
            }
          >
            BuzzCoin balance
          </Text>

          <Text
            style={
              styles.infoText
            }
          >
            If your account has
            BuzzCoins, pending balance,
            or earned balance, you will
            be asked to confirm
            permanent forfeiture before
            deletion continues.
          </Text>
        </View>

        <Pressable
          onPress={
            startDeleteFlow
          }

          style={({
            pressed,
          }) => [
            styles.dangerBtn,

            pressed &&
              styles.pressed,

            isWorking &&
              styles.disabledBtn,
          ]}

          disabled={
            isWorking
          }
        >
          {isWorking ? (
            <ActivityIndicator
              size="small"
              color={RBZ.text}
            />
          ) : (
            <Text
              style={
                styles.dangerText
              }
            >
              Delete now
            </Text>
          )}
        </Pressable>
      </Card>
    </ScreenShell>
  );
}

const styles =
  StyleSheet.create({
    warningBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(177,18,60,0.10)",

      borderWidth: 1,

      borderColor:
        "rgba(177,18,60,0.20)",

      marginBottom: 12,
    },

    warningIcon: {
      fontSize: 22,
    },

    big: {
      color: RBZ.text,

      fontWeight:
        "900",

      fontSize: 17,

      marginBottom: 6,
    },

    infoBox: {
      marginTop: 14,

      borderRadius: 16,

      paddingHorizontal:
        13,

      paddingVertical:
        12,

      backgroundColor:
        "rgba(177,18,60,0.06)",

      borderWidth: 1,

      borderColor:
        "rgba(177,18,60,0.12)",
    },

    infoTitle: {
      color: RBZ.text,

      fontSize: 13,

      fontWeight:
        "900",

      marginBottom: 4,
    },

    infoText: {
      color: RBZ.muted,

      fontSize: 12.5,

      fontWeight:
        "700",

      lineHeight: 18,
    },

    dangerBtn: {
      marginTop: 16,

      borderRadius: 16,

      paddingVertical:
        13,

      minHeight: 48,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(177,18,60,0.35)",

      borderWidth: 1,

      borderColor:
        "rgba(233,72,106,0.45)",
    },

    dangerText: {
      color: RBZ.text,

      fontWeight:
        "900",

      fontSize: 14,
    },

    pressed: {
      opacity: 0.78,
    },

    disabledBtn: {
      opacity: 0.65,
    },
  });
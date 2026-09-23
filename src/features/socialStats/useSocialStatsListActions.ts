import { perfTap } from "@/src/performance/diagnostics/core";
/**
 * Path: src/features/socialStats/useSocialStatsListActions.ts
 * Purpose: Preserve existing Social Stats list actions while the UI is redesigned.
 */

import {
    useRouter,
} from "expo-router";

import {
    useState,
} from "react";

import {
    Alert,
} from "react-native";

import {
    rbzApiJson,
} from "@/src/performance/api/rbzApiClient";

import {
    SocialStatsTab,
    SocialStatsUser,
    socialUserId,
} from "./socialStatsTypes";

export function useSocialStatsListActions({
  activeTab,
  onClose,
  onRefresh,
}: {
  activeTab:
    | SocialStatsTab
    | null;

  onClose: () => void;

  onRefresh: () => void;
}) {
  const router =
    useRouter();

  const [
    reportSheetOpen,
    setReportSheetOpen,
  ] = useState(false);

  const [
    reportUser,
    setReportUser,
  ] =
    useState<
      SocialStatsUser | null
    >(null);

  const viewProfile = (
    userId: string
  ) => {
    onClose();

    const target =
      activeTab ===
      "matches"
        ? "/view-profile"
        : "/discover-profile";

    perfTap(target === "/view-profile" ? "view-profile" : "discover-profile");
    router.push({
      pathname: target,

      params:
        activeTab ===
        "matches"
          ? {
              id: userId,

              fromMatches:
                "1",

              returnTo:
                "/social-stats",
            }
          : {
              id: userId,
            },
    });
  };

  const chat = (
    userId: string
  ) => {
    onClose();

    router.push({
      pathname:
        "/chat/[peerId]",

      params: {
        peerId:
          userId,
      },
    });
  };

  const respondLike =
    async (
      fromId: string,

      action:
        | "accept"
        | "reject"
    ) => {
      try {
        const response =
          await rbzApiJson(
            "/likes/respond",
            {
              method:
                "POST",

              body:
                JSON.stringify(
                  {
                    fromId,
                    action,
                  }
                ),
            }
          );

        if (
          response.success
        ) {
          Alert.alert(
            action ===
              "accept"
              ? "✅ Match Created!"
              : "👍 Request Removed",

            action ===
              "accept"
              ? "You've matched! You can now chat with them."
              : "The like request has been removed.",

            [
              {
                text: "OK",

                onPress:
                  onRefresh,
              },
            ]
          );
        }
      } catch {
        Alert.alert(
          "Error",
          "Failed to process request. Please try again."
        );
      }
    };

  const unmatch = (
    userId: string,
    userName: string
  ) => {
    Alert.alert(
      "Unmatch",

      `Are you sure you want to unmatch with ${userName}?`,

      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Unmatch",

          style:
            "destructive",

          onPress:
            async () => {
              try {
                await rbzApiJson(
                  `/unmatch/${userId}`,
                  {
                    method:
                      "POST",
                  }
                );

                Alert.alert(
                  "Unmatched",

                  "You are no longer matched.",

                  [
                    {
                      text:
                        "OK",

                      onPress:
                        onRefresh,
                    },
                  ]
                );
              } catch {
                Alert.alert(
                  "Error",
                  "Failed to unmatch. Please try again."
                );
              }
            },
        },
      ]
    );
  };

  const cancelLike = (
    userId: string,
    userName: string
  ) => {
    Alert.alert(
      "Cancel Like",

      `Remove your like for ${userName}?`,

      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text:
            "Remove Like",

          style:
            "destructive",

          onPress:
            async () => {
              try {
                await rbzApiJson(
                  `/unmatch/${userId}`,
                  {
                    method:
                      "POST",
                  }
                );

                Alert.alert(
                  "Removed",

                  `${userName} has been removed from your likes.`,

                  [
                    {
                      text:
                        "OK",

                      onPress:
                        onRefresh,
                    },
                  ]
                );
              } catch {
                Alert.alert(
                  "Error",
                  "Failed to remove like. Please try again."
                );
              }
            },
        },
      ]
    );
  };

  const report = (
    user: SocialStatsUser
  ) => {
    const targetId =
      socialUserId(user);

    const displayName =
      [
        user?.firstName,
        user?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      String(
        user?.name ||
          "User"
      );

    if (!targetId) {
      Alert.alert(
        "Report",
        "Missing user id."
      );

      return;
    }

    setReportUser({
      ...user,

      id: targetId,

      displayName,
    });

    setReportSheetOpen(
      true
    );
  };

  const closeReport =
    () => {
      setReportSheetOpen(
        false
      );

      setReportUser(
        null
      );
    };

  return {
    reportSheetOpen,
    reportUser,

    closeReport,

    viewProfile,
    chat,

    respondLike,
    unmatch,
    cancelLike,
    report,
  };
}

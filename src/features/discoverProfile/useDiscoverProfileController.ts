/**
 * Path: src/features/discoverProfile/useDiscoverProfileController.ts
 * Purpose: Own Discover Profile loading, refresh, relationship state, and existing actions.
 * Used by: DiscoverProfileScreen.tsx.
 */

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";

import {
  fetchDiscoverProfile,
  fetchDiscoverRelationshipStatus,
  respondDiscoverMatchRequest,
  sendDiscoverMatchRequest,
  type DiscoverProfilePreview,
  type RelationshipMode,
  type RelationshipStatus,
} from "./discoverProfileApi";

type Args = {
  userId: string;
  returnTo: string;
  previewUser: DiscoverProfilePreview;
  profilePreviewMode?: "before";
};

export function useDiscoverProfileController({
  userId,
  returnTo,
  previewUser,
  profilePreviewMode,
}: Args) {
  const router = useRouter();

  const isProfilePreview =
    profilePreviewMode === "before";

  const [user, setUser] =
    useState<any>(
      previewUser ||
        null
    );

  const [
    loading,
    setLoading,
  ] = useState(
    !previewUser
  );

  const tokenRef =
    useRef("");

  const [
    relationshipStatus,
    setRelationshipStatus,
  ] =
    useState<RelationshipStatus | null>(
      null
    );

  const [
    statusLoading,
    setStatusLoading,
  ] =
    useState(
      !isProfilePreview
    );

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState(false);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const getToken =
    useCallback(
      async () => {
        if (
          tokenRef.current
        ) {
          return tokenRef.current;
        }

        const stored =
          (await SecureStore.getItemAsync(
            "RBZ_TOKEN"
          )) || "";

        if (stored) {
          tokenRef.current =
            stored;
        }

        return stored;
      },
      []
    );

  const loadProfile =
    useCallback(
      async (
        showSpinner = true
      ) => {
        if (!userId) {
          return;
        }

        try {
          if (
            showSpinner
          ) {
            setLoading(
              true
            );
          }

          const stored =
            await getToken();

          if (!stored) {
            return;
          }

          const next =
            await fetchDiscoverProfile(
              userId,
              stored
            );

          if (next) {
            setUser(next);
          }
        } catch (err) {
          console.warn(
            "Discover profile load failed:",
            err
          );
        } finally {
          if (
            showSpinner
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        getToken,
        userId,
      ]
    );

  const loadRelationshipStatus =
    useCallback(
      async () => {
        if (
          !userId ||
          isProfilePreview
        ) {
          setRelationshipStatus(
            null
          );

          setStatusLoading(
            false
          );

          return;
        }

        try {
          setStatusLoading(
            true
          );

          const stored =
            await getToken();

          if (!stored) {
            return;
          }

          setRelationshipStatus(
            await fetchDiscoverRelationshipStatus(
              userId,
              stored
            )
          );
        } catch (err) {
          console.warn(
            "Discover profile status failed:",
            err
          );

          setRelationshipStatus(
            {
              likedByMe:
                false,

              likedMe:
                false,

              matched:
                false,
            }
          );
        } finally {
          setStatusLoading(
            false
          );
        }
      },
      [
        getToken,
        isProfilePreview,
        userId,
      ]
    );

  useEffect(() => {
    loadProfile(true);
    loadRelationshipStatus();
  }, [
    loadProfile,
    loadRelationshipStatus,
  ]);

  const relationshipMode =
    useMemo<RelationshipMode>(
      () => {
        if (
          isProfilePreview
        ) {
          return "discover";
        }

        if (
          statusLoading
        ) {
          return "loading";
        }

        if (
          relationshipStatus
            ?.matched
        ) {
          return "matched";
        }

        if (
          relationshipStatus
            ?.likedMe
        ) {
          return "incoming";
        }

        if (
          relationshipStatus
            ?.likedByMe
        ) {
          return "requested";
        }

        return "discover";
      },
      [
        isProfilePreview,
        relationshipStatus,
        statusLoading,
      ]
    );

  const goBack =
    useCallback(() => {
      router.replace(
        returnTo as any
      );
    }, [
      returnTo,
      router,
    ]);

  const goToMatchedProfile =
    useCallback(() => {
      router.replace(
        `/view-profile?id=${encodeURIComponent(
          userId
        )}&returnTo=${encodeURIComponent(
          returnTo
        )}` as any
      );
    }, [
      returnTo,
      router,
      userId,
    ]);

  const sendRequest =
    useCallback(
      async () => {
        if (
          isProfilePreview ||
          !userId ||
          actionLoading
        ) {
          return;
        }

        try {
          setActionLoading(
            true
          );

          const stored =
            await getToken();

          if (!stored) {
            return Alert.alert(
              "Login required",
              "Please log in again."
            );
          }

          const {
            ok,
            data,
          } =
            await sendDiscoverMatchRequest(
              userId,
              stored
            );

          if (!ok) {
            if (
              data?.error ===
              "already liked"
            ) {
              setRelationshipStatus(
                (prev) => ({
                  likedByMe:
                    true,

                  likedMe:
                    !!prev
                      ?.likedMe,

                  matched:
                    !!prev
                      ?.matched,
                })
              );

              return;
            }

            return Alert.alert(
              "Could not send request",
              data?.error ||
                "Please try again."
            );
          }

          if (
            data?.matched
          ) {
            setRelationshipStatus(
              {
                likedByMe:
                  false,

                likedMe:
                  false,

                matched:
                  true,
              }
            );

            goToMatchedProfile();

            return;
          }

          setRelationshipStatus(
            {
              likedByMe:
                true,

              likedMe:
                false,

              matched:
                false,
            }
          );
        } catch (err) {
          console.warn(
            "Send match request failed:",
            err
          );

          Alert.alert(
            "Could not send request",
            "Please try again."
          );
        } finally {
          setActionLoading(
            false
          );
        }
      },
      [
        actionLoading,
        getToken,
        goToMatchedProfile,
        isProfilePreview,
        userId,
      ]
    );

  const respond =
    useCallback(
      async (
        action:
          | "accept"
          | "reject"
      ) => {
        if (
          isProfilePreview ||
          !userId ||
          actionLoading
        ) {
          return;
        }

        try {
          setActionLoading(
            true
          );

          const stored =
            await getToken();

          if (!stored) {
            return Alert.alert(
              "Login required",
              "Please log in again."
            );
          }

          const {
            ok,
            data,
          } =
            await respondDiscoverMatchRequest(
              userId,
              stored,
              action
            );

          if (!ok) {
            return Alert.alert(
              "Could not update request",
              data?.error ||
                "Please try again."
            );
          }

          if (
            action ===
            "accept"
          ) {
            setRelationshipStatus(
              {
                likedByMe:
                  false,

                likedMe:
                  false,

                matched:
                  true,
              }
            );

            goToMatchedProfile();
          } else {
            setRelationshipStatus(
              {
                likedByMe:
                  false,

                likedMe:
                  false,

                matched:
                  false,
              }
            );

            goBack();
          }
        } catch (err) {
          console.warn(
            "Respond match request failed:",
            err
          );

          Alert.alert(
            "Could not update request",
            "Please try again."
          );
        } finally {
          setActionLoading(
            false
          );
        }
      },
      [
        actionLoading,
        getToken,
        goBack,
        goToMatchedProfile,
        isProfilePreview,
        userId,
      ]
    );

  const primaryAction =
    useCallback(() => {
      if (
        isProfilePreview
      ) {
        return;
      }

      if (
        relationshipMode ===
        "incoming"
      ) {
        return void respond(
          "accept"
        );
      }

      if (
        relationshipMode ===
        "discover"
      ) {
        return void sendRequest();
      }

      if (
        relationshipMode ===
        "matched"
      ) {
        goToMatchedProfile();
      }
    }, [
      goToMatchedProfile,
      isProfilePreview,
      relationshipMode,
      respond,
      sendRequest,
    ]);

  const secondaryAction =
    useCallback(() => {
      if (
        isProfilePreview
      ) {
        return;
      }

      if (
        relationshipMode ===
        "incoming"
      ) {
        return void respond(
          "reject"
        );
      }

      goBack();
    }, [
      goBack,
      isProfilePreview,
      relationshipMode,
      respond,
    ]);

  const refresh =
    useCallback(
      async () => {
        if (
          !userId ||
          refreshing
        ) {
          return;
        }

        try {
          setRefreshing(
            true
          );

          await Promise.allSettled(
            isProfilePreview
              ? [
                  loadProfile(
                    false
                  ),
                ]
              : [
                  loadProfile(
                    false
                  ),

                  loadRelationshipStatus(),
                ]
          );
        } finally {
          setRefreshing(
            false
          );
        }
      },
      [
        isProfilePreview,
        loadProfile,
        loadRelationshipStatus,
        refreshing,
        userId,
      ]
    );

  return {
    user,
    loading,
    refreshing,
    relationshipMode,
    actionLoading,

    refresh,
    goBack,
    goToMatchedProfile,
    sendRequest,
    respond,
    primaryAction,
    secondaryAction,
  };
}
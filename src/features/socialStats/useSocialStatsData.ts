import { usePerfContent } from "@/src/performance/diagnostics/screens";
import { perfState } from "@/src/performance/diagnostics/core";
/**
 * Path: src/features/socialStats/useSocialStatsData.ts
 * Purpose: Preserve Social Stats caching, refresh, polling, list loading, and auth behavior.
 */

import {
    useFocusEffect,
    useRouter,
} from "expo-router";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    DeviceEventEmitter,
} from "react-native";

import {
    useCachedSocialStats,
} from "@/src/features/performance/useCachedSocialStats";

import {
    EMPTY_SOCIAL_STATS,
    SocialStatsCounts,
    SocialStatsTab,
    SocialStatsUser,
} from "./socialStatsTypes";

export function useSocialStatsData() {
  const router =
    useRouter();

  const socialPerf =
    useCachedSocialStats();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    social,
    setSocial,
  ] =
    useState<SocialStatsCounts>(
      EMPTY_SOCIAL_STATS
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<
      SocialStatsTab | null
    >(null);

  const [
    list,
    setList,
  ] =
    useState<
      SocialStatsUser[]
    >([]);

  const [
    listLoading,
    setListLoading,
  ] = useState(false);

  const [
    likedYouPreview,
    setLikedYouPreview,
  ] =
    useState<
      SocialStatsUser[]
    >([]);

  const diagnosticReady = useRef(false);
  usePerfContent("social-stats", diagnosticReady.current, undefined, social);

  const pollRef =
    useRef<
      ReturnType<
        typeof setInterval
      > | null
    >(null);

  const hydratedCacheRef =
    useRef(false);

  const fetchInFlightRef =
    useRef(false);

  const hydrateCachedSocial =
    useCallback(
      async () => {
        if (
          hydratedCacheRef.current
        ) {
          return false;
        }

        hydratedCacheRef.current =
          true;

        const [
          cached,
          preview,
        ] =
          await Promise.all([
            socialPerf.readCachedSocialStats(),

            socialPerf.readCachedSocialList(
              "likedYou"
            ),
          ]);

        if (preview.hit) {
          setLikedYouPreview(
            preview.list.slice(
              0,
              4
            )
          );
        }

        if (!cached.hit) {
          return false;
        }

        diagnosticReady.current = true;
        perfState("social-stats", "cache");
        setSocial(
          cached.social
        );

        setLoading(false);

        return true;

        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      []
    );

  const openList =
    useCallback(
      async (
        type:
          SocialStatsTab
      ) => {
        setActiveTab(type);

        const cached =
          await socialPerf.readCachedSocialList(
            type
          );

        if (cached.hit) {
          setList(
            cached.list
          );

          setListLoading(
            false
          );

          if (
            type ===
            "likedYou"
          ) {
            setLikedYouPreview(
              cached.list.slice(
                0,
                4
              )
            );
          }
        } else {
          setList([]);

          setListLoading(
            true
          );
        }

        try {
          const freshList =
            await socialPerf.fetchSocialListFresh(
              type
            );

          setList(
            freshList
          );

          if (
            type ===
            "likedYou"
          ) {
            setLikedYouPreview(
              freshList.slice(
                0,
                4
              )
            );
          }
        } catch (error) {
          console.error(
            "openList error",
            error
          );

          if (!cached.hit) {
            setList([]);
          }
        } finally {
          setListLoading(
            false
          );
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      []
    );

  const fetchAll =
    useCallback(
      async (
        showSpinner:
          boolean
      ) => {
        if (
          fetchInFlightRef.current
        ) {
          return;
        }

        fetchInFlightRef.current =
          true;

        try {
          const hadCache =
            await hydrateCachedSocial();

          if (
            showSpinner &&
            !hadCache
          ) {
            setLoading(
              true
            );
          }

          const fresh =
            await socialPerf.fetchSocialStatsFresh();

          diagnosticReady.current = true;
          perfState("social-stats", "fresh");
          setSocial(
            (prev) =>
              JSON.stringify(
                prev
              ) ===
              JSON.stringify(
                fresh
              )
                ? prev
                : fresh
          );
        } catch (
          error: any
        ) {
          if (
            error?.message ===
            "NO_TOKEN"
          ) {
            router.replace(
              "/auth/login"
            );

            return;
          }

          console.error(
            "SocialStats error:",
            error
          );
        } finally {
          fetchInFlightRef.current =
            false;

          setLoading(false);
        }
      },
      [
        hydrateCachedSocial,
        router,
        // eslint-disable-next-line react-hooks/exhaustive-deps
      ]
    );

  const onRefresh =
    useCallback(
      async () => {
        setRefreshing(
          true
        );

        await fetchAll(
          false
        );

        if (activeTab) {
          await openList(
            activeTab
          );
        }

        setRefreshing(
          false
        );
      },
      [
        activeTab,
        fetchAll,
        openList,
      ]
    );

  const closeModal =
    useCallback(() => {
      setActiveTab(null);
      setList([]);
    }, []);

  useEffect(() => {
    const sub =
      DeviceEventEmitter.addListener(
        "rbz:social-stats:warmed",
        (payload: any) => {
          if (
            payload?.social
          ) {
            diagnosticReady.current = true;
            perfState("social-stats", "fresh");
            setSocial(
              payload.social
            );
          }
        }
      );

    return () =>
      sub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      hydrateCachedSocial().finally(
        () =>
          fetchAll(false)
      );

      pollRef.current =
        setInterval(
          () =>
            fetchAll(
              false
            ),
          60_000
        );

      return () => {
        if (
          pollRef.current
        ) {
          clearInterval(
            pollRef.current
          );
        }

        pollRef.current =
          null;
      };
    }, [
      fetchAll,
      hydrateCachedSocial,
    ])
  );

  return {
    loading,
    refreshing,
    social,

    activeTab,
    list,
    listLoading,

    likedYouPreview,

    openList,
    onRefresh,
    closeModal,
  };
}
/**
 * Path: app/(tabs)/filter.tsx
 * Purpose: Discover Filters route, persistence, and navigation wiring.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

import {
  loadSavedDiscoverFilters,
  saveDiscoverFilters,
} from "@/src/features/discover/discoverFilterStorage";

import DiscoverFilterScreen from "@/src/features/discoverFilters/DiscoverFilterScreen";

import {
  DEFAULT_FILTERS,
  normalizeFilterState,
  parseIncoming,
  type DiscoverFilters,
} from "@/src/features/discoverFilters/discoverFilterModel";

export default function FilterScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      discoverFilters?: string;
    }>();

  const incoming = useMemo(
    () =>
      parseIncoming(
        params.discoverFilters
      ),
    [params.discoverFilters]
  );

  const [
    filters,
    setFilters,
  ] =
    useState<DiscoverFilters>(
      incoming
    );

  useEffect(() => {
    let alive = true;

    const restoreSavedFilters =
      async () => {
        if (
          typeof params.discoverFilters ===
            "string" &&
          params.discoverFilters.trim()
        ) {
          setFilters(incoming);
          return;
        }

        const saved =
          normalizeFilterState(
            await loadSavedDiscoverFilters(
              DEFAULT_FILTERS
            )
          );

        if (alive) {
          setFilters(saved);
        }
      };

    restoreSavedFilters();

    return () => {
      alive = false;
    };
  }, [
    incoming,
    params.discoverFilters,
  ]);

  const resetAll = () => {
    setFilters({
      ...DEFAULT_FILTERS,
    });
  };

  const applyFilters =
    async () => {
      await saveDiscoverFilters(
        filters
      );

      router.replace({
        pathname:
          "/(tabs)/discover",

        params: {
          discoverFilters:
            encodeURIComponent(
              JSON.stringify(
                filters
              )
            ),
        },
      } as any);
    };

  return (
    <DiscoverFilterScreen
      filters={filters}
      setFilters={setFilters}
      onBack={() =>
        router.replace(
          "/(tabs)/discover" as any
        )
      }
      onReset={resetAll}
      onApply={applyFilters}
    />
  );
}
/**
 * Path: src/features/microbuzz/useMicroBuzzQueue.ts
 * Purpose: Keeps incoming MicroBuzz requests ordered, deduped, and recoverable.
 */

import {
    useCallback,
    useMemo,
    useState,
} from "react";

import {
    fetchIncomingBuzzQueue,
} from "./microBuzzApi";

import {
    normalizeBuzzRequest,
    type BuzzRequestPayload,
} from "./microBuzzTypes";

function dedupe(
  list: BuzzRequestPayload[]
) {
  const seen =
    new Set<string>();

  return list.filter(
    (item) => {
      const id =
        String(
          item.fromId || ""
        );

      if (
        !id ||
        seen.has(id)
      ) {
        return false;
      }

      seen.add(id);
      return true;
    }
  );
}

export function useMicroBuzzQueue() {
  const [
    requests,
    setRequests,
  ] =
    useState<
      BuzzRequestPayload[]
    >([]);

  const current =
    requests[0] || null;

  const load =
    useCallback(
      async () => {
        const raw =
          await fetchIncomingBuzzQueue();

        const normalized =
          raw
            .map(
              normalizeBuzzRequest
            )
            .filter(
              Boolean
            ) as BuzzRequestPayload[];

        setRequests(
          dedupe(normalized)
        );
      },
      []
    );

  const enqueue =
    useCallback(
      (
        raw: any,
        toFront = false
      ) => {
        const request =
          normalizeBuzzRequest(
            raw
          );

        if (!request) return;

        setRequests(
          (prev) => {
            const withoutSame =
              prev.filter(
                (item) =>
                  item.fromId !==
                  request.fromId
              );

            return toFront
              ? [
                  request,
                  ...withoutSame,
                ]
              : [
                  ...withoutSame,
                  request,
                ];
          }
        );
      },
      []
    );

  const remove =
    useCallback(
      (fromId: string) => {
        setRequests(
          (prev) =>
            prev.filter(
              (item) =>
                item.fromId !==
                fromId
            )
        );
      },
      []
    );

  const clear =
    useCallback(() => {
      setRequests([]);
    }, []);

  return useMemo(
    () => ({
      requests,
      current,

      pendingCount:
        requests.length,

      load,
      enqueue,
      remove,
      clear,
    }),
    [
      requests,
      current,
      load,
      enqueue,
      remove,
      clear,
    ]
  );
}
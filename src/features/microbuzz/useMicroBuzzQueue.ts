/**
 * Path: src/features/microbuzz/useMicroBuzzQueue.ts
 * Purpose: Keeps incoming MicroBuzz requests ordered, deduped, and recoverable.
 */

import {
    useCallback,
    useMemo,
    useRef,
} from "react";
import { useRetainedState } from "../lifecycle/useRetainedState";
import type { ScreenActivity } from "../lifecycle/useScreenActivity";

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

export function useMicroBuzzQueue(activity: ScreenActivity) {
  type QueueUpdate = (previous: BuzzRequestPayload[]) => BuzzRequestPayload[];
  const inFlight = useRef<Promise<void> | null>(null);
  const duringLoad = useRef<QueueUpdate[]>([]);
  const [
    requests,
    setRequests,
  ] =
    useRetainedState<
      BuzzRequestPayload[]
    >(activity, []);

  const current =
    requests[0] || null;

  // Reconcile a reconnect/focus snapshot without losing socket events or
  // user decisions that arrived while that snapshot was in flight.
  const updateRequests = useCallback((update: QueueUpdate) => {
    if (inFlight.current) duringLoad.current.push(update);
    setRequests(update);
  }, [setRequests]);

  const load =
    useCallback(
      () => {
        if (inFlight.current) return inFlight.current;
        duringLoad.current = [];
        const task = (async () => {
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

        setRequests(duringLoad.current.reduce((queue, update) => update(queue), dedupe(normalized)));
        })();
        inFlight.current = task.finally(() => {
          inFlight.current = null;
          duringLoad.current = [];
        });
        return inFlight.current;
      },
      [setRequests]
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

        updateRequests(
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
      [updateRequests]
    );

  const remove =
    useCallback(
      (fromId: string) => {
        updateRequests(
          (prev) =>
            prev.filter(
              (item) =>
                item.fromId !==
                fromId
            )
        );
      },
      [updateRequests]
    );

  const clear =
    useCallback(() => {
      updateRequests(() => []);
    }, [updateRequests]);

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

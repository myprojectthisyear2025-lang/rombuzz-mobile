/**
 * Path: src/features/microbuzz/microBuzzApi.ts
 * Purpose: Small authenticated API helpers used by MicroBuzz UI helpers.
 */

import {
    API_BASE,
} from "@/src/config/api";

import * as SecureStore from "expo-secure-store";

import type {
    BuzzRequestPayload,
} from "./microBuzzTypes";

async function getToken() {
  return (
    await SecureStore.getItemAsync(
      "RBZ_TOKEN"
    )
  ) || "";
}

async function request(
  path: string,
  init?: RequestInit
) {
  const token =
    await getToken();

  return fetch(
    `${API_BASE}${path}`,
    {
      ...(init || {}),

      headers: {
        ...(init?.headers || {}),

        Authorization:
          `Bearer ${token}`,
      } as any,
    }
  );
}

async function readJson(
  res: Response
) {
  return res
    .json()
    .catch(() => null);
}

export async function fetchIncomingBuzzQueue():
Promise<BuzzRequestPayload[]> {
  const res =
    await request(
      "/microbuzz/incoming"
    );

  const data =
    await readJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error ||
        "Could not load incoming Buzzes"
    );
  }

  if (
    Array.isArray(
      data?.requests
    )
  ) {
    return data.requests;
  }

  return data?.request
    ? [data.request]
    : [];
}

export async function ignoreMicroBuzzSessionUser(
  targetId: string
) {
  const res =
    await request(
      `/microbuzz/session-ignore/${encodeURIComponent(
        targetId
      )}`,
      {
        method: "POST",
      }
    );

  const data =
    await readJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error ||
        "Could not ignore this user"
    );
  }
}

export async function blockRomBuzzUser(
  targetId: string
) {
  const res =
    await request(
      `/users/blocks/${encodeURIComponent(
        targetId
      )}`,
      {
        method: "POST",
      }
    );

  const data =
    await readJson(res);

  if (!res.ok) {
    throw new Error(
      data?.error ||
        "Could not block this user"
    );
  }
}
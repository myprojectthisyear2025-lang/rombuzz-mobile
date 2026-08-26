/**
 * ============================================================================
 * 📁 File: src/lib/_rbzApi.ts
 * 🎯 Purpose: Small authenticated JSON API helper for RomBuzz Settings pages.
 *
 * Responsibilities:
 * - Attach the stored RomBuzz JWT.
 * - Encode request bodies as JSON.
 * - Preserve backend status/code/payload on failed requests so screens can
 *   handle structured responses such as deletion confirmation requirements.
 * ============================================================================
 */

import * as SecureStore from "expo-secure-store";

import { API_BASE } from "../config/api";

export type RbzSettingsApiError = Error & {
  status?: number;
  code?: string;
  error?: string;
  payload?: any;
  [key: string]: any;
};

export async function rbzFetch<T = any>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
  } = {},
): Promise<T> {
  const token =
    (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",

    headers: {
      "Content-Type": "application/json",
      Authorization: token
        ? `Bearer ${token}`
        : "",
    },

    body:
      opts.body !== undefined
        ? JSON.stringify(opts.body)
        : undefined,
  });

  const text = await res.text();

  let json: any = {};

  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {
      raw: text,
    };
  }

  if (!res.ok) {
    const message =
      (typeof json?.message === "string" &&
        json.message) ||
      (typeof json?.error === "string" &&
        json.error) ||
      `Request failed with status ${res.status}`;

    const err =
      new Error(message) as RbzSettingsApiError;

    Object.assign(err, json, {
      status: res.status,

      code: String(
        json?.code ||
          json?.error ||
          "",
      ),

      error: String(
        json?.error ||
          "",
      ),

      payload: json,
    });

    throw err;
  }

  return json as T;
}
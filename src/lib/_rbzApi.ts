/**
 * ============================================================================
 * 📁 File: app/(tabs)/settings/_rbzApi.ts
 * 🎯 Purpose: Small API helper for Settings pages (auth + JSON)
 * ============================================================================
 */
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "../config/api";
export async function rbzFetch<T = any>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
  } = {}
): Promise<T> {
  const token = (await SecureStore.getItemAsync("RBZ_TOKEN")) || "";
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.error || json?.message || "Request failed";
    throw new Error(msg);
  }

  return json as T;
}

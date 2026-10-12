/** Durable account-scoped cleanup; an unavailable old account must not block a new token claim. */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { API_BASE } from "@/src/config/api";

export type PushOwner = { authToken: string; userId: string; pushToken: string };
const CLEANUP_KEY = "RBZ_PUSH_CLEANUP_V1";
const terminalAccountErrors = new Set([
  "ACCOUNT_BANNED", "ACCOUNT_DEACTIVATED", "Account scheduled for deletion",
]);

export async function syncPushOwner(owner: PushOwner, method: "POST" | "DELETE") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE}/users/me/push-token`, {
      method, signal: controller.signal,
      headers: { Authorization: `Bearer ${owner.authToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token: owner.pushToken, platform: Platform.OS, appOwnership: Constants.appOwnership || "" }),
    });
    if (response.ok) return "removed-or-registered";
    if (method === "DELETE") {
      if (response.status === 401) return "credentials-rejected";
      if (response.status === 403) {
        const body = await response.json().catch(() => null);
        // These exact auth-middleware responses cannot be repaired by retrying this credential.
        // This is NOT confirmation of remote deletion; a subsequent POST transfers ownership.
        if (terminalAccountErrors.has(body?.error)) return "credentials-rejected";
      }
    }
    throw new Error(`Push token ${method} failed (${response.status})`);
  } finally { clearTimeout(timeout); }
}

async function readCleanup(): Promise<PushOwner[]> {
  const raw = await SecureStore.getItemAsync(CLEANUP_KEY);
  try { const rows = JSON.parse(raw || "[]"); return Array.isArray(rows) ? rows : []; }
  catch { return []; }
}
async function writeCleanup(rows: PushOwner[]) {
  if (rows.length) await SecureStore.setItemAsync(CLEANUP_KEY, JSON.stringify(rows));
  else await SecureStore.deleteItemAsync(CLEANUP_KEY);
}

// Callers serialize these operations with registration, so cleanup storage cannot race itself.
export async function queuePushCleanup(owner: PushOwner) {
  const rows = await readCleanup();
  if (!rows.some(row => row.authToken === owner.authToken && row.pushToken === owner.pushToken && row.userId === owner.userId)) {
    await writeCleanup([...rows, owner]);
  }
}
export async function retryPushCleanup() {
  const pending: PushOwner[] = [];
  for (const owner of await readCleanup()) {
    try { await syncPushOwner(owner, "DELETE"); }
    catch { pending.push(owner); }
  }
  await writeCleanup(pending);
}
export async function forgetTransferredPushCleanup(token: string) {
  // The backend commits exclusive ownership before acknowledging POST, including legacy tokens.
  await writeCleanup((await readCleanup()).filter(owner => owner.pushToken !== token));
}

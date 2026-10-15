/**
 * File: src/features/auth/onboarding/rbzOnboardingDraft.ts
 * Purpose: Persists and restores unfinished signup onboarding.
 * Stores ordinary fields in AsyncStorage and secrets in SecureStore.
 * Serializes saves and clears so an older autosave cannot restore a deleted draft.
 * Clears drafts after completed signup or an explicit switch to login.
 * Preserves existing storage keys, draft format, and subscription behavior.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const DRAFT_KEY = "RBZ_ONBOARDING_DRAFT_V1";
const SECRET_KEY = "RBZ_ONBOARDING_SECRET_V1";

let pendingDraft: boolean | undefined;
let draftRevision = 0;
let draftWrites: Promise<unknown> = Promise.resolve();
const draftListeners = new Set<(pending: boolean) => void>();

function queueDraftWrite<T>(work: () => Promise<T>): Promise<T> {
  const result = draftWrites.then(work);
  draftWrites = result.catch(() => {});
  return result;
}

export function subscribeOnboardingDraft(
  listener: (pending: boolean) => void,
) {
  draftListeners.add(listener);
  return () => { draftListeners.delete(listener); };
}

function publishDraft(pending: boolean) {
  draftRevision++;
  pendingDraft = pending;
  draftListeners.forEach((listener) => listener(pending));
}

type DraftForm = Record<string, any>;

type SaveDraftInput = {
  step: number;
  form: DraftForm;
  email: string;
  authProvider?: string;
  signupVerificationTicket?: string;
  appleSignupTicket?: string;
};

export type OnboardingDraft<TForm = DraftForm> = {
  step: number;
  form: TForm;
  email: string;
  authProvider: string;
  signupVerificationTicket: string;
  appleSignupTicket: string;
  savedAt: number;
};

function normalizeStep(value: unknown) {
  const step = Number(value);
  if (!Number.isFinite(step)) return 1;
  return Math.min(4, Math.max(1, Math.round(step)));
}

export function saveOnboardingDraft(input: SaveDraftInput) {
  return queueDraftWrite(() => writeOnboardingDraft(input));
}

async function writeOnboardingDraft({
  step, form, email, authProvider = "",
  signupVerificationTicket = "", appleSignupTicket = "",
}: SaveDraftInput) {
  const { password = "", confirm = "", ...safeForm } = form || {};
  const savedAt = Date.now();

  const writes = await Promise.allSettled([
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({
      version: 1,
      step: normalizeStep(step),
      form: safeForm,
      savedAt,
    })),
    SecureStore.setItemAsync(SECRET_KEY, JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      authProvider: String(authProvider || "").trim().toLowerCase(),
      signupVerificationTicket: String(signupVerificationTicket || "").trim(),
      appleSignupTicket: String(appleSignupTicket || "").trim(),
      password: String(password || ""),
      confirm: String(confirm || ""),
    })),
  ]);

  const failed = writes.find((write) => write.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
  publishDraft(true);
}

export async function loadOnboardingDraft<
  TForm extends DraftForm = DraftForm
>(): Promise<OnboardingDraft<TForm> | null> {
  try {
    const [rawDraft, rawSecret] = await Promise.all([
      AsyncStorage.getItem(DRAFT_KEY),
      SecureStore.getItemAsync(SECRET_KEY),
    ]);
    if (!rawDraft || !rawSecret) return null;

    const draft = JSON.parse(rawDraft);
    const secret = JSON.parse(rawSecret);
    if (!draft?.form || typeof draft.form !== "object") return null;

    const email = String(secret?.email || "").trim().toLowerCase();
    if (!email) return null;

    return {
      step: normalizeStep(draft?.step),
      form: {
        ...draft.form,
        password: String(secret?.password || ""),
        confirm: String(secret?.confirm || ""),
      } as TForm,
      email,
      authProvider: String(secret?.authProvider || ""),
      signupVerificationTicket: String(secret?.signupVerificationTicket || ""),
      appleSignupTicket: String(secret?.appleSignupTicket || ""),
      savedAt: Number(draft?.savedAt || 0),
    };
  } catch (error) {
    console.log("❌ Failed to restore onboarding draft:", error);
    return null;
  }
}

export async function hasOnboardingDraft(force = false) {
  if (!force && pendingDraft !== undefined) return pendingDraft;
  const revision = draftRevision;
  try {
    const [rawDraft, rawSecret] = await Promise.all([
      AsyncStorage.getItem(DRAFT_KEY),
      SecureStore.getItemAsync(SECRET_KEY),
    ]);
    if (revision === draftRevision) {
      pendingDraft = Boolean(rawDraft && rawSecret);
    }
    return pendingDraft ?? false;
  } catch {
    return pendingDraft ?? false;
  }
}

export function clearOnboardingDraft() {
  return queueDraftWrite(async () => {
    const removals = await Promise.allSettled([
      AsyncStorage.removeItem(DRAFT_KEY),
      SecureStore.deleteItemAsync(SECRET_KEY),
    ]);
    const failed = removals.find(
      (removal) => removal.status === "rejected",
    );
    if (failed?.status === "rejected") throw failed.reason;
    publishDraft(false);
  });
}
/**
 * ============================================================================
 * 📁 File: src/features/auth/onboarding/rbzOnboardingDraft.ts
 * 🎯 Purpose: Persist and restore incomplete RomBuzz signup onboarding.
 *
 * USED BY:
 *   - app/auth/register-full/index.tsx
 *   - app/_layout.tsx
 *
 * SECURITY:
 *   - Normal onboarding fields are stored in AsyncStorage.
 *   - Passwords and signup verification tickets are stored in SecureStore.
 *   - Draft is deleted only after successful account creation.
 * ============================================================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const DRAFT_KEY = "RBZ_ONBOARDING_DRAFT_V1";
const SECRET_KEY = "RBZ_ONBOARDING_SECRET_V1";

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

export async function saveOnboardingDraft({
  step,
  form,
  email,
  authProvider = "",
  signupVerificationTicket = "",
  appleSignupTicket = "",
}: SaveDraftInput) {
  const {
    password = "",
    confirm = "",
    ...safeForm
  } = form || {};

  const savedAt = Date.now();

  await Promise.all([
    AsyncStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        version: 1,
        step: normalizeStep(step),
        form: safeForm,
        savedAt,
      })
    ),

    SecureStore.setItemAsync(
      SECRET_KEY,
      JSON.stringify({
        email: String(email || "").trim().toLowerCase(),
        authProvider: String(authProvider || "").trim().toLowerCase(),
        signupVerificationTicket: String(
          signupVerificationTicket || ""
        ).trim(),
        appleSignupTicket: String(appleSignupTicket || "").trim(),
        password: String(password || ""),
        confirm: String(confirm || ""),
      })
    ),
  ]);
}

export async function loadOnboardingDraft<
  TForm extends DraftForm = DraftForm
>(): Promise<OnboardingDraft<TForm> | null> {
  try {
    const [rawDraft, rawSecret] = await Promise.all([
      AsyncStorage.getItem(DRAFT_KEY),
      SecureStore.getItemAsync(SECRET_KEY),
    ]);

    if (!rawDraft || !rawSecret) {
      return null;
    }

    const draft = JSON.parse(rawDraft);
    const secret = JSON.parse(rawSecret);

    if (!draft?.form || typeof draft.form !== "object") {
      return null;
    }

    const email = String(secret?.email || "").trim().toLowerCase();

    if (!email) {
      return null;
    }

    return {
      step: normalizeStep(draft?.step),
      form: {
        ...draft.form,
        password: String(secret?.password || ""),
        confirm: String(secret?.confirm || ""),
      } as TForm,
      email,
      authProvider: String(secret?.authProvider || ""),
      signupVerificationTicket: String(
        secret?.signupVerificationTicket || ""
      ),
      appleSignupTicket: String(secret?.appleSignupTicket || ""),
      savedAt: Number(draft?.savedAt || 0),
    };
  } catch (error) {
    console.log("❌ Failed to restore onboarding draft:", error);
    return null;
  }
}

export async function hasOnboardingDraft() {
  try {
    const [rawDraft, rawSecret] = await Promise.all([
      AsyncStorage.getItem(DRAFT_KEY),
      SecureStore.getItemAsync(SECRET_KEY),
    ]);

    return Boolean(rawDraft && rawSecret);
  } catch {
    return false;
  }
}

export async function clearOnboardingDraft() {
  await Promise.all([
    AsyncStorage.removeItem(DRAFT_KEY),
    SecureStore.deleteItemAsync(SECRET_KEY),
  ]);
}
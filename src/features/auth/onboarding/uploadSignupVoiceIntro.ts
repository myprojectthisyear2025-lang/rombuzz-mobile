/**
 * ============================================================
 * 📁 File: src/features/auth/onboarding/uploadSignupVoiceIntro.ts
 * 🎯 Purpose: Upload a signup voice intro through the same
 *    authenticated Cloudflare R2 flow used by Profile.
 *
 * The signup recorder keeps its local URI until register-full
 * returns the normal RomBuzz auth token. Then this helper uploads
 * it as purpose "voice-intro" and stores the R2 key on the user.
 * ============================================================
 */

import axios from "axios";

import { API_BASE } from "../../../config/api";
import { uploadRomBuzzMedia } from "../../../config/uploadMedia";

function upsertVoiceInFavorites(
  favorites: any[] = [],
  voiceUrl: string
) {
  const next = (Array.isArray(favorites) ? favorites : []).filter(
    (item) => !String(item || "").startsWith("voice:")
  );

  if (voiceUrl) {
    next.push(`voice:${voiceUrl}`);
  }

  return next;
}

export async function uploadSignupVoiceIntro(
  token: string,
  localVoiceUri: string,
  durationSec: number,
  favorites: any[] = []
) {
  const uri = String(localVoiceUri || "").trim();

  if (!uri) {
    return null;
  }

  // Exact same R2 uploader + purpose used by Profile.
  const uploaded = await uploadRomBuzzMedia(uri, "audio", {
    purpose: "voice-intro",
  });

  const storedVoice = uploaded.r2Key || uploaded.url;

  if (!storedVoice) {
    throw new Error("Voice upload did not return an R2 key.");
  }

  const safeDuration = Math.max(
    1,
    Math.min(60, Number(durationSec || 0))
  );

  const nextFavorites = upsertVoiceInFavorites(
    favorites,
    storedVoice
  );

  const updated = await axios.put(
    `${API_BASE}/users/me`,
    {
      favorites: nextFavorites,
      voiceUrl: storedVoice,
      voiceDurationSec: safeDuration,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return {
    voiceUrl: storedVoice,
    voiceDurationSec: safeDuration,
    favorites: nextFavorites,
    user: updated.data?.user,
  };
}
/**
 * Path: src/features/discoverProfile/discoverProfileApi.ts
 * Purpose: Discover Profile data, relationship-status, and match-request API helpers.
 * Used by: Discover Profile controller and relationship-aware UI.
 */

import { API_BASE } from "@/src/config/api";
import * as Location from "expo-location";

import {
    dedupeDiscoverMedia,
} from "./discoverProfileMedia";

import {
    pickPublicFields,
} from "./discoverProfilePrivacy";

export type DiscoverProfileUser =
  Record<string, any>;

export type DiscoverProfilePreview =
  DiscoverProfileUser | null;

export type RelationshipStatus = {
  likedByMe: boolean;
  likedMe: boolean;
  matched: boolean;
};

export type RelationshipMode =
  | "loading"
  | "discover"
  | "incoming"
  | "requested"
  | "matched";

async function getFreshViewerCoords() {
  try {
    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (
      permission.status !==
      "granted"
    ) {
      return null;
    }

    const pos =
      await Location.getCurrentPositionAsync(
        {
          accuracy:
            Location
              .Accuracy
              .Balanced,
        }
      );

    const lat =
      Number(
        pos?.coords
          ?.latitude
      );

    const lng =
      Number(
        pos?.coords
          ?.longitude
      );

    if (
      !Number.isFinite(
        lat
      ) ||
      !Number.isFinite(
        lng
      )
    ) {
      return null;
    }

    if (
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }

    let country = "";
    let isoCountryCode = "";

    try {
      const places =
        await Location.reverseGeocodeAsync(
          {
            latitude: lat,
            longitude: lng,
          }
        );

      const place =
        Array.isArray(
          places
        )
          ? places[0]
          : null;

      country =
        String(
          place?.country ||
            ""
        ).trim();

      isoCountryCode =
        String(
          place
            ?.isoCountryCode ||
            ""
        ).trim();
    } catch (err) {
      console.warn(
        "Discover profile reverse geocode failed:",
        err
      );
    }

    return {
      lat,
      lng,
      country,
      isoCountryCode,
    };
  } catch (err) {
    console.warn(
      "Fresh discover-profile location failed:",
      err
    );

    return null;
  }
}

export async function fetchDiscoverProfile(
  userId: string,
  token: string
) {
  const freshCoords =
    await getFreshViewerCoords();

  let profileUrl =
    `${API_BASE}/users/${encodeURIComponent(
      userId
    )}`;

  if (freshCoords) {
    const qs =
      new URLSearchParams({
        lat: String(
          freshCoords.lat
        ),

        lng: String(
          freshCoords.lng
        ),
      });

    if (
      freshCoords
        .isoCountryCode
    ) {
      qs.set(
        "viewerCountry",
        freshCoords
          .isoCountryCode
      );
    } else if (
      freshCoords.country
    ) {
      qs.set(
        "viewerCountry",
        freshCoords.country
      );
    }

    profileUrl =
      `${profileUrl}?${qs.toString()}`;

    fetch(
      `${API_BASE}/users/location`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          {
            lat:
              freshCoords.lat,

            lng:
              freshCoords.lng,
          }
        ),
      }
    ).catch(() => {});
  }

  const res =
    await fetch(
      profileUrl,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const data =
    await res.json();

  if (!data?.user) {
    return null;
  }

  const next =
    pickPublicFields(
      data.user
    );

  return {
    ...next,

    distanceMeters:
      typeof next
        ?.distanceMeters ===
      "number"
        ? next.distanceMeters
        : null,

    distanceUnit:
      typeof next
        ?.distanceUnit ===
      "string"
        ? next.distanceUnit
        : "",

    distanceValue:
      typeof next
        ?.distanceValue ===
      "number"
        ? next.distanceValue
        : null,

    distanceText:
      typeof next
        ?.distanceText ===
      "string"
        ? next.distanceText
        : "",

    distanceSource:
      typeof next
        ?.distanceSource ===
      "string"
        ? next.distanceSource
        : "",

    media:
      dedupeDiscoverMedia(
        next?.media
      ),

    photos:
      dedupeDiscoverMedia(
        next?.photos
      ),
  };
}

export async function fetchDiscoverRelationshipStatus(
  userId: string,
  token: string
): Promise<RelationshipStatus> {
  const res =
    await fetch(
      `${API_BASE}/likes/status/${encodeURIComponent(
        userId
      )}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const data =
    await res
      .json()
      .catch(
        () => null
      );

  return {
    likedByMe:
      !!data?.likedByMe,

    likedMe:
      !!data?.likedMe,

    matched:
      !!data?.matched,
  };
}

export async function sendDiscoverMatchRequest(
  userId: string,
  token: string
) {
  const res =
    await fetch(
      `${API_BASE}/likes`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            to: userId,
          }),
      }
    );

  const data =
    await res
      .json()
      .catch(
        () => null
      );

  return {
    ok: res.ok,
    data,
  };
}

export async function respondDiscoverMatchRequest(
  userId: string,
  token: string,
  action:
    | "accept"
    | "reject"
) {
  const res =
    await fetch(
      `${API_BASE}/likes/respond`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            fromId: userId,
            action,
          }),
      }
    );

  const data =
    await res
      .json()
      .catch(
        () => null
      );

  return {
    ok: res.ok,
    data,
  };
}
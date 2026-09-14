/**
 * Path: src/features/discoverProfile/discoverProfileMedia.ts
 * Purpose: Preserve Discover-safe media filtering and build public photo lists.
 * Used by: Discover Profile API hydration, hero, gallery, and fullscreen viewer.
 */

export function normalizeDiscoverImageUrl(
  value: any
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

export function getDiscoverMediaUrl(
  entry: any
) {
  if (
    typeof entry ===
    "string"
  ) {
    return normalizeDiscoverImageUrl(
      entry
    );
  }

  return normalizeDiscoverImageUrl(
    entry?.url ||
      entry?.mediaUrl ||
      entry?.fileUrl ||
      entry?.secureUrl ||
      entry?.secure_url ||
      entry?.src ||
      entry?.imageUrl ||
      entry?.photoUrl ||
      entry?.videoUrl ||
      ""
  );
}

function getVisibility(
  entry: any
) {
  return String(
    entry?.privacy ||
      entry?.scope ||
      ""
  )
    .toLowerCase()
    .trim();
}

function getCaption(
  entry: any
) {
  return String(
    entry?.caption || ""
  )
    .toLowerCase()
    .trim();
}

export function stripDiscoverSignedUrl(
  url: string
) {
  return String(url || "")
    .split("?")[0]
    .split("#")[0]
    .trim();
}

export function getDiscoverMediaKey(
  entry: any
) {
  if (
    typeof entry ===
    "string"
  ) {
    return stripDiscoverSignedUrl(
      entry
    );
  }

  return String(
    entry?.r2Key ||
      entry?.key ||
      entry?.mediaId ||
      entry?.id ||
      entry?._id ||
      stripDiscoverSignedUrl(
        getDiscoverMediaUrl(
          entry
        )
      )
  ).trim();
}

export function isDiscoverSafeMediaEntry(
  entry: any
) {
  const url =
    getDiscoverMediaUrl(
      entry
    );

  if (!url) {
    return false;
  }

  const visibility =
    getVisibility(entry);

  const caption =
    getCaption(entry);

  const type =
    String(
      entry?.type ||
        entry?.mediaType ||
        ""
    )
      .toLowerCase()
      .trim();

  if (
    visibility ===
      "private" ||
    visibility ===
      "matches" ||
    visibility ===
      "matched-only" ||
    visibility ===
      "hidden" ||
    visibility ===
      "specific"
  ) {
    return false;
  }

  if (
    caption.includes(
      "scope:private"
    )
  ) {
    return false;
  }

  if (
    caption.includes(
      "scope:matches"
    )
  ) {
    return false;
  }

  if (
    caption.includes(
      "scope:matched"
    )
  ) {
    return false;
  }

  if (
    caption.includes(
      "privacy:private"
    )
  ) {
    return false;
  }

  if (
    caption.includes(
      "privacy:matches"
    )
  ) {
    return false;
  }

  if (
    caption.includes(
      "kind:reel"
    )
  ) {
    return false;
  }

  if (
    type === "video"
  ) {
    return false;
  }

  return true;
}

export function dedupeDiscoverMedia(
  entries: any[]
) {
  const seen =
    new Set<string>();

  const out: any[] = [];

  for (
    const entry of
    Array.isArray(entries)
      ? entries
      : []
  ) {
    if (
      !isDiscoverSafeMediaEntry(
        entry
      )
    ) {
      continue;
    }

    const url =
      getDiscoverMediaUrl(
        entry
      );

    const key =
      getDiscoverMediaKey(
        entry
      ) ||
      stripDiscoverSignedUrl(
        url
      );

    if (
      !url ||
      !key ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    out.push(
      typeof entry ===
        "string"
        ? url
        : {
            ...entry,
            url,
          }
    );
  }

  return out;
}

export function getDiscoverPhotos(
  user: any
): string[] {
  const media =
    dedupeDiscoverMedia(
      user?.media
    );

  const source =
    media.length
      ? media
      : dedupeDiscoverMedia(
          user?.photos
        );

  return source
    .map(
      getDiscoverMediaUrl
    )
    .filter(Boolean);
}

export function getDiscoverViewerPhotos(
  user: any,
  photos: string[]
) {
  const seen =
    new Set<string>();

  const out: string[] =
    [];

  const push = (
    url: string
  ) => {
    const clean =
      normalizeDiscoverImageUrl(
        url
      );

    const key =
      stripDiscoverSignedUrl(
        clean
      );

    if (
      !clean ||
      !key ||
      seen.has(key)
    ) {
      return;
    }

    seen.add(key);
    out.push(clean);
  };

  push(user?.avatar);

  photos.forEach(push);

  return out;
}

export function getDiscoverAge(
  dob: any
) {
  if (!dob) {
    return null;
  }

  const date =
    new Date(dob);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  const now =
    new Date();

  let age =
    now.getFullYear() -
    date.getFullYear();

  const month =
    now.getMonth() -
    date.getMonth();

  if (
    month < 0 ||
    (month === 0 &&
      now.getDate() <
        date.getDate())
  ) {
    age--;
  }

  return age;
}

export function getDiscoverDisplayName(
  user: any
) {
  const backendName =
    typeof user?.name ===
    "string"
      ? user.name.trim()
      : "";

  if (backendName) {
    return backendName;
  }

  const first =
    typeof user?.firstName ===
    "string"
      ? user.firstName.trim()
      : "";

  const last =
    typeof user?.lastName ===
    "string"
      ? user.lastName.trim()
      : "";

  return (
    [first, last]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "RomBuzz user"
  );
}

export function getDiscoverDistanceText(
  user: any
) {
  if (
    String(
      user?.distanceSource ||
        ""
    ).trim() !==
    "fresh_gps"
  ) {
    return "";
  }

  return typeof user?.distanceText ===
    "string"
    ? user.distanceText.trim()
    : "";
}
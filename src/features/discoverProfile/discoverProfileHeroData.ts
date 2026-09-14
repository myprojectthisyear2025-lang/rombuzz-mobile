/**
 * Path: src/features/discoverProfile/discoverProfileHeroData.ts
 * Purpose: Build privacy-safe hero location and preview chips for Discover Profile.
 * Used by: DiscoverProfileScreen.tsx only.
 */

import {
    discoverChipItems,
    discoverText,
    showDiscoverField,
} from "./discoverProfilePrivacy";

export function getDiscoverHeroLocationText(
  user: any
): string {
  if (
    showDiscoverField(
      user,
      "city",
      user?.city
    )
  ) {
    return discoverText(user.city);
  }

  if (
    showDiscoverField(
      user,
      "hometown",
      user?.hometown
    )
  ) {
    return discoverText(user.hometown);
  }

  return "";
}

export function getDiscoverHeroChips(
  user: any,
  limit = 4
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const add = (
    field: string,
    values: any
  ) => {
    if (
      !showDiscoverField(
        user,
        field,
        values
      )
    ) {
      return;
    }

    for (
      const item of
      discoverChipItems(values)
    ) {
      const key =
        item.toLowerCase();

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      out.push(item);

      if (
        out.length >= limit
      ) {
        return;
      }
    }
  };

  add(
    "interests",
    user?.interests
  );

  if (out.length < limit) {
    add(
      "likes",
      user?.likes
    );
  }

  if (out.length < limit) {
    add(
      "hobbies",
      user?.hobbies
    );
  }

  return out.slice(
    0,
    limit
  );
}
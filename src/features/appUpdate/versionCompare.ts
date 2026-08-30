/**
 * ============================================================
 * 📁 File: src/features/appUpdate/versionCompare.ts
 * 🎯 Purpose: Safely parse and compare RomBuzz app versions.
 *
 * Usage:
 *   Used by the app-update system to compare installed,
 *   minimum-supported, and latest versions numerically.
 * ============================================================
 */

export type ParsedVersion = [number, number, number];

export function parseAppVersion(
  value: unknown
): ParsedVersion | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();

  if (!/^\d+\.\d+\.\d+$/.test(normalized)) {
    return null;
  }

  const parts = normalized.split(".").map(Number);

  if (
    parts.length !== 3 ||
    parts.some(
      (part) =>
        !Number.isInteger(part) ||
        part < 0
    )
  ) {
    return null;
  }

  return [
    parts[0],
    parts[1],
    parts[2],
  ];
}

export function compareAppVersions(
  left: string,
  right: string
): number | null {
  const a = parseAppVersion(left);
  const b = parseAppVersion(right);

  if (!a || !b) {
    return null;
  }

  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) {
      return 1;
    }

    if (a[index] < b[index]) {
      return -1;
    }
  }

  return 0;
}

export function isVersionBelow(
  installedVersion: string,
  requiredVersion: string
): boolean {
  return (
    compareAppVersions(
      installedVersion,
      requiredVersion
    ) === -1
  );
}
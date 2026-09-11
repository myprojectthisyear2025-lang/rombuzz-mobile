/**
 * Path: src/features/viewProfile/info/viewProfileInfoFormat.ts
 * Purpose: Small display-only normalization helpers for matched-user View Profile information.
 * Used by: View Profile information components only.
 */

export function viewProfileTitle(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "";

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
}

export function viewProfileValues(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .flat()
      .map((item) =>
        String(item ?? "").trim()
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) {
      return [];
    }

    const parts = text
      .split(/,|\n|•|\||·/g)
      .map((item) =>
        item.trim()
      )
      .filter(Boolean);

    return parts.length > 1
      ? parts
      : [text];
  }

  return [];
}

export function hasViewProfileValue(
  ...values: unknown[]
): boolean {
  return values.some((value) => {
    if (Array.isArray(value)) {
      return value.some(
        (item) =>
          String(
            item ?? ""
          ).trim().length > 0
      );
    }

    return (
      String(
        value ?? ""
      ).trim().length > 0
    );
  });
}
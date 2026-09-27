// Preserve a still-valid R2 URL to avoid a second image load on cache refresh.
// An expired/unknown signature must not defeat a fresh server response.
export function preserveMediaUrl(oldValue: any, freshValue: any, now = Date.now()) {
  const oldUrl = String(oldValue || "").trim();
  const freshUrl = String(freshValue || "").trim();
  if (!oldUrl || !freshUrl || oldUrl === freshUrl) return freshUrl || oldUrl;
  try {
    const old = new URL(oldUrl), fresh = new URL(freshUrl);
    if (old.origin !== fresh.origin || old.pathname !== fresh.pathname) return freshUrl;
    const date = old.searchParams.get("X-Amz-Date") || "";
    const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(date);
    const lifetime = Number(old.searchParams.get("X-Amz-Expires"));
    if (!match || !old.searchParams.has("X-Amz-Signature") || !(lifetime > 0)) return freshUrl;
    // Retain only signature changes, never different image transforms/versions.
    const contentQuery = (url: URL) => [...url.searchParams.entries()]
      .filter(([key]) => !key.toLowerCase().startsWith("x-amz-"))
      .sort(([a], [b]) => a.localeCompare(b));
    if (JSON.stringify(contentQuery(old)) !== JSON.stringify(contentQuery(fresh))) return freshUrl;
    const issued = Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]);
    return issued + lifetime * 1000 > now + 60_000 ? oldUrl : freshUrl;
  } catch {
    return freshUrl;
  }
}

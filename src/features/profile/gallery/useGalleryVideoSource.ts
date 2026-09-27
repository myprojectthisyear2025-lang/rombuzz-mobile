import { useEffect, useState } from "react";

// Neighbouring pages remain mounted for paging; only the selected, foreground
// page may resolve or load a player. Abort and key guards cover late responses.
export function useGalleryVideoSource(
  url: string,
  uid: string,
  active: boolean,
  apiFetch?: (path: string, init?: RequestInit) => Promise<any>
) {
  const key = `${uid}\n${url}`;
  const [resolved, setResolved] = useState({ key: "", url: "" });
  const [pendingKey, setPendingKey] = useState("");

  useEffect(() => {
    if (!active || url || !uid || !apiFetch) return;
    const controller = new AbortController();
    setPendingKey(key);
    void apiFetch(`/stream/${encodeURIComponent(uid)}/playback`, { signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted) setResolved({ key, url: String(data?.playback?.hls || data?.playback?.dash || "").trim() });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResolved({ key, url: "" });
      })
      .finally(() => {
        if (!controller.signal.aborted) setPendingKey("");
      });
    return () => controller.abort();
  }, [active, apiFetch, key, uid, url]);

  return {
    url: active ? url || (resolved.key === key ? resolved.url : "") : "",
    resolving: active && !url && pendingKey === key,
  };
}

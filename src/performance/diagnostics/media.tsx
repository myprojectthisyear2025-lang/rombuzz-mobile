/** Path: src/performance/diagnostics/media.tsx
 * Purpose: Passive image decode/load and video ready-for-display events; never export signed media URLs. */
import React, { forwardRef, useRef } from "react";
import { Image, type ImageProps } from "react-native";
import { Video, type VideoProps } from "expo-av";
import { PERF_ENABLED, perfForeground, perfId, perfNow, perfRecord } from "./core";
const resources = new Map<string, string>();
function resource(source: any) {
  const uri = typeof source?.uri === "string" ? source.uri : "";
  if (!uri) return undefined;
  if (!resources.has(uri)) {
    if (resources.size >= 256) resources.delete(resources.keys().next().value!);
    resources.set(uri, perfId());
  }
  return resources.get(uri);
}
function provider(source: any) {
  const uri = String(source?.uri || "");
  if (uri.includes("res.cloudinary.com")) return "cloudinary";
  if (uri.includes("r2.cloudflarestorage.com") || uri.includes("r2.dev")) return "r2";
  if (uri.includes("videodelivery.net") || uri.includes("cloudflarestream.com")) return "cloudflare-stream";
  return uri.startsWith("http") ? "other-remote" : "local";
}
function useMediaEvents(role: string, source: unknown) {
  const state = useRef({ source, id: perfId(), start: perfNow(), scope: perfForeground(), loaded: false });
  const uri = typeof source === "object" && source ? (source as any).uri : source;
  const oldUri = typeof state.current.source === "object" && state.current.source
    ? (state.current.source as any).uri : state.current.source;
  if (oldUri !== uri) state.current = { source, id: perfId(), start: perfNow(), scope: perfForeground(), loaded: false };
  return (event: string, width?: number, height?: number) => {
    const item = state.current;
    if (event === "start") { item.start = perfNow(); item.scope = perfForeground(); item.loaded = false; }
    if (event === "loaded" && item.loaded) return;
    if (event === "loaded") item.loaded = true;
    perfRecord("media", { ...item.scope, media: item.id, resource: resource(source), role, event, provider: provider(source),
      durationMs: perfNow() - item.start, width, height });
  };
}
export function diagnosticImage(role: string): typeof Image {
  if (!PERF_ENABLED) return Image;
  const Observed = forwardRef<Image, ImageProps>((props, ref) => {
    const event = useMediaEvents(role, props.source);
    return <Image {...props} ref={ref}
      onLoadStart={() => { event("start"); props.onLoadStart?.(); }}
      onLoad={e => { event("loaded", e.nativeEvent.source.width, e.nativeEvent.source.height); props.onLoad?.(e); }}
      onError={e => { event("error"); props.onError?.(e); }}
      onLoadEnd={() => { event("load-end"); props.onLoadEnd?.(); }} />;
  });
  Observed.displayName = `PerfImage(${role})`;
  return Observed as unknown as typeof Image;
}
export function diagnosticVideo(role: string): typeof Video {
  if (!PERF_ENABLED) return Video;
  const Observed = forwardRef<Video, VideoProps>((props, ref) => {
    const event = useMediaEvents(role, props.source);
    return <Video {...props} ref={ref}
      onLoadStart={() => { event("start"); props.onLoadStart?.(); }}
      onLoad={status => { event("loaded"); props.onLoad?.(status); }}
      onReadyForDisplay={e => { event("ready-for-display", e.naturalSize.width, e.naturalSize.height); props.onReadyForDisplay?.(e); }}
      onError={error => { event("error"); props.onError?.(error); }} />;
  });
  Observed.displayName = `PerfVideo(${role})`;
  return Observed as unknown as typeof Video;
}

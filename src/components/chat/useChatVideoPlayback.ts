/** Owns one visible chat video, local-file fallback, playback controls, and bounded loading/retry. */
import { type AVPlaybackStatus, type Video } from "expo-av";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useChatVideoPlayback(uri: string, localUri?: string, onViewed?: () => void) {
  const videoRef = useRef<Video | null>(null);
  const [candidate, setCandidate] = useState(localUri || uri);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [playing, setPlaying] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const viewed = useRef(false);
  const onViewedRef = useRef(onViewed);
  onViewedRef.current = onViewed;
  const key = `${candidate}:${attempt}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const loaded = status?.isLoaded ? status : null;
  const buffering = !!uri && !error && (!ready || !loaded || loaded.isBuffering);
  const duration = loaded?.durationMillis || 0;
  const position = loaded?.positionMillis || 0;
  const source = useMemo(() => ({ uri: candidate,
    ...(/\.m3u8(?:[?#]|$)/i.test(candidate) ? { overrideFileExtensionAndroid: "m3u8" } : {}),
  }), [candidate]);

  useEffect(() => {
    currentKey.current = key;
    return () => { if (currentKey.current === key) currentKey.current = ""; };
  }, [key]);

  const fail = useCallback(() => {
    if (currentKey.current !== key) return;
    if (candidate !== uri) {
      setStatus(null);
      setReady(false);
      setCandidate(uri);
    } else {
      setError("Video could not start. Check your connection or try again shortly.");
    }
  }, [candidate, uri, key]);

  useEffect(() => {
    if (!buffering || !playing) return;
    const timeout = setTimeout(fail, 20000);
    return () => clearTimeout(timeout);
  }, [buffering, playing, fail]);

  const retry = () => {
    setStatus(null);
    setReady(false);
    setError("");
    setPlaying(true);
    setAttempt(value => value + 1);
  };
  const onStatus = (next: AVPlaybackStatus) => {
    if (currentKey.current !== key) return;
    setStatus(next);
    if (!next.isLoaded && next.error) fail();
  };
  const onReady = () => {
    if (currentKey.current !== key) return;
    setReady(true);
    if (viewed.current) return;
    viewed.current = true;
    onViewedRef.current?.();
  };
  const toggle = async () => {
    if (!loaded) return;
    try {
      if (loaded.didJustFinish) { await videoRef.current?.replayAsync(); setPlaying(true); }
      else if (playing) { await videoRef.current?.pauseAsync(); setPlaying(false); }
      else { await videoRef.current?.playAsync(); setPlaying(true); }
    } catch { fail(); }
  };
  const seek = async (milliseconds: number) => {
    if (!loaded) return;
    await videoRef.current?.setPositionAsync(Math.max(0, Math.min(duration, milliseconds))).catch(() => {});
  };
  return { videoRef, source, key, loaded, playing, error, buffering, duration, position,
    retry, onStatus, onReady, fail, toggle, seek };
}
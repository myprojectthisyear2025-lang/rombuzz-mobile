export const getMaxViews = (m: any): 1 | 2 | undefined => {
  const mv = m?.ephemeral?.maxViews;
  if (mv === 1 || mv === 2) return mv;
  // fallback if mode string exists
  const mode = m?.ephemeral?.mode;
  if (mode === "once") return 1;
  if (mode === "twice") return 2;
  return undefined;
};

export const getMediaKey = (m: any) => String(m?.id || m?.url || "");
export const isGiftedPaidMedia = (m: any) => {
  const priceBC = Math.floor(
    Number(m?.gift?.priceBC ?? m?.gift?.amount ?? 0) || 0,
  );
  return priceBC > 0 && (m?.type === "media" || !!m?.url);
};

export const getChatVideoUri = (m: any) => {
  return String(
    m?.playback?.hls ||
      m?.previewUrl ||
      m?.signedUrl ||
      m?.url ||
      m?.mediaUrl ||
      "",
  ).trim();
};

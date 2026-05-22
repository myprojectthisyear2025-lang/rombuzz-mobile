/**
 * ============================================================
 * 📁 File: src/config/rombuzzGifts.ts
 * 🎁 Purpose: Central frontend gift catalog for RomBuzz gifts.
 *
 * Used by:
 * - GiftPicker
 * - GiftCard
 * - GiftSummaryBar
 * - LetsBuzz posts/reels gift UI
 * - View Profile media gift UI
 * - Future chat/media gift UI
 *
 * Important:
 * - This file is for frontend display metadata only.
 * - Backend must still validate giftId and priceBC.
 * - App UI should show only gift image + BuzzCoin price.
 * - Gift names are internal/admin labels and should not be shown in the gift picker.
 * ============================================================
 */

export type RomBuzzGiftCategory =
  | "sweet"
  | "romantic"
  | "playful"
  | "premium"
  | "funny"
  | "attention"
  | "celebration"
  | "apology"
  | "exclusive"
  | "microbuzz"
  | "buzzpoke"
  | "streak"
  | "seasonal";

export type RomBuzzGiftRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "ultra";

export type RomBuzzGiftPlacement =
  | "reels"
  | "posts"
  | "profile_media"
  | "chat"
  | "buzzpoke"
  | "microbuzz"
  | "match_celebration"
  | "streak"
  | "universal";

export type RomBuzzGiftAssetType =
  | "png"
  | "lottie"
  | "webm"
  | "mp4"
  | "svg"
  | "gif";

export type RomBuzzGiftAnimation =
  | "softFloat"
  | "heartPop"
  | "sparkleRise"
  | "slowSpin"
  | "bounceIn"
  | "glowPulse"
  | "kissBurst"
  | "sway"
  | "zoomPop"
  | "twinkle"
  | "ribbonWave"
  | "lanternGlow"
  | "compassSpin"
  | "capsuleDrop"
  | "candleFlicker"
  | "birdsFlutter"
  | "lockShake"
  | "roseBloom"
  | "crystalShine"
  | "cherryBounce"
  | "bonsaiBreath"
  | "autumnDrift";

export type RomBuzzGift = {
  id: string;
  name: string;
  imageUrl: string;
  category: RomBuzzGiftCategory;
  rarity: RomBuzzGiftRarity;
  priceBC: number;
  animated: boolean;
  animationType: RomBuzzGiftAnimation;
  visualDescription: string;
  emotionalMeaning: string;
  bestPlacement: RomBuzzGiftPlacement;
  appStoreSafetyNote: string;
  designPrompt: string;
  suggestedAssetType: RomBuzzGiftAssetType;
  sortOrder: number;
  enabled: boolean;
  premiumOnly: boolean;
  seasonalOnly: boolean;
  allowedPlacements: RomBuzzGiftPlacement[];
};

const ALL_PLACEMENTS: RomBuzzGiftPlacement[] = [
  "reels",
  "posts",
  "profile_media",
  "chat",
  "buzzpoke",
  "microbuzz",
  "match_celebration",
  "streak",
  "universal",
];

export const ROMBUZZ_GIFTS: RomBuzzGift[] = [
  {
    id: "pink_heart",
    name: "Pink Heart",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097131/pink_heart_u0byvz.png",
    category: "romantic",
    rarity: "common",
    priceBC: 5,
    animated: true,
    animationType: "heartPop",
    visualDescription: "Pink heart gift icon with soft romantic styling.",
    emotionalMeaning: "A simple sweet heart reaction.",
    bestPlacement: "universal",
    appStoreSafetyNote: "Safe romantic symbolic gift with no adult or restricted content.",
    designPrompt: "Pink heart romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 1,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "heart_red",
    name: "Red Heart",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097124/heart_red_wpi6mn.png",
    category: "romantic",
    rarity: "common",
    priceBC: 8,
    animated: true,
    animationType: "heartPop",
    visualDescription: "Red heart gift icon with a clean romantic look.",
    emotionalMeaning: "A stronger heart reaction.",
    bestPlacement: "universal",
    appStoreSafetyNote: "Safe romantic symbolic gift with no adult or restricted content.",
    designPrompt: "Red heart romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 2,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "tea_cup",
    name: "Tea Cup",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097135/tea_cup_tddkrl.png",
    category: "sweet",
    rarity: "common",
    priceBC: 10,
    animated: true,
    animationType: "softFloat",
    visualDescription: "Cute romantic tea cup gift icon.",
    emotionalMeaning: "A cozy soft signal.",
    bestPlacement: "chat",
    appStoreSafetyNote: "Safe cozy gift with no adult or restricted content.",
    designPrompt: "Cute romantic tea cup gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 3,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "three_buns",
    name: "Three Buns",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097136/three_buns_secb0a.png",
    category: "sweet",
    rarity: "common",
    priceBC: 12,
    animated: true,
    animationType: "bounceIn",
    visualDescription: "Cute dessert-style romantic gift.",
    emotionalMeaning: "A playful sweet reaction.",
    bestPlacement: "posts",
    appStoreSafetyNote: "Safe cute food-style gift with no adult or restricted content.",
    designPrompt: "Cute romantic dessert gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 4,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "cherry_love",
    name: "Cherry Love",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097120/cherry_love_l7q10k.png",
    category: "playful",
    rarity: "common",
    priceBC: 15,
    animated: true,
    animationType: "cherryBounce",
    visualDescription: "Cherry heart gift icon.",
    emotionalMeaning: "A playful cute flirt reaction.",
    bestPlacement: "reels",
    appStoreSafetyNote: "Safe playful fruit gift with no adult or restricted content.",
    designPrompt: "Cherry heart romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 5,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "love_ribbon",
    name: "Love Ribbon",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097130/love_ribbon_auytjx.png",
    category: "romantic",
    rarity: "common",
    priceBC: 18,
    animated: true,
    animationType: "ribbonWave",
    visualDescription: "Soft ribbon-style romantic gift.",
    emotionalMeaning: "A gentle romantic gesture.",
    bestPlacement: "posts",
    appStoreSafetyNote: "Safe symbolic romantic gift with no adult or restricted content.",
    designPrompt: "Romantic love ribbon gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 6,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "autumn_love",
    name: "Autumn Love",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097119/autumn_love_cx8v8h.png",
    category: "seasonal",
    rarity: "common",
    priceBC: 20,
    animated: true,
    animationType: "autumnDrift",
    visualDescription: "Warm autumn-themed romantic gift.",
    emotionalMeaning: "A soft seasonal affection signal.",
    bestPlacement: "universal",
    appStoreSafetyNote: "Safe seasonal romantic gift with no adult or restricted content.",
    designPrompt: "Autumn romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 7,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "red_rose",
    name: "Red Rose",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097132/red_rose_uhu0nz.png",
    category: "romantic",
    rarity: "common",
    priceBC: 25,
    animated: true,
    animationType: "roseBloom",
    visualDescription: "Classic red rose romantic gift.",
    emotionalMeaning: "A direct romantic gesture.",
    bestPlacement: "profile_media",
    appStoreSafetyNote: "Safe symbolic romantic flower gift.",
    designPrompt: "Red rose romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 8,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "sparkling_rose",
    name: "Sparkling Rose",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097133/sparkling_rose_hj6imz.png",
    category: "romantic",
    rarity: "common",
    priceBC: 30,
    animated: true,
    animationType: "sparkleRise",
    visualDescription: "Sparkling rose romantic gift.",
    emotionalMeaning: "A prettier elevated rose gesture.",
    bestPlacement: "profile_media",
    appStoreSafetyNote: "Safe symbolic flower gift.",
    designPrompt: "Sparkling rose romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 9,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "cuddle_love",
    name: "Cuddle Love",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097122/cuddle_love_d0h9yv.png",
    category: "sweet",
    rarity: "uncommon",
    priceBC: 35,
    animated: true,
    animationType: "zoomPop",
    visualDescription: "Soft cuddle-themed romantic gift.",
    emotionalMeaning: "A warm and sweet affection signal.",
    bestPlacement: "chat",
    appStoreSafetyNote: "Safe symbolic cozy gift with no explicit content.",
    designPrompt: "Cute cuddle love gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 10,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "cute_birds",
    name: "Cute Birds",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097122/cute_birds_av7c4u.png",
    category: "romantic",
    rarity: "uncommon",
    priceBC: 40,
    animated: true,
    animationType: "birdsFlutter",
    visualDescription: "Cute love bird planter gift.",
    emotionalMeaning: "A gentle romantic togetherness signal.",
    bestPlacement: "universal",
    appStoreSafetyNote: "Safe romantic symbolic bird gift.",
    designPrompt: "Cute love birds romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 11,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "love_birds",
    name: "Love Birds",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097127/love_birds_n3dy21.png",
    category: "romantic",
    rarity: "uncommon",
    priceBC: 45,
    animated: true,
    animationType: "birdsFlutter",
    visualDescription: "Two romantic love birds gift.",
    emotionalMeaning: "A stronger togetherness gesture.",
    bestPlacement: "universal",
    appStoreSafetyNote: "Safe symbolic bird gift with no adult or restricted content.",
    designPrompt: "Love birds romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 12,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "love_candle",
    name: "Love Candle",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097127/love_candle_mdhh0y.png",
    category: "romantic",
    rarity: "uncommon",
    priceBC: 50,
    animated: true,
    animationType: "candleFlicker",
    visualDescription: "Romantic candle gift with heart styling.",
    emotionalMeaning: "A cozy romantic gesture.",
    bestPlacement: "chat",
    appStoreSafetyNote: "Safe romantic candle symbol with no adult content.",
    designPrompt: "Romantic candle heart gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 13,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "candle_light",
    name: "Candle Light",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097119/candle_light_mzncuw.png",
    category: "romantic",
    rarity: "uncommon",
    priceBC: 55,
    animated: true,
    animationType: "lanternGlow",
    visualDescription: "Warm candle light romantic gift.",
    emotionalMeaning: "A gentle cozy affection signal.",
    bestPlacement: "chat",
    appStoreSafetyNote: "Safe symbolic candle gift.",
    designPrompt: "Candle light romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 14,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "love_lantern",
    name: "Love Lantern",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097130/love_lantern_hdqnio.png",
    category: "romantic",
    rarity: "uncommon",
    priceBC: 60,
    animated: true,
    animationType: "lanternGlow",
    visualDescription: "Heart lantern romantic gift.",
    emotionalMeaning: "A warm romantic signal.",
    bestPlacement: "reels",
    appStoreSafetyNote: "Safe symbolic lantern gift.",
    designPrompt: "Heart lantern romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 15,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "lantern_blue",
    name: "Blue Lantern",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097125/lantern_blue_jv8vhy.png",
    category: "romantic",
    rarity: "uncommon",
    priceBC: 65,
    animated: true,
    animationType: "glowPulse",
    visualDescription: "Premium blue lantern romantic gift.",
    emotionalMeaning: "A calm glowing affection signal.",
    bestPlacement: "reels",
    appStoreSafetyNote: "Safe symbolic lantern gift.",
    designPrompt: "Blue lantern romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 16,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "love_capsule",
    name: "Love Capsule",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097128/love_capsule_ta0dbc.png",
    category: "romantic",
    rarity: "rare",
    priceBC: 70,
    animated: true,
    animationType: "capsuleDrop",
    visualDescription: "Love note capsule romantic gift.",
    emotionalMeaning: "A thoughtful message-like affection signal.",
    bestPlacement: "chat",
    appStoreSafetyNote: "Safe symbolic note/capsule gift.",
    designPrompt: "Love note capsule romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 17,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "lock_key",
    name: "Lock Key",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097126/lock_key_hyqsfj.png",
    category: "romantic",
    rarity: "rare",
    priceBC: 75,
    animated: true,
    animationType: "lockShake",
    visualDescription: "Heart lock and key romantic gift.",
    emotionalMeaning: "A special trust/connection signal.",
    bestPlacement: "chat",
    appStoreSafetyNote: "Safe symbolic lock/key gift.",
    designPrompt: "Heart lock and key romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 18,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "flower_vase",
    name: "Flower Vase",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097124/flower_vase_pxkt3h.png",
    category: "romantic",
    rarity: "rare",
    priceBC: 80,
    animated: true,
    animationType: "sway",
    visualDescription: "Flower vase romantic gift.",
    emotionalMeaning: "A polished thoughtful romantic gesture.",
    bestPlacement: "profile_media",
    appStoreSafetyNote: "Safe symbolic flower gift.",
    designPrompt: "Flower vase romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 19,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "bonsai_love",
    name: "Bonsai Love",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097120/bonsai_love_hf11ft.png",
    category: "premium",
    rarity: "rare",
    priceBC: 90,
    animated: true,
    animationType: "bonsaiBreath",
    visualDescription: "Heart bonsai premium romantic gift.",
    emotionalMeaning: "A meaningful growing-connection signal.",
    bestPlacement: "universal",
    appStoreSafetyNote: "Safe symbolic plant/heart gift.",
    designPrompt: "Heart bonsai romantic premium gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 20,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "rombuzz_love",
    name: "RomBuzz Love",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097133/rombuzz_love_mjkaak.png",
    category: "premium",
    rarity: "rare",
    priceBC: 100,
    animated: true,
    animationType: "glowPulse",
    visualDescription: "RomBuzz branded love gift.",
    emotionalMeaning: "A stronger app-native love reaction.",
    bestPlacement: "universal",
    appStoreSafetyNote: "Safe branded romantic gift.",
    designPrompt: "RomBuzz love gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 21,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "velvet_kiss",
    name: "Velvet Kiss",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097137/velvet_kiss_taofc4.png",
    category: "premium",
    rarity: "epic",
    priceBC: 120,
    animated: true,
    animationType: "kissBurst",
    visualDescription: "Premium velvet kiss romantic gift.",
    emotionalMeaning: "A bold romantic signal without explicit content.",
    bestPlacement: "chat",
    appStoreSafetyNote: "Safe stylized romantic gift, not explicit or adult-service oriented.",
    designPrompt: "Velvet kiss romantic premium gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 22,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "love_compass",
    name: "Love Compass",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097129/love_compass_iinnhg.png",
    category: "premium",
    rarity: "epic",
    priceBC: 150,
    animated: true,
    animationType: "compassSpin",
    visualDescription: "Premium love compass gift.",
    emotionalMeaning: "A destiny/found-you style romantic signal.",
    bestPlacement: "universal",
    appStoreSafetyNote: "Safe symbolic compass gift.",
    designPrompt: "Love compass romantic premium gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 23,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "star_compass",
    name: "Star Compass",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097134/star_compass_m0fitn.png",
    category: "premium",
    rarity: "epic",
    priceBC: 180,
    animated: true,
    animationType: "twinkle",
    visualDescription: "Starlight compass premium gift.",
    emotionalMeaning: "A special destiny-style premium gift.",
    bestPlacement: "universal",
    appStoreSafetyNote: "Safe symbolic compass/star gift.",
    designPrompt: "Starlight compass premium romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 24,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
  {
    id: "crystal_swan",
    name: "Crystal Swan",
    imageUrl:
      "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097121/crystal_swan_gzjhyu.png",
    category: "premium",
    rarity: "legendary",
    priceBC: 250,
    animated: true,
    animationType: "crystalShine",
    visualDescription: "Crystal swan premium romantic gift.",
    emotionalMeaning: "A luxury romantic gift for special moments.",
    bestPlacement: "universal",
    appStoreSafetyNote: "Safe symbolic swan/crystal gift.",
    designPrompt: "Crystal swan luxury romantic gift icon, transparent background, no text.",
    suggestedAssetType: "png",
    sortOrder: 25,
    enabled: true,
    premiumOnly: false,
    seasonalOnly: false,
    allowedPlacements: ALL_PLACEMENTS,
  },
];

export function getGiftById(id: string) {
  return ROMBUZZ_GIFTS.find((gift) => gift.id === id) || null;
}

export function getGiftsByCategory(category: RomBuzzGiftCategory) {
  return ROMBUZZ_GIFTS.filter(
    (gift) => gift.enabled && gift.category === category
  ).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAnimatedGifts() {
  return ROMBUZZ_GIFTS.filter((gift) => gift.enabled && gift.animated).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

export function getGiftsByPlacement(placement: RomBuzzGiftPlacement) {
  return ROMBUZZ_GIFTS.filter((gift) => {
    if (!gift.enabled) return false;
    if (gift.allowedPlacements.includes("universal")) return true;
    return gift.allowedPlacements.includes(placement);
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getGiftsForPlacement(placement: RomBuzzGiftPlacement) {
  return getGiftsByPlacement(placement);
}

export function getGiftPrice(id: string) {
  return getGiftById(id)?.priceBC ?? 0;
}

export function isGiftAnimated(id: string) {
  return Boolean(getGiftById(id)?.animated);
}
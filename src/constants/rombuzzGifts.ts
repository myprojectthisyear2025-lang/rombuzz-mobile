/**
 * File: src/constants/rombuzzGifts.ts
 *
 * Purpose:
 * Central RomBuzz gift catalog for all gift-enabled areas of the mobile app.
 *
 * Used by:
 * - LetsBuzz post gifts
 * - LetsBuzz reel gifts
 * - View Profile fullscreen media gifts
 * - Future chat gifts
 *
 * What this file contains:
 * - Cloudinary image URLs for each gift
 * - Internal gift IDs
 * - Gift prices
 * - Internal animation preset names
 *
 * Important:
 * Gift names should NOT be shown in the app UI.
 * The app should only show the gift image and the price.
 */

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
  imageUrl: string;
  price: number;
  animation: RomBuzzGiftAnimation;
  rarity: "normal" | "medium" | "premium";
};

export const ROMBUZZ_GIFTS: RomBuzzGift[] = [
  {
    id: "pink_heart",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097131/pink_heart_u0byvz.png",
    price: 5,
    animation: "heartPop",
    rarity: "normal",
  },
  {
    id: "heart_red",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097124/heart_red_wpi6mn.png",
    price: 8,
    animation: "heartPop",
    rarity: "normal",
  },
  {
    id: "tea_cup",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097135/tea_cup_tddkrl.png",
    price: 10,
    animation: "softFloat",
    rarity: "normal",
  },
  {
    id: "three_buns",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097136/three_buns_secb0a.png",
    price: 12,
    animation: "bounceIn",
    rarity: "normal",
  },
  {
    id: "cherry_love",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097120/cherry_love_l7q10k.png",
    price: 15,
    animation: "cherryBounce",
    rarity: "normal",
  },
  {
    id: "love_ribbon",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097130/love_ribbon_auytjx.png",
    price: 18,
    animation: "ribbonWave",
    rarity: "normal",
  },
  {
    id: "autumn_love",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097119/autumn_love_cx8v8h.png",
    price: 20,
    animation: "autumnDrift",
    rarity: "normal",
  },
  {
    id: "red_rose",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097132/red_rose_uhu0nz.png",
    price: 25,
    animation: "roseBloom",
    rarity: "normal",
  },
  {
    id: "sparkling_rose",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097133/sparkling_rose_hj6imz.png",
    price: 30,
    animation: "sparkleRise",
    rarity: "normal",
  },
  {
    id: "cuddle_love",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097122/cuddle_love_d0h9yv.png",
    price: 35,
    animation: "zoomPop",
    rarity: "medium",
  },
  {
    id: "cute_birds",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097122/cute_birds_av7c4u.png",
    price: 40,
    animation: "birdsFlutter",
    rarity: "medium",
  },
  {
    id: "love_birds",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097127/love_birds_n3dy21.png",
    price: 45,
    animation: "birdsFlutter",
    rarity: "medium",
  },
  {
    id: "love_candle",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097127/love_candle_mdhh0y.png",
    price: 50,
    animation: "candleFlicker",
    rarity: "medium",
  },
  {
    id: "candle_light",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097119/candle_light_mzncuw.png",
    price: 55,
    animation: "lanternGlow",
    rarity: "medium",
  },
  {
    id: "love_lantern",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097130/love_lantern_hdqnio.png",
    price: 60,
    animation: "lanternGlow",
    rarity: "medium",
  },
  {
    id: "lantern_blue",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097125/lantern_blue_jv8vhy.png",
    price: 65,
    animation: "glowPulse",
    rarity: "medium",
  },
  {
    id: "love_capsule",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097128/love_capsule_ta0dbc.png",
    price: 70,
    animation: "capsuleDrop",
    rarity: "medium",
  },
  {
    id: "lock_key",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097126/lock_key_hyqsfj.png",
    price: 75,
    animation: "lockShake",
    rarity: "medium",
  },
  {
    id: "flower_vase",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097124/flower_vase_pxkt3h.png",
    price: 80,
    animation: "sway",
    rarity: "medium",
  },
  {
    id: "bonsai_love",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097120/bonsai_love_hf11ft.png",
    price: 90,
    animation: "bonsaiBreath",
    rarity: "premium",
  },
  {
    id: "rombuzz_love",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097133/rombuzz_love_mjkaak.png",
    price: 100,
    animation: "glowPulse",
    rarity: "premium",
  },
  {
    id: "velvet_kiss",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097137/velvet_kiss_taofc4.png",
    price: 120,
    animation: "kissBurst",
    rarity: "premium",
  },
  {
    id: "love_compass",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097129/love_compass_iinnhg.png",
    price: 150,
    animation: "compassSpin",
    rarity: "premium",
  },
  {
    id: "star_compass",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097134/star_compass_m0fitn.png",
    price: 180,
    animation: "twinkle",
    rarity: "premium",
  },
  {
    id: "crystal_swan",
    imageUrl: "https://res.cloudinary.com/drhx99m5f/image/upload/v1778097121/crystal_swan_gzjhyu.png",
    price: 250,
    animation: "crystalShine",
    rarity: "premium",
  },
];

export function getRomBuzzGiftById(giftId: string) {
  return ROMBUZZ_GIFTS.find((gift) => gift.id === giftId) || null;
}
/**
 * ============================================================================
 * 📁 File: src/config/buzzTypes.ts
 * 🎯 Purpose: Central config for RomBuzz normal + premium Buzz types
 *
 * Used by:
 * - BuzzPokeCard.tsx
 * - Premium Buzz picker
 * - Paid Buzz confirmation sheet
 * - Sender-side animation
 * - Receiver-side global animation
 *
 * Rule:
 * - Normal Buzz is always free and instant.
 * - Paid Buzzes can be confirmed, remembered, charged, animated, and notified.
 * ============================================================================
 */

export type BuzzAvailability =
  | {
      type: "always";
    }
  | {
      type: "date_range";
      startMonth: number;
      startDay: number;
      endMonth: number;
      endDay: number;
    };

export type BuzzTypeId =
  | "normal"
  | "cupid"
  | "midnight"
  | "rain"
  | "rainbow"
  | "sunshine"
  | "thunder"
  | "ring"
  | "teddy"
  | "spotlight"
  | "soul"
  | "valentine"
  | "snow"
  | "spooky"
  | "holiday"
  | "new_year";

export type BuzzType = {
  id: BuzzTypeId;
  emoji: string;
  label: string;
  shortLabel: string;
  price: number;
  isPaid: boolean;
  category: "free" | "always" | "seasonal";
  availability: BuzzAvailability;
  priority: number;

  description: string;
  confirmTitle: string;
  confirmBody: string;

  senderSuccessTitle: string;
  senderSuccessBody: string;

  notificationTitle: string;
  notificationBody: string;

  receiverOverlayTitle: string;
  receiverOverlayBody: string;

  animationKey:
    | "normal"
    | "cupid"
    | "midnight"
    | "rain"
    | "rainbow"
    | "sunshine"
    | "thunder"
    | "ring"
    | "teddy"
    | "spotlight"
    | "soul"
    | "valentine"
    | "snow"
    | "spooky"
    | "holiday"
    | "new_year";

  gradient: readonly [string, string];
};

export const BUZZ_TYPES: BuzzType[] = [
  {
    id: "normal",
    emoji: "❤️",
    label: "Normal Buzz",
    shortLabel: "Buzz",
    price: 0,
    isPaid: false,
    category: "free",
    availability: { type: "always" },
    priority: 0,
    description: "A quick free poke for your match.",
    confirmTitle: "Send Normal Buzz?",
    confirmBody: "Normal Buzz is free.",
    senderSuccessTitle: "Buzz sent",
    senderSuccessBody: "Your match got your Buzz.",
    notificationTitle: "buzzed you ❤️",
    notificationBody: "sent you a Buzz.",
    receiverOverlayTitle: "buzzed you ❤️",
    receiverOverlayBody: "A quick little poke just arrived.",
    animationKey: "normal",
    gradient: ["#d8345f", "#b5179e"],
  },

  {
    id: "cupid",
    emoji: "💘",
    label: "Cupid Buzz",
    shortLabel: "Cupid",
    price: 20,
    isPaid: true,
    category: "always",
    availability: { type: "always" },
    priority: 10,
    description: "A playful romantic nudge with a heart-arrow moment.",
    confirmTitle: "Send Cupid Buzz?",
    confirmBody: "A cute heart-arrow animation will play for both of you.",
    senderSuccessTitle: "Cupid Buzz sent 💘",
    senderSuccessBody: "Your heart-arrow is on its way.",
    notificationTitle: "sent you a Cupid Buzz 💘",
    notificationBody: "Someone’s aiming right at your heart.",
    receiverOverlayTitle: "sent you a Cupid Buzz 💘",
    receiverOverlayBody: "Someone’s aiming right at your heart.",
    animationKey: "cupid",
    gradient: ["#ff4d8d", "#d946ef"],
  },
  {
    id: "midnight",
    emoji: "🌙",
    label: "Midnight Buzz",
    shortLabel: "Midnight",
    price: 35,
    isPaid: true,
    category: "always",
    availability: { type: "always" },
    priority: 20,
    description: "A quiet romantic signal that says you crossed their mind.",
    confirmTitle: "Send Midnight Buzz?",
    confirmBody: "A dreamy moon-and-stars animation will play for both of you.",
    senderSuccessTitle: "Midnight Buzz sent 🌙",
    senderSuccessBody: "They’ll know they crossed your mind.",
    notificationTitle: "sent you a Midnight Buzz 🌙",
    notificationBody: "You crossed their mind.",
    receiverOverlayTitle: "sent you a Midnight Buzz 🌙",
    receiverOverlayBody: "You crossed their mind.",
    animationKey: "midnight",
    gradient: ["#312e81", "#7c3aed"],
  },
  {
    id: "rain",
    emoji: "🌧️",
    label: "Rain Buzz",
    shortLabel: "Rain",
    price: 40,
    isPaid: true,
    category: "always",
    availability: { type: "always" },
    priority: 30,
    description: "A soft emotional rain moment with heart ripples.",
    confirmTitle: "Send Rain Buzz?",
    confirmBody: "A soft rain-and-heart ripple animation will play for both of you.",
    senderSuccessTitle: "Rain Buzz sent 🌧️",
    senderSuccessBody: "A little feeling just poured in.",
    notificationTitle: "sent you a Rain Buzz 🌧️",
    notificationBody: "A little feeling just poured in.",
    receiverOverlayTitle: "sent you a Rain Buzz 🌧️",
    receiverOverlayBody: "A little feeling just poured in.",
    animationKey: "rain",
    gradient: ["#2563eb", "#06b6d4"],
  },
  {
    id: "rainbow",
    emoji: "🌈",
    label: "Rainbow Buzz",
    shortLabel: "Rainbow",
    price: 45,
    isPaid: true,
    category: "always",
    availability: { type: "always" },
    priority: 40,
    description: "A bright colorful Buzz that makes the moment feel lighter.",
    confirmTitle: "Send Rainbow Buzz?",
    confirmBody: "A rainbow sparkle animation will play for both of you.",
    senderSuccessTitle: "Rainbow Buzz sent 🌈",
    senderSuccessBody: "You brightened their day.",
    notificationTitle: "sent you a Rainbow Buzz 🌈",
    notificationBody: "You brightened someone’s day.",
    receiverOverlayTitle: "sent you a Rainbow Buzz 🌈",
    receiverOverlayBody: "You brightened someone’s day.",
    animationKey: "rainbow",
    gradient: ["#f97316", "#ec4899"],
  },
  {
    id: "sunshine",
    emoji: "☀️",
    label: "Sunshine Buzz",
    shortLabel: "Sunshine",
    price: 50,
    isPaid: true,
    category: "always",
    availability: { type: "always" },
    priority: 50,
    description: "A warm golden Buzz that feels caring and positive.",
    confirmTitle: "Send Sunshine Buzz?",
    confirmBody: "A warm sunshine glow animation will play for both of you.",
    senderSuccessTitle: "Sunshine Buzz sent ☀️",
    senderSuccessBody: "You sent them a little warmth.",
    notificationTitle: "sent you a Sunshine Buzz ☀️",
    notificationBody: "Someone sent you a little warmth.",
    receiverOverlayTitle: "sent you a Sunshine Buzz ☀️",
    receiverOverlayBody: "Someone sent you a little warmth.",
    animationKey: "sunshine",
    gradient: ["#f59e0b", "#f97316"],
  },
  {
    id: "thunder",
    emoji: "⚡",
    label: "Thunder Buzz",
    shortLabel: "Thunder",
    price: 80,
    isPaid: true,
    category: "always",
    availability: { type: "always" },
    priority: 60,
    description: "A bold electric Buzz that grabs attention instantly.",
    confirmTitle: "Send Thunder Buzz?",
    confirmBody: "A lightning pulse animation will play for both of you.",
    senderSuccessTitle: "Thunder Buzz sent ⚡",
    senderSuccessBody: "They just got struck by attention.",
    notificationTitle: "sent you a Thunder Buzz ⚡",
    notificationBody: "You just got struck by attention.",
    receiverOverlayTitle: "sent you a Thunder Buzz ⚡",
    receiverOverlayBody: "You just got struck by attention.",
    animationKey: "thunder",
    gradient: ["#7c3aed", "#2563eb"],
  },
  {
    id: "ring",
    emoji: "💍",
    label: "Ring Buzz",
    shortLabel: "Ring",
    price: 90,
    isPaid: true,
    category: "always",
    availability: { type: "always" },
    priority: 70,
    description: "A sparkling high-attention Buzz with a playful ring glow.",
    confirmTitle: "Send Ring Buzz?",
    confirmBody: "A sparkling ring animation will play for both of you.",
    senderSuccessTitle: "Ring Buzz sent 💍",
    senderSuccessBody: "This one came with serious attention.",
    notificationTitle: "sent you a Ring Buzz 💍",
    notificationBody: "This one came with serious attention.",
    receiverOverlayTitle: "sent you a Ring Buzz 💍",
    receiverOverlayBody: "This one came with serious attention.",
    animationKey: "ring",
    gradient: ["#facc15", "#ec4899"],
  },
  {
    id: "teddy",
    emoji: "🧸",
    label: "Teddy Buzz",
    shortLabel: "Teddy",
    price: 60,
    isPaid: true,
    category: "always",
    availability: { type: "always" },
    priority: 80,
    description: "A soft cute Buzz that feels like a tiny hug.",
    confirmTitle: "Send Teddy Buzz?",
    confirmBody: "A cute teddy-and-hearts animation will play for both of you.",
    senderSuccessTitle: "Teddy Buzz sent 🧸",
    senderSuccessBody: "A soft little hug just arrived.",
    notificationTitle: "sent you a Teddy Buzz 🧸",
    notificationBody: "A soft little hug just arrived.",
    receiverOverlayTitle: "sent you a Teddy Buzz 🧸",
    receiverOverlayBody: "A soft little hug just arrived.",
    animationKey: "teddy",
    gradient: ["#a16207", "#fb7185"],
  },
  {
    id: "spotlight",
    emoji: "💫",
    label: "Spotlight Buzz",
    shortLabel: "Spotlight",
    price: 125,
    isPaid: true,
    category: "always",
    availability: { type: "always" },
    priority: 90,
    description: "A premium attention Buzz that puts your signal in the spotlight.",
    confirmTitle: "Send Spotlight Buzz?",
    confirmBody: "A premium spotlight animation will play for both of you.",
    senderSuccessTitle: "Spotlight Buzz sent 💫",
    senderSuccessBody: "They’ll know you wanted to be noticed.",
    notificationTitle: "sent you a Spotlight Buzz 💫",
    notificationBody: "Someone wanted you to notice this.",
    receiverOverlayTitle: "sent you a Spotlight Buzz 💫",
    receiverOverlayBody: "Someone wanted you to notice this.",
    animationKey: "spotlight",
    gradient: ["#8b5cf6", "#f59e0b"],
  },
  {
    id: "soul",
    emoji: "✨",
    label: "Soul Buzz",
    shortLabel: "Soul",
    price: 150,
    isPaid: true,
    category: "always",
    availability: { type: "always" },
    priority: 100,
    description: "A rare high-intent Buzz with a deep glowing aura.",
    confirmTitle: "Send Soul Buzz?",
    confirmBody: "A premium soul-aura animation will play for both of you.",
    senderSuccessTitle: "Soul Buzz sent ✨",
    senderSuccessBody: "This one was meant to stand out.",
    notificationTitle: "sent you a Soul Buzz ✨",
    notificationBody: "This one was meant to stand out.",
    receiverOverlayTitle: "sent you a Soul Buzz ✨",
    receiverOverlayBody: "This one was meant to stand out.",
    animationKey: "soul",
    gradient: ["#d946ef", "#f59e0b"],
  },

  {
    id: "valentine",
    emoji: "🎁",
    label: "Valentine Buzz",
    shortLabel: "Valentine",
    price: 70,
    isPaid: true,
    category: "seasonal",
    availability: { type: "date_range", startMonth: 2, startDay: 1, endMonth: 2, endDay: 15 },
    priority: 200,
    description: "A limited-time romantic surprise for Valentine season.",
    confirmTitle: "Send Valentine Buzz?",
    confirmBody: "A gift, hearts, and petals animation will play for both of you.",
    senderSuccessTitle: "Valentine Buzz sent 🎁",
    senderSuccessBody: "A romantic surprise just arrived.",
    notificationTitle: "sent you a Valentine Buzz 🎁",
    notificationBody: "A romantic surprise just arrived.",
    receiverOverlayTitle: "sent you a Valentine Buzz 🎁",
    receiverOverlayBody: "A romantic surprise just arrived.",
    animationKey: "valentine",
    gradient: ["#e11d48", "#db2777"],
  },
  {
    id: "snow",
    emoji: "❄️",
    label: "Snow Buzz",
    shortLabel: "Snow",
    price: 65,
    isPaid: true,
    category: "seasonal",
    availability: { type: "date_range", startMonth: 12, startDay: 1, endMonth: 2, endDay: 28 },
    priority: 210,
    description: "A soft winter Buzz with snowflakes and frosty hearts.",
    confirmTitle: "Send Snow Buzz?",
    confirmBody: "A snowflake-and-frosted-heart animation will play for both of you.",
    senderSuccessTitle: "Snow Buzz sent ❄️",
    senderSuccessBody: "A soft winter moment just arrived.",
    notificationTitle: "sent you a Snow Buzz ❄️",
    notificationBody: "A soft winter moment just arrived.",
    receiverOverlayTitle: "sent you a Snow Buzz ❄️",
    receiverOverlayBody: "A soft winter moment just arrived.",
    animationKey: "snow",
    gradient: ["#38bdf8", "#6366f1"],
  },
  {
    id: "spooky",
    emoji: "🎃",
    label: "Spooky Buzz",
    shortLabel: "Spooky",
    price: 60,
    isPaid: true,
    category: "seasonal",
    availability: { type: "date_range", startMonth: 10, startDay: 1, endMonth: 10, endDay: 31 },
    priority: 220,
    description: "A cute mysterious Buzz for spooky season.",
    confirmTitle: "Send Spooky Buzz?",
    confirmBody: "A playful ghost, purple mist, and tiny hearts will play for both of you.",
    senderSuccessTitle: "Spooky Buzz sent 🎃",
    senderSuccessBody: "A little mystery came their way.",
    notificationTitle: "sent you a Spooky Buzz 🎃",
    notificationBody: "A little mystery came your way.",
    receiverOverlayTitle: "sent you a Spooky Buzz 🎃",
    receiverOverlayBody: "A little mystery came your way.",
    animationKey: "spooky",
    gradient: ["#7c2d12", "#7e22ce"],
  },
  {
    id: "holiday",
    emoji: "🎄",
    label: "Holiday Buzz",
    shortLabel: "Holiday",
    price: 90,
    isPaid: true,
    category: "seasonal",
    availability: { type: "date_range", startMonth: 12, startDay: 1, endMonth: 12, endDay: 31 },
    priority: 230,
    description: "A festive Buzz with lights, warmth, and sparkle.",
    confirmTitle: "Send Holiday Buzz?",
    confirmBody: "A holiday lights-and-sparkles animation will play for both of you.",
    senderSuccessTitle: "Holiday Buzz sent 🎄",
    senderSuccessBody: "You sent a little festive warmth.",
    notificationTitle: "sent you a Holiday Buzz 🎄",
    notificationBody: "Someone sent you a little festive warmth.",
    receiverOverlayTitle: "sent you a Holiday Buzz 🎄",
    receiverOverlayBody: "Someone sent you a little festive warmth.",
    animationKey: "holiday",
    gradient: ["#16a34a", "#dc2626"],
  },
  {
    id: "new_year",
    emoji: "🎆",
    label: "New Year Buzz",
    shortLabel: "New Year",
    price: 120,
    isPaid: true,
    category: "seasonal",
    availability: { type: "date_range", startMonth: 12, startDay: 26, endMonth: 1, endDay: 3 },
    priority: 240,
    description: "A limited New Year spark with fireworks and fresh energy.",
    confirmTitle: "Send New Year Buzz?",
    confirmBody: "A fireworks-and-countdown sparkle animation will play for both of you.",
    senderSuccessTitle: "New Year Buzz sent 🎆",
    senderSuccessBody: "A fresh spark just arrived.",
    notificationTitle: "sent you a New Year Buzz 🎆",
    notificationBody: "A fresh spark just arrived.",
    receiverOverlayTitle: "sent you a New Year Buzz 🎆",
    receiverOverlayBody: "A fresh spark just arrived.",
    animationKey: "new_year",
    gradient: ["#0f172a", "#f59e0b"],
  },
];

function dateToMonthDayNumber(month: number, day: number) {
  return month * 100 + day;
}

export function isBuzzTypeAvailable(type: BuzzType, date = new Date()) {
  if (type.availability.type === "always") return true;

  const current = dateToMonthDayNumber(date.getMonth() + 1, date.getDate());
  const start = dateToMonthDayNumber(
    type.availability.startMonth,
    type.availability.startDay
  );
  const end = dateToMonthDayNumber(
    type.availability.endMonth,
    type.availability.endDay
  );

  // Same-year range: Feb 1 -> Feb 15
  if (start <= end) {
    return current >= start && current <= end;
  }

  // Cross-year range: Dec 1 -> Feb 28
  return current >= start || current <= end;
}

export function getAvailableBuzzTypes(date = new Date()) {
  return BUZZ_TYPES.filter((type) => isBuzzTypeAvailable(type, date)).sort(
    (a, b) => a.priority - b.priority
  );
}

export function getBuzzTypeById(id?: string | null) {
  return BUZZ_TYPES.find((type) => type.id === id) || BUZZ_TYPES[0];
}

export function getNormalBuzzType() {
  return getBuzzTypeById("normal");
}

export function formatBuzzPrice(type: BuzzType) {
  return type.price <= 0 ? "Free" : `${type.price} BC`;
}
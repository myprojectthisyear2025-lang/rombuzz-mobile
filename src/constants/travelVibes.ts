/**
 * ============================================================================
 * 📁 File: src/constants/travelVibes.ts
 * 🎯 Purpose: Shared RomBuzz Travel Vibe options for profile preferences.
 *
 * Users can choose up to 5 travel vibes.
 * ============================================================================
 */

export const MAX_TRAVEL_VIBES = 5;

export const TRAVEL_VIBE_OPTIONS = [
  "Love Traveling",
  "Homebody",
  "World Explorer",
  "Beach Lover",
  "Mountain Lover",
  "Camping & Outdoors",
  "Road Trip Lover",
  "Weekend Getaways",
  "City Explorer",
  "Luxury Traveler",
  "Backpacking",
  "Adventure Seeker",
  "Culture & Food Trips",
  "Spontaneous Traveler",
  "Travel With a Partner",
  "Cruise Lover",
  "Island Hopper",
  "Digital Nomad",
  "Nature Escapes",
  "International Traveler",
] as const;

export type TravelVibe =
  (typeof TRAVEL_VIBE_OPTIONS)[number];
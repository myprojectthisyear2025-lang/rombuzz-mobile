# RomBuzz Gifts System

## Strategy

RomBuzz gifts should feel like emotional signals, not transactions. The best product framing is that gifts are small romantic expressions that help shy or introverted users say something without writing a perfect message.

The system should appear in LetsBuzz posts, LetsBuzz reels, View Profile fullscreen media, Profile media, Chat, BuzzPoke, BuzzStreak, MicroBuzz match screens, match celebrations, and gift insights.

BuzzCoin should be used as the internal spending unit, but gift names and UI copy should avoid financial language. Do not say “tip,” “cash,” “payout,” “donation,” “buy attention,” or “pay them.” Say “send a gift,” “send a spark,” or “make the moment special.”

Frontend can show gift metadata and estimated price, but backend must be the source of truth for whether the gift exists, whether it is enabled, whether it is allowed in the requested placement, whether it is premium-only or seasonal-only, and the final BuzzCoin cost.

Never trust frontend price.

## Pricing tiers

| Tier | Suggested range | Use case |
|---|---:|---|
| Cheap gifts | 5–25 BC | Daily reactions, small chat signals, light post/reel gifts |
| Casual gifts | 25–100 BC | More meaningful reactions, MicroBuzz, BuzzPoke, profile media |
| Premium gifts | 100–250 BC | Special chat, profile, reels, apology/reconnect, match moments |
| Rare gifts | 250–800 BC | Legendary moments, premium romantic signals, special milestones |
| Ultra gifts | 1000–2500 BC | Rare wow moments, streak milestones, major match celebrations |

## 100 gifts

| # | id | name | category | rarity | priceBC | animated | placement | asset |
|---:|---|---|---|---|---:|---|---|---|
| 1 | `smile_spark` | Smile Spark | sweet | common | 5 | true | universal | lottie |
| 2 | `soft_hello` | Soft Hello | sweet | common | 5 | false | chat | png |
| 3 | `tiny_heart_ping` | Tiny Heart Ping | attention | common | 8 | true | buzzpoke | lottie |
| 4 | `blush_note` | Blush Note | sweet | common | 8 | false | chat | svg |
| 5 | `starry_like` | Starry Like | playful | common | 10 | true | posts | lottie |
| 6 | `cozy_wave` | Cozy Wave | sweet | common | 10 | true | chat | lottie |
| 7 | `mini_rose` | Mini Rose | romantic | common | 12 | false | universal | png |
| 8 | `sunny_smile` | Sunny Smile | sweet | common | 12 | true | reels | lottie |
| 9 | `gentle_nudge` | Gentle Nudge | buzzpoke | common | 15 | true | buzzpoke | lottie |
| 10 | `kind_glow` | Kind Glow | sweet | common | 15 | false | profile_media | png |
| 11 | `cute_comet` | Cute Comet | playful | common | 18 | true | reels | lottie |
| 12 | `soft_star` | Soft Star | attention | common | 18 | false | posts | svg |
| 13 | `warm_ping` | Warm Ping | buzzpoke | common | 20 | true | buzzpoke | lottie |
| 14 | `pocket_charm` | Pocket Charm | playful | common | 20 | false | chat | png |
| 15 | `happy_sparkle` | Happy Sparkle | celebration | common | 22 | true | universal | lottie |
| 16 | `sweet_pebble` | Sweet Pebble | sweet | common | 22 | false | posts | png |
| 17 | `heart_confetti` | Heart Confetti | celebration | uncommon | 25 | true | match_celebration | lottie |
| 18 | `soft_bloom` | Soft Bloom | romantic | uncommon | 25 | true | profile_media | lottie |
| 19 | `moonlit_hi` | Moonlit Hi | romantic | uncommon | 28 | false | chat | png |
| 20 | `thought_bubble` | Thought Bubble | attention | uncommon | 28 | true | chat | lottie |
| 21 | `reel_spark` | Reel Spark | playful | uncommon | 30 | true | reels | lottie |
| 22 | `photo_glow` | Photo Glow | sweet | uncommon | 30 | false | profile_media | png |
| 23 | `buzz_beam` | Buzz Beam | buzzpoke | uncommon | 35 | true | buzzpoke | webm |
| 24 | `soft_laugh` | Soft Laugh | funny | uncommon | 35 | true | reels | lottie |
| 25 | `charming_wink` | Charming Wink | playful | uncommon | 40 | false | chat | png |
| 26 | `nearby_spark` | Nearby Spark | microbuzz | uncommon | 40 | true | microbuzz | lottie |
| 27 | `first_match_pop` | First Match Pop | celebration | uncommon | 45 | true | match_celebration | lottie |
| 28 | `gentle_retry` | Gentle Retry | apology | uncommon | 45 | false | chat | png |
| 29 | `streak_flamelet` | Streak Flamelet | streak | uncommon | 50 | true | streak | lottie |
| 30 | `soft_apology` | Soft Apology | apology | uncommon | 50 | false | chat | svg |
| 31 | `rose_spark` | Rose Spark | romantic | rare | 60 | true | universal | lottie |
| 32 | `midnight_note` | Midnight Note | romantic | rare | 60 | false | chat | png |
| 33 | `golden_ping` | Golden Ping | buzzpoke | rare | 65 | true | buzzpoke | webm |
| 34 | `micro_magnet` | Micro Magnet | microbuzz | rare | 65 | true | microbuzz | lottie |
| 35 | `reel_ribbon` | Reel Ribbon | playful | rare | 70 | true | reels | lottie |
| 36 | `profile_shimmer` | Profile Shimmer | attention | rare | 70 | true | profile_media | lottie |
| 37 | `sweet_rewind` | Sweet Rewind | apology | rare | 75 | true | chat | lottie |
| 38 | `laugh_cloud` | Laugh Cloud | funny | rare | 75 | true | posts | lottie |
| 39 | `match_moment` | Match Moment | celebration | rare | 80 | true | match_celebration | webm |
| 40 | `streak_star` | Streak Star | streak | rare | 80 | true | streak | lottie |
| 41 | `velvet_rose` | Velvet Rose | romantic | rare | 85 | false | profile_media | png |
| 42 | `glow_pulse` | Glow Pulse | attention | rare | 85 | true | buzzpoke | lottie |
| 43 | `tiny_fireworks` | Tiny Fireworks | celebration | rare | 90 | true | reels | lottie |
| 44 | `daydream_badge` | Daydream Badge | sweet | rare | 90 | false | universal | svg |
| 45 | `coffee_smile` | Coffee Smile | sweet | rare | 95 | true | chat | lottie |
| 46 | `nearby_orbit` | Nearby Orbit | microbuzz | rare | 95 | true | microbuzz | webm |
| 47 | `golden_rose` | Golden Rose | premium | epic | 120 | true | universal | lottie |
| 48 | `soft_spotlight` | Soft Spotlight | attention | epic | 120 | true | profile_media | webm |
| 49 | `superbuzz_trail` | SuperBuzz Trail | buzzpoke | epic | 130 | true | buzzpoke | webm |
| 50 | `heart_ribbon_drop` | Heart Ribbon Drop | romantic | epic | 130 | true | reels | webm |
| 51 | `moonbeam_message` | Moonbeam Message | romantic | epic | 140 | true | chat | lottie |
| 52 | `streak_crownlet` | Streak Crownlet | streak | epic | 140 | true | streak | lottie |
| 53 | `reconnect_bloom` | Reconnect Bloom | apology | epic | 150 | true | chat | lottie |
| 54 | `match_glowburst` | Match Glowburst | celebration | epic | 150 | true | match_celebration | webm |
| 55 | `microbuzz_signal` | MicroBuzz Signal | microbuzz | epic | 160 | true | microbuzz | webm |
| 56 | `silver_charm` | Silver Charm | premium | epic | 160 | false | universal | png |
| 57 | `floating_lantern` | Floating Lantern | romantic | epic | 170 | true | profile_media | webm |
| 58 | `reel_ovation` | Reel Ovation | celebration | epic | 170 | true | reels | webm |
| 59 | `gentle_comeback` | Gentle Comeback | apology | epic | 180 | false | chat | png |
| 60 | `spark_ring` | Spark Ring | attention | epic | 180 | true | buzzpoke | lottie |
| 61 | `butterfly_ping` | Butterfly Ping | sweet | epic | 190 | true | universal | webm |
| 62 | `starlit_compliment` | Starlit Compliment | romantic | epic | 190 | false | chat | png |
| 63 | `dreamy_applause` | Dreamy Applause | celebration | epic | 200 | true | posts | lottie |
| 64 | `soft_meteor` | Soft Meteor | playful | epic | 200 | true | reels | webm |
| 65 | `premium_glow_note` | Premium Glow Note | premium | epic | 220 | true | chat | lottie |
| 66 | `nearby_firefly` | Nearby Firefly | microbuzz | epic | 220 | true | microbuzz | lottie |
| 67 | `diamond_smile` | Diamond Smile | premium | legendary | 300 | true | universal | webm |
| 68 | `rose_comet` | Rose Comet | romantic | legendary | 320 | true | reels | webm |
| 69 | `golden_superbuzz` | Golden SuperBuzz | buzzpoke | legendary | 350 | true | buzzpoke | webm |
| 70 | `seven_day_spark` | Seven Day Spark | streak | legendary | 350 | true | streak | webm |
| 71 | `match_firefly_cascade` | Match Firefly Cascade | celebration | legendary | 375 | true | match_celebration | webm |
| 72 | `aurora_note` | Aurora Note | romantic | legendary | 400 | true | chat | webm |
| 73 | `profile_aura` | Profile Aura | premium | legendary | 425 | true | profile_media | webm |
| 74 | `microbuzz_beacon` | MicroBuzz Beacon | microbuzz | legendary | 450 | true | microbuzz | webm |
| 75 | `velvet_sky` | Velvet Sky | romantic | legendary | 475 | true | universal | webm |
| 76 | `rare_reconnect` | Rare Reconnect | apology | legendary | 500 | true | chat | webm |
| 77 | `spotlight_bloom` | Spotlight Bloom | attention | legendary | 525 | true | profile_media | webm |
| 78 | `reel_constellation` | Reel Constellation | celebration | legendary | 550 | true | reels | webm |
| 79 | `golden_streak_path` | Golden Streak Path | streak | legendary | 575 | true | streak | webm |
| 80 | `heart_aurora` | Heart Aurora | premium | legendary | 600 | true | universal | webm |
| 81 | `soft_crown` | Soft Crown | premium | legendary | 625 | false | profile_media | png |
| 82 | `supernova_smile` | Supernova Smile | celebration | legendary | 650 | true | match_celebration | webm |
| 83 | `secret_garden` | Secret Garden | exclusive | legendary | 675 | true | universal | webm |
| 84 | `glimmer_bridge` | Glimmer Bridge | romantic | legendary | 700 | true | microbuzz | webm |
| 85 | `platinum_ping` | Platinum Ping | buzzpoke | legendary | 750 | true | buzzpoke | webm |
| 86 | `winter_warmth` | Winter Warmth | seasonal | rare | 90 | true | universal | lottie |
| 87 | `spring_bloom_ping` | Spring Bloom Ping | seasonal | rare | 90 | true | universal | lottie |
| 88 | `summer_glow` | Summer Glow | seasonal | rare | 95 | false | universal | png |
| 89 | `autumn_note` | Autumn Note | seasonal | rare | 95 | false | universal | svg |
| 90 | `new_year_spark` | New Year Spark | seasonal | epic | 200 | true | match_celebration | webm |
| 91 | `valentine_glow` | Valentine Glow | seasonal | epic | 240 | true | universal | webm |
| 92 | `birthday_bloom` | Birthday Bloom | celebration | epic | 240 | true | chat | webm |
| 93 | `anniversary_light` | Anniversary Light | romantic | legendary | 700 | true | chat | webm |
| 94 | `exclusive_orbit` | Exclusive Orbit | exclusive | legendary | 800 | true | universal | webm |
| 95 | `moon_rose_cascade` | Moon Rose Cascade | exclusive | ultra | 1000 | true | universal | mp4 |
| 96 | `aurora_heartfall` | Aurora Heartfall | exclusive | ultra | 1200 | true | match_celebration | mp4 |
| 97 | `infinity_glow` | Infinity Glow | premium | ultra | 1500 | true | profile_media | mp4 |
| 98 | `legendary_superbuzz` | Legendary SuperBuzz | buzzpoke | ultra | 1800 | true | buzzpoke | mp4 |
| 99 | `seven_sky_streak` | Seven Sky Streak | streak | ultra | 2000 | true | streak | mp4 |
| 100 | `romance_constellation` | Romance Constellation | exclusive | ultra | 2500 | true | universal | mp4 |


## Frontend file

Use `src/config/rombuzzGifts.ts`.

## Backend file

Use `server/config/rombuzzGifts.js`.

## Wiring

### LetsBuzz posts
Import `getGiftsByPlacement("posts")`. Frontend sends `giftId`, `placement: "posts"`, `targetType: "buzz_post"`, `targetId`, and `receiverId`. Backend validates gift and placement, calculates price server-side, deducts BuzzCoin, saves transaction, updates summary, emits `gift:new`, and creates notification.

### LetsBuzz reels
Import `getGiftsByPlacement("reels")`. Use short animations that do not block reel controls. Frontend sends `giftId`, `placement: "reels"`, `targetType: "buzz_reel"`, `targetId`, and `receiverId`.

### View Profile fullscreen media
Import `getGiftsByPlacement("profile_media")`. Show gift actions only in fullscreen. Hide gift controls when photo is zoomed. Frontend sends `giftId`, `placement: "profile_media"`, `targetType: "profile_media"`, `targetId`, and `receiverId`.

### Chat gift flow
Import `getGiftsByPlacement("chat")`. Chat gifts should be real message objects, not raw JSON. Store message type `gift` with metadata containing `giftId` and `transactionId`. Chat renderer looks up the gift by ID and displays the proper gift UI. Backend emits both `message:new` and `gift:new`.

### BuzzPoke
Import `getGiftsByPlacement("buzzpoke")`. BuzzPoke gifts must be matched-user-only. Backend enforces match status, cooldown, allowed placement, balance, notification, and socket event.

### MicroBuzz
Import `getGiftsByPlacement("microbuzz")`. Only allow MicroBuzz gifts after valid nearby interaction or match context. Avoid copy that feels like buying access to nearby people.

### Profile media gifts
Use `profile_media` placement. Gift summaries should aggregate by `giftId`, not gift name, so names can change later without breaking history.

### Gift insights
Gift insights should use transaction records plus frontend metadata lookup. Store stable IDs in database. Display current name/icon from config.

## Database transaction fields

| Field | Why |
|---|---|
| senderId | Who sent the gift |
| receiverId | Who received the gift |
| giftId | Stable lookup key |
| priceBC | Server-side price snapshot at purchase time |
| placement | Where gift was sent |
| targetType | Post, reel, media, chat, buzzpoke, microbuzz, streak, etc. |
| targetId | Exact target object |
| createdAt | Timeline and audit |
| transactionId | Idempotency and support reference |
| status | pending, completed, failed, refunded |
| refundedAt | Needed for refund/payment failure logic |
| failureReason | Debug and support |
| appPlatform | iOS, Android, web |
| appVersion | Client debugging |
| metadata | Safe optional details like assetVersion or campaignId |

## Backend purchase flow

1. Authenticate user.
2. Validate receiver.
3. Validate target content.
4. Validate `giftId`.
5. Validate placement.
6. Check enabled, premium-only, and seasonal-only rules.
7. Load price from `server/config/rombuzzGifts.js`.
8. Check BuzzCoin balance.
9. Deduct BuzzCoin safely.
10. Create gift transaction.
11. Update gift summary.
12. Emit socket event.
13. Create notification.
14. Return transaction response.

## Scalability

- Add gifts by appending new objects.
- Disable gifts with `enabled: false`; do not delete launched gift IDs.
- Change price in backend config first because backend is source of truth.
- Use `seasonalOnly` for seasonal windows.
- Use `premiumOnly` for premium/KYC-gated gifts.
- Keep asset paths predictable, such as `/assets/gifts/{giftId}.json`.
- Keep transaction status instead of deleting failed/refunded records.
- For future receiver earning, avoid consumer-facing cash-out language until policy review is complete.

## Testing checklist

### Frontend
- Gift picker opens.
- Gifts filter by placement.
- Animated gifts display correctly.
- Disabled gifts do not show.
- Premium gifts lock for non-premium users.
- Seasonal gifts only show during allowed windows.
- Chat gifts do not render raw JSON.
- Fullscreen media gift controls hide while zoomed.
- Reel gifts do not block video controls.

### Backend
- Invalid gift ID fails.
- Disabled gift fails.
- Wrong placement fails.
- Frontend price spoofing fails.
- Insufficient BuzzCoin fails.
- Non-matched BuzzPoke gift fails.
- Valid gift succeeds.
- Transaction saves.
- Balance deducts once.
- Socket event emits.
- Receiver notification creates.
- Gift summary updates.

### App Store / Play Store safety
- No sexual names.
- No gambling mechanics.
- No cash-out wording.
- No minors or school themes.
- No manipulative gift names.
- No predatory “pay for attention” wording.

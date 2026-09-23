<!-- Path: docs/performance/screen-baseline.md; Purpose: Explicit separation of unavailable native timings from measured local API baselines. -->
# Screen baseline status

**Unavailable** means no valid measurement, never zero. There was no connected native device. Consequently native tap-to-useful-content, render, media-visible and cache hit/miss values are unavailable for every row. HTTP/backend/Mongoose numbers below are **local synthetic p50 milliseconds** from the independent endpoint fixture, not screen totals. See [flow-map.md](flow-map.md) for scope differences and [baseline.md](baseline.md) for p95, samples and payloads.

| Experience | Native client total | Local HTTP body | Backend | Mongoose union | Client render | Media visible | Cache hit/miss | Main measured API cost / limitation |
|---|---|---:|---:|---:|---|---|---|---|
| App startup | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Individual warmup routes only; no launch trace |
| Homepage | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable | Greeting is local storage; no dedicated Home API |
| Discover | Unavailable | 65.28 | 60.42 | 48.30 | Unavailable | Unavailable | Unavailable | Candidate query + 639,311-byte response |
| View Profile | Unavailable | 7.31 | 5.12 | 4.00 | Unavailable | Unavailable | Unavailable | Profile read only; location/media excluded |
| LetsBuzz Posts | Unavailable | 7.34 | 5.42 | 3.82 | Unavailable | Unavailable | Unavailable | Shared gallery-feed API only |
| LetsBuzz Reels | Unavailable | 7.34 | 5.42 | 3.82 | Unavailable | Unavailable | Unavailable | Same feed; video first frame unavailable |
| Social Stats | Unavailable | 9.32 | 7.88 | 6.61 | Unavailable | Unavailable | Unavailable | Counts endpoint; modal lists unavailable |
| Notifications | Unavailable | 37.40 | 35.85 | 33.95 | Unavailable | Unavailable | Unavailable | 82 operations for 80 notifications |
| Matches | Unavailable | 37.73 | 35.42 | 34.12 | Unavailable | Unavailable | Unavailable | Inbox route; Social Stats matches is a different route |
| Chat inbox | Unavailable | 37.73 | 35.42 | 34.12 | Unavailable | Unavailable | Unavailable | 20 per-match room lookups; presence excluded |
| Chat open | Unavailable | 13.42 | 11.95 | 10.27 | Unavailable | Unavailable | Unavailable | 40-message page; cache/display excluded |
| Chat send | Unavailable | 47.39 | 44.74 | 41.44 | Unavailable | Unavailable | Unavailable | HTTP send only; optimistic bubble unavailable |
| Chat history | Unavailable | 12.39 | 10.95 | 9.33 | Unavailable | Unavailable | Unavailable | Earlier 40-message page |
| MicroBuzz | Unavailable | 8.71 | 7.11 | 6.06 | Unavailable | Unavailable | Unavailable | Empty nearby scan only |
| Own Profile | Unavailable | 6.33 | 5.11 | 4.21 | Unavailable | Unavailable | Unavailable | profile/full API |
| Profile gallery | Unavailable | 6.33 | 5.11 | 4.21 | Unavailable | Unavailable | Unavailable | Included in own-profile response; no gallery download |
| Shared Media | Unavailable | 132.60 | 126.68 | 100.07 | Unavailable | Unavailable | Unavailable | Complete room hydration; text fixture |
| Purchased Media | Unavailable | 132.60 | 126.68 | 100.07 | Unavailable | Unavailable | Unavailable | Same room read; no paid-media display |
| Gifts catalog | Unavailable | 3.52 | 2.10 | 1.30 | Unavailable | Unavailable | Unavailable | Catalog only, assets unavailable |
| Video-call start | Unavailable | 22.53 | 20.19 | 16.02 | Unavailable | Unavailable | Unavailable | Synthetic API setup, no Agora session |

Unread summary, used across startup/chat badges and realtime work, measured 101.97 ms HTTP / 100.58 ms backend / 98.70 ms logical Mongoose p50. Native badge-update delay is unavailable.

No row supports a statement such as "this screen takes 1,240 ms." The supplied capture procedure adds the missing native observations; the paired backend waterfall already accounts for measured request time.

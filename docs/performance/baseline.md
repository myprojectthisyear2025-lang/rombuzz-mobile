<!-- Path: docs/performance/baseline.md; Purpose: Generated real local synthetic API baseline. -->
# Measured local baseline

Captured 2026-09-23T02:37:30.823Z. Windows loopback; synthetic Mongo replica set; Node v22.20.0.

401 users, 20 matches, 120 posts, 500 initial embedded messages, 80 notifications. Media URLs are synthetic references: no media was downloaded. API timings are **Node loopback HTTP**, not native screen/tap timings. Read flows: 15 warm serial samples; chat send: 7; call actions: 5. First access is excluded from warm statistics, retained below.

| Experience/API | n | HTTP body p50 | p95 | Backend p50 | Mongoose union p50 | Driver union p50 | Hydration p50 | Queries | Bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| health | 15 | 5.23 | 12.56 | 0.62 | 0.00 | 0.00 | 0.00 | 0 | 93 |
| discover | 15 | 65.28 | 115.44 | 60.42 | 48.30 | 27.55 | 0.00 | 8 | 639311 |
| view-profile | 15 | 7.31 | 10.19 | 5.12 | 4.00 | 2.57 | 0.00 | 4 | 1942 |
| letsbuzz-posts-reels | 15 | 7.34 | 8.42 | 5.42 | 3.82 | 2.34 | 0.00 | 3 | 68887 |
| social-stats | 15 | 9.32 | 18.89 | 7.88 | 6.61 | 4.31 | 0.00 | 8 | 117 |
| notifications | 15 | 37.40 | 72.07 | 35.85 | 33.95 | 26.14 | 0.00 | 82 | 51741 |
| matches-inbox | 15 | 37.73 | 50.37 | 35.42 | 34.12 | 29.75 | 0.00 | 23 | 10829 |
| chat-open | 15 | 13.42 | 18.19 | 11.95 | 10.27 | 6.95 | 0.00 | 7 | 59410 |
| chat-history | 15 | 12.39 | 14.34 | 10.95 | 9.33 | 6.40 | 0.00 | 7 | 59410 |
| shared-purchased-media | 15 | 132.60 | 158.91 | 126.68 | 100.07 | 17.28 | 68.88 | 7 | 741391 |
| unread | 15 | 101.97 | 135.43 | 100.58 | 98.70 | 16.89 | 65.40 | 5 | 36 |
| microbuzz | 15 | 8.71 | 13.47 | 7.11 | 6.06 | 4.11 | 0.00 | 6 | 12 |
| own-profile-gallery | 15 | 6.33 | 8.73 | 5.11 | 4.21 | 2.60 | 0.00 | 4 | 12334 |
| gifts-catalog | 15 | 3.52 | 6.04 | 2.10 | 1.30 | 0.78 | 0.00 | 1 | 30644 |
| video-call-active | 15 | 7.21 | 10.16 | 5.82 | 4.85 | 2.78 | 0.00 | 4 | 23 |
| chat-send | 7 | 47.39 | 53.34 | 44.74 | 41.44 | 32.36 | 0.00 | 10 | 1503 |
| video-call-start | 5 | 22.53 | 30.28 | 20.19 | 16.02 | 11.45 | 0.00 | 9 | 1028 |
| video-call-token | 5 | 10.53 | 15.27 | 8.13 | 5.98 | 3.05 | 0.15 | 3 | 1028 |
| video-call-accept | 5 | 15.05 | 15.72 | 12.18 | 8.98 | 5.91 | 0.15 | 4 | 1052 |
| video-call-end | 5 | 11.83 | 21.93 | 9.44 | 7.63 | 5.20 | 0.18 | 3 | 762 |

Milliseconds throughout. Mongoose includes pool wait, driver/network, BSON/materialization, hydration and query hooks. Driver time includes wire/server time; it is not pure database CPU. Hydration and driver spans are **inside** Mongoose spans. Auth also includes user queries. These columns must not be added. Independent column medians do not describe one request.

## First access and parse cost

| Flow | First HTTP body ms | Warm JSON parse p50 ms | Statuses |
|---|---:|---:|---|
| health | 70.29 | 0.01 | 200 |
| discover | 254.66 | 2.06 | 200 |
| view-profile | 10.31 | 0.03 | 200 |
| letsbuzz-posts-reels | 10.19 | 0.22 | 200 |
| social-stats | 14.75 | 0.01 | 200 |
| notifications | 56.42 | 0.19 | 200 |
| matches-inbox | 46.64 | 0.04 | 200 |
| chat-open | 20.65 | 0.26 | 200 |
| chat-history | 17.39 | 0.25 | 200 |
| shared-purchased-media | 287.16 | 2.96 | 200 |
| unread | 123.02 | 0.01 | 200 |
| microbuzz | 17.53 | 0.01 | 200 |
| own-profile-gallery | 13.30 | 0.08 | 200 |
| gifts-catalog | 5.26 | 0.11 | 200 |
| video-call-active | 17.37 | 0.01 | 200 |
| chat-send | 55.98 | 0.05 | 200 |
| video-call-start | 34.80 | 0.03 | 200 |
| video-call-token | 13.78 | 0.04 | 200 |
| video-call-accept | 17.79 | 0.02 | 200 |
| video-call-end | 13.37 | 0.03 | 200 |

Client intervals include synthetic token/request-option preparation and JavaScript scheduling around fetch; socket connection timing also includes client setup. They are not pure wire transit.

First access is route/JIT/pool warming in an already running local process, **not** a Render cold start.

## Existing-index execution statistics

| Synthetic query | Returned | Docs examined | Keys examined | DB execution ms | Index / stages |
|---|---:|---:|---:|---:|---|
| User.findOne.id | 1 | 1 | 1 | 0 | id_1 / EXPRESS_IXSCAN |
| User.discover-base-filter | 380 | 380 | 401 | 1 | id_1 / LIMIT → FETCH → IXSCAN |
| Match.users | 20 | 20 | 20 | 0 | users_1 / FETCH → IXSCAN |
| Post.owner-sort | 12 | 12 | 12 | 0 | userId_1_createdAt_-1, userId_1_createdAt_-1 / FETCH → SORT_MERGE → IXSCAN → IXSCAN |
| ChatRoom.roomId | 1 | 1 | 1 | 0 | roomId_1 / EXPRESS_IXSCAN |
| ChatRoom.unread-participants | 1 | 1 | 1 | 0 | participants_1_updatedAt_-1 / FETCH → IXSCAN |

Explain is bounded to 1,000 ms, run only on this disposable fixture after baseline requests. These are the identified query shapes; the post owner/sort example is a representative query, not the active gallery feed. No Atlas/production explain was run. A zero executionMs is Mongo’s integer-millisecond result, not evidence of zero work.

## Diagnostic overhead

60 warm samples per mode/route, interleaved order, identical fixture, two local backend processes. Enabled mode samples 100% and writes detailed records.

| Route | Off p50 | On p50 | Difference | Off p95 | On p95 |
|---|---:|---:|---:|---:|---:|
| / | 1.28 | 1.39 | 0.10 | 7.50 | 2.29 |
| /api/profile/full | 7.20 | 7.77 | 0.56 | 9.64 | 10.52 |

These are noisy local A/B observations, not a production overhead guarantee. Disabled mode installs no Mongoose/Express wrappers and emits no timing headers or diagnostic logs. Mobile device overhead remains unavailable.

Socket connect (10 local authenticated WebSocket connections): p50 **11.79 ms**, p95 **29.90 ms**. Sender HTTP initiation → peer Socket.IO message callback (8 sends): p50 **46.31 ms**. Neither measures native chat bubble visibility.

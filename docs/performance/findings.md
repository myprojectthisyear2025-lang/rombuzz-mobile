<!-- Path: docs/performance/findings.md; Purpose: Evidence, confidence, classifications and a provisional future backlog without optimization changes. -->
# Findings and prioritized follow-up

Numbers below come from the final local fixture, not Render/Atlas or a mobile device. High confidence means the mechanism and local measurement agree; it does not imply a production percentile. Production frequency, worldwide prevalence and user-visible delay remain unmeasured, so no production P0 bottleneck is asserted.

## Measured costs

| Finding / category | Affected flow and evidence | Measured local time / volume | Confidence | Future investigation or fix, not implemented |
|---|---|---|---|---|
| Full embedded-room materialization; MongoDB architecture / application-side Mongoose work | `services/chatUnread.js` reads ChatRoom with `.lean(false)`; driver, logical and document-init spans distinguish work | Unread HTTP p50 101.97 ms; backend 100.58 ms; ChatRoom.find 93.12 ms; hydration union 65.40 ms | High for fixture; production unknown | After migration validation, test projected/lean unread computation preserving Maps, expiry, hidden messages and manual unread semantics; evaluate message storage separately only if evidence requires it |
| Full-history response for media views; payload / hydration / serialization | Both media hubs request rooms/:id without limit; `routes/chatRooms.js` loads a hydrated full room | HTTP p50 132.60 ms; backend 126.68 ms; longest room lookup p50 93.45 ms; hydration 68.88 ms; serialization 5.51 ms; 741,391 bytes for 500 text messages | High for fixture; populated media payload unknown | Measure representative long rooms, then consider a bounded media read path or reduced materialization without changing authorization/paid-media rules |
| Large candidate response; MongoDB query / application logic / payload | Discover finds up to 400 candidates, performs existing filters/scores, signs/transforms | 380 returned; 639,311 bytes; HTTP 65.28 ms; backend 60.42 ms; candidate User.find 35.60 ms | High for fixture | Profile realistic filters/cardinality and native consumption before considering projection/pagination or algorithm-preserving reductions |
| Repeated actor lookups; MongoDB query fan-out | `routes/notifications.js` enriches each notification using User.findOne | 82 total operations: auth + notifications + 80 actor queries for 20 distinct actors; backend 35.85 ms; longest User.findOne per-request p50 29.25 ms | High | Evaluate deduplicated/batched actor hydration; preserve all output fields and visibility rules |
| Per-match room lookups; MongoDB query fan-out | `routes/likesMatches.js` maps 20 matches with one ChatRoom.findOne each | 23 total operations; backend 35.42 ms; longest per-request room lookup p50 28.37 ms | High | Evaluate batch room metadata after confirming last-message and unread behavior |
| Repeated self lookups; backend auth / application logic | Discover auth, feature permission and route each resolve current user | Three User.findOne calls per request; 8 total logical operations; pooled User.findOne call p50 1.72 ms | High count; no proven large delay | Assess request-local reuse only after clarifying each projection/security requirement; never cache away current authorization checks |
| Chat persistence + delivery | HTTP chat-room send and peer Socket.IO callback | HTTP warm p50 47.39 ms; backend 44.74 ms; HTTP-start-to-peer-event p50 46.31 ms across 8 sends | High local | Measure sender optimistic bubble and recipient native commit before prioritizing any transport change |
| Middleware / response preparation | All exercised requests wrapped at leaf middleware and serialization | Other middleware p50 0.06–0.50 ms across flows; auth p50 1.43–3.02 ms including user queries; max flow serialization p50 5.51 ms | High local | Not the leading measured local cost; keep measuring under real payload/concurrency |

The six bounded explain plans all used existing indexes. The room queries examined/returned one document; Discover examined/returned 380 and examined 401 keys. The representative post sort used SORT_MERGE with its existing owner/date index. No production collection scan, missing index or expensive lookup stage was demonstrated. Logical Mongo spans must not be presented as database CPU time.

Backend operation ranking, p95 values and first-access samples are in [operations.md](operations.md) and [baseline.md](baseline.md). First access is JIT/pool/route warmup, not a measured Render cold start. Call cycles and independent chat sends wait 500 ms between cycles so existing asynchronous unread work is less likely to contaminate the next sample; normal background work still exists. No concurrency/load capacity conclusion follows from this serial fixture.

## Duplicate frontend requests and cache

These are **source-supported candidates**, not observed device duplicate counts. The new exact-URL detector was tested synthetically but no native navigation session ran.

| Source evidence | Potential overlap | Existing guards / required proof |
|---|---|---|
| Startup warmup launches six data jobs; root pager has `lazy: false` for five screens | Mount fetches can overlap warmup for profile, feed, matches and stats | Warmup has once-per-session guard; individual screens have cache/in-flight guards. Capture actual requests before calling any unnecessary |
| `app/(tabs)/_layout.tsx` reads notifications for unread badge; Notifications screen also reads the list; startup also warms it | Entering Notifications can cause badge and screen requests for the same list | Layout already throttles ordinary badge reads to 60 seconds and only forces when entering Notifications; no claim of every-tab refetch |
| Layout, startup and `chatListPersistence.ts` read unread-summary; reconnect refreshes unread truth | Shared expensive full-room read can be repeated across owners | Socket pushes are also consumed; determine which HTTP reads were required recovery versus avoidable overlap |
| Startup warms users/social-stats, whereas Social Stats uses social-stats | Semantically overlapping resources with different URL aliases | Exact-URL detector will not automatically mark this pair; source analysis and state timing are necessary |
| `LetsBuzzPosts.tsx` conditionally hydrates incomplete owners with users/:id | Multiple items can request the same owner when the feed lacks fields | Current feed includes owners in the fixture; no duplicate production count was measured. Reels does not get assigned the old per-owner behavior |
| Deferred inbox presence reads one peer per request, concurrency 4 | Startup/inbox can add several presence calls after content work | Existing 2-minute presence cache and deferral matter; native trace must establish whether they delay interaction |

No focus loop or unstable-effect performance regression was proven by runtime evidence. Cached content hit-rate, cache latency, cache-to-pixel time and background refresh overlap are unavailable until device capture. Do not remove stale refreshes solely because a local cache hit exists.

## Rendering and startup

The root pager deliberately mounts neighboring screens to support swiping. Existing startup code contains a 2,100 ms splash gate and a separate 2,000 ms routing timer; the Home animation duration is 320 ms. These are **configured timers**, not measured startup duration, and must not be added because eligibility and overlap differ. Existing auth storage synchronization polls every 400 ms. No behavior was changed.

Posts already uses a FlatList with initialNumToRender 4/windowSize 5; Reels uses 1/3 and existing viewability behavior. Large source files or `.map()` calls alone do not establish excessive render cost. There is no measured React rerender, JS-blocking, list repaint, native layout, or dropped-frame bottleneck in this environment. Use the new Profiler events with Android/iOS frame tools; retain the fixed current Reels behavior.

Discover-profile obtains fresh viewer coordinates before its main request and can also reverse-geocode/update location. This is a possible pre-request delay that is absent from the Node HTTP baseline. Capture tap-to-request gaps and native location timing before assigning that gap to the API.

## Media

No R2/Cloudinary/Cloudflare Stream media was fetched during the baseline. Synthetic user media references use example.test; the shared/purchased fixture contains text messages. Actual CDN cache hit, payload, dimensions, first-frame and native visible time remain unavailable.

Current source uses R2 signed GETs and also **Cloudflare Stream** playback/thumbnail paths, in addition to Cloudinary gift/media URLs. R2 upload code sets `private, max-age=3600`; signed URL default lifetime is 3,600 seconds, clamped 60..21,600 seconds. This is source configuration, not a verified live edge response. Signed URL variation could influence native cache keys, but duplicate transfers were not observed. Discover and LetsBuzz already prefetch image URLs; the feed helper considers up to eight items and deduplicates URLs within that invocation. Prefetch invocation is not proof of transfer completion or cache reuse.

Local bundled image metadata was measured separately in [assets.json](evidence/assets.json): logo 677,152 bytes at 1024x1024; Home Discover 1,878,176 bytes at 1122x1402; Home MicroBuzz 1,752,833 bytes at 1122x1402. These are packaged assets, not CDN request sizes. They are candidates for native decode/memory measurement, not proven media bottlenecks.

## Socket.IO

Ten authenticated local WebSocket connects measured p50 11.79 ms / p95 29.90 ms. Message event delivery measured p50 46.31 ms. This excludes real geography, device rendering, push notifications and Agora traffic. Regression tests cover persistence, identity enforcement, reconnect/restart, typing, seen and idempotent registration.

`src/lib/socket.ts` reuses a socket only after `.connected` is true. Concurrent calls while connecting/reconnecting can therefore allocate more than one connection. This is a code-supported risk, not a measured duplicate connection count. The new live-connection/listener events allow verification. `useChatListRealtime.ts` calls `off('chat:unread:update')` without its own callback during cleanup; that can remove another subscriber's listener. Other cleanup paths use named listeners. Do not redesign this lifecycle without a targeted reproduction. Existing backend register aliases are already idempotent, and both registration tests passed.

## Provisional backlog

| Priority | Next item | Impact/frequency/global evidence | Risk of future change |
|---|---|---|---|
| Measurement prerequisite | Native cold/warm and actual-region capture after migration/parity confirmation | Required to rank real user-visible/global delay; no valid production screen or Asia number yet | Low: capture only |
| P1 candidate | Unread full-room hydration | 100.58 ms backend p50 locally; source used by startup/badges/realtime, so broad exposure is plausible; real frequency unknown | Medium/high: preserve seen, expiry, hidden and manual unread semantics; coordinate migration |
| P1 candidate | Full-history media hub read | 126.68 ms backend p50 and 741 KB in a 500-text-message fixture; network impact in Asia unmeasured | Medium/high: media permissions, purchase and ephemeral behavior |
| P1 candidate | Discover response/query workload | 60.42 ms backend and 639 KB; central flow, no production frequency estimate | High if filtering/matching changes; start with measurement of projections and response needs |
| P2 candidate | Notification actor fan-out and match room fan-out | 82 / 23 operations; 35.85 / 35.42 ms backend p50 locally; likely amplified by connection/geography but not quantified | Medium: DTO and authorization parity required |
| P2 investigation | Startup/badge/screen request overlap; connecting socket reuse | Concrete overlapping owners/race paths, no native count or saved milliseconds yet | Medium; preserve cache freshness and realtime ownership |
| Unranked | Render/Atlas hosting, global transport, frontend rendering, R2/Cloudinary/Stream delivery, native decoding, index changes | Measurements unavailable; no honest impact ranking possible | Unknown until captures |

No Redis, new index, hosting move, Fly.io deployment, server caching, query rewrite, screen refactor or socket change is justified or implemented by this audit alone. A demonstrated narrow improvement should be a separate task with before/after device and API measurements.

<!-- Path: docs/performance/README.md; Purpose: Entry point and executive summary of the instrumentation and local baseline audit. -->
# RomBuzz performance instrumentation and baseline

Audit period: 22–23 September 2026, America/Chicago. Final baseline measurements captured at `2026-09-23T02:37:30.823Z`.

**Instrumentation and the authorized local synthetic baseline are complete. Production tap-to-visible performance is not established.** There was no connected Android/iOS device, staging environment, production dataset, or regional runner. The report never substitutes loopback HTTP for a screen measurement.

Only these current local checkouts were used:

- Mobile: `C:/projects/rombuzz-mobile`, base HEAD `ed5054f` (19 September), plus the instrumentation changes listed in [files.md](files.md).
- Backend: `C:/projects/rombuzz/Rombuzz_main/server`, base HEAD `b4c4f1d` (21 September), plus the instrumentation changes listed in [files.md](files.md).

No older backend archive or earlier audit was used as implementation evidence. No deployment, optimization, API redesign, cache change, index addition to an application database, or migration change was made. The previously fixed Reels blank screen is not reported as an unresolved bug.

## What was actually measured

The latest Express/Socket.IO application ran against a disposable local MongoDB replica set with synthetic accounts. Backend dotenv loading was blocked in that test process; real service credentials were not used. Existing schema indexes were created only inside that disposable fixture.

The final run contains 272 API measurements, 280 additional alternating enabled/disabled HTTP trials (240 retained after warmup), 10 socket connections, 8 message deliveries, and 6 bounded query execution plans. All 272 API requests returned HTTP 200. No request trace dropped spans. Read endpoint statistics use 15 warm samples each; call action statistics use 5, so their p95 is effectively the largest sample, not a reliable population tail estimate.

| Local synthetic flow | HTTP through body p50 | Backend to headers p50 | Direct observation |
|---|---:|---:|---|
| Shared/Purchased Media room read | 132.60 ms | 126.68 ms | 500 messages; 741,391 response bytes; hydration p50 68.88 ms |
| Unread summary | 101.97 ms | 100.58 ms | Hydrates full embedded room; hydration p50 65.40 ms |
| Discover | 65.28 ms | 60.42 ms | 380 profiles; 639,311 response bytes; 8 logical operations |
| Chat send | 47.39 ms | 44.74 ms | Synthetic text; socket peer delivery separately measured |
| Matches / inbox data | 37.73 ms | 35.42 ms | 23 operations, including 20 room lookups |
| Notifications | 37.40 ms | 35.85 ms | 82 operations for 80 notifications and 20 distinct actors |

The columns are independent medians and **must not be added**. Mongoose time includes driver/network and materialization. It is not all database server execution. The indexed room explain examined one document and reported integer execution time of 0 ms; the measured hydration spans explain substantial additional application-side work.

For one actual shared-media request, the HTTP body arrived in **132.60 ms**: backend-to-headers **128.53 ms**, approximately **4.07 ms** outside that boundary, followed by **2.72 ms** of Node JSON parsing. Within those 128.53 ms, document hydration took **68.88 ms**. [The paired waterfall](waterfalls.md) accounts for the remaining measured intervals without adding overlapping spans. It does not claim a native image was visible at 132.60 ms.

## Deliverables

| Requested result | Artifact |
|---|---|
| Executive summary and migration boundary | This document |
| Files added/modified and validation | [files.md](files.md), [validation.md](validation.md) |
| Mobile/backend architecture, Mongo methodology, production controls, Sentry use | [architecture.md](architecture.md) |
| All 20 experiences and actual current code paths | [flow-map.md](flow-map.md) |
| Measured API baseline, overhead, query plans and socket timing | [baseline.md](baseline.md), [raw evidence](evidence/local-baseline.json) |
| Screen-level values and unavailable fields | [screen-baseline.md](screen-baseline.md) |
| Detailed waterfalls | [waterfalls.md](waterfalls.md), [interactive HTML](waterfall.html) |
| Slowest operations, middleware and serialization | [operations.md](operations.md) |
| Duplicate requests, render/media/socket findings, classifications and backlog | [findings.md](findings.md) |
| Device capture, media measurement and US/Asia procedure | [capture.md](capture.md) |

## MongoDB migration boundary

The current runtime reads/writes MongoDB. Source inspection found no active LowDB import/read/write in the runtime paths inspected. The current backend's `docs/mongodb-migration.md` documents the completed source conversion and an offline importer; it explicitly states that no real legacy snapshot was available and **zero real records were imported**. Production cutover and deployed data parity are therefore unverified, not assumed complete.

This audit changes neither importer, schemas, indexes, persistence ownership, nor migration behavior. Synthetic timing can proceed now. Representative Atlas execution plans, production cardinality/payload baselines, and before/after production comparisons should wait for migration cutover/parity confirmation. The two existing message contracts remain separate, exactly as the current backend implements them.

## Limits and next task

No genuine evidence currently assigns production delays to Render, Atlas, R2, Cloudinary, Asian geography, React rendering, or native decoding. Local instrumentation overhead was small in the sampled HTTP routes: median enabled-minus-disabled **0.10 ms** on health and **0.56 ms** on profile/full. This is not a guarantee under load or on a phone.

**Recommended next task:** capture cold and warm Discover, unread/inbox, shared media and profile flows on a physical Android device using the prepared fixture, then repeat against a migration-validated staging dataset with owned synthetic media. Run the supplied probe on actual US, India, Singapore, Japan, South Korea and Nepal hosts. Rank optimization work only after correlating those user-visible results. The provisional evidence-based backlog is in [findings.md](findings.md).

# Fix #7 — Discover request lifecycle

Measured evidence: cached Discover content appeared quickly; requests varied around 571 ms and 4.2 seconds, with duplicate/cache work and potentially large candidate responses. Current tracing was performed after accepted Fix #3 removed Discover's unrelated Chat unread ownership. No new unread-summary owner is introduced.

## Trace and before → after

The screen hydrated the cache in a standalone effect and again inside every fetch. Its focus effect fetched immediately and scheduled another fetch after 900 ms with fresh GPS, even if the first remained in flight. Filter handlers changed dependencies that restarted the focus effect and also explicitly fetched. Blur only cleared the 900 ms timer; it did not cancel existing HTTP, cache hydration or later location work. There was no AppState ownership. Prefetch deduplication lasted for only one call, so cache, fresh and swipe saves repeatedly prefetched the same URLs.

The deck cache was global and fell back from an exact filter miss to an arbitrary last deck, temporarily displaying users from other filters/accounts. Empty/exhausted decks were not written. Expanded requests saved the effective relaxed filter key while swipe saves used the unrelaxed key. Fresh results with identical IDs could keep compact cached objects instead of updating their signed URLs and full public media.

| Area | Before → after |
| --- | --- |
| Owner | Multiple effect/action starts → one active request owner; identical requests join, new filters/manual refresh supersede the old request, blur/background cancels it. Every async completion checks ownership, activity and session token. |
| Cache | Two hydrations per cycle → one exact account/filter cache read inside the request. Existing same-filter cards retain their position/photo/reveal state. Filter changes clear mismatching cards immediately. Fresh same-ID results update full metadata/URLs without resetting selection. |
| Location | Overlapping 900 ms second request → fast initial request using a recent known device location when available, then serial fresh-location reconciliation. The second HTTP request occurs only if actual coordinates differ; denied/unavailable/unchanged GPS does not refetch. Explicit refresh retains fresh-location behavior. A manual refresh is not superseded by the automatic follow-up. |
| Timers/cleanup | Deadline timers lingered after native location completion → clear on completion/abort; obsolete native location results cannot start reverse geocoding or HTTP. Native location calls themselves are not cancellable through this API. |
| Filter actions | Direct fetch plus dependency-triggered fetch → one effect after the complete filter-state change. Strict → user-requested expansion, hard filters, back-to-strict and persisted Looking For remain. |
| Cache correctness | Global arbitrary last-deck fallback → v5 account-scoped exact filter keys. The separate Homepage latest-deck reader remains account scoped. Empty decks persist; expanded request/swipe keys match. Old v4 decks are left intact but not reused across accounts/filters. |
| Prefetch | Repeated same-URI starts → bounded session deduplication (200 URLs), retry allowed after failures; requests only start from active Discover work. |
| Backend | Full candidate/relationship documents → explicit fields required for current filtering/scoring/public response, plus minimal relationship projections. Existing query predicates, 400-candidate bound, strict/fallback logic, scoring, distance pools, complete public media and response schema remain. |

Backend source shows an existing 400-candidate cap, not an unbounded query. The endpoint still returns all selected candidates and their public images; it does not truncate the deck or gallery. Candidate media signing and large legitimate public galleries can still contribute to cost. This fix makes the narrow, evidence-supported projection change; it does not invent a cursor/ranking model or new geospatial index. Source comments mentioning saved/default live distance are stale: actual code hides distance when no device coordinates are supplied, and that behavior remains verified.

## Every changed file

Mobile paths relative to `C:/projects/rombuzz-mobile`:

- `app/(tabs)/discover.tsx`: sole focus/foreground request lifecycle, exact cache integration, serial conditional GPS reconciliation, guards, filter action deduplication and fresh same-ID metadata updates.
- `src/features/discover/discoverRequestOwner.ts`: keyed in-flight ownership/cancellation and cancellable deadline helper.
- `src/features/performance/useCachedDiscoverDeck.ts`: account/filter cache keys, exact lookup, empty-deck persistence and bounded image-prefetch deduplication.
- `scripts/performance-fixes/discover.test.cjs`: request replacement/late-result tests, GPS timer cleanup, account/filter cache isolation, exhaustion and prefetch deduplication.
- `docs/performance-fix-7-discover.md`: this record.

Backend paths relative to `C:/projects/rombuzz/Rombuzz_main`:

- `server/routes/discover.js`: candidate and relationship projections only.
- `server/tests/discover.test.js`: disposable Mongo/HTTP strict/fallback ranking, gender/verification hard filters, liked/blocked/matched/hidden exclusions, public-only media, real/missing-coordinate distances, and local profiler assertions for the projection and unchanged 400 limit.

## Validation and deferred acceptance

TypeScript passed. Three focused mobile tests passed. All 46 backend tests passed, including the new Discover fixture; syntax check passed 190 JavaScript files. Scoped lint has zero errors/warnings, unchanged from baseline; both repository diff checks passed. Existing renderer and duplicate schema-index warnings remain in broader suites. Query profiling was enabled only on the disposable test database. No production data, configuration, index deployment, Redis or infrastructure changes.

Device acceptance remains deferred: repeat cached/uncached Discover → Preview → back, strict/expanded/back-to-strict, all saved filters and Looking For changes, swipe/skip/Buzz behavior, selected photo and deck position on return, denied/slow/fresh GPS, moved versus unchanged coordinates, refresh during an older read, background/foreground and account switching. Confirm no concurrent equivalent Discover HTTP calls, no stale filter results, no offscreen requests/preloads, correct full fresh public galleries, and current signed URLs. A serial second read with changed coordinates is expected and should be distinguished from duplicate requests. Measure actual request sizes, timings and frames; local fixtures do not establish production speedups.

Local checkpoint message: `perf: fix 7 discover request lifecycle`; final summary records hashes. Accepted auth/unread/focus work and Fixes #4–#6 remain intact. No push, deploy, `USE_LOCAL`, production configuration or navigation architecture changes. Continue directly to Fix #8.

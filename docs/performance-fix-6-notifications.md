# Fix #6 — Notifications ownership and rendering

Measured evidence: approximately 192 notifications, duplicate requests, a roughly 294,889-character response, production requests around 5–7 seconds and an unrelated background request around 9.5 seconds. Cached/fresh React list work was also expensive. Device verification remains deferred.

## Exact trace

Three independent owners fetched the full list: `rbzStartupWarmup.warmNotifications`, the tab layout's badge loader, and `useCachedNotifications` invoked by the Notifications screen. Entering Notifications forced the tab badge request while the screen also loaded. Warmup and the screen wrote a shared unscoped list cache; two socket subscriptions independently managed seen IDs and unread counts. The tab loader expected an array, although the current backend returned `{ notifications }`, so it could persist an incorrect zero badge. The screen had no focus/AppState cancellation and its asynchronous socket setup could subscribe after cleanup.

The backend used one notification query followed by `User.findOne` for each notification, repeated for the same sender, then duplicated signed actor/avatar metadata in the response. Mobile cards use icons, type, message, time and routing fields; none consume those actor/avatar fields. The screen mapped the entire list into a ScrollView, created one Modal per card, and measured every menu button during rendering. There was no HTTP pagination or polling timer. Filtering and unread counts operate on the complete list; mark-all-read targets its unread IDs.

## Before → after

| Area | Change |
| --- | --- |
| Ownership | Warmup, badge and screen owners → one account/session store under the authenticated root lifecycle. The screen supplies its active visibility; tab and Homepage badges consume shared counts. The old helper delegates to that store. |
| Reads | Full list from unrelated screens → `GET /notifications/unread-count` for global foreground/reconnect/socket reconciliation; `/notifications?view=mobile` only for an active Notifications screen. A list response also supplies the badge count. Concurrent demands share an in-flight request; list demand supersedes a count read. |
| Lifecycle | Uncancelled mount reads → blur/background cancellation, generation/revision guards, stale-first cache and explicit refresh. List and count freshness are separate; the 30-second cache window avoids immediately repeating a successful read, while ownership and cancellation remove redundancy. |
| Realtime | Independent screen/badge counters → one notification subscription, ID deduplication, account filtering, shared state, late socket setup guard and exact cleanup. Covered Notifications retains its last rendered snapshot while the store retains incoming state. No background HTTP reconciliation. |
| Cache/actions | Global list/key races → account-scoped cache, migration only of records belonging to that account, atomic shared list/count updates, obsolete read rejection, and protection against old-account action callbacks. Existing read/unread/delete/mark-all API actions and routing remain. |
| Backend | Repeated actor queries → mobile projection omits unused enrichment altogether; legacy responses batch sender lookup and sign each unique actor once. Additive count endpoint uses the existing recipient/read index. |
| Rendering | All cards rendered and measured → FlatList with 10 initial cards, batches of 8, window size 7; native menu measurement happens on press. Existing card JSX, filters, timestamps, long-press details, menu actions and scroll behavior remain. Pull-to-refresh uses the same shared request. |

Complete compact metadata remains available to all filters, totals and mark-all-read. This fix does not add HTTP pagination: slicing this list without server-wide filter/count/mark-all semantics would change those features. It removes repeated full-list requests, unused payload fields, N+1 queries and unbounded card rendering. Future very-large notification histories may justify API pagination with those semantics preserved; no history is removed here.

Compatibility: existing backend clients still receive `{ notifications }` and enriched actors. Older servers ignore `view=mobile` and retain their existing response. If `/unread-count` is absent (404 without an API error), the same owner makes one legacy list request and seeds the screen/cache; access errors do not trigger fallback. The server's notification creation, push/socket delivery and mutation endpoints are unchanged. Fix #1 session/onboarding and Fix #3 Chat unread lifecycle remain intact; the root change only adds the independent Notifications lifecycle under the same ready/authenticated/onboarding-complete gate.

## Every changed file

Mobile paths relative to `C:/projects/rombuzz-mobile`:

- `app/_layout.tsx`: adds gated Notifications lifecycle alongside the unchanged Chat unread lifecycle.
- `app/(tabs)/_layout.tsx`: removes the badge's full-list requests, cache writes and duplicate socket subscription; consumes the shared count.
- `app/(tabs)/notifications.tsx`: consumes retained shared state, keeps filters/actions/routes, virtualizes cards, measures menus on demand and gates modals by activity.
- `src/features/home/HomeNotificationButton.tsx`: consumes the same account-scoped unread count.
- `src/features/performance/useCachedNotifications.ts`: compatibility facade over the authoritative store, without an independent fetch/cache lifecycle.
- `src/performance/startup/rbzStartupWarmup.ts`: removes only notification warmup and its now-unused cache/count helpers.
- `src/features/notifications/createNotificationStore.ts`: account state, cache hydration, count/list ownership, request deduplication, cancellation, socket and mutation reconciliation.
- `src/features/notifications/notificationState.ts`: storage/API adapters, diagnostics, root lifecycle and badge/screen hooks.
- `scripts/performance-fixes/notifications.test.cjs`: five ownership/lifecycle/compatibility/hook regression tests.
- `docs/performance-fix-6-notifications.md`: this report.

Backend paths relative to `C:/projects/rombuzz/Rombuzz_main`:

- `server/routes/notifications.js`: additive count endpoint, compact mobile projection and batched legacy actor enrichment.
- `server/tests/notifications.test.js`: disposable 192-notification fixture, complete compact/legacy routing equivalence, smaller payload, account isolation, read/unread/delete contracts and existing index use.

## Validation and deferred acceptance

TypeScript passed. Five focused mobile tests passed: shared concurrent requests, count-only hidden reconciliation, cache-first UI, background/blur aborts, stale and old-account response rejection, socket deduplication, optimistic mutations, 192-item old-server fallback, actual hook offscreen rendering retention, old-account action rejection and late socket cleanup. Backend suite passed all 45 tests; syntax check passed 189 JavaScript files. Both diff checks passed. Scoped ESLint adds no diagnostics: one pre-existing screen lint error remains, warnings decreased 21 → 18. Existing renderer-deprecation and duplicate `expiresAt` index warnings remain; unrelated lint was not repaired.

The accepted auth/session suite also passed all 11 tests, and Chat unread ownership passed all 12 tests after root integration.

Local tests establish correctness and smaller fixture payloads, not production timing. Backend work was justified by concrete N+1 queries and unused enrichment, without a new index, infrastructure, Redis, configuration or migration. Physical acceptance must repeat cold/cached Notifications entry, tab transitions while requests are slow, foreground/background, socket reconnect, bursts/duplicates, read/unread/delete/mark-all, all filters and legacy report/gift/comment/reply deep links, long-press details and menu positions at multiple scroll offsets. Confirm the measured 192 notifications remain accessible and accurate, only the active screen reads the compact list, badges reconcile consistently, and hidden screens do not render the list on socket events. Verify old-backend compatibility, fresh/cached timings, payload bytes and frame costs in the final device pass.

Local checkpoint message: `perf: fix 6 notifications ownership and rendering`, hashes recorded in the final summary. No push, deploy, production-data/configuration, `USE_LOCAL`, dependency or unrelated navigation changes. Continue directly to Fix #7.

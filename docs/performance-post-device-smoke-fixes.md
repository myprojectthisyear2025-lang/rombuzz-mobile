# Post-device smoke cleanup

Scope: the five issues reported from the production-account Galaxy S22 Ultra recording. Starting mobile `3946e07`, backend `96f34d4` (both matched their local origin/main refs). No repeat performance audit, production changes, push or deployment. The unrelated untracked audit files are excluded.

## 1. Discover refresh presentation and image continuity

Observed: usable cached card accompanied by a roughly 20-second refresh pill; a brief blank during reconciliation.

Trace: `quietRefreshing` explicitly rendered the pill during cached and fresh-GPS work. Same-filter requests did **not** intentionally clear the deck, change its key, or reset its index. However, `keepVisibleCardStable` returned fresh objects verbatim, so renewed R2 signatures changed the native image source even for the same asset (including compact-cache media without IDs). A selected photo could also address an absent index after a shorter fresh gallery. Invalid response bodies were converted to an authoritative empty deck. Cache hydration updated the live users reference only in a later effect.

Before → after: no refresh pill/state/styles; valid cached signed URLs survive signature-only renewal while fresh metadata/privacy wins. Expired URLs and changed assets still update. Cache/live refs and a validated fresh deck publish together, with selected photo retained or clamped when removed. Malformed responses and network failures retain usable content. Real filter changes still clear incompatible cards into neutral loading; genuine validated empty results still represent exhaustion. Request dedupe/cancellation, sequential changed-coordinate GPS, strict/expanded behavior, prefetch ownership and swipe/navigation architecture remain.

Files: `app/(tabs)/discover.tsx`, `src/features/discover/reconcileDiscoverDeck.ts`, `src/features/discover/discoverScreen.styles.ts`, `scripts/performance-fixes/discover-smoke.test.cjs`, `scripts/performance-fixes/screenHarness.cjs`, `scripts/performance-fixes/harness.cjs`, this document.

Validation: actual screen render tests check retained image instance and selected URI, no empty deck commits through delayed cache/network/GPS, no refresh UI, malformed response retention, filter isolation and aborted/late requests. Existing request-owner, GPS deadline, account/filter cache and prefetch tests pass. Native image decoding/frame timing still requires the device; source-level causes are reproduced in regression fixtures, not claimed as a measured device trace.

Checkpoint: `e8b6961` — `fix: keep Discover refresh invisible and preserve card media`. TypeScript and scoped lint passed; 6 Discover tests passed.

## 2. Focused Pinned Messages retrieval

Observed: roughly four seconds of loading for about eight pins.

Trace: navigation waited for a SecureStore user read, then a partial thread-cache read, then fetched the complete unpaginated room. The backend hydrated the room and signed all visible messages (including Stream playback preparation); only afterward did mobile filter pins. There was no pin-specific cache, so pins older than the thread's 250-message window were absent. No redundant peer request existed. Socket listeners were unscoped by focus and could accept roomless events for unrelated messages. HTTP did not cancel on blur or protect socket updates from a late snapshot.

Before → after: session identity is synchronous; dedicated account/room memory and disk caches retain old pins and known-empty results. Disk hydration and a single focused HTTP reconciliation run concurrently. The existing recent thread cache can seed/update pins without erasing older IDs. Abort/session/scope guards reject covered, unmounted and obsolete responses; in-flight socket deltas overlay the snapshot. Pin/unpin/delete events and reconnect refresh remain supported. Cached rows survive ordinary failures; access denial clears them. Cards retain their ordering, labels and focusMsgId navigation; full message metadata includes replies, reactions, media keys and original text. The focused endpoint does no signing/playback lookup because the pinned list displays labels, while the destination thread owns playable media. Gifts/providers/configuration are untouched.

Mobile compatibility was implemented and tested before the backend edit. An absent endpoint (404 without a JSON error) falls back to the legacy complete room; JSON access/account errors never trigger fallback. The old full-room route is unchanged. That compatibility path necessarily retains the old transfer cost until the endpoint is available.

Backend: `/chat/rooms/:roomId/pinned` reuses the same moderation and active-room authorization, performs indexed room lookup and projects only candidate pinned IDs, resolves duplicate-message versions, excludes hidden/deleted/temp/unpinned records and preserves descending pin time. The embedded schema still scans messages **inside MongoDB**; no claim of constant-time pin lookup or new index/infrastructure.

Controlled disposable Mongo/HTTP fixture: 1,213 history rows, eight visible pins. JSON bytes: 2,509,852 full stored history → 1,712 projected candidates (12 rows, including versions to exclude) → 1,571 endpoint response (8 rows). This compares synthetic serialized data, not a production compression/timing result. The query uses IXSCAN; media signing/playback calls are zero. HTTP access and missing-match gates passed.

Mobile files: `app/chat/pinned/[peerId].tsx`, `src/features/chat/pinned/pinnedMessages.ts`, `src/features/chat/pinned/usePinnedMessages.ts`, `scripts/performance-fixes/pinned-smoke.test.cjs`, this document.

Backend files: `server/routes/chatRooms.js`, `server/services/chatPinnedQuery.js`, `server/tests/chat-pinned.test.js`, `server/docs/performance-post-device-pinned.md`.

Validation: 7 new mobile tests; 10 existing thread/media tests; new backend integration test; mobile TypeScript/scoped lint; backend changed-file syntax; both diff checks. The timestamp fixture caught and corrected millisecond ordering for native Mongo Date values before checkpointing.

Checkpoints: mobile `e670067` — `fix: load pinned messages from a focused cache and endpoint`; backend `75dcebe` — `perf: project pinned messages without full history hydration`.

## 3. Preview / View Profile false unavailable state

Observed: Preview → After Match showed a terminal unavailable message before a successful profile.

Exact state bug: focus selected `silent` whenever **any** profile was held in a ref. A changed route then cleared that different user's profile, while blocking loading was enabled only for `initial`. The resulting `!user && !loading` render unconditionally claimed unavailable. Separate profile/user/matched setters, absent focus cleanup, and an unguarded catch also allowed obsolete requests to alert/navigate. A fresh promise started before awaited cache hydration could reject before its catch was attached. Cache keys included target ID but not the viewing account.

Before → after: a scoped read state owns profile, loading/ready/unavailable/error and request cancellation. Route/account/preview changes render neutral loading synchronously, before effects; cached same-user data stays visible during refresh. Only confirmed 403/404/410 marks unavailable and removes cached access. Network/malformed-data errors have a separate retry state. HTTP status is preserved on the shared API Error without changing its existing auth handling. Cache and network run concurrently with rejection handlers; late cache never replaces fresh data, and blur/background/route/account changes abort and reject stale work. New account-scoped cache keys avoid cross-viewer privacy leakage (old entries are left on disk but no longer read). Profile/media/matched data commits together, using the existing Fix #9 URL merge. Changing the profile scope closes old media viewers. Before Match routing, matched entry gates, actions, media parsing and provider configuration remain intact.

Files: `app/(tabs)/view-profile.tsx`, `src/features/viewProfile/useViewProfileRead.ts`, `src/features/performance/viewProfile/rbzViewProfileCache.ts`, `src/performance/api/rbzApiClient.ts`, `scripts/performance-fixes/profile-state-smoke.test.cjs`, this document.

Validation: 6 new state/cache tests (including actual screen route → loading → successful profile), 6 existing Fix #9 media tests and all 11 auth tests pass. Checks cover cache refresh, confirmed 404, network retry, rapid preview/user/account changes, focus cancellation and late disk/API work. TypeScript and scoped lint are checked before checkpoint; existing unused `height` and `getStreamUid` warnings are compared in final lint validation.

Checkpoint: `bd661a6` — `fix: distinguish profile loading from confirmed unavailability`.

## 4. Unknown profile metadata / Photos (0)

Observed: matched-profile transitions displayed Photos (0) and incomplete fields before populated data arrived.

Root cause: startup warms View Profile from lightweight `/matches` rows. `writeCachedViewProfileFromUser` invented empty media/photos/reels/gallery/uploads arrays when absent, treated the preview as a full profile, and could overwrite rich cached media with empty preview arrays. The screen accepted any cached user, so gallery `.length` looked authoritative while the full `/users/:id` request was pending. That endpoint supplies the actual visible gallery.

Before → after: cache bundles explicitly track completeness. Only the full user endpoint marks a bundle complete. Warmed previews keep unknown fields absent and never downgrade a complete cached profile or extend its lifetime. The screen retains a complete cached profile or its existing neutral loading presentation until full data is known. The gallery itself and its real zero counts are unchanged; no counts are invented and Fix #9 URL merging remains intact.

Files: `src/features/performance/viewProfile/rbzViewProfileCache.ts`, `src/features/viewProfile/useViewProfileRead.ts`, `scripts/performance-fixes/profile-state-smoke.test.cjs`, this document.

Validation: two additional tests cover an incomplete warm cache → loaded gallery, a genuinely empty gallery, and warm rows failing to overwrite complete media URLs/metadata. All 14 profile state/media tests pass; TypeScript passes; lint has only the pre-existing unused-helper warning.

Checkpoint: `fix: keep incomplete profile previews in neutral loading` (hash recorded in the next checkpoint).

## Remaining work in this batch

Shared Media video previews; final complete validation and checkpoint inventory.

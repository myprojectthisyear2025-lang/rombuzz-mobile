# Fix #5 — Shared and Purchased Media

Implemented against the current tree after Fix #4. Device verification remains deferred. The measured problem was a roughly 655,718-character full-room response, multi-second requests, another media loading pass after fresh history, and original R2 images around 4080×3056.

## Trace and before → after

Both `app/chat/shared-media/[peerId].tsx` and `app/chat/purchased-media/[peerId].tsx` read the thread cache, independently fetched the legacy full `/chat/rooms/:roomId` array, wrote that entire response back to the thread cache, parsed/filter/sorted it, and replaced their grids. The backend hydrated the full room and signed every visible media message. Neither screen cancelled work on blur/background. Both declared their `MediaTile` component inside the screen, so parent updates changed its component type and remounted visible native images/players. Every video tile instantiated a paused player.

| Area | Before → after |
| --- | --- |
| Retrieval | Full conversation and all media signing → additive `GET /chat/rooms/:roomId/media?kind=shared\|purchased&mediaType=image\|video&limit=30&before=cursor`, accurate visible counts for both tabs, bounded HTTP pages and signing only the selected page. |
| Mongo path | Hydrated full room → existing indexed `roomId` lookup, aggregation projects compact media candidates and legacy encoded media. Ordinary message text, receipts, replies and reactions do not cross Mongo → Node. Node normalizes legacy payloads, counts and sorts candidates; cursor uses time plus id and remains valid if its original message is deleted. |
| Lifecycle | Mount-only uncancellable read → focus + foreground owner, abort/late-result guards, one request per screen, shared in-flight page reads for identical token/room/filter/cursor. Cancelling one reader does not abort another reader's request. |
| Cache | Media response overwrites thread history cache → separate account/room/kind media cache, retained in-memory rows, bounded persisted previews, optional read-only seeding from existing thread cache. Failures retain useful cached rows. Account changes do not display the previous account's media. |
| History | Entire history downloaded on entry → initial media page and controlled older-page loading, automatic near list end plus explicit retry/load control. All older media remains reachable. |
| Realtime/actions | No media-screen socket reconciliation → active subscriptions for room/personal media, deletion, unlock and reconnect events, with exact cleanup; unrelated messages do not fetch. Local deletion/unlock invalidates older reads so their responses cannot resurrect stale state. Existing thread socket ownership stays intact. |
| Rendering | Recreated tile component type → ordinary render callback retaining native element identity. Supplied video thumbnails replace paused players; legacy videos keep a focused-only preview player. Viewers unmount/hide while inactive. Images request native resize decoding to tile size; original download/viewer URL remains unchanged. |

Backend work was required to avoid sending and signing the conversation on media entry. It is additive: the old array endpoint and existing paginated thread endpoint remain compatible. Existing chat feature, active-user, match, block and room authorization checks run before the new query. Shared excludes purchased/locked media; Purchased retains unlocked paid items. Hidden/deleted and both top-level/payload ephemeral media are excluded. Sender/recipient, price and unlock metadata remain available; payment, delete, save and show-in-chat routes are unchanged. Unlock now also uses the signed message returned by the existing API.

Mobile is ready before backend deployment: a missing endpoint (404 without an API access error) falls back to existing `?limit=40` room pages. It never deliberately calls the full-history URL. Empty compatibility pages expose “Load older media”; only loaded counts are knowable on that old API, so they grow as pages load. The new endpoint provides exact counts immediately. API access errors never trigger fallback. No deployment performed.

## Changed files

Mobile, relative to `C:/projects/rombuzz-mobile`:

- `app/chat/shared-media/[peerId].tsx`: paginated hook integration, stable tile rendering, thumbnail/focus handling, older-page controls; retains existing actions/viewers.
- `app/chat/purchased-media/[peerId].tsx`: same integration, preserves lock/price/unlock handling and uses signed unlock response.
- `src/features/chat/mediaHub/chatMediaRows.ts`: shared normalization for cached/legacy media, categories, metadata and ephemeral exclusion.
- `src/features/chat/mediaHub/chatMediaRequest.ts`: additive endpoint, old-server compatibility and reference-counted in-flight cancellation/deduplication.
- `src/features/chat/mediaHub/useChatMedia.ts`: active lifecycle, account cache, paging, mutation races and relevant socket reconciliation.
- `scripts/performance-fixes/chat-media.test.cjs`: focused executable regression coverage.
- `docs/performance-fix-5-chat-media.md`: this record.

Backend, relative to `C:/projects/rombuzz/Rombuzz_main`:

- `server/routes/chatRooms.js`: additive authorized media route.
- `server/services/chatMediaQuery.js`: compact projection, filtering, counts, cursor paging and page-only signing.
- `server/services/chatMediaRows.js`: normalization contract mirrored by mobile, including legacy payloads.
- `server/tests/chat-media.test.js`: disposable Mongo/HTTP fixture, projection size, page-only signing, exact counts, old payloads, unlocked purchase retention, deleted cursor continuity, authorization/filter errors and existing index use.

## Validation and limits

TypeScript passed. Five focused mobile tests passed, covering normalization, shared in-flight ownership, cancellation, old-backend compatibility, access-error handling, cache-first rendering, late responses, pagination deduplication, socket filtering/deletion/background cleanup and account changes. Backend `npm test` passed all 44 tests, including existing thread/unread/payment transaction suites; syntax check passed 188 JavaScript files. Scoped ESLint: 0 errors, warnings decreased 4 → 2 (existing unused peer-avatar declarations), no new diagnostics. Both repository diff checks passed. Existing renderer deprecation and duplicate `expiresAt` index warnings remain.

The synthetic fixture projects less than one tenth of its full history bytes and signs 30 items for a 30-item page; its query plan uses the existing index. These are local correctness/data-path checks, not production timing claims. Mongo still scans the room's embedded messages, and all compact media candidates reach Node to classify legacy encoded payloads and calculate exact counts. No new infrastructure, index deployment, migration, Redis or production data operation.

Intentionally deferred: server-generated R2 image thumbnails would require a separate storage pipeline; native resize reduces decoded tile memory, not original network bytes. Older loaded pages are retained during head refresh and reconcile through observed deletion/unlock events; no background history scan is added. Direct media entry consumes existing personal socket delivery, while the retained Chat thread continues to own its room join. Existing signed URL lifetime and media service behavior remain. Physical validation must cover thumbnail availability, original-image memory/bytes, video fallback previews, HTTP cancellation effectiveness, and fresh signed URL transitions.

Deferred device acceptance: repeat Shared/Purchased entry from the measured 167-message room; confirm no full-room request from these screens, bounded media pages, exact new-endpoint counts, old photos/videos reachable, preserved scroll/viewer/save/show-in-chat actions, seller/buyer lock and unlock behavior, delete for me/all, incoming media and reconnect, blur/background cancellation with no hidden players, cached offline entry and account separation. Verify mobile with the old backend fallback, then the additive backend in an authorized environment, before production deployment.

Local checkpoint message: `perf: fix 5 shared and purchased media pagination` in both repositories; final summary records hashes. Fixes #1–#4 and unrelated user changes preserved. No push, deploy, `USE_LOCAL`, dependency or production configuration changes. Continue directly to Fix #6.

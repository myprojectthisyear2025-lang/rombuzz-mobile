# RomBuzz performance batch — final implementation and validation record

Updated 2026-09-27. Local work only; no push, deployment, production-data/configuration change, `USE_LOCAL` change, new infrastructure or Redis. Physical-device performance verification remains intentionally deferred. The existing installed-account cold-open migration was already accepted by the user.

**This is not a claim that every measured issue is fixed.** Fixes #1–#7 are implemented, and the source-proven media cleanup in #9 is implemented. Fix #8's production transport failure and the two particular Cloudinary asset failures in #9 remain unresolved because the failing installed-build/network/resource details are unavailable. Tests do not replace that evidence. All independent, evidence-supported batch work and the final automated sweep are complete; stopping here without speculative production changes.

## Status, ownership and expected effects

| Fix | Status and BEFORE → AFTER | Expected effect; limits |
| --- | --- | --- |
| #1 Auth/session | Accepted and preserved. Repeated ~400 ms SecureStore auth checks/full-user writes → shared initialized session, explicit events, small secure identity and full user cache. | Removes recurring secure-storage work and oversized user writes. Existing-account cold-open migration passed on device; remaining performance verification deferred. See [report](performance-fix-1-auth.md). |
| #2 Offscreen work | Accepted and preserved. Mounted MicroBuzz/Reels/Profile work → focus/AppState-owned activity, retained hidden state, timer/animation/player cleanup. Navigation mounting architecture retained. | Removes measured unnecessary background work while keeping tab state and realtime reception. See [report](performance-fix-2-offscreen.md). |
| #3 Chat unread | Accepted and preserved. Tab badge + warmup + Chat list + thread independently owned summary requests/cache writes → one root lifecycle and shared account store/in-flight read; screens consume it; mark-read uses returned summary. Backend full room/message hydration → Mongo count projection. | Removes redundant equivalent overlapping GETs; bounds data transferred to Node. Mongo still scans eligible embedded histories and existing auth/match checks remain. Local fixture: 2,206,898 → 553 query-result bytes, not a production latency result. See [report](performance-fix-3-unread.md). |
| #4 Chat thread | Implemented. Mounted reads/late updates → focused foreground owner, abort/identity guards, retained messages/cache, buffered hidden socket work. Backend mark-read lookup projects the room identifier. | Avoids obsolete room/user reads and hidden thread rendering; preserves current recent-page loading and access to old messages. Target-message navigation can still use the legacy full-history path. See [report](performance-fix-4-chat-thread.md). |
| #5 Shared/Purchased Media | Implemented. Full conversation/history loads for a gallery → focused paginated media endpoint, shared cache/in-flight readers, bounded grid rendering and appropriate preview/player lifecycle. | Avoids transferring/rendering the entire ~655 KB conversation merely for media. Local fixture verifies projection, 30-row signing and access. Original R2 transfer sizes are not reduced by native decode resizing. See [report](performance-fix-5-chat-media.md). |
| #6 Notifications | Implemented. Warmup + badge + screen reads and multiple socket owners → root account store with one read lifecycle, count-only hidden reconciliation and visible compact list refresh. Eager card/modal tree → FlatList and active menus; backend per-row user queries → compact mobile projection/batched legacy enrichment. | Removes duplicate reads, unnecessary badge payload/enrichment and eager card work. Complete compact metadata is retained to preserve global filters/counts/actions; HTTP history pagination and mark-all write batching remain deferred. See [report](performance-fix-6-notifications.md). |
| #7 Discover | Implemented. Duplicate hydration/focus/filter/GPS starts → keyed request ownership, account/filter cache, cancellation, serial changed-coordinate reconciliation and bounded prefetch deduplication. Backend full candidate documents → required-field projection. | No concurrent equivalent request owners or stale filter commits. A second sequential read is valid when fresh coordinates change. Existing 400-candidate cap, complete public media, ranking and strict/relaxed behavior remain. See [report](performance-fix-7-discover.md). |
| #8 Gifts | **Unresolved investigation checkpoint; runtime unchanged.** Current client URL/auth/routing/response/write path traced and tested. | Workstation unauthenticated catalog/wallet GETs returned JSON 401 in 346/256 ms on 2026-09-26. This does not reproduce the device's `Network request failed`. Local URL overrides are absent; remote EAS environment read timed out. Installed-build origin/native failure details are needed. No provider is blamed without evidence. See [report](performance-fix-8-gifts.md). |
| #9 Media/Profile | Source-proven cleanup implemented; **two specific Cloudinary failures still unresolved**. Neighbouring/hidden gallery players and Stream resolution → selected foreground ownership, abort/late guards and retained playback snapshot. Indefinite old URL reuse → expiration-aware renewal on existing fresh responses. | Avoids off-page/native background work and repairs a reproducible expired-cache merge bug. Does not establish why the two measured Cloudinary resources failed or repair unavailable assets. Profile itself was not broadly rewritten. See [report](performance-fix-9-profile-media.md). |

The response-time evidence (including 2–6 second unread summaries, multi-second room/media/notification loads) motivated these changes. There is no measured post-fix production speedup claim. Fixture byte reductions, fewer source-level owners, component mount counts and deterministic race tests establish narrower facts.

## Local checkpoints

Fixes #1–#3 were already accepted working-tree changes when the continuous workflow began. They share one preservation checkpoint; separate historical commits were not invented.

| Checkpoint | Mobile commit | Backend commit |
| --- | --- | --- |
| Accepted #1–#3 | `203f835038b7b5f367f9df5d7234e0dcf88bf349` | `134a63cc6583ac692a6feaa462f9f22776ed7ea4` (#3) |
| #4 | `a4ff8755fb7b96574cc38b103cdc23de8f6653fc` | `e1fa8bcadfcf752242dfcf8fe8a5119ef192c102` |
| #5 | `eefc47a0aa711482397716488daf3a10af656cf7` | `ccb9f0f7fc572f45c3018442d9037184450a37f9` |
| #6 | `773c267641079e3124d737fb9eba24de56422d66` | `fd7d508a8a5a30dab222932d008189bef5dafdd6` |
| #7 | `61f411f6e9bd18036fe0c9817106e7f25658ea15` | `75af28461c004aab3dcde0c101f303e396b2d445` |
| #8 investigation only | `5ea0d9a94f86a49eb6d94cf77c79beda36b71780` | None |
| #9 | `043fde30cc947dda2cd8198ad3e71b12f5a764e5` | None |
| Final test fixture correction | Auth-test import and this report in the final mobile documentation checkpoint | `96f34d4a8b204309920130f0a1f383cc120dd0dc` |

All commits are local. No unrelated logo assets, original audit notes or backend audit directory were included. Scratch candidates, test logs and machine-readable comparison reports remain under ignored `.perf-work/`.

## Final automated validation

| Check | Result |
| --- | --- |
| All mobile `scripts/**/*.test.cjs`, Node test runner, concurrency 2 | **133 passed, 0 failed/skipped**. Covers auth, lifecycle, unread, Chat, settings, instrumentation and all new performance-fix fixtures. |
| Backend `server/tests/*.test.js`, concurrency 2, disposable local Mongo/HTTP/socket fixtures | **46 passed, 0 failed/skipped** after the fixture correction below. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| Backend `node scripts/check-syntax.js` | All **190 JavaScript files** passed; the final changed test also passed `node --check`. |
| Full mobile ESLint scan of app/src/scripts, comparison against `7696f7a` | **No introduced diagnostics across 85 changed source/test files.** Current full-tree result: 3 existing errors and 141 warnings; not a clean lint exit. |
| Both repositories `git diff --check` and staged diff checks | Passed. |
| Accepted-file SHA-256 preservation inventory | All changes accounted for. #1 runtime, #2 screen/helper work and #3 unread store/backend implementation retained. Root/tab/startup integration for Notifications and Discover's own lifecycle are documented later-fix changes. One auth-test import correction only. Shared API configuration unchanged. |

The 133 mobile tests comprise 11 auth, 14 offscreen lifecycle, 12 unread ownership/race, 68 existing Chat/settings/instrumentation and 28 focused #4–#9 cases. The auth suite's 11 tests passed again after its explicit `node:buffer` import was added; runtime session code was untouched.

The first final backend sweep passed response assertions but failed the Discover profiler assertion: only two of three expected candidate queries were captured when profiling began before startup/first-request initialization. A local diagnostic reproduced that missing record. The fixture now initializes one synthetic request before opening the profiling window; **all three query-count/projection assertions remain**, as do all HTTP ranking/filter/media assertions. The complete 46-test suite then passed. This correction changes only `server/tests/discover.test.js`, not the Discover endpoint or production instrumentation.

Remaining diagnostics: `react/no-unescaped-entities` errors in Let'sBuzz (line 287), MicroBuzz (line 1805) and Notifications (line 941) predate this work. Warnings include existing hook-dependency and unused-variable diagnostics. React test renderer emits its deprecation notice; existing backend schema/index and dotenv notices are not claimed fixed. Git emits normal LF/CRLF conversion notices. Sandbox `spawn EPERM` failures were rerun with approved process permissions; they are not counted as passing tests.

Local raw artifacts: `.perf-work/batch-final-mobile.log`, `batch-final-backend.log`, `batch-final-types.log`, `batch-final-syntax.log`, `batch-final-lint.json`, `batch-final-preservation.json`; each fix also has its saved scoped lint comparison. The detailed per-fix reports record earlier focused tests and synthetic query checks.

## Backend changes and compatibility

- #3 moves unread counting into Mongo projection/aggregation while retaining `{ total, byPeer }`, match eligibility, manual unread and seen/deleted/hidden/expiry semantics. Existing participant/user/match indexes were inspected through code/local fixtures; actual production plans/index state were not inspected.
- #4 avoids hydrating an entire room merely to identify it for mark-read. Recent history and old-history APIs stay available.
- #5 adds an authorized paginated media route, compact Mongo projection and page-only signing. Existing history routes remain. Mobile recognizes an unsupported new route and falls back to existing paginated history; it does not fall back to an unbounded gallery history request. Exact media counts require the new endpoint; fallback counts cover loaded data.
- #6 adds unread-count and compact mobile response support. The legacy notification shape/enrichment remains compatible; the client supports the old endpoint when the count route is unavailable. Filters, action routing, timestamps, read/delete semantics and sockets remain.
- #7 narrows candidate/relationship projections without changing ranking/filter contracts or the existing limit.

No schema/index migration or new service is required. Mobile compatibility is implemented before any future deployment. These backend patches are un-deployed local changes. This report does not authorize deployment. Large embedded histories, legitimate large public media arrays, auth/moderation/legacy-match checks, original media transfer sizes and network latency can still dominate individual requests.

## One deferred physical-device acceptance pass

Run this only when the user elects to resume device verification. Record exact mobile/backend revisions and whether the new backend routes are available; distinguish old-backend fallback behavior from the optimized endpoints. Keep the existing account/data and diagnostic instrumentation. Use the same measured flows and comparable network conditions, with repeated warm and cold runs; record tap/focus/useful-content/useful-frame/fresh-commit times, request count/overlap/body size, React commits and native media events. Do not infer a gain from one favourable run.

1. **Installed-account cold open/auth:** repeat ordinary startup and foreground transitions, verify cached identity/onboarding route/badges, no ~400 ms auth polling or oversized secure writes. Verify login/logout/token expiry/account switching and unfinished-onboarding resume with appropriate test accounts. A delayed old 401 must not clear a newer login. The prior migration pass is already accepted, not reset.
2. **Cross-screen ownership:** visit Homepage → Discover → Preview → back → MicroBuzz → Let'sBuzz Reels → Profile → Social Stats → Notifications → Chat. Leave MicroBuzz, Reels and Profile mounted offscreen for several minutes, then background/foreground. Confirm retained tab/scroll state and realtime updates, with no idle hidden timers/animation/progress work or old Reel/player ready-for-display activity after cleanup.
3. **Global Chat unread:** reproduce Discover/Preview, MicroBuzz, Chat-origin matched View Profile and Social Stats captures. Expect one authoritative active read, no unrelated screen-owned overlapping summaries, correct cached tab badge/list counts, incoming message/reaction handling and socket reconnect reconciliation. Mark-read/mark-all responses should normally supply counts without a follow-up GET. Intervening writes or genuinely changed data may require sequential reconciliation. Test a covered thread, rapid account switch, offline/online and delayed server responses.
4. **Chat rooms/history:** open the previously cached ~167-message thread, reopen warm, open a fresh room and leave while reads are pending. Compare the ~577 ms useful-cache/~715 ms frame and multi-second room baselines without discarding history. Page to the oldest messages, navigate directly to an older target, and check ordering, scroll, edit/delete/reactions, typing, seen, reconnect and background delivery. Verify mark-read and unread counts together. The legacy target-message full-history path is an explicit remaining cost.
5. **Shared/Purchased Media:** open from the same long conversation, switch photo/video filters, page beyond 30 rows and exercise old/legacy media/gifts. Verify access, hidden/deleted/expired handling, seller/buyer ownership, unlock actions and exactly one financial operation per user action. Confirm gallery entry does not fetch the full ~655 KB conversation on a backend with the new route; compare response/signing/media-load counts and cache/fresh behavior. Test incoming/deleted/unlocked items and navigate away mid-request. Validate fallback against the old backend separately.
6. **Notifications (~192 items):** cold/warm open, scroll through old history, pull refresh, switch every filter/group and check timestamps/counts, read/unread, mark-all, delete, actions and deep links. Check tab/Home badges while another screen is foregrounded and when sockets reconnect. Expect count-only hidden reconciliation, one visible list owner, bounded mounted cards and no stale-account or background list commits. Compare payload size and the prior 5–7/9.5 second cases.
7. **Discover/Preview:** warm/cold deck, strict → expanded → strict, all filters/Looking For changes, swipe/skip/Buzz and return from Preview. Preserve selected card/photo and saved filters. Exercise denied/slow GPS, unchanged versus moved coordinates, refresh during pending reads and account changes. Equivalent requests must not overlap; a changed-coordinate reconciliation may follow sequentially. Verify full fresh public media and no offscreen prefetch starts. Compare both prior ~571 ms and ~4.2 second examples.
8. **Gifts — open investigation:** obtain only the failing build's sanitized URL origin/path and native failure category, alongside a working API request. Establish whether a build override, DNS/TLS/connectivity or another concrete cause reproduces the failure. Do not log bearer tokens/signed query credentials or private bodies. Then verify catalog, wallet, summary and supported send placements, insufficient funds and balance/transaction updates. Never auto-retry an uncertain gift POST. The current workstation 401 probes are not acceptance for this flow.
9. **Own and matched Profile/media:** repeat own Profile and matched View Profile from Social and Chat, including good cached ~120–280 ms/useful and ~337/618 ms fresh baselines. Check photos/reels, mixed pages, zoom/swipe/seek/mute/pause, captions/privacy/delete/comment/gift actions, background resume and navigation away. Only the selected foreground video should own a native player; position/paused state should return correctly. Refresh expired signed media and confirm valid unchanged URLs avoid a duplicate load. For the **two Cloudinary errors**, capture their exact resource paths and real HTTP/native error before deciding a repair; no guessed transforms or production deletions.

Record unresolved failure details separately from timing comparisons. Do not mark #8 or the two asset failures accepted merely because the rest of the batch feels faster. Real-device render/decode/network cancellation, production query plans and post-fix performance numbers are all still unverified.

## Complete repository file inventory

This inventory covers the accepted #1–#3 checkpoint through #9 and final validation. Per-file purpose and BEFORE → AFTER behavior are in the linked reports above. Baselines: mobile `7696f7a`, backend the parent of `134a63c`; unrelated existing working-tree assets/audit files are excluded.
### Mobile repository (95 files)

- `app/(tabs)/(root)/chat.tsx`
- `app/(tabs)/(root)/homepage.tsx`
- `app/(tabs)/(root)/profile.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/discover.tsx`
- `app/(tabs)/microbuzz.tsx`
- `app/(tabs)/notifications.tsx`
- `app/(tabs)/settings/account.tsx`
- `app/(tabs)/settings/index.tsx`
- `app/(tabs)/settings/manage-account.tsx`
- `app/(tabs)/settings/security.tsx`
- `app/_layout.tsx`
- `app/auth/register-full/index.tsx`
- `app/auth/register.tsx`
- `app/chat/purchased-media/[peerId].tsx`
- `app/chat/shared-media/[peerId].tsx`
- `docs/performance-fix-1-auth.md`
- `docs/performance-fix-2-offscreen.md`
- `docs/performance-fix-3-unread.md`
- `docs/performance-fix-4-chat-thread.md`
- `docs/performance-fix-5-chat-media.md`
- `docs/performance-fix-6-notifications.md`
- `docs/performance-fix-7-discover.md`
- `docs/performance-fix-8-gifts.md`
- `docs/performance-fix-9-profile-media.md`
- `docs/performance-fix-final-summary.md`
- `scripts/auth-tests/harness.cjs`
- `scripts/auth-tests/session.test.cjs`
- `scripts/lifecycle-tests/harness.cjs`
- `scripts/lifecycle-tests/screens.test.cjs`
- `scripts/performance-fixes/chat-media.test.cjs`
- `scripts/performance-fixes/chat-thread.test.cjs`
- `scripts/performance-fixes/discover.test.cjs`
- `scripts/performance-fixes/gifts.test.cjs`
- `scripts/performance-fixes/harness.cjs`
- `scripts/performance-fixes/notifications.test.cjs`
- `scripts/performance-fixes/profile-media.test.cjs`
- `scripts/settings-tests/account.test.cjs`
- `scripts/settings-tests/harness.cjs`
- `scripts/unread-tests/harness.cjs`
- `scripts/unread-tests/ownership.test.cjs`
- `src/components/comments/PrivateCommentsSheet.tsx`
- `src/components/letsbuzz/LetsBuzzReels.tsx`
- `src/components/letsbuzz/ReelVideoPlayer.tsx`
- `src/components/media/ActiveViewerVideo.tsx`
- `src/components/media/RBZVideoViewer.tsx`
- `src/components/profile/Gallery/GalleryPhotoViewer.tsx`
- `src/components/profile/Gallery/GalleryVideoViewer.tsx`
- `src/components/profile/ViewProfileMediaActions.tsx`
- `src/components/reporting/RBZReportSheet.tsx`
- `src/features/auth/login/useLoginController.ts`
- `src/features/auth/onboarding/rbzOnboardingDraft.ts`
- `src/features/auth/rbzSession.ts`
- `src/features/auth/rbzSessionStorage.ts`
- `src/features/auth/useRootAuth.ts`
- `src/features/chat/list/chatListPersistence.ts`
- `src/features/chat/list/chatListRealtimeHandlers.ts`
- `src/features/chat/list/useChatListActions.ts`
- `src/features/chat/list/useChatListInbox.ts`
- `src/features/chat/list/useChatListRealtime.ts`
- `src/features/chat/list/useChatListState.ts`
- `src/features/chat/list/useChatListUnread.ts`
- `src/features/chat/mediaHub/chatMediaRequest.ts`
- `src/features/chat/mediaHub/chatMediaRows.ts`
- `src/features/chat/mediaHub/useChatMedia.ts`
- `src/features/chat/thread/chatUnavailableCache.ts`
- `src/features/chat/thread/useChatThreadFastOpen.ts`
- `src/features/chat/thread/useChatThreadMessages.ts`
- `src/features/chat/unread/chatUnread.ts`
- `src/features/chat/unread/createUnreadStore.ts`
- `src/features/chat/unread/useChatUnreadLifecycle.ts`
- `src/features/chat/unread/useUnreadSummary.ts`
- `src/features/chat/window/hooks/useChatIdentity.ts`
- `src/features/chat/window/hooks/useChatUnread.ts`
- `src/features/chat/window/realtime/useChatRealtime.ts`
- `src/features/chat/window/useChatWindowController.ts`
- `src/features/discover/discoverFilterStorage.ts`
- `src/features/discover/discoverRequestOwner.ts`
- `src/features/home/HomeNotificationButton.tsx`
- `src/features/lifecycle/useRetainedState.ts`
- `src/features/lifecycle/useScreenActivity.ts`
- `src/features/microbuzz/useMicroBuzzLiveWork.ts`
- `src/features/microbuzz/useMicroBuzzQueue.ts`
- `src/features/microbuzz/useMicroBuzzVisuals.ts`
- `src/features/notifications/createNotificationStore.ts`
- `src/features/notifications/notificationState.ts`
- `src/features/performance/useCachedDiscoverDeck.ts`
- `src/features/performance/useCachedNotifications.ts`
- `src/features/performance/useCachedProfile.ts`
- `src/features/performance/viewProfile/preserveMediaUrl.ts`
- `src/features/performance/viewProfile/rbzViewProfileCache.ts`
- `src/features/profile/gallery/useGalleryVideoSource.ts`
- `src/lib/socket.ts`
- `src/performance/api/rbzApiClient.ts`
- `src/performance/startup/rbzStartupWarmup.ts`

### Backend repository (12 files)

- `server/routes/chatRooms.js`
- `server/routes/discover.js`
- `server/routes/notifications.js`
- `server/services/chatMediaQuery.js`
- `server/services/chatMediaRows.js`
- `server/services/chatUnread.js`
- `server/services/chatUnreadQuery.js`
- `server/tests/chat-media.test.js`
- `server/tests/chat-thread.test.js`
- `server/tests/discover.test.js`
- `server/tests/notifications.test.js`
- `server/tests/unread-summary.test.js`

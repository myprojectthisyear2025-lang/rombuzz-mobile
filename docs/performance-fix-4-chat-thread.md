Fix #4 — Chat thread / room / mark-read

The measured account showed useful cached content around 577–715 ms, a 2.8–3+ second room GET, fresh content around 3.6 seconds, mark-read around 6.1 seconds, and another approximately 655 KB room request continuing after exit for 11.9 seconds. This fix addresses the remaining source-backed lifecycle and data-path work. These timings were not remeasured locally.

Current code inspection found that the main thread **already** requests 40-message recent pages and loads older pages explicitly. The backend already filters hidden messages and slices inside Mongo, signs only the page, and preserves a legacy array response for other clients. The existing pagination was retained and tested; no history was deleted. The unused thread warmup module has no runtime callers and was left unchanged. A `focusMsgId` deep link still deliberately uses full history to preserve arbitrary old-message navigation; replacing it needs a target-window/bidirectional contract and is intentionally deferred. Shared/Purchased Media full-history ownership is handled next in Fix #5.

| Traced cause | BEFORE → AFTER |
| --- | --- |
| Room initial read | Mount/peer-owned effect, cancelled only on unmount → focus/AppState-owned read, aborted on cover/background/unmount. Checks after cache/token/body awaits reject obsolete work before state changes or unavailable-peer navigation. |
| Cache hydration and return | Effect always rehydrated disk and snapped latest → first entry still paints cache immediately; refocus keeps loaded memory/history and scroll instead of replacing it with the shorter cache or snapping the list. |
| Older history | Existing per-thread in-flight guard, with late-response/cleanup races → retains the guard; rejects cancelled/inactive responses and lets only the owning controller clear its pending flag. Loaded history remains accessible and survives refocus. |
| Identity | SecureStore identity read delayed room-id readiness; peer GET had only an unmount guard → identity comes synchronously from accepted Fix #1 session state; peer GET is focus/AppState/token-bound and abortable. Existing route name/avatar fallback and nicknames remain. |
| Realtime | Mounted hidden thread could emit seen/typing, scroll, and render socket updates; reconnect did not explicitly rejoin → seen/typing/scroll require actual visible foreground state, typing stops on blur, and reconnect rejoins. Message/edit/delete/reaction/pin/seen/expiry/unlock listeners remain so loaded history stays correct. |
| Hidden messages | Socket updates immediately rendered the hidden thread → updates compose in retained state, flush on return, and can be read when persisting a hidden thread on unmount. |
| Backend mark-read | Loaded and hydrated a full embedded room solely to read `roomId` → canonical/legacy lookup selects `roomId` and uses `lean()`. Authorization, atomic `markRoomsRead`, returned summary, and socket pushes are unchanged. |

Fix #3 still owns mark-read request deduplication and summary application. This fix creates no independent unread-summary reader. Already-started writes may finish. The shared socket is not disconnected on blur: retaining its event listeners preserves realtime changes, while expensive room reads and user-visible side effects require an active screen. Existing send/edit/delete/reaction/seen logic and reconciliation of changes received during a request remain in place. No navigation, swipe, list layout, composer, or API response shape changed.

Changed files (mobile paths relative to `C:/projects/rombuzz-mobile`):

| File | Purpose |
| --- | --- |
| `src/features/chat/thread/useChatThreadFastOpen.ts` | Active-screen request ownership, obsolete-response guards, retained history, owned pagination cleanup and final cache persistence. |
| `src/features/chat/thread/useChatThreadMessages.ts` (new) | Retains hidden socket state and exposes the latest value for cache persistence. Uses the unchanged Fix #2 retained-state helper. |
| `src/features/chat/window/hooks/useChatIdentity.ts` | Synchronous session identity, cancellable peer read and obsolete nickname guard. |
| `src/features/chat/window/realtime/useChatRealtime.ts` | Visible-only seen/typing/scroll effects, typing cleanup and reconnect room join; retains mutation subscriptions. |
| `src/features/chat/window/useChatWindowController.ts` | Integrates retained messages and the cache snapshot getter. |
| `scripts/performance-fixes/harness.cjs` (new) | Controlled React, network, focus, AppState, socket, session, storage and timer test boundaries for the remaining batch. |
| `scripts/performance-fixes/chat-thread.test.cjs` (new) | Five cache/lifecycle/history/realtime/identity regressions using actual hooks. |
| `docs/performance-fix-4-chat-thread.md` (new) | This record. |

Backend paths relative to `C:/projects/rombuzz/Rombuzz_main`:

| File | Purpose |
| --- | --- |
| `server/routes/chatRooms.js` | Two mark-read lookup projections; no route or response contract change. |
| `server/tests/chat-thread.test.js` (new) | Disposable local Mongo/HTTP test: 167-message fixture, complete pagination of 166 visible messages, hidden-message exclusion, legacy array compatibility, invalid cursor, access denial, and mark-read preserving history. |

Validation: TypeScript passed; five new mobile tests passed; 68 existing Chat/settings/performance tests passed; all 12 Fix #3 unread tests passed. Backend `npm test` passed 43 tests, and `npm run check` checked 185 JavaScript files. Scoped ESLint matched the committed baseline with zero errors/warnings in these files; both repository diff checks passed. Existing renderer deprecation and duplicate schema-index warnings remain. Local fixtures establish correctness and query projection, not production timing gains.

Device verification remains deferred: repeat cached/uncached thread opens, slow reads interrupted by View Profile/background, reconnect, typing/read receipts, mutations while covered, back/unmount/reopen cache correctness, older-page scrolling and pinned/reply deep links. Confirm old messages remain reachable, scroll/composer state remains stable, and mark-read still updates both list and tab badge without a new summary owner. Compare room and mark-read timings against the original account only during the final device pass.

Local checkpoint message: `perf: fix 4 chat thread lifecycle`, in both repositories. Exact hashes are recorded in the final batch summary. The accepted Fixes #1–#3 were first checkpointed as mobile `203f835` and backend `134a63c`; unrelated logo edits and the pre-existing audit document remain outside these commits. No push, deploy, production data/configuration operation, dependency change, or `USE_LOCAL` change. Continue directly to Fix #5.

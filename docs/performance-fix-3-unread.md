Fix #3 — one unread-summary owner

Implemented against the current local mobile and backend repositories on 2026-09-26. Physical-device performance verification remains deferred until the measured optimization batch is complete. This report covers Fix #3 only.

The measured overlapping requests were consistent with four independent runtime owners: the tab layout, startup warmup, mounted Chat list, and Chat thread. They each fetched and/or rewrote the same global unread cache without a shared in-flight promise. Several mount, reconnect, foreground, and message callbacks could run together. A small HTTP response did not imply a small backend operation: the summary service loaded and hydrated complete embedded message histories before counting unread messages.

**Trace before editing**

| Owner/path | BEFORE | AFTER |
| --- | --- | --- |
| Root `app/_layout.tsx` | Auth and navigation lifecycle, no authoritative unread owner. | Mounts one unread lifecycle above the root Stack, gated by the existing ready/logged-in/onboarding state. |
| Tab layout | Cached badge hydration followed by forced GET; socket setup GET; forced connect/reconnect GET; AppState active GET; message fallback GET after 650 ms. A local 15-second timestamp throttle was bypassed by forced calls and did not deduplicate requests across components. | Badge subscribes to the shared snapshot. No unread fetch, cache writer, AppState listener, or socket owner in the tab layout. Existing badge animation remains. |
| `rbzStartupWarmup.ts` | Independent unread GET ran in parallel with other warmups and rewrote the global unread map/total. | Unread startup belongs to the root owner. Profile, inbox, notification, and social-stat warmups remain unchanged. |
| Chat list `useChatListUnread` | Cache/identity hydration then GET; another AppState active GET; clear-peer event triggered another GET. | Loads identity and exposes a stable explicit-refresh callback to the shared owner. No automatic unread fetch or event owner. |
| Chat list `useChatListInbox` | Both initial inbox load and pull-to-refresh awaited unread reconciliation, despite the comment describing only pull-to-refresh. | Only explicit pull-to-refresh requests a shared reconciliation. Cached inbox hydration and `/matches` behavior remain. |
| Chat list realtime handlers | Separate connect GET, message optimistic counters and 700-ms GET fallback, summary subscription and cache writes. Blanket `off("chat:unread:update")` could remove another owner's listener. | Retains presence, row previews, ordering, reactions, and room membership. Unread events and counts belong to the root store. Async attachment checks cleanup; removal names the exact owned callbacks. |
| Chat list actions | Local map mutations, independent cache writes, preference response application; unmatch response summary ignored. Map and total could diverge. | Optimistic read/unread changes and existing preference/unmatch summaries go through the shared store. Preference writes begin their shared mutation lifecycle before publishing the optimistic count. Existing endpoints and list controls remain. |
| Chat thread `useChatUnread` | On mount/peer change, DOM active/clear-peer events, POST mark-read, then GET summary even though POST already returned it. No focus/AppState guard. DOM events did not match the layout's native event listener. | Focused foreground thread owns its active-peer registration and mark-read action. Uses the returned summary, with no normal follow-up GET. Blur/background releases active-peer suppression; refocus/foreground marks read again. Native active-peer events continue to inform list previews. |
| Thread covered by View Profile | Mounted thread could finish mark-read and initiate its extra summary GET while View Profile was foreground. | An already-issued write may finish; its valid summary can update shared state. Covering the thread does not start another mark-read or per-thread GET. |
| Unavailable-peer cache cleanup | Read/modify/write of the unscoped unread cache plus an emitted total. | Clears that peer through the shared store with an account-id guard. Other thread/inbox/presence/preference cleanup stays intact. |
| Homepage / Home notification button | No chat unread-summary caller. The notification button owns separate notification counts. | Unchanged in this fix. |
| Discover / Preview | No direct or helper-owned chat unread-summary fetch. Persistent layout/list/warmup/thread owners explain requests attributed to these foreground screens. | Unchanged in this fix; navigation does not trigger a summary fetch. |
| Social Stats | Its data/cache refresh and startup warmup do not call chat unread-summary. | Unchanged in this fix. |
| Profile / View Profile | Profile refresh/cache helpers do not call chat unread-summary. A covered thread and the persistent owners could continue independently. | Profile code and accepted Fix #2 lifecycle remain unchanged. |
| MicroBuzz | No direct or indirect chat unread-summary caller in queue, socket, focus, or cache helpers. | MicroBuzz and accepted Fix #2 lifecycle remain unchanged. |
| Notifications | Notification unread/cache/socket behavior is separate from chat unread-summary. | Unchanged in this fix. |
| Navigation and focus | Root pager keeps tabs mounted (`lazy: false`); mounted effects were mistaken for screen-specific ownership. No architecture change is needed to remove redundant unread owners. | Mounting/scroll retention and instant tab navigation remain. Consumer focus does not fetch; only thread visibility controls mark-read. |
| Timers/polling | Separate message-fallback timers, lifecycle requests, and local throttling; no shared request lifecycle. | One 650-ms missing-summary fallback, cancelled by a valid summary push or background/cleanup. No interval, polling loop, enlarged debounce, or instrumentation suppression. |
| Other helpers | `rbzApiJson` did not deduplicate requests. `navStore.setUnreadChat` has no runtime callers. | Generic API/session helpers remain intact. One runtime unread-summary URL remains, in `unread/chatUnread.ts`. |

The archived `src/features/chat/thread/rombuzz-chat-viewport-step1/app/chat/[peerId].tsx` also contains old unread code. It is outside the Expo route tree and has no runtime imports. It was inspected and left unchanged. Diagnostics still recognize and record unread-summary requests.

**Authoritative lifecycle and races**

`useChatUnreadLifecycle` owns application-level triggers; `chatUnread` owns the shared snapshot, cache, in-flight GET, and write reconciliation. `useUnreadSummary` only subscribes. The owner initializes in a layout effect before a nested thread's passive mark-read effect. Thread token subscriptions handle a session change without waiting for another focus transition.

Startup hydrates the account cache and starts one foreground reconciliation. Multiple consumers, concurrent explicit refreshes, the first socket connection, and a reconnect during that read share the same in-flight request. A later reconnect or a later foreground transition requests a fresh reconciliation. Socket summaries update badges/list counts directly; duplicate message aliases are deduplicated before optimistic increments. Reaction previews retain their lightweight unread indication without adding a summary GET.

A valid summary push supersedes an older GET. A message or optimistic write received after a GET began prevents that GET from overwriting newer state. If truth remains uncertain, reconciliation follows sequentially after the old request and pending writes finish; genuine intervening data changes may therefore require a second sequential read. This is distinct from multiple owners issuing overlapping reads.

Mark-read, mark-all-read, preference changes, and unmatch consume the existing `{ summary }` response. Matching pending writes share their promise. Missing summaries, failed writes, or ambiguous interleaved results use the same shared reconciliation path. The current mobile UI has no mark-all-read button; the shared action is tested without adding a new UI trigger. Backend mark-all-read semantics remain unchanged.

Background entry cancels an in-flight summary GET and its fallback timer. Background triggers cannot start another GET. Socket summaries may still update shared state if delivered; foreground entry reconciles missed data. An already-issued mutation is allowed to finish. Transport, HTTP, and malformed-response errors retain cached state and do not start error polling. Old-account reads, cache completions, mutation results, and delayed optimistic actions cannot overwrite the current account. A 401 clears only the token that made the request through the accepted Fix #1 session API.

Unread persistence is now one account-scoped AsyncStorage record, `RBZ_CHAT_UNREAD_V1:<userId>`, containing the owner id and summary. Writes are serialized. This removes multiple SecureStore writers and a potentially large unread-map value. Existing unscoped `RBZ_unread_map` / `RBZ_unread_total` entries are left untouched but are not imported because they contain no account identity. On the first upgrade, the badge waits for server truth instead of trusting a potentially different account's legacy count; subsequent cold starts paint the account cache first. No inbox, profile, message, media, or notification cache was removed.

**Backend evidence and compatibility**

The existing GET route runs JWT/account validation in `routes/auth-middleware.js`, then `enforceChatAllowed` / `utils/moderation.js`, then `computeUnreadSummaryForUser`. Auth and moderation each read the requesting user. Those security checks and their queries remain unchanged.

Previously `ChatRoom.find({ participants: me }).lean(false)` transferred all matched room documents, including text, media, replies, reactions, and full message arrays, then hydrated Mongoose documents/subdocuments in Node. The service separately read eligible users and modern/legacy matches, and counted messages in JavaScript. Even a zero-count response could traverse a large history.

The service now aggregates counts inside MongoDB and returns only `{ participants, unreadCount }` per room. It retains the same active-user and match filtering and the same HTTP/socket result shape `{ total, byPeer }`. Recipient, seen/deleted, hidden-for-user, expiry, strict last-read cutoff, missing-time hydration default, and manual `forceUnread` behavior are covered by parity tests against the original counter. Muted/deleted-for-me preferences do not acquire new filtering semantics. The original exported room counter remains available; routes and socket contracts were not changed.

Backend work was justified by the confirmed full-history transfer/hydration path. No production connection or timing measurement was made. A disposable local Mongo test with 1,000 historical messages reduced the serialized query result from **2,206,898 bytes to 553 bytes** while preserving counts. The test verifies a usable existing participants index and examines only the ten fixture rooms belonging to the account, excluding 120 unrelated rooms. These are synthetic payload/query-plan results, not claimed device or Render latency improvements.

Index inspection found `ChatRoom`'s declared `{ participants: 1, updatedAt: -1 }` index, which supports the initial participant match, plus a unique `User.id` index and a multikey `Match.users` index. Embedded-message indexes do not make this per-room array reduction an indexed counter. The legacy `Match` OR branches on `user1`/`user2` have no corresponding indexes declared in the current schema; the existing compatibility query remains. Actual Atlas indexes/plans were not inspected. Mongo still scans messages inside eligible room documents, and network/auth/moderation/legacy-match costs can remain. This patch cannot establish that all of the observed 2–6-second latency is resolved.

The backend patch consists of one service edit, one query helper, and one test file. No schema, index configuration, infrastructure, Redis, API configuration, or deployment changes were made. Mobile works with the existing backend response and falls back safely if a mutation response lacks a summary, so deployment order is not a new compatibility requirement.

**Every repository file changed by Fix #3**

Paths in the first table are relative to `C:/projects/rombuzz-mobile`.

| File | Change and preserved behavior |
| --- | --- |
| `app/_layout.tsx` | Adds the single owner alongside existing auth gating; no auth implementation or navigation change. |
| `app/(tabs)/_layout.tsx` | Replaces independent unread ownership with shared badge consumption; retains tab behavior and badge animation. |
| `app/(tabs)/(root)/chat.tsx` | Removes the redundant realtime reconciliation argument; keeps screen UI and navigation. |
| `src/performance/startup/rbzStartupWarmup.ts` | Removes only the unread warmup; retains Fix #1 session persistence and all other warmups. |
| `src/features/chat/list/useChatListState.ts` | Reads shared map/total instead of owning separate counters; retains list state/cache/controls. |
| `src/features/chat/list/useChatListUnread.ts` | Removes automatic fetch/cache/event owners; retains identity hydration and explicit refresh. |
| `src/features/chat/list/useChatListInbox.ts` | Restricts unread reconciliation to explicit refresh; retains inbox hydration and refresh behavior. |
| `src/features/chat/list/useChatListRealtime.ts` | Removes unread subscription/reconnect fetch and blanket listener removal; retains presence/previews/membership. |
| `src/features/chat/list/chatListRealtimeHandlers.ts` | Removes independent unread counters and fallback timer; retains row previews/reactions/order. Renames message handler to describe its remaining purpose. |
| `src/features/chat/list/chatListPersistence.ts` | Removes independent unread fetch/cache/broadcast helpers; retains other list persistence helpers. |
| `src/features/chat/list/useChatListActions.ts` | Routes count mutations and preference/unmatch response summaries through the store; retains existing controls/endpoints. |
| `src/features/chat/window/hooks/useChatUnread.ts` | Gates active-peer/mark-read by focus, AppState and session; consumes POST summary and removes the follow-up GET. |
| `src/features/chat/thread/chatUnavailableCache.ts` | Routes unread peer removal through the account-guarded store; retains other cache cleanup. |
| `src/features/chat/unread/createUnreadStore.ts` (new) | Shared cache/state, single-flight reads/writes, stale-result and account protections. |
| `src/features/chat/unread/chatUnread.ts` (new) | Account cache, sole summary GET, token-bound request helper and mark-read/all-read actions. |
| `src/features/chat/unread/useChatUnreadLifecycle.ts` (new) | One session/AppState/socket/fallback lifecycle with owned cleanup. |
| `src/features/chat/unread/useUnreadSummary.ts` (new) | Stable external-store subscription with no network ownership. |
| `scripts/unread-tests/harness.cjs` (new) | Executes actual unread modules and React lifecycle hooks with controlled requests/events/storage. |
| `scripts/unread-tests/ownership.test.cjs` (new) | Twelve focused request ownership, race, cache, mutation, auth and focus regressions. |
| `docs/performance-fix-3-unread.md` (new) | This trace, change inventory, validation and deferred acceptance record. |

Paths below are relative to `C:/projects/rombuzz/Rombuzz_main`.

| File | Change and preserved behavior |
| --- | --- |
| `server/services/chatUnread.js` | Replaces full-document hydration with per-room aggregate counts; retains eligibility filters, result contract, and exported legacy counter. |
| `server/services/chatUnreadQuery.js` (new) | Participant-filtered Mongo count projection with equivalent unread rules. |
| `server/tests/unread-summary.test.js` (new) | Real local Mongo parity, peer eligibility, payload and existing-index checks. |

Pre-existing worktree edits were retained. Fourteen recorded Fix #1/#2 source hashes match their pre-Fix-#3 values, including auth/session helpers, shared socket/API clients, MicroBuzz, Profile, Reels and lifecycle helpers. The root layout integration adds only the unread hook; startup integration removes only the obsolete unread warmup. No later optimization was started.

Ignored `.perf-work` artifacts contain pre-edit snapshots, preserved-file hashes, the staging/test/apply scripts and copies for the three backend files, the lint comparison script, and `fix3-lint-comparison.json`. They are local review/validation artifacts, not application/configuration changes.

**Validation**

| Check | Result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed. |
| Existing chat/settings/performance suites | 68 passed. |
| Accepted Fix #1 auth suite | 11 passed. |
| Accepted Fix #2 lifecycle suite | 14 passed. |
| `node --test scripts/unread-tests/ownership.test.cjs` | 12 passed. |
| Backend `npm test` | 42 passed, including HTTP/Socket.IO/Mongo integration and the four new unread test results. |
| Backend `npm run check` | Passed; 184 JavaScript files checked. |
| ESLint on all 19 touched/new mobile source/test files, compared to pre-edit snapshots | 0 errors; 25 existing warnings before, 16 after; no new diagnostics. Two existing dependency warnings have fewer missing dependencies. Unrelated warnings were not fixed. |
| `git diff --check` in both repositories, plus added-file whitespace checks | Passed. |
| Preserved Fix #1/#2 hashes | All 14 matched. |

The tests cover startup/consumer/concurrent-read coalescing; incoming aliases; summary pushes overtaking REST; missing-push fallback; background abort and foreground/reconnect; mark-read/all-read response reuse; account/cache/401 races; failures retaining stale state; exact listener cleanup and late attachment; a nested thread covered by another screen; and ambiguous overlapping writes. Existing suites emitted their React renderer deprecation and duplicate schema-index warnings; checks passed. No physical-device performance claim is made.

**Deferred physical-device acceptance criteria**

1. Cold/warm open the existing production account. Confirm correct cached-then-fresh badges, normal auth/onboarding behavior, and no repeated unread GET from mounting tab consumers. The first upgrade has the legacy-cache exception described above.
2. Repeat Homepage → Discover/Preview → MicroBuzz → Social Stats → Profile/View Profile → Notifications, including Chat-origin View Profile. Navigation alone must not create unread-summary requests. Necessary app-level reconciliation may occur while any screen is foreground; attribution to a screen alone is not a regression.
3. Receive messages and reactions on unrelated foreground screens. Badge and list counts should agree, message aliases should increment once, previews/order should update, and a timely summary push should cancel the fallback GET. At most one current-session summary GET should be in flight.
4. Open an unread thread, leave it, cover it with View Profile, and return. The visible thread clears unread through mark-read; its normal response must not be followed by a summary GET. Covered/background threads must not initiate mark-read. Messages received while covered should count until the thread becomes active again.
5. Exercise manual mark-unread/read, clear chat, unmatch, pull-to-refresh, and mark-all-read from an existing supported client. Confirm totals, per-peer counts, realtime propagation and server persistence. Mark-all-read has no new mobile UI in this patch.
6. Background the app during a slow read, receive messages, foreground it, and reconnect the socket. Verify cancellation/no new background summary GET, one shared reconciliation, and preserved realtime listeners. Check offline cache, failed requests, logout/login and delayed old-session responses.
7. Once backend deployment is separately authorized, compare the same account's summary duration/server timing under equivalent network conditions. Confirm removal of overlapping requests and measure whether the single-request 2–6-second delay improved. Investigate any residual auth/moderation/Mongo/transport time using the retained diagnostics before claiming the latency issue fully resolved.
8. Confirm Fix #1 migration/session behavior and Fix #2 MicroBuzz/Profile/Reels focus/background behavior still hold. Instant tab navigation, scroll position, caches and notification behavior must remain intact.

No commit, push, deploy, `USE_LOCAL` change, production configuration change, or production data operation was performed. Stop here before Fix #4.

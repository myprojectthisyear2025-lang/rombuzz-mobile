# Fix 1: auth storage lifecycle

Only the auth/SecureStore bottleneck is addressed. Device verification is pending; work stops here before Fix 2. No backend, production configuration, dependencies, UI design, or infrastructure was changed. Nothing was committed, pushed, or deployed.

## Confirmed cause and before → after

- `app/_layout.tsx` installed `setInterval(syncAuth, 400)`. Each run read `RBZ_TOKEN`, the complete `RBZ_USER`, and onboarding draft presence (AsyncStorage plus its SecureStore secret). Root navigation and push registration learned about changes only by rereading storage. The interval continued regardless of the foreground screen or app state.
- Login, registration, startup `/profile/full` warmup, cached Profile refresh, Profile edits, and Account/Security settings all wrote complete user objects to `RBZ_USER`. Fixing warmup alone would leave the other oversized writes intact.
- **After:** one shared in-memory session is initialized from storage; explicit login, logout, expiry, user updates, and onboarding draft events notify consumers. A background/inactive → active transition performs one reconciliation. Screen navigation and idle time perform no auth polling. The `startup.auth-storage` span still covers the combined session and onboarding-draft reconciliation.
- **After:** `RBZ_TOKEN` remains in SecureStore. `RBZ_USER` is a bounded JSON identity with `id`, `_id`, and `rbzSessionVersion: 1`. Full user data is retained in memory and AsyncStorage under `RBZ_SESSION_USER_V1`, following the existing profile-cache policy. Passwords and onboarding verification tickets remain in their existing SecureStore secret.

## Lifecycle and compatibility

1. Startup subscribers are installed before initialization. Concurrent session readers share initialization, and storage operations are serialized to prevent migration from overtaking a login. Existing `RBZ_USER` JSON is copied in full to AsyncStorage **before** its secure copy is compacted. Failed migration retains the original readable user and retries on a later storage reconciliation. The legacy `token` fallback is promoted into `RBZ_TOKEN` for existing direct readers.
2. Email/Google/Apple login and both registration entry points publish a session after persistence succeeds. Full registration still saves the token before authenticated media uploads. An unfinished onboarding draft continues to take precedence over normal logged-in routing; clearing it after successful completion immediately releases that gate. Draft fields and secret restoration are unchanged.
3. Profile and settings writes update the full cached user and session snapshot. The root hook compares only readiness, token, user ID, and draft presence, so profile-only changes do not rerender the navigation tree. ID-only consumers of `RBZ_USER` retain both aliases; consumers of names, avatars, email, and other user fields use the full cached user.
4. Existing logout, deactivation, deletion, and expiry handlers call the shared clear operation. It removes both current and legacy auth keys plus the new user cache, clears memory, and publishes the logged-out state. Existing route destinations and push-removal effects remain. Existing API rejection rules remain; this change does not introduce a timer for JWT expiry or an extra validation endpoint.
5. Expiry cleanup is tied to the token used by the rejected request. A late 401 for an old token cannot clear a newer login. Profile writes after logout, or with a different known user ID after an account switch, cannot restore the old session.
6. Session token changes update and reconnect the existing socket; logout disconnects it. The socket instance is retained during reconnects so existing listeners remain attached. Profile-only updates do not reconnect sockets.
7. Foreground reconciliation rereads persisted session/draft state once. Repeated active events and screen renders do not reread it. Transient foreground read failures retain the known session and pending-onboarding gate. Subscribers are removed when the root hook unmounts.

Existing stale-first profile/media caches and all unrelated instrumentation remain. Shared Media, Purchased Media, unread-summary ownership, notification fetching, offscreen screen work, and the other numbered fixes are not optimized here. Other SecureStore keys may still have their own size issues; this change eliminates full-user writes to `RBZ_USER`.

## Changed files

Paths are relative to the mobile repository. Pre-existing logo changes and the existing audit document were left alone. Existing import-order edits in the layout and warmup were retained.

| File | Change and preserved behavior |
| --- | --- |
| `src/features/auth/rbzSessionStorage.ts` | New compact identity/full-user persistence and legacy migration; preserves token storage, user fields, and identity aliases. |
| `src/features/auth/rbzSession.ts` | New shared session, serialized writes, subscriptions, and guarded cleanup; preserves authenticated state across startup and explicit changes. |
| `src/features/auth/useRootAuth.ts` | New root lifecycle hook; preserves auth/onboarding routing inputs without polling or profile-only root updates. |
| `app/_layout.tsx` | Consumes that hook instead of the 400 ms interval; retains splash timing, route guards, push registration/removal, notification routing, and providers. |
| `src/features/auth/onboarding/rbzOnboardingDraft.ts` | Publishes draft save/clear events and caches presence; preserves recovery data, secret storage, and onboarding precedence. |
| `src/features/auth/login/useLoginController.ts` | Publishes persisted login sessions; preserves email/Google/Apple, incomplete-profile handling, and tour logic. |
| `app/auth/register.tsx` | Publishes registration sessions; preserves endpoint, form, and destination. |
| `app/auth/register-full/index.tsx` | Publishes the early upload session and final user; preserves media uploads, draft recovery, completion ordering, and first-signup tour. |
| `src/performance/api/rbzApiClient.ts` | Uses the shared session instead of independent 60-second auth caches; preserves requests, response parsing, expiry rules, and the auth-expired event. |
| `src/performance/startup/rbzStartupWarmup.ts` | Persists the warmed full user through the shared path; preserves all warmup requests and other caches. |
| `src/features/performance/useCachedProfile.ts` | Persists refreshed profile users through the shared path; preserves stale-first cache behavior. |
| `app/(tabs)/(root)/profile.tsx` | Routes existing user writes and logout/expiry/deactivation/deletion cleanup through shared helpers; preserves profile edits, media, forms, and destinations. |
| `app/(tabs)/discover.tsx` | Sends the existing rejected-token cleanup through the shared session, guarded by the request token; preserves Discover fetching/filtering. |
| `app/(tabs)/settings/account.tsx` | Persists changed names/emails through the shared user cache; preserves request payloads and confirmations. |
| `app/(tabs)/settings/security.tsx` | Reads full cached email and persists server users through shared helpers; preserves password flow. |
| `app/(tabs)/settings/index.tsx` | Publishes logout through shared cleanup; preserves confirmation and destination. |
| `app/(tabs)/settings/manage-account.tsx` | Uses shared cleanup after deletion; preserves preview, confirmations, balance forfeiture, and destination. |
| `app/(tabs)/(root)/homepage.tsx` | Reads the full cached user for its greeting; preserves greeting instrumentation and refresh behavior. |
| `app/(tabs)/microbuzz.tsx` | Reads the full cached first name; preserves ID lookup and all screen/media behavior. |
| `src/components/comments/PrivateCommentsSheet.tsx` | Reads the full cached user; preserves optimistic comment identity/avatar fields. |
| `src/components/reporting/RBZReportSheet.tsx` | Reads the full cached reporter name; preserves reporting payloads and flow. |
| `src/components/profile/ViewProfileMediaActions.tsx` | Reads the full cached user; preserves all legacy/nested ID fallbacks. |
| `src/features/discover/discoverFilterStorage.ts` | Reads the full cached user; preserves per-user filter keys and email fallback. |
| `src/lib/socket.ts` | Updates authentication on session events and retains the socket through reconnects; preserves existing listeners and event handlers. |
| `scripts/auth-tests/harness.cjs` | New isolated storage, network, socket, app-state, and React test boundaries; uses real auth modules. |
| `scripts/auth-tests/session.test.cjs` | New migration, storage failure, concurrency, expiry, onboarding, foreground, subscription, and socket regressions. |
| `scripts/settings-tests/harness.cjs` | Supports the actual session helper's AsyncStorage and diagnostics dependencies in existing settings tests. |
| `scripts/settings-tests/account.test.cjs` | Checks the preserved full user in its new cache location after account edits. |
| `docs/performance-fix-1-auth.md` | This implementation record, changed-file inventory, and device retest procedure. |

## Local verification

- `node node_modules/typescript/bin/tsc --noEmit --pretty false`: passed before changes and after implementation.
- `node --test scripts/auth-tests/*.test.cjs scripts/settings-tests/*.test.cjs scripts/performance/mobile-diagnostics.test.cjs scripts/chat-tests/*.test.cjs`: **76 passed, 0 failed**. The suite includes 11 new auth regressions. It uses mocks, not production requests. Node test workers required sandbox escalation after an EPERM spawn failure.
- Changed-file ESLint: reports 1 existing MicroBuzz `react/no-unescaped-entities` error and 29 existing warnings in the touched screens. These unrelated lines are outside Fix 1. The new auth modules have no lint findings. `git diff --check` passed.
- No physical device run or production performance improvement is claimed yet.

## Physical Android retest

Keep performance instrumentation enabled as in the measurement build. Install/run this code over the existing app **without uninstalling or clearing data**, so the first launch exercises migration of the production account's existing full `RBZ_USER`.

1. Force-stop and cold-open. Confirm the existing login, home greeting, avatar, and cached Profile still appear. Open Home, Discover, MicroBuzz, Profile, and Chat; remain on each for 20–30 seconds. In the capture, `startup.auth-storage` must no longer appear every ~400 ms. Expect a startup reconciliation, then none from simply navigating or idling.
2. Leave the app in the background for 30 seconds and return; repeat three times. Expect one auth-storage reconciliation per actual resume, no continuous auth spans in the background, and no login redirect. Confirm a chat can still send/receive and a notification opens its existing destination.
3. Open/refresh Profile and update an editable profile field. Confirm the displayed value, avatar/name-dependent views, and cached data survive a force-stop/reopen. Check that these user writes and startup warmup no longer emit the oversized `RBZ_USER` SecureStore warning. If a size warning remains, preserve its stack/capture so its key can be identified separately.
4. Log out through Settings, confirm login appears, then force-stop/reopen and confirm it stays logged out. Log in again with each provider available on the Android build; email and Google are the usual Android cases. Repeat through Profile's existing logout action if exposed. Confirm Chat and notification routing work after login. If a second test account is available, switch accounts and check that identity and realtime events belong to the new account.
5. With a test signup/incomplete-profile account, reach onboarding step 2 or 3, enter fields, force-stop, and reopen. Confirm it resumes the saved step and cannot enter tabs. Complete onboarding and confirm uploads, the normal home destination, and the first-signup tour behavior. Repeat background/foreground while the draft is pending. Do not delete/deactivate the production account merely to test cleanup; those paths are covered by the existing automated tests.
6. If an already expired/invalid test session is available, open or refresh Profile/Discover to trigger the existing backend rejection. Confirm login appears and reopening stays logged out, then confirm a fresh login works. If no such session is available, mark this physical case untested; rejected-token and late-401 behavior is covered by the automated suite. No production token or server configuration needs to be changed for this check.

Report the capture's auth-storage count/cadence, whether user-size warnings remain, and any login/logout/onboarding/realtime regression. Wait for that result before beginning Fix 2.

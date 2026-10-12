# RomBuzz launch fixes — local review handoff

Prepared 2026-10-11 from the current local repositories:

Follow-up: [push ownership review corrections](push-ownership-review.md) supersede the original push cleanup/concurrency description below and record the additional tests and MongoDB deployment requirement. The diff stats below remain the original launch-pass snapshot.

- Mobile: `C:\projects\rombuzz-mobile` (mobile paths below are relative to this root).
- Backend: `C:\projects\rombuzz\Rombuzz_main` (backend paths below start with `server/`).

The requested Pass 1 code changes are implemented locally. Changes are **uncommitted**. No EAS build, backend deployment, store submission, commit, push, production database purge, test email, or real push was performed. No dependencies were upgraded. Existing system photo picker and save-media changes were preserved. This is code and local automated validation, not device acceptance or a store-readiness claim.

## 1. Account isolation and avatar

**Established causes:** the full-profile cache used an unowned global key; the shared cache and LetsBuzz feed could be reused by another account; logout waited for storage before publishing the signed-out identity; pending successful requests and profile writes lacked an account-generation guard. The bottom avatar refreshed on navigation instead of directly following identity changes.

**Implemented:** private shared caches now use `RBZ_PRIVATE_V1:<userId>:...`, ignore legacy unowned entries, and clear their memory on a session boundary. Same-account disk caching remains available. Profile hydration validates the payload's user ID. Logout/account changes synchronously invalidate the session and reset the authenticated navigation/call subtree. Storage writes are serialized, and secure identity records bind to the token signature to reject interrupted mixed-account writes on restart. Requests reject changed ownership both before dispatch and after a successful response. Old 401 responses cannot log out the new account. Startup warmup, profile, inbox, social stats, and feed writes check their captured owner. Notification state resets immediately with the session.

The avatar follows the live session, handles string/object photo sources, and shows a neutral person icon until the current image loads or when it fails. No previous account's image is intentionally retained during loading.

**Exact changed files:**

- `src/features/auth/rbzSession.ts`, `src/features/auth/rbzSessionStorage.ts`, `src/features/auth/useRootAuth.ts`
- `src/performance/api/rbzApiClient.ts`, `src/performance/cache/rbzCache.ts`, `src/performance/startup/rbzStartupWarmup.ts`
- `src/features/performance/useCachedProfile.ts`, `src/features/performance/useCachedChatInbox.ts`, `src/features/performance/useCachedSocialStats.ts`, `src/features/performance/letsbuzz/rbzLetsBuzzFeedCache.ts`
- `src/components/letsbuzz/LetsBuzzPosts.tsx`, `src/components/letsbuzz/LetsBuzzReels.tsx`
- `app/(tabs)/(root)/profile.tsx`, `app/(tabs)/_layout.tsx`, `app/_layout.tsx`, `src/navigation/RootBottomBar.tsx`
- `src/features/notifications/notificationState.ts`, `src/features/notifications/createNotificationStore.ts`

**Validation:** automated slow-storage logout, torn restart, same-account cache restart, foreign cached identity, stale successful responses, token-lookup switching, late profile/feed writes, unread ownership, and old/current 401 tests pass. Native frame-by-frame A→logout→B signup/login, slow image loading, and process-kill/relaunch remain device checks. Cached private data remains on the device under account-specific keys; this is isolation, not a new cache-erasure policy.

## 2. About information

The inspected current About components and `server/models/User.js` / `server/routes/profile.js` already leave the optional personal facts empty. The global cache issue above could make another account's saved facts appear as defaults. A separate confirmed conversion in `lookingForKeyFromValue` silently changed removed legacy categories to “New Connections”; it now preserves the actual saved value. Empty editable text rows display “Not provided.” No personal data migration was performed; valid saved facts and DOB-derived age remain intact.

**Changed:** `src/constants/lookingFor.ts`, `src/features/profile/info/ProfileInfoRow.tsx` (plus the account/cache fixes above).

**Inspected mounted paths:** `src/components/profile/ProfileInfoTab.tsx` and its imported `src/features/profile/info/sections/` components, including Basics, Background, Beliefs, BodyBasics, Dating, Identity, Lifestyle and Location; `src/features/viewProfile/info/viewProfileInfoFormat.ts` and its consumers; `src/features/discoverProfile/DiscoverProfileFields.tsx`, `DiscoverProfileBasics.tsx` and `discoverProfilePrivacy.ts`. Missing viewed-profile fields remain hidden/empty. Profile country/hometown edits are manual text choices, not GPS opt-in.

**Validation:** a minimal account read through the actual backend `/profile/full` route contains no fabricated optional facts. Existing profile state/cache tests pass. No rendered native About screen was visually tested. There is no reliable provenance marker in the inspected schema to distinguish an old incorrect persisted fact from intentional input; do not bulk-clear plausible-looking values. A future correction should use user confirmation or independently verified write provenance.

## 3. Location consent

**Established causes:** Discover automatically requested location while fetching; MicroBuzz treated the OS grant/global permission cache as feature consent, refreshed GPS on entry, and exposed a permission-based label. Stale coordinates alone were not proof of continuous tracking. The issue was the automatic permission/GPS path and lack of an independent account-specific off choice.

**Implemented:** new device-local, per-account, per-feature choices default off and do not import the old OS-permission cache. Explicit enable requests OS permission. Disable immediately invalidates pending work and persists off; OS denial/revocation remains off. Consent revisions prevent an old GPS result from becoming usable after an off/on cycle. Discover has an explicit switch and omits coordinates when off. MicroBuzz stops scans/heartbeats, clears live coordinates, and attempts deactivation on disable/logout/unmount. Pending activations clean up using their original account token. Meet in the Middle retains its explicit one-time share action and drops permission/GPS responses after reset, unmount, or account switching.

**Changed:** `src/features/location/useLocationConsent.ts` (new); `app/(tabs)/discover.tsx`; `app/(tabs)/microbuzz.tsx`; `src/features/microbuzz/MicroBuzzHeader.tsx`; `src/features/meetMiddle/useMeetMiddleLocationShare.ts`; `src/features/meetMiddle/meetMiddleApi.ts`.

**Inspected without GPS changes:** signup `app/auth/register-full/steps/Step2Prefs.tsx` and `src/features/profile/info/sections/ProfileLocationSection.tsx` use manual choices. `server/routes/discover.js` updates stored coordinates only when the request supplies valid coordinates; missing GPS hides distance rather than inventing it. No new permissions or background location subscription were added.

**Validation:** tests cover OS grant without opt-in, denial, disable racing permission/storage, relaunch, account changes, consent revisions, the mounted Discover screen disabling during GPS, and Meet in the Middle switching accounts during GPS. Physical OS revoke/relaunch, MicroBuzz live visibility, and native GPS behavior remain unverified. A native one-shot GPS promise already launched may finish, but its result is ignored after invalidation. Offline logout/deactivation cannot instantly remove already published backend presence; cleanup is best effort and existing server expiry still matters. Disabling does not erase historically stored coordinates or manual profile location.

## 4. Live chat list

**Established causes:** outgoing events selected the sender as the peer; active-thread messages could skip the row update; captured handler callbacks became stale; stored ordering could override new-message recency; mutations/reconnect/resume lacked consistent reconciliation. The HTTP message path broadcast through a single remembered peer socket and did not reliably reach the sender's other device.

**Implemented:** derive the peer from both sender and recipient, deduplicate message aliases, reject older previews, update outgoing and incoming previews immediately, then reconcile server inbox/unread truth. One subscription set uses current callbacks and cleans up only its listeners. Delete/edit/reconnect/foreground events trigger a debounced silent reload. Socket revisions prevent an older HTTP list from replacing newer events. Pins remain first; other rows follow message recency. HTTP sends use the union of chat room and both account rooms. Delete-for-me and relevant room mutations emit `chat:inbox:update` to the actor's devices.

**Changed:** `app/(tabs)/(root)/chat.tsx`; `src/features/chat/list/chatListRealtimeHandlers.ts`, `useChatListRealtime.ts`, `useChatListInbox.ts`, `useChatListState.ts`; `src/features/performance/useCachedChatInbox.ts`; `server/routes/chatRooms.js`. The socket persistence path in `server/sockets/chatEvents.js` also gains the push call described below. Existing `src/lib/socket.ts`, `chatListPersistence.ts`, `server/services/chatPersistence.js`, and unread ownership machinery were traced and retained.

**Validation:** local HTTP + Socket.IO + disposable Mongo tests verify both account rooms, a second sender device, one persisted message for a retried ID, latest `/matches` preview, and delete-for-me invalidation. Mobile tests verify own/received/media previews, aliases, old timestamps, session changes, one listener, reconnect/resume/delete reconciliation, thread lifecycle, and unread ownership. Two physical devices exchanging messages remain an acceptance check.

## 5. Push delivery pipeline

**Established causes:** device-local sync markers could suppress real server reconciliation; settings UI did not persist the account's switches; a token could remain associated with another account; the active persisted chat paths did not dispatch chat push; duplicated transports counted attempted sends as success and did not track receipts. Code inspection cannot establish whether production credentials are valid.

**Implemented mobile:** serialize token-owner changes with a durable SecureStore owner record; read server preferences before requesting/registering; do not automatically re-prompt a denial; create the Android `default` channel; obtain the current Expo token and reconcile on foreground, rotation, preferences, and account changes. Failed cleanup remains retryable on the next trigger. Settings use the existing authenticated settings API. Foreground presentation and taps require the payload's recipient to match the current user; account changes dismiss existing tray notifications. Deep-link routing itself remains the existing resolver.

**Implemented backend:** detach the registering token from other accounts, including the legacy `pushToken`; make old-account deletion account-scoped and atomic for the token array. Dispatch chat push only for a newly inserted persisted message, respecting recipient status, mute, master and message preferences. Existing match notification paths in `server/routes/likesMatches.js` reach the shared sender. Calls respect master/message switches. Payloads include `recipientId`. One transport batches sends, validates individual tickets, reports error codes without token/body logs, prunes `DeviceNotRegistered`, and saves accepted tickets for durable receipt checks. Receipt metadata has a 24-hour TTL; the worker runs after Mongo startup, checks each minute, and initially queries tickets after 15 minutes.

**Exact changed/new files:**

- Mobile: `src/features/notifications/usePushRegistration.ts` (new), `app/_layout.tsx`, `app/(tabs)/settings/notifications.tsx`, `src/features/notifications/notificationState.ts`, `src/features/notifications/createNotificationStore.ts`, `app.config.js` (optional `GOOGLE_SERVICES_JSON` path).
- Backend: `server/routes/users.js`, `server/routes/settings.js`, `server/routes/videoCalls.js`, `server/routes/chatRooms.js`, `server/sockets/chatEvents.js`, `server/utils/helpers.js`, `server/services/expoPushService.js`, `server/index.js`.
- New backend: `server/services/chatPushNotification.js`, `server/services/expoPushTransport.js`, `server/services/expoPushReceipts.js`, `server/models/ExpoPushReceipt.js`.

**Validation:** mocked Expo tests cover batching, ticket failures, credential-error reporting, receipt persistence failures, missing-receipt retry, invalid-device pruning, categories/master/mute/deleted-recipient suppression, recipient IDs and message/match/call links. Mobile tests cover denial, disabled push, foreground reconciliation, token rotation, and late A registration cleanup before B. Actual route tests cover settings persistence, legacy and current token transfer, and late A deletion preserving B's registration. These tests send no real OS notifications.

**Remaining configuration / acceptance — unverified:**

1. Local production config currently has **no `android.googleServicesFile`**. Supply the matching Firebase Android client file through `GOOGLE_SERVICES_JSON` (for example an EAS production file environment variable), and verify the Firebase client package is `com.rombuzz.app`. Verify FCM V1 service-account credentials in the same Expo/EAS project and Firebase project; check restricted API-key setup against the Play app-signing certificate where applicable. No credential files or EAS account settings were inspected. [Expo FCM credentials](https://docs.expo.dev/push-notifications/fcm-credentials/)
2. If Expo enhanced push security is enabled, provide the backend `EXPO_ACCESS_TOKEN` through secret configuration. Allow backend HTTPS to Expo; ensure Mongo can create the receipt indexes and `DISABLE_BACKGROUND_JOBS` is not `true`. Keep a backend process awake for receipt polling. Verify operational logs for ticket/receipt errors after deployment. A ticket is acceptance by Expo, and a successful receipt is provider handoff, not proof of device display. [Expo sending and receipts](https://docs.expo.dev/push-notifications/sending-notifications/)
3. Deploy the backend recipient payload changes before using this mobile patch: older payloads without recipient identity are intentionally ignored by the foreground/tap ownership checks. Review/deploy/build are later actions; none were performed here.
4. On physical Play-installed devices, test message and match push in foreground, background, and normally closed states; tap to the correct peer/screen; deny permission; turn off master and each relevant category; rotate/reinstall; switch A→B with delayed/offline cleanup; confirm no duplicate notification for a retried message. An offline device cannot revoke a token already registered remotely or recall a push already queued by the provider. The client queue retries on foreground/preference/session triggers; this is not a guaranteed-delivery outbox.
5. Test Android force-stop separately: force-stopping through device Settings prevents messages until the app is manually reopened. It is not equivalent to a normally closed app. [Firebase Android state behavior](https://firebase.google.com/docs/cloud-messaging/flutter/receive-messages)

## 6. Small UI and email fixes

| Item | Cause / implementation | Files | Validation |
| --- | --- | --- | --- |
| Signup interests | Removed only the rendered `+Add Interest` control; existing selection remains | `app/auth/register-full/steps/Step2Prefs.tsx` | Diff review + TypeScript; native selection unverified |
| Signup review photos | Tiny clipped single-row previews and a capped nested scroller; now all photos wrap in larger contain-fit tiles and use the outer signup scroll | `app/auth/register-full/steps/Step6ReviewSections.tsx`, `Step6Summary.tsx`, `app/auth/register-full/styles/createStep6SummaryStyles.ts` | Mounted parent flow inspected + TypeScript; small-device layout unverified |
| Bottom avatar | Live session + neutral loading/error fallback | `app/(tabs)/_layout.tsx`, `src/navigation/RootBottomBar.tsx` | Account/hook validation; native image rendering unverified |
| Theme | Unset/invalid saved preference now starts as system; explicit light/dark stays saved | `src/design/RomBuzzThemeProvider.tsx` | Automated live Appearance change and explicit override test passes |
| OTP logo | Removed the old raw-GitHub image source; attach the existing mobile brand PNG inline with a stable CID | `server/routes/auth/otp.js`, new `server/assets/rombuzz-email-logo.png` | Byte-identical SHA256 to `assets/images/logo.png`; installed Resend attachment support inspected; no email sent/rendered |
| Photo edit control | Mounted `ProfileIdentityHero` now renders camera-only while retaining button role, tap area/hitSlop and “Change profile photo” accessibility label | `src/features/profile/ProfileIdentityHero.tsx` | Mounted caller/diff review + TypeScript; unmounted `ProfilePhotoHero.tsx` untouched |

Logo SHA256: `D7B94C13757ACF00BDAA316615BD90B22AFDFA963266A1A9E6B006390CDD69AE`. The user's untracked `frontend/src/assets/logo2.png` was preserved; it was not silently substituted for the mobile app's configured logo.

## 7. Earlier bugs inspected separately

**DOB — existing patch retained.** `app/auth/register-full/steps/Step1Basic.tsx` already contains a bounded year `ScrollView` with `height: 160`, `flexShrink: 0`, and `nestedScrollEnabled`. It generates 100 descending years starting at current year minus 18 (2008 through 1909 in 2026). The rendered registration parent and actual month/day adult validation in `app/auth/register-full/index.tsx` were inspected. No DOB change was needed. Android gesture handling still needs a physical scroll check; the presence of the patch is not a device pass.

**Incoming call — small established bug fixed.** The active extensionless import resolves to `src/features/videoCall/useVideoCallSocket.ts`, not the historical `.tsx`. The overlay did not dismiss on the accepted event, and unstable callbacks caused subscriptions to churn. The hook now retains one listener set with current callbacks. `src/features/videoCall/IncomingCallOverlay.tsx` closes on accepted and remembers dismissed call IDs so a duplicate ringing event cannot reopen it. The provider's active call remains separate and is not cleared by overlay dismissal. The actual overlay test verifies accept navigation/dismissal, accepted elsewhere, and duplicate events. Native Agora/media and two-device calls remain unverified. `VideoCallProvider.tsx` was inspected, not rewritten.

**Seven-day deletion — inspection only, not verified production purge.** Inspected `server/services/accountDeletionService.js`, `accountDeletionDatabaseCleanup.js`, `accountDeletionStorageCleanup.js`, the directly referenced records/storage and Apple cleanup, and scheduler registration in `server/index.js`. No deletion behavior was changed or live account purged.

- Deletion currently removes user-facing data immediately and then scrubs a `pending_delete` User record with a seven-day email hold. It deletes whole participating chat rooms/messages, affecting counterpart history too; this is existing behavior.
- The job is registered after Mongo connection when `DISABLE_BACKGROUND_JOBS !== "true"`, runs about 15 seconds after startup and every six hours while the process is awake. Deployment env, host uptime and real worker runs were not checked; a sleeping host can delay final removal.
- Before expiry, cleanup retries with failed storage references stored in the User `media` retry manifest. After expiry, successful cleanup actually calls `User.deleteOne`. When cleanup fails, the record remains with a synthetic released email and retry references. Thus email reuse after seven days is not evidence of complete purge.
- The failure path returns `success: true, pendingCleanup: true`; the expired sweep counts this as “wiped.” Its log can overstate final deletion. The pre-expiry loop has no per-user exception boundary: one thrown error can abort that run before the expired sweep.
- Pending records with missing/null `deleteAfter` are retried but do not naturally age into the expired query. The exported final-wipe helper trusts its caller to enforce pending/expiry conditions. These need a separate review, not a live corrective purge.
- Initial cleanup runs before the durable pending-delete update. A crash between destructive cleanup and saving the retry manifest can lose retry information or leave partially removed data without the final state transition.
- Storage collection selects only `mediaUrl` for posts/stories, so separate Stream UID fields may be missed. Legacy non-R2 string URLs are ignored by the R2 collector. Chat-room collection covers media from both participants; ownership/retention policy needs review before changing it.
- Reports/support and financial/audit history are retained with pseudonymous actor IDs. This includes `ReportModel`, `SupportTicket`, `GiftTransaction`, `BuzzCoinLedger`, remaining `GiftSummary` references, `MediaGift`, `BuzzPostGift`, and `VideoCallGiftRequest`. Freeform content can still contain identifying text; no complete erasure or retention deadline was established by this inspection. The new receipt table additionally retains token/ticket metadata with a 24-hour TTL, not message content. Confirm index creation in deployment; TTL deletion is asynchronous.
- Apple revocation/storage credentials and real failed-cleanup retries remain external checks. A separate change should add explicit expiry/state guards, crash-safe cleanup progress, per-account retry isolation, truthful completion counts and retention decisions, with disposable-fixture tests before any production operation.

## 8. Pass 2 remains pending

| Backlog | Entry points / required decision |
| --- | --- |
| Tour redesign | `src/features/onboarding/FirstSignupTour.tsx`, `FirstSignupTour.styles.ts`, `firstSignupTourSteps.ts` and imported previews; design review |
| Social incoming-request badge | `src/navigation/RootBottomBar.tsx`, `src/features/socialStats/useSocialStatsData.ts`, notification store; define seen/read/request-clearing semantics |
| Composer spacing | `src/features/chat/window/components/ChatComposer.tsx`, `ChatWindowView.tsx`, `src/features/chat/thread/useChatThreadViewport.ts`; keyboard and safe area behavior |
| Remove image download buttons | Mounted action map below; review scope before changing preserved save-media work |
| Copy/paste messages | `src/features/chat/window/components/ChatMessageActionsSheet.tsx`, `ChatComposer.tsx`, `src/features/chat/window/useChatWindowController.ts`; use explicit platform clipboard/menu actions |
| Select/bulk delete | Same actions/controller, `src/features/chat/thread/useChatThreadMessages.ts`, `server/routes/chatRooms.js`; define delete-for-me/everyone and server ownership |
| Multi-select signup/profile photos | `app/auth/register-full/steps/Step4Photos.tsx`, both named signup upload helpers under `src/features/onboarding/` and `src/features/auth/onboarding/`, `src/components/profile/Gallery/AddPhotoButton.tsx`, `MediaUploader.tsx`, `ProfileUploadPreview.tsx`; confirm active path, total limits, per-file validation, partial failures |

**Mounted download actions inspected, not removed:**

- `app/chat/[peerId].tsx` → ChatWindow screen/view → `ChatThreadOverlays` → `ChatPlusModal` → `src/components/chat/ChatUploadPreview.tsx`: the selected upload preview has a download action calling `saveMediaToPhone(selected.uri)`. Existing user changes preserved.
- The chat window controller's media hook mounts `src/features/chat/thread/ChatMediaViewerController.tsx`. Persistent chat photos use `RBZImageViewer` without a download footer. Ephemeral photos use `src/components/chat/MediaViewer.tsx` with `allowDownload=false` (a locked icon can still render). Keep-mode videos enable its download/share action outside Expo Go; view-limited videos disable it.
- `app/chat/shared-media/[peerId].tsx` and `app/chat/purchased-media/[peerId].tsx`: photos use `RBZImageViewer` without a download footer; videos use `MediaViewer` with download disabled. Their remaining `saveToPhone` helpers are unused, not mounted download buttons.
- `src/utils/saveMediaToPhone.ts` remains intact. Removing the upload-preview action and/or the keep-video action requires the requested Pass 2 scope decision; no action was removed here.

## 9. Verification record

Run from the mobile root:

```powershell
npx tsc --noEmit
node --test scripts/launch-fixes/*.test.cjs scripts/auth-tests/*.test.cjs scripts/unread-tests/ownership.test.cjs scripts/performance-fixes/discover.test.cjs scripts/performance-fixes/discover-smoke.test.cjs scripts/performance-fixes/notifications.test.cjs scripts/performance-fixes/profile-state-smoke.test.cjs scripts/performance-fixes/chat-thread.test.cjs
node --test scripts/auth-tests/session.test.cjs
node scripts/launch-fixes/check-production-config.cjs
git -c core.safecrlf=false diff --check
```

TypeScript passes. The combined mobile run had 60/61 pass: one existing 401 test switched accounts before dispatch, which the new guard now correctly prevents. Its fixture was changed to wait for actual dispatch before testing a late 401; all 11 auth tests then passed. **All 61 distinct tests pass across those final runs.** The React test renderer emits its existing deprecation warning; native UI/hardware is mocked. New behavior tests are `scripts/launch-fixes/session-consent-chat.test.cjs` and `push.test.cjs`; existing harness updates are in `scripts/auth-tests/harness.cjs`, `scripts/auth-tests/session.test.cjs`, `scripts/performance-fixes/harness.cjs`, and `scripts/performance-fixes/discover-smoke.test.cjs`.

The config script resolves the installed Expo CLI with `APP_VARIANT=production` and prints only a whitelist. It passed after rerunning with permission for a child process blocked by the sandbox. It asserts:

```text
android.package = com.rombuzz.app
blocked: android.permission.READ_MEDIA_IMAGES
blocked: android.permission.READ_MEDIA_VIDEO
blocked: android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION
googleServicesFileConfigured = false
expoProjectIdConfigured = true
notificationsPluginConfigured = true
artifactManifestVerified = false
```

No rebuilt AAB exists from this task; its final merged manifest is unverified.

Run from `C:\projects\rombuzz\Rombuzz_main\server`:

```powershell
npm run check
node --test tests/chat-thread.test.js tests/notifications.test.js
node --test tests/launch-push.test.js tests/launch-routes.test.js
```

Syntax check passes for 199 JavaScript files. Both existing backend tests pass. All six new backend tests pass. Route/integration tests use local disposable Mongo and localhost servers; Expo calls are mocked in push tests. `git -c core.safecrlf=false diff --check` also passes at the backend root. Logo hashes match. No seven-day elapsed test or physical-device test was run.

## 10. Preserved starting changes and review order

The tracked diff below includes changes already present when this task began. It must not be attributed entirely to this pass.

**Mobile starting changes preserved:** `app.config.js`, `app.json`, `app/chat/purchased-media/[peerId].tsx`, `app/chat/shared-media/[peerId].tsx`, `app/components/CloudinaryUploader.tsx`, `src/components/chat/ChatPlusModal.tsx`, `src/components/chat/ChatUploadPreview.tsx`, `src/components/comments/PrivateCommentsSheet.tsx`, `src/components/story/AddStoryModal.tsx`, and untracked `src/utils/`. Only `app.config.js` additionally receives this pass's optional Firebase file-path setting. Other files in this starting list were not edited by this pass.

**Backend starting changes preserved:** deleted `server/docs/performance-post-device-pinned.md`, untracked `astra-mongodb-audit/`, and untracked `frontend/src/assets/logo2.png`.

Suggested review order:

1. Auth/session storage, cache ownership and root layout/identity resets; run the race tests first.
2. Explicit location choice and the Discover/MicroBuzz/Meet in the Middle async guards.
3. Mobile chat subscriptions/inbox and backend room fanout/persistence.
4. Push ownership, settings/preferences, shared ticket/receipt services, index/job configuration and deployment ordering.
5. About/small UI fixes, call overlay and the bundled OTP logo.
6. Deletion findings and Pass 2 decisions; keep those separate from approval of the implemented patch.
7. Review the preserved starting changes, then configure credentials and perform physical-device acceptance before a separately authorized rebuild/release.

All new production helpers have a purpose comment and are under 200 lines. No staging was performed. New files are listed separately because ordinary `git diff --stat` omits untracked files.


## Tracked working-tree diff stat

Mobile (includes preserved starting changes):

```text
 app.config.js                                      |   7 +
 app.json                                           |   8 +-
 app/(tabs)/(root)/chat.tsx                         |   2 +-
 app/(tabs)/(root)/profile.tsx                      |  25 ++-
 app/(tabs)/_layout.tsx                             |  60 ++----
 app/(tabs)/discover.tsx                            |  36 +++-
 app/(tabs)/microbuzz.tsx                           | 191 ++++++------------
 app/(tabs)/settings/notifications.tsx              |  80 ++++++--
 app/_layout.tsx                                    | 218 ++-------------------
 app/auth/register-full/steps/Step2Prefs.tsx        |   9 -
 .../register-full/steps/Step6ReviewSections.tsx    |   3 +-
 app/auth/register-full/steps/Step6Summary.tsx      |   9 +-
 .../styles/createStep6SummaryStyles.ts             |  10 +-
 app/chat/purchased-media/[peerId].tsx              |  26 +--
 app/chat/shared-media/[peerId].tsx                 |  28 +--
 app/components/CloudinaryUploader.tsx              |  13 +-
 scripts/auth-tests/harness.cjs                     |   6 +-
 scripts/auth-tests/session.test.cjs                |   7 +-
 scripts/performance-fixes/discover-smoke.test.cjs  |  24 ++-
 scripts/performance-fixes/harness.cjs              |   9 +-
 src/components/chat/ChatPlusModal.tsx              |  17 +-
 src/components/chat/ChatUploadPreview.tsx          |  14 +-
 src/components/comments/PrivateCommentsSheet.tsx   |  10 +-
 src/components/letsbuzz/LetsBuzzPosts.tsx          |  10 +-
 src/components/letsbuzz/LetsBuzzReels.tsx          |   8 +-
 src/components/story/AddStoryModal.tsx             |  13 +-
 src/constants/lookingFor.ts                        |   4 +-
 src/design/RomBuzzThemeProvider.tsx                |   6 +-
 src/features/auth/rbzSession.ts                    |  45 +++--
 src/features/auth/rbzSessionStorage.ts             |  12 +-
 src/features/auth/useRootAuth.ts                   |  10 +-
 src/features/chat/list/chatListRealtimeHandlers.ts | 204 ++++---------------
 src/features/chat/list/useChatListInbox.ts         |  54 +++--
 src/features/chat/list/useChatListRealtime.ts      | 166 +++++++---------
 src/features/chat/list/useChatListState.ts         |   3 +-
 src/features/meetMiddle/meetMiddleApi.ts           |   9 +-
 .../meetMiddle/useMeetMiddleLocationShare.ts       |  16 +-
 src/features/microbuzz/MicroBuzzHeader.tsx         |   4 +-
 .../notifications/createNotificationStore.ts       |   1 +
 src/features/notifications/notificationState.ts    |   6 +
 .../performance/letsbuzz/rbzLetsBuzzFeedCache.ts   |  37 ++--
 src/features/performance/useCachedChatInbox.ts     |  26 ++-
 src/features/performance/useCachedProfile.ts       |  90 +++------
 src/features/performance/useCachedSocialStats.ts   |   5 +
 src/features/profile/ProfileIdentityHero.tsx       |   9 +-
 src/features/profile/info/ProfileInfoRow.tsx       |   2 +-
 src/features/videoCall/IncomingCallOverlay.tsx     |  14 +-
 src/features/videoCall/useVideoCallSocket.ts       |  22 ++-
 src/navigation/RootBottomBar.tsx                   |  14 +-
 src/performance/api/rbzApiClient.ts                |   7 +-
 src/performance/cache/rbzCache.ts                  |  39 ++--
 src/performance/startup/rbzStartupWarmup.ts        |  48 +++--
 52 files changed, 682 insertions(+), 1014 deletions(-)
```

Backend (includes the pre-existing deleted document):

```text
 server/docs/performance-post-device-pinned.md | 24 -------
 server/index.js                               |  1 +
 server/routes/auth/otp.js                     | 10 ++-
 server/routes/chatRooms.js                    | 35 ++++-------
 server/routes/settings.js                     |  7 ++-
 server/routes/users.js                        | 14 +++--
 server/routes/videoCalls.js                   |  4 +-
 server/services/expoPushService.js            | 74 +++-------------------
 server/sockets/chatEvents.js                  |  2 +
 server/utils/helpers.js                       | 91 ++-------------------------
 10 files changed, 53 insertions(+), 209 deletions(-)
```

## New files from this pass, omitted by the tracked stat

Mobile:

- `scripts/launch-fixes/check-production-config.cjs` (12 lines)
- `scripts/launch-fixes/push.test.cjs` (48 lines)
- `scripts/launch-fixes/session-consent-chat.test.cjs` (175 lines)
- `src/features/location/useLocationConsent.ts` (66 lines)
- `src/features/notifications/usePushRegistration.ts` (119 lines)
- `docs/launch-fixes-review.md` (this handoff)

Backend:

- `server/assets/rombuzz-email-logo.png` (919502 bytes)
- `server/models/ExpoPushReceipt.js` (9 lines)
- `server/services/chatPushNotification.js` (17 lines)
- `server/services/expoPushReceipts.js` (52 lines)
- `server/services/expoPushTransport.js` (48 lines)
- `server/tests/launch-push.test.js` (50 lines)
- `server/tests/launch-routes.test.js` (33 lines)

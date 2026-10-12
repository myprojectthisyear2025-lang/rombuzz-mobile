# Push ownership review corrections

This follow-up fixes the two confirmed findings in the earlier launch handoff. All prior fixes and pre-existing user changes remain in place. Changes are local and uncommitted; no build, deployment, commit, push, production database operation, or actual push was performed.

## Old-owner cleanup must not block the current account

`server/routes/auth-middleware.js` was inspected without modification. Its DELETE rejections are:

| Response | Cleanup behavior |
| --- | --- |
| 401 (expired/missing account credential) | Retire the unusable cleanup credential; continue registration |
| 403 + `Account scheduled for deletion` | Same |
| 403 + `ACCOUNT_BANNED` | Same |
| 403 + `ACCOUNT_DEACTIVATED` | Same |
| Network error, timeout, server failure, unrecognized/malformed 403, or `ACCOUNT SUSPENDED` | Persist retryable cleanup separately; still allow the current registration attempt |

Only DELETE recognizes these terminal credential responses. A rejected POST always fails registration. A terminal cleanup result does **not** mean the server deleted the token; the code explicitly distinguishes credential rejection from a successful API response.

**Changed files:**

- `src/features/notifications/usePushRegistration.ts`: move superseded ownership into durable cleanup before replacing the current owner; retry cleanup independently of the new claim; retain the prior preferences, permission, rotation, generation and foreground checks.
- New `src/features/notifications/pushTokenCleanup.ts`: exact response classification, account-scoped DELETE using the original owner's auth token, a 15-second abort deadline per request, and the SecureStore `RBZ_PUSH_CLEANUP_V1` queue. Successful POST discards pending cleanup for that exact token because the backend has committed its exclusive transfer; pending cleanup for a different rotated token remains.
- `scripts/launch-fixes/push.test.cjs`: regression coverage for all terminal responses, rejected POST, retryable network/server/unknown-403/suspension failures, restart recovery, original credentials, same-token transfer, different-token retention, and an unresponsive DELETE timing out before B registers. Existing registration, rotation, denial and late-account-switch cases remain.

Retryable entries survive a process restart. They contain the original auth/token tuple in SecureStore, not plain AsyncStorage or logs. Normal foreground, preference, rotation and session triggers retry them. The timeout bounds each network attempt; multiple pending entries can still delay a queued synchronization attempt. SecureStore write failures still fail the synchronization attempt rather than intentionally discard cleanup state.

## Concurrent token registration must have one owner

The previous sequence read a User, removed a token from other users, and saved the stale User array. Different processes could both finish that sequence, or one request could restore another token removed after its initial read.

**Changed files:**

- `server/routes/users.js`: POST delegates to `claimPushToken`, responds only after transaction commit, and logs only a safe error classification. Failed ownership updates return retryable 503 (404 for a vanished user). The previous account-scoped atomic DELETE remains unchanged by this follow-up.
- New `server/services/pushTokenOwnership.js`: create/find the token guard, write it inside a MongoDB transaction, read the current owner data inside that transaction, remove the token from all modern and legacy locations, and append only the new entry to the recipient array. It never calls `User.save()` or replaces a previously read token array. Existing creation time is preserved for the same account. Mongoose's transaction callback retries write conflicts using a fresh snapshot. Removal and assignment commit together or roll back together.
- New `server/models/PushTokenGuard.js`: the built-in unique `_id` is a SHA-256 token hash. Incrementing its revision makes concurrent requests for the same installation conflict even when neither user previously owned that token. This coordinates different backend processes; it is not an in-memory lock. The guard stores no raw token, user ID, or credential.
- New `server/tests/push-token-ownership.test.js`: real disposable Mongo replica set and two independent backend processes. It covers simultaneous first claims, repeated requests, old modern/legacy duplicates, a new token for A while B takes A's old token, retained other installations, late A DELETE, rollback after an injected append failure, and the real middleware's 403 payloads.
- `server/tests/launch-routes.test.js`: the existing route integration fixture now uses a disposable replica set so it exercises the actual transactional POST.

The ownership test also deterministically pauses A after reading its old token list, lets B commit the transfer, then resumes A. It verifies a transaction retry occurred and A cannot restore B's token. Existing duplicates for a token are reconciled when that token registers; there was no bulk migration of other stored tokens.

## Validation

Mobile root (`C:\projects\rombuzz-mobile`):

```powershell
node --test scripts/launch-fixes/push.test.cjs
node --test scripts/auth-tests/session.test.cjs scripts/launch-fixes/session-consent-chat.test.cjs
npx tsc --noEmit
git -c core.safecrlf=false diff --check
```

- Push suite: **15 tests/subtests passed** (7 top-level cases).
- Existing auth/session and launch race/consent/chat/call checks: **21 passed**.
- TypeScript: **passed**.
- Diff whitespace check: **passed**.
- The renderer deprecation warning and Node's experimental mock-timer warning are test-tool warnings. The simulated POST failure warning is expected in its failure-path test.

Backend server root (`C:\projects\rombuzz\Rombuzz_main\server`):

```powershell
node --test tests/push-token-ownership.test.js tests/launch-routes.test.js tests/launch-push.test.js
node --test tests/push-token-ownership.test.js
npm run check
```

- Five existing push-service tests and the route integration test passed.
- Final ownership test passed with all **5 subcases** (6 tests including its parent). The second command includes the added deterministic paused-snapshot regression. **12 distinct backend tests/subtests pass across the final runs.**
- Syntax check: **202 JavaScript files passed**.
- Backend root `git -c core.safecrlf=false diff --check`: **passed**.
- Databases, users, tokens and backend processes in these tests are disposable local fixtures. No real Expo push or deployed service was used.

## Remaining limitations and deployment requirements

1. The POST now requires transaction-capable MongoDB: a replica set or supported sharded deployment. Standalone MongoDB cannot perform this transfer and the endpoint fails closed with 503 instead of falling back to unsafe writes. Production topology/permissions were not inspected. Verify them before deploying. [MongoDB transaction availability](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/)
2. All token-registering backend instances must use the new path. An old process or direct database writer replacing `pushTokens` can bypass the guard. Avoid mixed old/new token writers during rollout. The client assumes a successful POST provides the new exclusive-ownership guarantee, so update the backend first.
3. Guard records persist, one hashed record per observed token, with the default unique `_id` index. No TTL or new cleanup job was added, and they must not be deleted while registrations are active. Storage growth/retention should be reviewed operationally. The collection needs normal database create/read/write permissions.
4. Terminal old-account rejection retires that unusable local credential, not the remote token. If there is no successful claim of the same token (for example a different rotated token, or registration disabled/denied for the new account), an old server entry may remain until account cleanup or invalid-token receipt pruning. Authentication was not bypassed: cleanup uses the captured original credential and can remove only that credential's account entry.
5. In-flight/provider-queued pushes cannot be recalled. Network timeout is not proof the server cancelled an already-running transaction; pending current-owner records still drive later reconciliation. Physical device delivery, Firebase/EAS credentials and prior manual acceptance items remain unverified.

The earlier launch handoff's diff stats are its initial snapshot. This follow-up additionally changes the files above and adds this document; it does not alter unrelated launch fixes or the Pass 2 backlog.

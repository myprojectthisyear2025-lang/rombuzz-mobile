<!-- Path: docs/performance/validation.md; Purpose: Actual checks, regression results, overhead and unverified runtime boundaries. -->
# Validation results

| Check | Result | Scope |
|---|---|---|
| Backend `npm run check` | Passed, 182 JavaScript files | Latest backend including all five performance modules |
| Backend `PERF_DIAGNOSTICS=true; npm test` | Passed, 38 tests | Disposable Mongo integration, HTTP/Socket.IO, migration parity, paid-media atomicity, reconnect/restart, idempotent registration |
| Mobile + instrumentation test command below | Passed, 68 tests | 43 existing chat tests, 17 existing settings tests, 8 diagnostic tests |
| TypeScript `tsc --noEmit --pretty false` | Passed | Entire mobile project |
| Focused ESLint on new diagnostic modules/scripts | Passed, 0 errors / 0 warnings | `src/performance/diagnostics`, `scripts/performance` |
| Full mobile ESLint | Not clean: 3 errors / 168 warnings | The 3 errors were reproduced by linting untouched HEAD text; see below |
| Expo Android export, diagnostics enabled and release opt-in | Passed | 3,078 modules, approximately 10.2 MB Hermes bundle; no installed/native test |
| Expo Android export, default diagnostics flags | Passed | Same module count; validates default bundle path |
| Backend startup and real endpoint smoke | Passed | All 272 measured API requests and 280 A/B trial requests returned 200 |
| Device-fixture preparation smoke | Passed | Two synthetic accounts completed normal email/password login, status ok and profileComplete true |
| Evidence integrity | Passed | 272 request-ID joins, no missing trace, 0 dropped spans, timing/header boundaries consistent |
| Git diff whitespace check | Passed in both repositories | No whitespace errors |

Diagnostic tests verify concurrent request isolation, unique server IDs, overlapping interval union, JSON/status/error preservation, validation middleware behavior, redaction of credentials/query/account values, disabled response/fetch identity, one-time fetch installation, bounded event capture, duplicate GET detection, and optional API-origin handling. They do not substitute for an actual native media/React Profiler capture or a Sentry-ingestion check.

Commands used from the mobile root:

```powershell
node --test scripts/performance/instrumentation.test.cjs scripts/performance/mobile-diagnostics.test.cjs scripts/chat-tests/*.test.cjs scripts/settings-tests/*.test.cjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
node node_modules/eslint/bin/eslint.js . --format json --output-file .perf-work/lint-final.json
node node_modules/eslint/bin/eslint.js src/performance/diagnostics scripts/performance
node node_modules/expo/bin/cli export --platform android --output-dir .perf-work/export-final --max-workers 2
node scripts/performance/verify-evidence.cjs
```

The diagnostic export additionally used EXPO_PUBLIC_PERF_DIAGNOSTICS=true and EXPO_PUBLIC_PERF_ALLOW_RELEASE=true. The local fixture smoke used PERF_DEVICE_SMOKE=true with `local-device-server.cjs`; its result is preserved in [device-fixture-smoke.json](evidence/device-fixture-smoke.json).

## Existing lint failures

`react/no-unescaped-entities` reports one literal apostrophe each in LetsBuzz, MicroBuzz and Notifications JSX. Their untouched HEAD counterparts reproduce the same rule violations at lines 286, 1883 and 1082 respectively. Current instrumentation shifts line numbers. These UI text lines were not changed to make an unrelated lint cleanup part of this audit. Full-project warnings also include existing hook dependency/import warnings; new diagnostic files and scripts have none.

## Overhead and behavior limits

The interleaved A/B retained 60 samples per mode per route, alternating which backend was called first. Diagnostic mode samples all requests and serializes detailed logs; disabled mode installs no Express/Mongoose wrappers and returns no diagnostic headers. Median overhead observations were +0.10 ms for health and +0.56 ms for profile/full. Tails vary with local process scheduling; this is not a load-test or a native-phone overhead guarantee. Raw trials are preserved, not just the favorable medians. Disabled screen instrumentation also adds no focus subscriptions or React effects, verified by a dedicated regression test.

Request spans stop at response headers. Existing request-triggered asynchronous unread/call work can still use the event loop after response; it is intentionally not billed to that response. Scheduled backend jobs are disabled by the synthetic harness's existing DISABLE_BACKGROUND_JOBS option, so scheduled production-job contention is not represented. The synthetic example.test media references also do not exercise real R2 object signing or Stream playback resolution. Concurrent production traffic, cold starts, pool pressure, Atlas network, native decoding and Sentry's enabled overhead were not exercised.

No physical Android/iOS device was attached (`adb devices -l` returned no devices). No native Gradle/Xcode build, installed-app UI test, Sentry ingestion, real media/CDN request, push delivery, production explain, Atlas access, regional test or Agora session ran. Those remain explicit capture steps rather than claimed passes.

No deployment or git commit was made. The original unrelated untracked mobile audit and backend `astra-mongodb-audit/` directory remain untouched. No migration, matching, cache, realtime, auth, response schema, media source selection or navigation behavior was intentionally changed.

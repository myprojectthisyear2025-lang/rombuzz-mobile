<!-- Path: docs/performance/capture.md; Purpose: Reproducible local, native-device, media and actual-region measurement procedures. -->
# Repeatable capture procedure

Run commands from `C:/projects/rombuzz-mobile` unless stated otherwise. These scripts use the current backend at `C:/projects/rombuzz/Rombuzz_main/server`; set PERF_BACKEND_ROOT if that checkout is elsewhere. They require the already installed backend test dependencies, Node 22 and MongoDB Memory Server's downloaded executable. The first run may need to download that executable. No script selects Atlas or reads a production Mongo URI.

## Reproduce the local baseline

```powershell
node scripts/performance/local-baseline.cjs
node scripts/performance/report.cjs
node scripts/performance/asset-metadata.cjs
```

Close builds/tests before timing. The runner starts a disposable Mongo replica set and latest backend with synthetic credentials, issues 16 serial requests per read flow, then chat/call actions and enabled/disabled overhead trials. It shuts down both processes in finally. No production services, media URLs, messages or accounts are used. Rerunning replaces generated evidence/reports; copy a run into a dated evidence folder first if comparing results. Handwritten summary/findings refer to the stated capture date and need review after a rerun. Record code diff, machine, process load, dataset and build mode with each comparison.

## Prepare a local Android capture

1. Use an isolated diagnostic checkout/build. Keep all these instrumentation changes in it. Use the existing development app variant so real installed-app storage is separate. A native development build is required for this app's native modules; the JS export check is not an installed APK.
2. Start `node scripts/performance/local-device-server.cjs` in one terminal. It prints the local backend port and the exact `adb reverse tcp:4000 tcp:<port>` command. Run that command with your device attached; confirm `adb devices -l` lists it. Keep the fixture process running. Ctrl+C shuts it down. Its HTTP traces print as `[PERF]` JSON once per second in batches.
3. In that isolated checkout only, set the **existing** `USE_LOCAL` constant to true in `src/config/api.tsx`. It already selects localhost:4000 for both API and Socket.IO. This audit left that constant unchanged. Do not point the synthetic fixture at production. Record this test-only configuration and restore it after capture.
4. Set the following shell values before starting Metro; gifts use an origin without `/api`. A single space disables the existing trimmed Sentry DSN without dotenv substituting a live one. Do not use uploads, push, purchases or external RTC sessions in this local fixture.

```powershell
$env:APP_VARIANT='development'
$env:EXPO_PUBLIC_PERF_DIAGNOSTICS='true'
$env:EXPO_PUBLIC_API_BASE_URL='http://localhost:4000'
$env:EXPO_PUBLIC_API_URL='http://localhost:4000'
$env:EXPO_PUBLIC_SENTRY_DSN=' '
npx expo start --dev-client --clear
```

5. Open the installed development client. If no development binary exists, build the existing development variant using the repository's normal native build process first. Local HTTP must be allowed by that diagnostic binary; if its network policy rejects it, use a trusted local HTTPS test endpoint and update only the isolated test configuration. No native network-policy change was made by this audit.
6. Log in normally as `perf0@example.test` or `perf1@example.test`, password `RomBuzzPerf-local-2026!`. These are disposable accounts created only by this script. Their normal email/password login and complete-profile status were smoke-tested; no real device login was performed. No auth bypass was added.
7. The fixture's geographic data is near 0,0. For an Android emulator use `adb emu geo fix 0 0`; on a phone, prepare a dedicated synthetic dataset appropriate to its location/filters. Record empty states honestly. All fixture media URLs are intentionally unresolved example.test references, so this fixture alone cannot benchmark successful media display.

On iOS, run an equivalent development build on macOS. Simulator localhost can use the fixture host; a physical iPhone requires a reachable trusted test endpoint. No iOS compile or device run occurred here.

## Capture a flow

Record device model, OS, refresh rate, native/JS engine version, app commit+diff, build variant, diagnostics flags, backend build, fixture size, network type and region. Use synthetic accounts only.

In React Native DevTools, clear only the diagnostic records before a flow:

```javascript
globalThis.__RBZ_PERF__.clear()
```

Tap through the actual UI, wait for the intended useful content and primary media, then export:

```javascript
JSON.stringify(globalThis.__RBZ_PERF__.snapshot())
// Or emit one bounded JSON line for manual log collection:
globalThis.__RBZ_PERF__.flush()
```

Save the JSON as `.perf-work/discover-warm-01.json`. Generate a readable chronological table:

```powershell
node scripts/performance/mobile-report.cjs .perf-work/discover-warm-01.json > .perf-work/discover-warm-01.md
```

Join each HTTP event's `serverRequest` to the backend record's `requestId`. Keep client and server monotonic clocks separate: compare durations, not raw timestamps. Select **one request/visit** for a waterfall. Never construct a supposed 1,240 ms request by adding medians from different runs or overlapping parent/child spans. Cache/memory hits may render before the API finishes; render and media can overlap other work.

Capture at least 20 cold-cache and 20 warm-cache visits per important flow, plus first process launch separately. Clear only the dedicated synthetic build's data when creating a cold-storage condition; reauthenticate before navigation tests. Record whether image/native cache was cold independently of application-data cache. Keep development Profiler runs separate from profiling-capable release runs. If React's release build does not emit Profiler events, report render timing unavailable and use native/JS profiling tools instead. Release diagnostics require EXPO_PUBLIC_PERF_ALLOW_RELEASE=true and a rebuild.

Use an Android System Trace/Perfetto recording or iOS Instruments plus screen recording to verify the frame where meaningful content and the primary image/video become visible. JS image onLoad, video ready-for-display and double-RAF are supporting milestones, not exact pixel proof. Define useful content per flow before comparing: first Discover card, inbox rows, chat messages, profile hero, first playable reel. Report successful content, empty and error states separately.

Repeat this route sequence with warm storage: Home -> Discover -> profile -> back -> Posts -> Reels -> Social Stats -> Notifications -> Matches/inbox -> chat -> history -> send -> shared media -> purchased media -> own profile/gallery -> gifts. Run MicroBuzz and call setup as separate controlled sessions. Also navigate quickly between Home/inbox/notifications to inspect startup and badge overlap. Check dropped event/span counts before accepting a capture.

For duplicate requests, inspect identical-URL GET pairs, overlap, response IDs and state usage. Semantically equivalent URL aliases need manual comparison. Determine whether both responses serve distinct freshness requirements before calling them unnecessary. For sockets, compare liveConnections/listener counts across repeated mount/unmount and reconnect cycles; normal connection and business listeners must remain unchanged.

## Media capture

Prepare owned synthetic fixtures for avatar, Discover/profile hero, gallery photo, post photo, reel thumbnail/video, chat/shared/purchased media and gift asset. Record original dimensions, encoded size and expected display dimensions. Do not use private user media or share signed URLs in reports. For each item capture cold and warm native loads and the actual visible frame, independently of API response.

For HTTP delivery/headers only, supply one fixture URL locally and run:

```powershell
$env:PERF_MEDIA_URL=Read-Host 'Owned synthetic HTTPS media URL (kept out of output)'
node scripts/performance/media-probe.cjs > .perf-work/media-delivery.json
Remove-Item Env:PERF_MEDIA_URL
```

The probe records safe header fields, delivered bytes, status and duration; it never saves body/URL. It stops after 8 MiB and marks truncation. A truncated video transfer is not a full-download time or first-frame time. Compare Cache-Control, Age, CF-Cache-Status, content type/length and native cold/warm behavior. Use a device network trace to distinguish repeated mounts from actual duplicate downloads, and inspect thumbnails/preload requests without exposing URL signatures. No CDN or native media result was collected during this audit.

## Actual-region API tests

Use the same migration-validated staging backend/build, route and synthetic account/data from machines **physically running** in each target region. Do not relabel a local test with a region name. Record provider/host region or device location, timestamp and network type as provenance. Nepal requires an actual Nepal machine/device; India is not a Nepal measurement. VPN traffic is a separate scenario, not a substitute for verified origin location.

| Required location | PERF_REGION value | Current result |
|---|---|---|
| US | US | Unavailable |
| India | India | Unavailable |
| Singapore | Singapore | Unavailable |
| Japan | Japan | Unavailable |
| South Korea | South-Korea | Unavailable |
| Nepal | Nepal | Unavailable |

Run on each regional host (PowerShell example; equivalent environment variables work in other shells):

```powershell
$env:PERF_REGION='India' # Only on the actual India host
$env:PERF_API_ORIGIN='https://YOUR-STAGING-HOST'
$env:PERF_PROBE_PATH='/api/discover?lat=0&lng=0'
$env:PERF_SAMPLES='30'
$credential=Read-Host 'Synthetic staging bearer token' -AsSecureString
$env:PERF_TEST_TOKEN=[System.Net.NetworkCredential]::new('', $credential).Password
node scripts/performance/regional-probe.cjs > regional-discover.jsonl
Remove-Item Env:PERF_TEST_TOKEN
```

Enable backend diagnostics only for the bounded staging window so Server-Timing is present; sample 100% for this small controlled run, then restore the prior setting/restart. The probe is serial, maximum 100 requests with a 500 ms pause. Repeat for profile, unread, notifications, paginated/full room and catalog. These are real authenticated routes and can have existing read-side effects; use only test accounts.

Each record reports DNS/connect/TLS socket-event intervals when available, reusedSocket, HTTP-to-headers/body, backend total and approximate non-server-to-headers time. Reused sockets report unavailable phases as null, not zero. Native fetch cannot expose these exact phases. Compare initial and reused connections separately; report p50/p95 and sample sizes for each region and route. Run more than one time window to distinguish regional differences from transient load/cold starts. Do not infer Render versus Atlas responsibility from a large transport remainder alone.

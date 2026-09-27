# Fix #8 — Gifts transport failure investigation

Status: **investigated, unresolved**. No production source change and no claim that the device failure is fixed. This checkpoint records the trace and regression fixtures, not a completed repair. The remaining investigation requires the failing installed build's actual origin and native network failure detail; physical testing remains deferred. Independent Fix #9 work can continue.

## Evidence and exact current path

The measured device captures showed fast wallet/catalog failures with `Network request failed`, while some gift artwork remained visible. `GiftPicker` loads `useGiftCatalog(visible)` and `useBuzzCoinWallet(visible)`. Both call `src/api/gifts.ts`; frontend artwork comes separately from the bundled catalog/Cloudinary metadata and can remain visible when either API read fails.

The gift API chooses `EXPO_PUBLIC_API_BASE_URL`, then `EXPO_PUBLIC_API_URL`, then `https://rombuzz-api-ulyk.onrender.com`. It appends `/api/gifts/catalog`, `/wallet`, `/ledger`, `/summary`, `/transactions` or `/send`. Shared app configuration instead includes `/api` in its API base. Neither override is present in this checkout's `.env` or process; `eas.json` does not declare either override. Therefore the defaults currently construct the same correct production HTTPS endpoints. A different remote build environment remains possible, but is **not demonstrated**. An override already ending in `/api` would produce a double prefix; that normally yields an HTTP route error and does not by itself establish this native transport failure.

Auth is a SecureStore `RBZ_TOKEN` read per call and an `Authorization: Bearer ...` header. Missing auth throws a distinct logged-in error before fetch. The response is read as text and parsed as JSON when possible; non-2xx errors retain status, code and payload. Native fetch rejection propagates directly. No retry occurs, including on gift sends with uncertain completion. The backend remains the authority for gift prices; the client sends gift identity/context, not a trusted price.

Backend `server/index.js` mounts `server/routes/gifts.js` at `/api/gifts`. Catalog is authenticated static enabled catalog data; wallet authenticates then calls the wallet service. Wallet lookup can create a missing wallet. No authenticated production probe was attempted and no production data was touched. There is no source evidence blaming Mongo, Render, R2 or Cloudinary for the transport rejection. Browser CORS is not established as relevant to the native-device failure.

## Read-only checks

On 2026-09-26, unauthenticated GETs from this workstation to the configured production `/api/gifts/catalog` and `/api/gifts/wallet` returned JSON HTTP **401** in **346 ms** and **256 ms**, respectively. These establish present workstation DNS/TLS/HTTP/auth-route reachability only, not successful authenticated Gifts behavior or historical device connectivity. No response contents or credentials were recorded. A read-only EAS production environment query, restricted in output to these two public API URLs, timed out. No installed APK/AAB or original native error trace was available locally.

## BEFORE → AFTER

Runtime behavior is unchanged. Before, the measured failure had no complete source trace; after, URL construction, auth, routing, parsing and write behavior are documented and covered by four focused client tests. Consolidating API configuration or changing auth without reproducing the actual failing path would be speculative, contrary to the request. The wallet hook's uncaught automatic-load rejection is a separate observed source concern, not proven to cause the transport failure; it is not silently relabeled as the fix.

## Changed files and validation

- `scripts/performance-fixes/gifts.test.cjs`: actual client tests for routes/auth, missing credentials, HTTP-versus-transport errors, and no retries/server-owned pricing for sends.
- `docs/performance-fix-8-gifts.md`: this report.

Validation: all four focused Gifts tests passed; TypeScript `--noEmit` passed; the new test has zero ESLint errors/warnings against the existing baseline; `git diff --check` passed. Node test workers required execution outside the sandbox after `spawn EPERM`. Backend source is unchanged; no backend deployment is required for this investigation.

## Deferred acceptance

During the single final device pass, capture the installed build's sanitized Gifts origin/path and native transport error (DNS/TLS/connectivity/timeout), alongside a working app API request. Do not record tokens, query credentials or private response content. Verify catalog, wallet and all supported gift placements, insufficient funds, updated balance and one transaction per send. Do not automatically retry a failed POST with uncertain outcome. Compare production build environment values if available; do not modify production configuration as part of this work. The reported production failure remains open until its actual cause is reproduced and repaired.

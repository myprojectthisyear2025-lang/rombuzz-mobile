# Post-device smoke cleanup

Scope: the five issues reported from the production-account Galaxy S22 Ultra recording. Starting mobile `3946e07`, backend `96f34d4` (both matched their local origin/main refs). No repeat performance audit, production changes, push or deployment. The unrelated untracked audit files are excluded.

## 1. Discover refresh presentation and image continuity

Observed: usable cached card accompanied by a roughly 20-second refresh pill; a brief blank during reconciliation.

Trace: `quietRefreshing` explicitly rendered the pill during cached and fresh-GPS work. Same-filter requests did **not** intentionally clear the deck, change its key, or reset its index. However, `keepVisibleCardStable` returned fresh objects verbatim, so renewed R2 signatures changed the native image source even for the same asset (including compact-cache media without IDs). A selected photo could also address an absent index after a shorter fresh gallery. Invalid response bodies were converted to an authoritative empty deck. Cache hydration updated the live users reference only in a later effect.

Before → after: no refresh pill/state/styles; valid cached signed URLs survive signature-only renewal while fresh metadata/privacy wins. Expired URLs and changed assets still update. Cache/live refs and a validated fresh deck publish together, with selected photo retained or clamped when removed. Malformed responses and network failures retain usable content. Real filter changes still clear incompatible cards into neutral loading; genuine validated empty results still represent exhaustion. Request dedupe/cancellation, sequential changed-coordinate GPS, strict/expanded behavior, prefetch ownership and swipe/navigation architecture remain.

Files: `app/(tabs)/discover.tsx`, `src/features/discover/reconcileDiscoverDeck.ts`, `src/features/discover/discoverScreen.styles.ts`, `scripts/performance-fixes/discover-smoke.test.cjs`, `scripts/performance-fixes/screenHarness.cjs`, `scripts/performance-fixes/harness.cjs`, this document.

Validation: actual screen render tests check retained image instance and selected URI, no empty deck commits through delayed cache/network/GPS, no refresh UI, malformed response retention, filter isolation and aborted/late requests. Existing request-owner, GPS deadline, account/filter cache and prefetch tests pass. Native image decoding/frame timing still requires the device; source-level causes are reproduced in regression fixtures, not claimed as a measured device trace.

Checkpoint: `fix: keep Discover refresh invisible and preserve card media` (hash recorded in the next checkpoint).

## Remaining work in this batch

Pinned retrieval; Preview request states; unknown profile gallery counts; Shared Media video previews; final complete validation and checkpoint inventory.

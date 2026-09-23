<!-- Path: docs/performance/files.md; Purpose: Exact audit file inventory for both current repositories. -->
# Files added and modified

All paths are relative to their respective git root. Backend files have the server/ prefix. All new handwritten source files are below 200 lines and carry a path/purpose header. Large JSON files and the interactive waterfall are generated evidence. [sources.json](evidence/sources.json) records final code fingerprints and base commits. No files were committed or deployed.

## Mobile: added (38)

- `docs/performance/README.md`
- `docs/performance/architecture.md`
- `docs/performance/baseline.md`
- `docs/performance/capture.md`
- `docs/performance/evidence/assets.json`
- `docs/performance/evidence/device-fixture-smoke.json`
- `docs/performance/evidence/local-baseline.json`
- `docs/performance/evidence/sources.json`
- `docs/performance/evidence/summary.json`
- `docs/performance/files.md`
- `docs/performance/findings.md`
- `docs/performance/flow-map.md`
- `docs/performance/operations.md`
- `docs/performance/screen-baseline.md`
- `docs/performance/validation.md`
- `docs/performance/waterfall.html`
- `docs/performance/waterfalls.md`
- `scripts/performance/actions.cjs`
- `scripts/performance/asset-metadata.cjs`
- `scripts/performance/instrumentation.test.cjs`
- `scripts/performance/local-baseline.cjs`
- `scripts/performance/local-device-server.cjs`
- `scripts/performance/local-harness.cjs`
- `scripts/performance/media-probe.cjs`
- `scripts/performance/mobile-diagnostics.test.cjs`
- `scripts/performance/mobile-report.cjs`
- `scripts/performance/no-env.cjs`
- `scripts/performance/overhead.cjs`
- `scripts/performance/regional-probe.cjs`
- `scripts/performance/report.cjs`
- `scripts/performance/seed.cjs`
- `scripts/performance/verify-evidence.cjs`
- `src/performance/diagnostics/cache.ts`
- `src/performance/diagnostics/core.ts`
- `src/performance/diagnostics/media.tsx`
- `src/performance/diagnostics/network.ts`
- `src/performance/diagnostics/screens.tsx`
- `src/performance/diagnostics/socket.ts`

## Mobile: modified (43)

- `.gitignore`
- `app/(tabs)/(root)/chat.tsx`
- `app/(tabs)/(root)/homepage.tsx`
- `app/(tabs)/(root)/letsbuzz.tsx`
- `app/(tabs)/(root)/profile.tsx`
- `app/(tabs)/(root)/social-stats.tsx`
- `app/(tabs)/discover.tsx`
- `app/(tabs)/microbuzz.tsx`
- `app/(tabs)/notifications.tsx`
- `app/(tabs)/view-profile.tsx`
- `app/_layout.tsx`
- `app/chat/purchased-media/[peerId].tsx`
- `app/chat/shared-media/[peerId].tsx`
- `eslint.config.js`
- `src/components/gifts/GiftCard.tsx`
- `src/components/gifts/GiftPicker.tsx`
- `src/components/letsbuzz/LetsBuzzPosts.tsx`
- `src/components/letsbuzz/LetsBuzzReels.tsx`
- `src/components/media/RBZVideoViewer.tsx`
- `src/components/profile/Gallery/PhotoGrid.tsx`
- `src/components/profile/Gallery/ReelGrid.tsx`
- `src/components/profile/ViewProfileGallery.tsx`
- `src/features/chat/list/useChatListActions.ts`
- `src/features/chat/list/useChatListInbox.ts`
- `src/features/chat/thread/rbzChatThreadCache.ts`
- `src/features/chat/thread/useChatThreadFastOpen.ts`
- `src/features/chat/window/ChatWindowScreen.tsx`
- `src/features/chat/window/components/ChatMediaBubble.tsx`
- `src/features/chat/window/hooks/useChatTextSender.ts`
- `src/features/discoverProfile/DiscoverProfileHero.tsx`
- `src/features/discoverProfile/DiscoverProfileScreen.tsx`
- `src/features/home/HomeDashboard.tsx`
- `src/features/performance/letsbuzz/rbzLetsBuzzFeedCache.ts`
- `src/features/performance/useCachedDiscoverDeck.ts`
- `src/features/profile/ProfilePhotoHero.tsx`
- `src/features/socialStats/useSocialStatsData.ts`
- `src/features/socialStats/useSocialStatsListActions.ts`
- `src/features/viewProfile/hero/ViewProfileHero.tsx`
- `src/hooks/gifts/useGiftCatalog.ts`
- `src/lib/socket.ts`
- `src/navigation/RootBottomBar.tsx`
- `src/performance/api/rbzApiClient.ts`
- `src/performance/cache/rbzCache.ts`

## Backend: added (5)

- `server/performance/context.js`
- `server/performance/express.js`
- `server/performance/http.js`
- `server/performance/mongo.js`
- `server/performance/runtime.js`

## Backend: modified (4)

- `server/config/cors.js`
- `server/config/db.js`
- `server/index.js`
- `server/routes/discover.js`

## Scope of edits

Backend changes are middleware registration, conditional timing-header exposure and driver monitoring, plus two Discover logic spans. Mobile edits insert diagnostic calls/wrappers at existing navigation, state, cache, image/video and socket boundaries. The original native components, query/response logic and function arguments are retained. The gitignore/lint changes exclude only temporary local audit/build artifacts.

The pre-existing untracked docs/performance-audit-2026-09-19.md and backend astra-mongodb-audit/ are outside this inventory and were untouched. .perf-work contains ignored staging, source snapshots and bundle output; it is not required for the shipped instrumentation or repeatable baseline scripts.

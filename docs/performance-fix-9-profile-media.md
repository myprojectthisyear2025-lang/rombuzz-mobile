# Fix #9 — Remaining profile/media cleanup

Status: source-proven lifecycle and signed URL renewal fixes implemented. **The two specific failing production Cloudinary assets remain unverified/unresolved**: their URLs and native error details are not in the supplied captures or local workspace. No asset deletion, replacement or guessed URL transformation was performed. This report does not label an R2 signature bug as the cause of those Cloudinary failures.

## Measured scope and traced causes

Own Profile (~618 ms fresh) and matched View Profile (~337 ms fresh; useful cache ~120–280 ms) did not justify a screen rewrite. Fix #2's own Profile screen, retained state and activity implementation remain unchanged.

- `GalleryVideoViewer` rendered `ActiveVideoItem` for every mounted video row. Each row resolved missing Stream playback even when it was not selected; paused neighbouring native players still loaded media. Selection used row index alone, with no screen-focus/AppState guard. Progress/auto-advance callbacks could run after leaving the screen. A second delayed auto-scroll duplicated the parent index effect.
- `GalleryPhotoViewer` mounted paused native video players on adjacent mixed-media pages even while the selected page was a photo.
- The shared `RBZVideoViewer` (used by matched View Profile and media hubs) mounted a player for every rendered page. Its playback and controls timer used modal visibility alone. App background/route blur did not release players. The initial animation-frame scroll lacked cleanup.
- `mergeStableViewProfile` preserved the old URL whenever the path matched, without examining expiration or changed query semantics. An expired cached R2 URL therefore survived a successful fresh profile response indefinitely; a changed Cloudinary query was also discarded. A synthetic expired-signature fixture reproduces the merge bug. Gallery normalization already deduplicates Stream/R2 identity and URLs; View Profile already avoids merging derived photos/reels back into media. Those working paths were retained.

## BEFORE → AFTER

Gallery pages/selection remain mounted for navigation. Only the selected foreground video loads a native player or resolves Stream playback. Blur, background and unmount abort resolution, discard obsolete results and release native players. Paused state and playback position are retained across background; switching rows retains the existing reset-to-start behavior in the own gallery. The existing index effect handles auto-advance and owns its cancellable scroll callback. Photo paging uses a supplied video poster or empty adjacent page until selection switches to the video viewer.

The shared viewer retains page state and a playback snapshot, but mounts only its selected foreground player. It restores position/paused state when returning, preserves playback intent during buffering, cleans controls timers and animation frames, and rejects callbacks from retired player generations. Existing diagnostic video instrumentation stays attached to actual native loads. Fullscreen gestures, mute/seek/retry controls and action footers are retained; native behavior still needs the deferred device pass.

Fresh profile merges preserve a same-resource R2 URL only while its AWS signature is known valid for at least another minute and non-signature query parameters match. Expired/unknown signatures and changed transformations use the fresh URL. Unchanged Cloudinary URLs remain unchanged. This is renewal on an existing fresh response, not a polling/retry loop or a new backend request. Stable usable URLs still avoid duplicate loads on cache refresh.

## Every changed file

- `src/features/profile/gallery/useGalleryVideoSource.ts`: selected/foreground-only Stream resolver, abort and response identity guards.
- `src/components/profile/Gallery/GalleryVideoViewer.tsx`: focus/AppState integration, player release, saved background position, stable native ref, obsolete callback guards, removal of duplicate auto-scroll timer.
- `src/components/profile/Gallery/GalleryPhotoViewer.tsx`: poster placeholders instead of off-page paused video players.
- `src/components/media/ActiveViewerVideo.tsx`: retained playback snapshot around an active-only instrumented native player; retired-generation guards.
- `src/components/media/RBZVideoViewer.tsx`: use accepted activity helper; selected foreground player, timer/frame cleanup, retained modal/page state.
- `src/features/performance/viewProfile/preserveMediaUrl.ts`: expiration-aware URL reuse.
- `src/features/performance/viewProfile/rbzViewProfileCache.ts`: use the URL policy in existing cache merge.
- `scripts/performance-fixes/profile-media.test.cjs`: six actual helper/component regression tests, including native-player mount counts, late responses/callbacks, auto-advance, position/paused restore, mixed pages and expired URL recovery.
- `docs/performance-fix-9-profile-media.md`: this report.

No backend source, API contract, navigation architecture, production configuration or `USE_LOCAL` change.

## Validation and limits

Validation: six focused tests passed, TypeScript `--noEmit` passed and `git diff --check` passed. Scoped ESLint comparison: zero errors, five existing warnings reduced to three, no introduced diagnostics. The focused tests also caught and verified cleanup of a pending animation-frame scroll on background. Component tests mock native players and do not prove Android decoder timing, network cancellation inside the native player, picture quality, gesture behavior or measured device speed. React test renderer emits its existing deprecation notice.

Deferred device acceptance: repeat own Profile and matched View Profile from Social and Chat, compare cache/fresh timings, open photo/reel viewers, swipe old/new media, zoom/seek/mute/pause, background and navigate away for several minutes. Expect no hidden viewer playback/progress/ready-for-display work after cleanup, correct paused position on return, unchanged permissions/gift/comment/actions and no duplicate off-page player loads. Verify fresh profile refresh repairs expired signed links without reloading still-valid ones. Identify the two failed Cloudinary resource paths and actual HTTP/native errors before attempting their repair; unchanged unavailable assets are not repaired by this patch. Original full-resolution transfer bytes and absent server thumbnails are not addressed by a broad media infrastructure change.

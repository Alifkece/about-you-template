# Changelog

## Milestone 1 — Port Existing Experience
Ported the original vanilla HTML/CSS/JS cinematic experience (`index.html`,
`app.js`, `style.css`, `lyrics_data.js`) into a data-driven Next.js
component (`ExperiencePlayer` + `useExperienceEngine`). 100% of the camera,
film-strip, lyric-sync, ambient-color, and audio logic preserved; only
necessary compatibility changes made (explicit `lastSeekPct` declaration,
dropped extension-guessing in favor of exact URLs, effect cleanup for
React mount/unmount). `/demo` added for regression comparison.

## Milestone 2 — Dynamic Route
Added `/[slug]`: Server Component fetch from Firestore by slug-as-doc-ID,
rendering the same `ExperiencePlayer`. Custom `not-found.tsx`/`loading.tsx`.
`/demo` confirmed unaffected.

## Milestone 3 — Firebase Foundation
Firebase app/Firestore/Storage config, typed error taxonomy, image
validation + client-side compression, atomic slug-conflict-safe site
creation (Firestore transaction), parallel asset upload, and security
rules for both Firestore and Storage (public read, create-only writes,
structured for a future auth upgrade).

## Milestone 4 — Dashboard + Live Preview Foundation
Modular dashboard UI (`UploadCard`, `CoverUploader`, `GalleryUploader`,
`SlugInput`, `PreviewPanel`, `GenerateButton`), Tailwind scoped to
`/dashboard` only, live slug availability checking, and a full-screen Live
Preview that renders the real `ExperiencePlayer` fed by local object URLs.

## Milestone 5 — Website Generation
Wired the Dashboard to `generateSite()`: full submit flow with staged
progress (validating → compressing → uploading → saving), a `SuccessScreen`
(Copy Link / Open Website / Generate Another), and error handling that
never clears uploaded state on failure. Added optional progress reporting
to `generateSite`/`uploadSiteAssets` (additive, non-breaking).

## Final Milestone — Production Readiness
- Removed dead code: unused `albumArtWrapper`/`playerCard` refs and the
  never-populated legacy ref fields (`bottomBar`, `timeCurrent`, etc.) in
  `ExperienceRefs` — confirmed unused by the engine, zero behavior change.
- Removed duplicate logic: `canGenerate` was independently re-derived in
  both `Dashboard` and `GenerateButton`; now computed once and passed down.
- Fixed a real perf/correctness issue: `ExperiencePlayer`'s `refs` bundle
  was a new object every render, which — combined with the engine effect's
  dependency array — caused the entire cinematic engine to tear down and
  rebuild on any unrelated re-render (e.g. while typing in the Dashboard).
  Now memoized with `useMemo`.
- Replaced the Milestone 1 placeholder landing page with a real one.
- Full manual review of every route, component, Firebase service, and
  type for consistency (this sandbox has no network access, so an actual
  `npm install`/`next build` still needs to run on your machine — see
  Deployment Checklist).
- Added `README.md`, `PROJECT_SUMMARY.md`, `DEPLOYMENT_CHECKLIST.md`,
  `CHANGELOG.md`, `FILE_SUMMARY.md`.

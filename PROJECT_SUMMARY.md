# Final Project Summary

## What this is

A production-ready Next.js website builder that ports an existing static
cinematic music-video experience ("About You") into a data-driven React
component, then wraps it in a Dashboard that lets anyone generate their own
shareable version at `/theirslug`, backed entirely by Firebase's free tier
and deployed once on Vercel.

## Architecture recap

- **`ExperiencePlayer`** — the ported engine. Receives only a typed
  `SiteData` prop. Never imports Firebase. Used identically by `/demo`
  (bundled assets), `/[slug]` (Firestore, Server Component fetch), and the
  Dashboard's Live Preview (local object URLs).
- **`services/firebase/`** — `firebase.ts` (app init), `firestore.ts`
  (`getSiteBySlug`, `checkSlugAvailable`, `createSiteIfAvailable`),
  `storage.ts` (`uploadSiteAssets`, with real progress via
  `uploadBytesResumable`).
- **`services/site/generateSite.ts`** — orchestrates the full flow:
  validate → compress → upload → atomically create the Firestore doc.
  Nothing is written unless every upload succeeds.
- **`components/dashboard/`** — modular, single-purpose components composed
  by `Dashboard.tsx`, which owns all local state (uploads, slug, generation
  status/progress/result/error).
- **Security rules** — public read; create-only writes with schema/type/size
  validation; update/delete denied in v1; structured with inline comments
  for adding `ownerId`-based auth later without restructuring.

## Known limitations (v1)

1. **No authentication.** Anyone can generate a site; sites are immutable
   once created (by design — this is also what makes "no overwrite on slug
   conflict" enforceable at the rules level, not just in app code).
2. **Fixed audio track.** All generated sites use the same demo song;
   custom audio upload isn't implemented yet (schema and Storage layout
   already support adding it — see Recommendations below).
3. **No custom lyrics editing.** Every site uses the same word-synced
   lyric timing as the original; per-site lyric customization isn't built.
4. **Live Preview is full-screen, not embedded.** A deliberate trade-off
   (approved during Milestone 4/5): the ported camera/scene engine sizes
   itself from the real browser viewport, so a small embedded preview box
   would compute incorrect framing. Full-screen preview guarantees
   pixel-identical behavior to production with zero engine changes.
5. **`/demo` is a public route.** It renders the original 11 bundled assets
   for regression QA and has no security implications (no secrets, no user
   data), but it's a development/QA aid, not an end-user feature — consider
   removing or gating it before a public launch if you don't want it
   discoverable.
6. **Storage security rules validate type/size, not deep content.** A
   determined uploader could still upload an image with misleading content
   (rules can't inspect pixel data) — same limitation as most consumer
   upload tools.
7. **No rate limiting.** Nothing currently stops one visitor from generating
   many sites quickly; free-tier Firestore/Storage quotas are the only
   current backstop.
8. **This sandbox could not run `npm install`/`next build`.** Every
   milestone's code was manually reviewed (import correctness, brace/paren
   balance, type narrowing, dead-code sweeps) but a real build on your
   machine, with network access, is the actual verification step — please
   run it before deploying.

## Recommendations for Version 2

- **Authentication** (e.g. Firebase Auth, anonymous or email-based): add
  `ownerId` to the Firestore schema, flip the commented-out `update`/`delete`
  rules on, and gate the Dashboard so people can edit their own sites later.
- **Custom audio upload**: add an `audioUrl` upload slot to the Dashboard
  (same `UploadCard` pattern, just accepting audio MIME types), store it
  alongside `cover`/`photos` in Firestore.
- **Themes/templates**: add a `theme`/`template` field; parameterize
  `experience.css`'s color values or branch `/[slug]/page.tsx` to a
  different Experience component per template — `ExperiencePlayer`'s
  props-only contract already supports this without engine changes.
- **Analytics/view counter**: increment a counter in `/[slug]/page.tsx` on
  each Server Component render, or move it to an edge function to avoid a
  Firestore write on every single page view.
- **Rate limiting**: add a simple per-IP or per-session cap on generations
  (e.g. via a Vercel Edge Middleware check) before it becomes a real cost
  concern at scale.
- **Weighted upload progress**: `uploadSiteAssets`'s progress is an
  unweighted average across 11 files; weighting by actual file size would
  make the progress bar track reality more precisely for very uneven photo
  sizes.

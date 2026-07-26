# About You — Website Builder

A Next.js app that lets anyone generate their own copy of the "About You"
cinematic music-video experience — a song cover, 10 photos, and a name in,
a shareable `/yourslug` website out — built on Firebase (Firestore +
Storage, both free-tier) and deployed once on Vercel.

## Project overview

The original project was a single static HTML/CSS/JS page: a cinematic,
lyric-synced, camera-panned photo experience for The 1975's "About You."
This app ports that experience, unchanged in look and behavior, into a
data-driven React component (`ExperiencePlayer`), then wraps it in:

- a **Dashboard** where anyone can upload their own cover + 10 photos and
  pick a name,
- a **Live Preview** that renders the exact same component full-screen
  against their in-progress uploads,
- a **Generate** flow that uploads to Firebase Storage and writes a
  Firestore document, and
- a **dynamic route** (`/[slug]`) that serves any generated site.

`ExperiencePlayer` never imports Firebase — it only ever receives a typed
`SiteData` prop (`cover`, `photos[10]`, `audioUrl`, optional `lyrics`),
whether that data comes from Firestore (production), local object URLs
(Live Preview), or the bundled demo assets (`/demo`).

## Folder structure

```
app/
  page.tsx                 → landing page
  demo/page.tsx            → the original 11 demo assets, for regression QA
  dashboard/
    layout.tsx              → imports Tailwind, scoped to this route only
    page.tsx
  [slug]/
    page.tsx                → fetches Firestore doc by slug, renders ExperiencePlayer
    not-found.tsx            → custom "website doesn't exist" page
    loading.tsx
  layout.tsx                → root layout, fonts, metadata

components/
  experience/
    ExperiencePlayer.tsx     → the ported cinematic engine's UI shell
  dashboard/
    Dashboard.tsx            → owns all dashboard state + the generate flow
    CoverUploader.tsx
    GalleryUploader.tsx
    UploadCard.tsx           → reusable single-image upload slot
    SlugInput.tsx
    PreviewPanel.tsx
    GenerateButton.tsx
    SuccessScreen.tsx

hooks/
  useExperienceEngine.ts     → the ported app.js logic, as a React hook
  useSlugAvailability.ts     → debounced live slug check

services/
  firebase/
    firebase.ts              → Firebase app init
    firestore.ts             → getSiteBySlug, checkSlugAvailable, createSiteIfAvailable
    storage.ts               → uploadSiteAssets (with progress)
  site/
    generateSite.ts          → orchestrates validate → compress → upload → save

utils/
  slugify.ts, validateImage.ts, compressImage.ts

types/
  site.ts, dashboard.ts, errors.ts

lib/
  lyrics.ts, defaultSiteData.ts

styles/
  experience.css             → original style.css, copied verbatim
  dashboard-globals.css       → Tailwind directives + dashboard-only signature styles

public/
  images/, media/             → the original 11 demo assets

firestore.rules, storage.rules, firebase.json
```

## Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) (Spark/free plan is enough).
2. Enable **Firestore Database** (production mode; rules below replace the defaults).
3. Enable **Storage**.
4. Register a **Web App** in Project Settings → get your config values.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in the 6 values from your
Firebase web app config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

These are safe to expose in the browser (`NEXT_PUBLIC_*`) — real protection
comes from the security rules below, not from hiding the config.

## Firestore setup

Collection `sites`, **document ID = slug** (not a random ID):

```
sites/{slug}
  slug: string
  cover: string        // Storage download URL
  photos: string[10]   // Storage download URLs, in order
  createdAt: Timestamp
  updatedAt: Timestamp
```

## Storage setup

```
sites/{slug}/cover.webp
sites/{slug}/photos/1.webp ... 10.webp
```

## Security rules

Deploy both rules files with the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # select your project
firebase deploy --only firestore:rules,storage:rules
```

Both `firestore.rules` and `storage.rules`:
- allow public **read** (sites are meant to be shared),
- allow **create** only if the document/object doesn't already exist and
  passes schema/type/size validation (this is what actually prevents slug
  overwrites — not just app-level checks),
- **deny update/delete** entirely for this version (no auth yet, so sites
  are immutable once created),
- include inline comments showing exactly what to change to add
  `ownerId`-based authenticated editing later, without restructuring
  anything.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in your Firebase config
npm run dev
```

Then visit:
- `/` — landing page
- `/demo` — the original 11 assets (regression check against the source site)
- `/dashboard` — build a site
- `/yourslug` — view a generated site

## Production deployment

1. Push this repo to GitHub.
2. Deploy the Firebase rules (see above).
3. Deploy to Vercel (below).
4. Confirm `/dashboard` → generate → `/yourslug` end to end against the
   real project.

## Vercel deployment

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: Next.js (auto-detected).
3. Add the same 6 `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel's
   Project Settings → Environment Variables.
4. Deploy. One Vercel project serves every generated site via `/[slug]` —
   never create a second Vercel project per site.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/[slug]` always 404s | Firestore rules not deployed, or env vars missing | Deploy rules; confirm `.env.local`/Vercel env vars are set |
| Upload fails with a permission error | Storage rules not deployed | `firebase deploy --only storage:rules` |
| Slug shows "taken" for a name you haven't used | Someone else (or a prior test) already created it | Try a different name — this is the no-overwrite rule working correctly |
| Live Preview shows the original demo photos in some slots | Those slots aren't uploaded yet | Expected — empty slots preview with demo assets on purpose |
| `npm run build` fails on `@types/*` fetch | Your environment's registry access, not this code | Retry with normal npm registry access; not a project bug |
| Camera/animation looks different in embedded preview | N/A — Live Preview is intentionally full-screen, never embedded | See Milestone 4/5 design note in the project summary |

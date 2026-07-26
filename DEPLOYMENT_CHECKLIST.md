# Deployment Checklist

## Firebase
- [ ] Create Firebase project (Spark/free plan)
- [ ] Enable Firestore Database
- [ ] Enable Storage
- [ ] Register a Web App, copy the 6 config values
- [ ] `firebase login` / `firebase use --add` (select the project)
- [ ] `firebase deploy --only firestore:rules,storage:rules`
- [ ] Confirm rules deployed successfully (Firebase Console → Firestore/Storage → Rules tab)

## Environment variables
- [ ] `.env.local` created locally from `.env.local.example`, filled in
- [ ] Same 6 `NEXT_PUBLIC_FIREBASE_*` variables added in Vercel → Project Settings → Environment Variables (Production/Preview/Development as needed)

## Local verification (do this before deploying)
- [ ] `npm install` completes with no errors
- [ ] `npm run build` completes with no TypeScript/build errors
- [ ] `npm run dev` → `/demo` looks and behaves identically to the original static site
- [ ] `/dashboard` → upload a name + cover + 10 photos → slug shows "Available"
- [ ] Generate → progress bar moves → Success screen appears
- [ ] Copy Link copies the real URL; Open Website loads `/yourslug` correctly
- [ ] Generate Another fully resets the form
- [ ] Attempt the same name again → confirm "already taken," original site untouched
- [ ] Visit a nonexistent slug → confirm the custom not-found page, not Next's default

## GitHub
- [ ] Repo pushed, `.env.local` NOT committed (already in `.gitignore`)
- [ ] `.env.local.example` IS committed (so collaborators know what's needed)

## Vercel
- [ ] Repo imported at vercel.com/new, Next.js preset auto-detected
- [ ] Environment variables added (see above)
- [ ] First deploy succeeds
- [ ] `/`, `/demo`, `/dashboard`, and a freshly generated `/yourslug` all load correctly on the live URL

## Post-launch decisions
- [ ] Decide whether to keep `/demo` public, gate it, or remove it (see Known Limitations)
- [ ] Decide on a plan for rate-limiting generation if this will see real public traffic

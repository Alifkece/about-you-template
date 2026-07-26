import { getFirestore, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from './firebase';
import { SiteData } from '@/types/site';
import { SlugTakenError, mapFirebaseError, AppError } from '@/types/errors';

const db = getFirestore(firebaseApp);

/**
 * Shape of a `sites/{slug}` Firestore document, per the approved architecture.
 * The doc ID itself IS the slug (see Section 3 of the architecture doc), so
 * there's no separate query — just a direct doc lookup.
 */
interface SiteDocument {
  slug: string;
  cover: string;
  photos: string[];
  audioUrl: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/**
 * Fetches a site's data by slug. Returns null if no such site exists —
 * callers (the [slug] page) turn that into a proper 404 via notFound(),
 * never a thrown error or a generic crash.
 */
export async function getSiteBySlug(slug: string): Promise<SiteData | null> {
  const ref = doc(db, 'sites', slug);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data() as SiteDocument;

  return {
    cover: data.cover,
    photos: data.photos,
    audioUrl: data.audioUrl,
    // Custom per-site lyrics aren't part of the schema yet (Section 3) —
    // ExperiencePlayer/useExperienceEngine already fall back to the default
    // word-synced lyrics when `lyrics` is omitted, so this is a no-op today
    // and becomes a real field the moment lyric editing is added later.
  };
}

/** Quick read for live availability-check UI (Milestone 4). Not race-safe on
 *  its own — the actual create still goes through the transaction below. */
export async function checkSlugAvailable(slug: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'sites', slug));
    return !snap.exists();
  } catch (err) {
    throw mapFirebaseError(err);
  }
}

export interface CreateSitePayload {
  cover: string;
  photos: string[]; // exactly 10 download URLs
}

/**
 * Creates a new `sites/{slug}` document, atomically. Uses a Firestore
 * transaction so two simultaneous "Generate" requests for the same slug
 * can't both succeed (closes the race condition flagged in the architecture
 * risk analysis). If the slug is already taken, existing data is never
 * touched — this throws SlugTakenError instead of overwriting.
 */
export async function createSiteIfAvailable(slug: string, payload: CreateSitePayload): Promise<void> {
  const ref = doc(db, 'sites', slug);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        throw new SlugTakenError(slug);
      }
      tx.set(ref, {
        slug,
        cover: payload.cover,
        photos: payload.photos,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw mapFirebaseError(err);
  }
}

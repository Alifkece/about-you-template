import { getFirestore, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from './firebase';
import { SiteData } from '@/types/site';
import { SlugTakenError, mapFirebaseError, AppError } from '@/types/errors';
import { defaultSiteData } from '@/lib/defaultSiteData';

const db = getFirestore(firebaseApp);

interface SiteDocument {
  slug: string;
  cover: string;
  photos: string[];
  audioUrl: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function getSiteBySlug(slug: string): Promise<SiteData | null> {
  const ref = doc(db, 'sites', slug);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data() as Partial<SiteDocument>;

  const photos =
    Array.isArray(data.photos) && data.photos.length === 10 && data.photos.every((p) => typeof p === 'string' && p)
      ? data.photos
      : defaultSiteData.photos;

  return {
    cover: typeof data.cover === 'string' && data.cover ? data.cover : defaultSiteData.cover,
    photos,
    audioUrl: typeof data.audioUrl === 'string' && data.audioUrl ? data.audioUrl : defaultSiteData.audioUrl,
    lyrics: defaultSiteData.lyrics,
  };
}

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
  photos: string[];
  audioUrl: string;
}

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
        audioUrl: payload.audioUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw mapFirebaseError(err);
  }
}

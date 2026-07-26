import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from './firebase';
import { AppError, mapFirebaseError, UploadFailedError } from '@/types/errors';

const storage = getStorage(firebaseApp);

/**
 * Storage layout (see architecture Section 3):
 *   sites/{slug}/cover.webp
 *   sites/{slug}/photos/1.webp ... 10.webp
 */
export function coverPath(slug: string): string {
  return `sites/${slug}/cover.webp`;
}

export function photoPath(slug: string, index: number): string {
  return `sites/${slug}/photos/${index}.webp`;
}

/**
 * Uploads a single blob and returns its public download URL.
 *
 * Milestone 5 change: switched from uploadBytes to uploadBytesResumable so
 * real byte-level progress can be reported via `onProgress` (0-1 fraction
 * for this one file). Behavior and return value are unchanged for any
 * caller that doesn't pass a progress callback.
 */
async function uploadOne(path: string, blob: Blob, onProgress?: (fraction: number) => void): Promise<string> {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, blob, { contentType: 'image/webp' });

  return new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
        }
      },
      (err) => reject(mapFirebaseError(err)),
      async () => {
        try {
          resolve(await getDownloadURL(storageRef));
        } catch (err) {
          reject(mapFirebaseError(err));
        }
      }
    );
  });
}

export interface UploadedAssets {
  coverUrl: string;
  photoUrls: string[]; // length 10, in order
}

/**
 * Uploads the cover + all 10 gallery photos for a slug. All uploads run in
 * parallel; if any single one fails, the whole operation rejects with an
 * UploadFailedError (or the more specific mapped error) rather than leaving
 * a half-uploaded site — callers should not write the Firestore doc unless
 * this resolves successfully.
 *
 * `onProgress`, if provided, receives the unweighted average fraction (0-1)
 * across all 11 files as uploads proceed — an approximation (each file
 * counts equally regardless of its size), which is accurate enough for a
 * progress bar without needing to pre-know every file's exact byte size.
 */
export async function uploadSiteAssets(
  slug: string,
  cover: Blob,
  photos: Blob[],
  onProgress?: (fraction: number) => void
): Promise<UploadedAssets> {
  if (photos.length !== 10) {
    throw new UploadFailedError(`Expected exactly 10 photos, got ${photos.length}.`);
  }

  const fractions = new Array(11).fill(0);
  function reportAggregate(index: number, fraction: number) {
    if (!onProgress) return;
    fractions[index] = fraction;
    const avg = fractions.reduce((a, b) => a + b, 0) / fractions.length;
    onProgress(avg);
  }

  try {
    const [coverUrl, ...photoUrls] = await Promise.all([
      uploadOne(coverPath(slug), cover, (f) => reportAggregate(0, f)),
      ...photos.map((p, i) => uploadOne(photoPath(slug, i + 1), p, (f) => reportAggregate(i + 1, f))),
    ]);

    return { coverUrl, photoUrls };
  } catch (err) {
    // Re-throw as-is if already a mapped AppError (from uploadOne), otherwise map it.
    throw err instanceof AppError ? err : mapFirebaseError(err);
  }
}

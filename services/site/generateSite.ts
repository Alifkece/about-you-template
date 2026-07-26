import { assertValidSlug, slugify } from '@/utils/slugify';
import { assertValidImage } from '@/utils/validateImage';
import { compressImage } from '@/utils/compressImage';
import { uploadSiteAssets } from '@/services/firebase/storage';
import { createSiteIfAvailable, checkSlugAvailable } from '@/services/firebase/firestore';
import { AppError, SlugTakenError, UnexpectedError } from '@/types/errors';
import { GenerationProgress } from '@/types/dashboard';

export interface GenerateSiteInput {
  /** Raw display name as typed by the user, e.g. "ForAraa" — will be slugified. */
  siteName: string;
  cover: File;
  photos: File[]; // must be exactly 10
}

export interface GenerateSiteResult {
  slug: string;
  url: string; // relative path, e.g. "/foraraa"
}

/** Milestone 5 addition: optional progress reporter. Purely additive — omit
 *  it and this function behaves exactly as it did in Milestone 3. */
export type OnGenerateProgress = (progress: GenerationProgress) => void;

/**
 * Full generate flow:
 *   1. Slugify + validate the name
 *   2. Validate every image (type + size)
 *   3. Compress every image client-side
 *   4. Upload all 11 assets to Storage
 *   5. Atomically create the Firestore doc (no-overwrite)
 *
 * Every failure mode throws a typed AppError subclass (see types/errors.ts)
 * so calling UI code can show a specific, correct message rather than a
 * generic crash. Nothing is written to Firestore unless every upload
 * succeeds first — so on any failure, the person's uploaded files (still
 * held as local state in the Dashboard) are completely untouched and can
 * simply be retried.
 */
export async function generateSite(input: GenerateSiteInput, onProgress?: OnGenerateProgress): Promise<GenerateSiteResult> {
  if (input.photos.length !== 10) {
    throw new UnexpectedError('Exactly 10 gallery photos are required.');
  }

  const slug = slugify(input.siteName);
  assertValidSlug(slug); // throws InvalidSlugError

  onProgress?.({ phase: 'validating', label: 'Checking website name…', percent: 2 });

  // Fail fast before doing any (slow, costly) uploads if the name is clearly taken.
  // This is a convenience check only — createSiteIfAvailable's transaction is
  // what actually prevents a race between two simultaneous generations.
  const available = await checkSlugAvailable(slug);
  if (!available) {
    throw new SlugTakenError(slug);
  }

  const allFiles = [input.cover, ...input.photos];
  allFiles.forEach(assertValidImage); // throws InvalidImageError on the first bad file

  try {
    onProgress?.({ phase: 'compressing', label: 'Compressing images…', percent: 8 });
    const [compressedCover, ...compressedPhotos] = await Promise.all(allFiles.map((f) => compressImage(f)));

    onProgress?.({ phase: 'uploading', label: 'Uploading images…', percent: 20 });
    const { coverUrl, photoUrls } = await uploadSiteAssets(slug, compressedCover, compressedPhotos, (fraction) => {
      // Map the 0-1 upload fraction onto the 20-90% overall range.
      onProgress?.({ phase: 'uploading', label: 'Uploading images…', percent: 20 + fraction * 70 });
    });

    onProgress?.({ phase: 'saving', label: 'Saving your website…', percent: 92 });
    await createSiteIfAvailable(slug, { cover: coverUrl, photos: photoUrls });

    onProgress?.({ phase: 'saving', label: 'Done', percent: 100 });
    return { slug, url: `/${slug}` };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new UnexpectedError();
  }
}

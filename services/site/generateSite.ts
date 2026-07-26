import { assertValidSlug, slugify } from '@/utils/slugify';
import { assertValidImage } from '@/utils/validateImage';
import { compressImage } from '@/utils/compressImage';
import { uploadSiteAssets } from '@/services/cloudinary/upload';
import { createSiteIfAvailable, checkSlugAvailable } from '@/services/firebase/firestore';
import { AppError, SlugTakenError, UnexpectedError } from '@/types/errors';
import { GenerationProgress } from '@/types/dashboard';
import { defaultSiteData } from '@/lib/defaultSiteData';

export interface GenerateSiteInput {
  siteName: string;
  cover: File;
  photos: File[]; // must be exactly 10
}

export interface GenerateSiteResult {
  slug: string;
  url: string;
}

export type OnGenerateProgress = (progress: GenerationProgress) => void;

export async function generateSite(input: GenerateSiteInput, onProgress?: OnGenerateProgress): Promise<GenerateSiteResult> {
  if (input.photos.length !== 10) {
    throw new UnexpectedError('Exactly 10 gallery photos are required.');
  }

  const slug = slugify(input.siteName);
  assertValidSlug(slug);

  onProgress?.({ phase: 'validating', label: 'Checking website name…', percent: 2 });

  const available = await checkSlugAvailable(slug);
  if (!available) {
    throw new SlugTakenError(slug);
  }

  const allFiles = [input.cover, ...input.photos];
  allFiles.forEach(assertValidImage);

  try {
    onProgress?.({ phase: 'compressing', label: 'Compressing images…', percent: 8 });
    const [compressedCover, ...compressedPhotos] = await Promise.all(allFiles.map((f) => compressImage(f)));

    onProgress?.({ phase: 'uploading', label: 'Uploading images…', percent: 20 });
    const { coverUrl, photoUrls } = await uploadSiteAssets(slug, compressedCover, compressedPhotos, (fraction) => {
      onProgress?.({ phase: 'uploading', label: 'Uploading images…', percent: 20 + fraction * 70 });
    });

    onProgress?.({ phase: 'saving', label: 'Saving your website…', percent: 92 });
    await createSiteIfAvailable(slug, { cover: coverUrl, photos: photoUrls, audioUrl: defaultSiteData.audioUrl });

    onProgress?.({ phase: 'saving', label: 'Done', percent: 100 });
    return { slug, url: `/${slug}` };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new UnexpectedError();
  }
}

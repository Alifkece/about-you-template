import { AppError, NetworkError, UploadFailedError, mapUploadError } from '@/types/errors';

/**
 * Cloudinary Free-tier image hosting — replaces Firebase Storage
 * (see services/firebase/storage.ts in the previous milestone).
 *
 * Uses Cloudinary's unsigned upload endpoint directly from the browser, so
 * no backend/signing server is required (matches the previous
 * client-only upload flow). This needs two public env vars:
 *
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET   (an *unsigned* preset)
 *
 * Trade-off vs. the old Storage rules: Storage enforced "never overwrite an
 * existing path" server-side. Cloudinary's unsigned upload API does not
 * give us that same hard guarantee — an unsigned preset can overwrite an
 * existing public_id. This is acceptable here because the Firestore
 * transaction in services/site/generateSite.ts / createSiteIfAvailable is
 * already the real guard against two sites sharing a slug; this layer only
 * needs to get bytes hosted and return a URL.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = CLOUD_NAME ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload` : '';

/**
 * Public-ID layout (mirrors the old Storage path layout 1:1):
 *   sites/{slug}/cover
 *   sites/{slug}/photos/1 ... 10
 */
export function coverPublicId(slug: string): string {
  return `sites/${slug}/cover`;
}

export function photoPublicId(slug: string, index: number): string {
  return `sites/${slug}/photos/${index}`;
}

/**
 * Uploads a single blob to Cloudinary and returns its public HTTPS URL.
 * Progress is reported via XHR's native `upload.onprogress`, which is the
 * closest browser-side equivalent to Firebase's `uploadBytesResumable`
 * progress events used previously.
 */
function uploadOne(publicId: string, blob: Blob, onProgress?: (fraction: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      reject(new UploadFailedError('Image hosting is not configured (missing Cloudinary env vars).'));
      return;
    }

    const form = new FormData();
    form.append('file', blob);
    form.append('upload_preset', UPLOAD_PRESET);
    form.append('public_id', publicId);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL);

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onerror = () => reject(new NetworkError());

    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new UploadFailedError('Unexpected response from image host.'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.secure_url) {
        onProgress?.(1);
        resolve(body.secure_url as string);
      } else {
        reject(mapUploadError(body, xhr.status));
      }
    };

    xhr.send(form);
  });
}

export interface UploadedAssets {
  coverUrl: string;
  photoUrls: string[]; // length 10, in order
}

/**
 * Uploads the cover + all 10 gallery photos for a slug. All uploads run in
 * parallel; if any single one fails, the whole operation rejects (or the
 * more specific mapped error) rather than leaving a half-uploaded site —
 * callers should not write the Firestore doc unless this resolves
 * successfully. Same contract as the previous Firebase Storage version.
 *
 * `onProgress`, if provided, receives the unweighted average fraction (0-1)
 * across all 11 files as uploads proceed.
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
      uploadOne(coverPublicId(slug), cover, (f) => reportAggregate(0, f)),
      ...photos.map((p, i) => uploadOne(photoPublicId(slug, i + 1), p, (f) => reportAggregate(i + 1, f))),
    ]);

    return { coverUrl, photoUrls };
  } catch (err) {
    throw err instanceof AppError ? err : new UploadFailedError('Upload failed.');
  }
}

/**
 * Compresses/resizes an image file in the browser before upload, to keep
 * Cloudinary Free-tier usage (25 monthly credits ~ 25GB combined
 * storage/bandwidth/transforms) reasonable even with many full-resolution
 * phone photos.
 *
 * Falls back to returning the original file untouched if run in a non-browser
 * environment, or if compression fails for any reason — compression is a
 * nice-to-have, never a hard requirement for upload to proceed.
 */
export async function compressImage(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<Blob> {
  const { maxDimension = 1600, quality = 0.82 } = options;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality)
    );

    return blob ?? file;
  } catch {
    return file;
  }
}

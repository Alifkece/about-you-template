import { InvalidImageError } from '@/types/errors';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Throws InvalidImageError with a clear, user-facing message if the file fails validation. */
export function assertValidImage(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new InvalidImageError(`"${file.name}" isn't a supported image type. Use JPG, PNG, or WEBP.`);
  }
  if (file.size > MAX_BYTES) {
    throw new InvalidImageError(`"${file.name}" is too large. Maximum size is 5MB.`);
  }
}

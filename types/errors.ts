/**
 * Typed errors for the upload/generate flow. Every failure mode maps to one
 * of these, so calling code (the Dashboard) can switch on `error.code`
 * instead of parsing raw Firestore or Cloudinary error shapes.
 */
export class AppError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
  }
}

export class InvalidImageError extends AppError {
  constructor(message: string) {
    super('invalid-image', message);
  }
}

export class SlugTakenError extends AppError {
  constructor(slug: string) {
    super('slug-taken', `This website name is already taken: "${slug}"`);
  }
}

export class InvalidSlugError extends AppError {
  constructor(slug: string) {
    super('invalid-slug', `"${slug}" is not a valid website name.`);
  }
}

export class UploadFailedError extends AppError {
  constructor(message: string) {
    super('upload-failed', message);
  }
}

export class FirestoreWriteError extends AppError {
  constructor(message: string) {
    super('firestore-write-failed', message);
  }
}

export class PermissionDeniedError extends AppError {
  constructor(message = 'Permission denied.') {
    super('permission-denied', message);
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection lost.') {
    super('network-error', message);
  }
}

export class UnexpectedError extends AppError {
  constructor(message = 'Something unexpected went wrong.') {
    super('unexpected-error', message);
  }
}

/**
 * Maps a raw Firestore error to one of the typed errors above, based on its
 * `.code`. Unrecognized codes fall back to UnexpectedError rather than
 * leaking Firebase's internal error shape.
 */
export function mapFirebaseError(err: unknown): AppError {
  const code = (err as { code?: string })?.code ?? '';

  if (code.includes('permission-denied') || code.includes('unauthorized')) {
    return new PermissionDeniedError();
  }
  if (code.includes('network-request-failed') || code === 'unavailable') {
    return new NetworkError();
  }
  if (code.startsWith('firestore/') || code === 'already-exists' || code === 'aborted') {
    return new FirestoreWriteError(`Could not save your site (${code}).`);
  }
  return new UnexpectedError();
}

/**
 * Maps a Cloudinary unsigned-upload response to one of the typed errors
 * above. `response` is the parsed JSON body (Cloudinary returns
 * `{ error: { message } }` on failure); `status` is the HTTP status code,
 * or `undefined`/`0` for a transport-level failure (no response at all).
 */
export function mapUploadError(response: { error?: { message?: string } } | null, status?: number): AppError {
  const message = response?.error?.message ?? '';

  if (!status) {
    return new NetworkError();
  }
  if (status === 401 || status === 403 || /preset/i.test(message)) {
    return new PermissionDeniedError('Upload was rejected — check your Cloudinary upload preset.');
  }
  if (status === 400) {
    return new UploadFailedError(message || 'Upload rejected — check image format and size.');
  }
  return new UploadFailedError(message || `Upload failed (${status}).`);
}

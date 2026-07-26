/** Local state for a single upload slot (cover or one gallery photo). */
export interface UploadSlot {
  /** Original selected file, kept for filename/type display. */
  file: File | null;
  /** Compressed blob, ready to hand to uploadSiteAssets() in a later milestone. */
  preparedBlob: Blob | null;
  /** Object URL for the compressed blob — what Live Preview and the thumbnail both show. */
  objectUrl: string | null;
  /** Validation/compression error message, if the last selection failed. */
  error: string | null;
}

export const emptySlot: UploadSlot = { file: null, preparedBlob: null, objectUrl: null, error: null };

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export type GenerationStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface GenerationProgress {
  phase: 'validating' | 'compressing' | 'uploading' | 'saving';
  label: string;
  percent: number; // 0-100, overall (not per-phase)
}

export interface GenerationResult {
  slug: string;
  url: string; // e.g. "/foraraa"
}

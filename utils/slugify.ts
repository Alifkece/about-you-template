import { InvalidSlugError } from '@/types/errors';

/** Converts a display name like "ForAraa" into a URL-safe slug like "foraraa". */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(['demo', 'dashboard', 'api', 'app', '_next', 'admin']);

/** Throws InvalidSlugError if the slug is empty, malformed, or reserved. */
export function assertValidSlug(slug: string): void {
  if (!slug || slug.length < 1 || slug.length > 50 || !SLUG_PATTERN.test(slug)) {
    throw new InvalidSlugError(slug);
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new InvalidSlugError(slug);
  }
}

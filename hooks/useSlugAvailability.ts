'use client';

import { useEffect, useState } from 'react';
import { assertValidSlug } from '@/utils/slugify';
import { checkSlugAvailable } from '@/services/firebase/firestore';
import { SlugStatus } from '@/types/dashboard';

const DEBOUNCE_MS = 500;

/**
 * Given a (pre-slugified) slug, returns its live availability status, debounced.
 * Reuses services/firebase/firestore.ts's checkSlugAvailable — the same
 * function the real generate flow (Milestone 3/6) uses — so this is a
 * genuine live check, not a UI-only simulation.
 */
export function useSlugAvailability(slug: string): SlugStatus {
  const [status, setStatus] = useState<SlugStatus>('idle');

  useEffect(() => {
    if (!slug) {
      setStatus('idle');
      return;
    }

    try {
      assertValidSlug(slug);
    } catch {
      setStatus('invalid');
      return;
    }

    setStatus('checking');
    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        const available = await checkSlugAvailable(slug);
        if (!cancelled) setStatus(available ? 'available' : 'taken');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [slug]);

  return status;
}

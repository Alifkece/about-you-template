'use client';

import { slugify } from '@/utils/slugify';
import { useSlugAvailability } from '@/hooks/useSlugAvailability';
import { SlugStatus } from '@/types/dashboard';

export interface SlugInputProps {
  siteName: string;
  onChangeSiteName: (name: string) => void;
  onStatusChange?: (status: SlugStatus, slug: string) => void;
}

const STATUS_COPY: Record<SlugStatus, { text: string; className: string }> = {
  idle: { text: '', className: '' },
  checking: { text: 'Checking availability…', className: 'text-white/45' },
  available: { text: 'Available', className: 'text-db-good' },
  taken: { text: 'This website name is already taken', className: 'text-db-bad' },
  invalid: { text: 'Enter a name using letters and numbers', className: 'text-db-bad' },
  error: { text: "Couldn't check availability — try again", className: 'text-db-bad' },
};

export default function SlugInput({ siteName, onChangeSiteName }: SlugInputProps) {
  const slug = slugify(siteName);
  const status = useSlugAvailability(slug);
  const copy = STATUS_COPY[status];

  return (
    <div>
      <label htmlFor="site-name" className="mb-2 block font-display text-lg text-white/90">
        Website name
      </label>
      <input
        id="site-name"
        type="text"
        value={siteName}
        onChange={(e) => onChangeSiteName(e.target.value)}
        placeholder="ForAraa"
        className="w-full rounded-lg border border-db-border bg-black/30 px-4 py-2.5 font-body text-white/90 placeholder:text-white/25 focus:border-db-violet focus:outline-none focus:ring-1 focus:ring-db-violet"
      />
      <div className="mt-1.5 flex items-center justify-between font-mono text-xs">
        <span className="text-white/40">
          yoursite.vercel.app/<span className="text-white/70">{slug || '…'}</span>
        </span>
        {copy.text && <span className={copy.className}>{copy.text}</span>}
      </div>
    </div>
  );
}

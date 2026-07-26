'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import ExperiencePlayer from '@/components/experience/ExperiencePlayer';
import { SiteData } from '@/types/site';

export interface PreviewPanelProps {
  data: SiteData;
  isComplete: boolean; // whether all 11 slots + a valid name are filled
}

/**
 * Live Preview design decision (flagged for review): rather than embedding a
 * miniature ExperiencePlayer inside a small dashboard card, this opens the
 * SAME component full-screen, exactly as it will appear in production. The
 * cinematic engine sizes itself from window.innerWidth/innerHeight (ported
 * as-is from app.js, per Milestone 1's "don't modify unless necessary" rule)
 * — a shrunk-down embedded preview would compute its camera/scene geometry
 * against the real window size, not the small container, so it wouldn't
 * accurately represent production framing. A full-screen overlay guarantees
 * 100% identical behavior with zero engine changes.
 *
 * Bug fix: the overlay below is rendered via a portal straight to
 * `document.body`. Without this, `position: fixed` on the overlay resolves
 * against the nearest ancestor that establishes a new containing block
 * (e.g. any parent with a CSS `transform`, `filter`, or `perspective` —
 * common on animated dashboard panels), which shrinks the "full-screen"
 * overlay down to that ancestor's box instead of the real viewport. A
 * portal renders this subtree as a direct child of <body>, so `fixed`
 * always means the actual screen, regardless of what wraps PreviewPanel.
 */
export default function PreviewPanel({ data, isComplete }: PreviewPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="db-glass rounded-xl p-4">
      <h2 className="mb-2 font-display text-lg text-white/90">Live preview</h2>
      <p className="mb-3 text-sm text-white/45">
        {isComplete
          ? 'Everything is filled in — preview looks exactly like the real site.'
          : 'Empty slots preview with the original demo photos, so you can still see how it flows.'}
      </p>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-lg border border-db-violet/50 bg-db-violet/10 px-4 py-2.5 font-body text-sm text-white/90 transition-colors hover:bg-db-violet/20"
      >
        ▶ Open live preview
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <ExperiencePlayer data={data} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="fixed right-4 top-4 z-[60] rounded-full bg-black/60 px-3 py-1.5 font-mono text-xs text-white/85 backdrop-blur-sm hover:bg-black/80"
              aria-label="Exit preview"
            >
              ✕ Exit preview
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { GenerationResult } from '@/types/dashboard';

export interface SuccessScreenProps {
  result: GenerationResult;
  onGenerateAnother: () => void;
}

export default function SuccessScreen({ result, onGenerateAnother }: SuccessScreenProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${result.url}` : result.url;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be denied/unavailable — the URL is still visible and selectable, so this fails quietly.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-db-bg px-4">
      <div className="db-glass w-full max-w-md rounded-2xl p-8 text-center">
        <div className="mb-3 text-3xl">✅</div>
        <h1 className="mb-2 font-display text-2xl text-white/95">Website created successfully</h1>
        <p className="mb-6 text-sm text-white/50">Your site is live and ready to share.</p>

        <div className="mb-6 rounded-lg border border-db-border bg-black/30 px-4 py-3 font-mono text-sm text-white/80">
          {fullUrl}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopy}
            className="w-full rounded-lg border border-db-violet/50 bg-db-violet/10 px-4 py-2.5 text-sm text-white/90 transition-colors hover:bg-db-violet/20"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-db-amber px-4 py-2.5 text-sm font-medium text-black transition-colors hover:brightness-110"
          >
            Open website
          </a>
          <button
            onClick={onGenerateAnother}
            className="w-full rounded-lg px-4 py-2.5 text-sm text-white/60 transition-colors hover:text-white/90"
          >
            Generate another website
          </button>
        </div>
      </div>
    </div>
  );
}

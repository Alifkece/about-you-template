'use client';

import { GenerationProgress, GenerationStatus } from '@/types/dashboard';

export interface GenerateButtonProps {
  isComplete: boolean;
  canGenerate: boolean;
  status: GenerationStatus;
  progress: GenerationProgress | null;
  errorMessage: string | null;
  onGenerate: () => void;
}

export default function GenerateButton({
  isComplete,
  canGenerate,
  status,
  progress,
  errorMessage,
  onGenerate,
}: GenerateButtonProps) {
  const isSubmitting = status === 'submitting';

  return (
    <div>
      <button
        disabled={!canGenerate}
        onClick={onGenerate}
        className={`w-full rounded-lg px-4 py-3 font-display text-base transition-colors ${
          canGenerate
            ? 'bg-db-amber text-black hover:brightness-110'
            : 'cursor-not-allowed bg-white/10 text-white/35'
        }`}
      >
        {isSubmitting ? progress?.label ?? 'Generating…' : 'Generate website'}
      </button>

      {!isSubmitting && !isComplete && (
        <p className="mt-2 text-center text-xs text-white/35">
          Fill in a website name and all 11 images to continue.
        </p>
      )}

      {isSubmitting && progress && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-db-amber transition-all"
            style={{ width: `${Math.min(100, Math.round(progress.percent))}%` }}
          />
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="mt-3 rounded-lg border border-db-bad/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {errorMessage}
          <div className="mt-1 text-xs text-red-300/70">
            Your uploaded images and details are untouched — fix the issue above and try again.
          </div>
        </div>
      )}
    </div>
  );
}

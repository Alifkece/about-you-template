'use client';

import { useRef, useState, MouseEvent, KeyboardEvent } from 'react';
import { UploadSlot, emptySlot } from '@/types/dashboard';
import { assertValidImage } from '@/utils/validateImage';
import { compressImage } from '@/utils/compressImage';
import { InvalidImageError } from '@/types/errors';

export interface UploadCardProps {
  label: string;
  slot: UploadSlot;
  onChange: (slot: UploadSlot) => void;
  /** A faint placeholder shown when the slot is empty (e.g. the original demo photo), purely cosmetic. */
  fallbackPreviewUrl?: string;
  aspect?: 'square' | 'wide';
}

export default function UploadCard({ label, slot, onChange, fallbackPreviewUrl, aspect = 'square' }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFile(file: File) {
    setIsProcessing(true);
    try {
      assertValidImage(file);
      const blob = await compressImage(file);
      if (slot.objectUrl) URL.revokeObjectURL(slot.objectUrl);
      const objectUrl = URL.createObjectURL(blob);
      onChange({ file, preparedBlob: blob, objectUrl, error: null });
    } catch (err) {
      const message =
        err instanceof InvalidImageError ? err.message : 'Could not process this image. Try another file.';
      if (slot.objectUrl) URL.revokeObjectURL(slot.objectUrl);
      onChange({ ...emptySlot, error: message });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleRemove(e: MouseEvent) {
    e.stopPropagation();
    if (slot.objectUrl) URL.revokeObjectURL(slot.objectUrl);
    onChange({ ...emptySlot });
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  const previewSrc = slot.objectUrl ?? fallbackPreviewUrl;

  return (
    <div
      className={`db-frame db-frame-slot group relative cursor-pointer transition-transform hover:scale-[1.02] ${
        aspect === 'square' ? 'aspect-square' : 'aspect-[4/3]'
      }`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${label} — click to ${slot.objectUrl ? 'replace' : 'upload'} image`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {previewSrc ? (
        <img
          src={previewSrc}
          alt={label}
          className={`h-full w-full object-cover ${!slot.objectUrl ? 'opacity-35' : ''}`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-white/35">
          <span className="text-3xl leading-none">+</span>
        </div>
      )}

      <div className="absolute inset-x-2 top-3 z-10 flex items-center justify-between">
        <span className="rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-white/75 backdrop-blur-sm">
          {label}
        </span>
        {slot.objectUrl && (
          <button
            onClick={handleRemove}
            className="rounded bg-black/55 px-1.5 py-0.5 text-[11px] text-white/70 backdrop-blur-sm transition-colors hover:text-db-bad"
            aria-label={`Remove ${label}`}
          >
            ✕
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 font-mono text-xs text-white/85">
          Processing…
        </div>
      )}

      {slot.error && !isProcessing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-950/75 px-2 text-center text-[11px] text-red-200">
          {slot.error}
        </div>
      )}
    </div>
  );
}

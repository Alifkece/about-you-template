'use client';

import UploadCard from './UploadCard';
import { UploadSlot } from '@/types/dashboard';

export interface GalleryUploaderProps {
  slots: UploadSlot[]; // length 10
  onChangeAt: (index: number, slot: UploadSlot) => void;
  fallbackPreviewUrls?: string[]; // length 10, optional
}

export default function GalleryUploader({ slots, onChangeAt, fallbackPreviewUrls }: GalleryUploaderProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-display text-lg text-white/90">Gallery photos</h2>
        <span className="font-mono text-xs text-white/40">
          {slots.filter((s) => s.objectUrl).length}/10
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {slots.map((slot, i) => (
          <UploadCard
            key={i}
            label={`Photo ${i + 1}`}
            slot={slot}
            onChange={(s) => onChangeAt(i, s)}
            fallbackPreviewUrl={fallbackPreviewUrls?.[i]}
            aspect="square"
          />
        ))}
      </div>
    </div>
  );
}

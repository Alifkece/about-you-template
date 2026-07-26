'use client';

import UploadCard from './UploadCard';
import { UploadSlot } from '@/types/dashboard';

export interface CoverUploaderProps {
  slot: UploadSlot;
  onChange: (slot: UploadSlot) => void;
  fallbackPreviewUrl?: string;
}

export default function CoverUploader({ slot, onChange, fallbackPreviewUrl }: CoverUploaderProps) {
  return (
    <div>
      <h2 className="mb-2 font-display text-lg text-white/90">Song cover</h2>
      <div className="max-w-[220px]">
        <UploadCard label="Cover" slot={slot} onChange={onChange} fallbackPreviewUrl={fallbackPreviewUrl} aspect="square" />
      </div>
    </div>
  );
}

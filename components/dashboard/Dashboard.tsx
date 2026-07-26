'use client';

import { useMemo, useState } from 'react';
import CoverUploader from './CoverUploader';
import GalleryUploader from './GalleryUploader';
import SlugInput from './SlugInput';
import PreviewPanel from './PreviewPanel';
import GenerateButton from './GenerateButton';
import SuccessScreen from './SuccessScreen';
import { UploadSlot, emptySlot, GenerationStatus, GenerationProgress, GenerationResult } from '@/types/dashboard';
import { SiteData } from '@/types/site';
import { slugify } from '@/utils/slugify';
import { defaultSiteData } from '@/lib/defaultSiteData';
import { useSlugAvailability } from '@/hooks/useSlugAvailability';
import { generateSite } from '@/services/site/generateSite';
import { AppError } from '@/types/errors';

function revokeSlot(slot: UploadSlot) {
  if (slot.objectUrl) URL.revokeObjectURL(slot.objectUrl);
}

export default function Dashboard() {
  const [siteName, setSiteName] = useState('');
  const [cover, setCover] = useState<UploadSlot>(emptySlot);
  const [photos, setPhotos] = useState<UploadSlot[]>(Array.from({ length: 10 }, () => emptySlot));

  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const slug = useMemo(() => slugify(siteName), [siteName]);
  const slugStatus = useSlugAvailability(slug);

  function updatePhotoAt(index: number, next: UploadSlot) {
    setPhotos((prev) => prev.map((s, i) => (i === index ? next : s)));
  }

  const isComplete = Boolean(siteName.trim()) && Boolean(cover.objectUrl) && photos.every((p) => p.objectUrl);
  const canGenerate = isComplete && slugStatus === 'available' && generationStatus !== 'submitting';

  const previewData: SiteData = useMemo(
    () => ({
      cover: cover.objectUrl ?? defaultSiteData.cover,
      photos: photos.map((p, i) => p.objectUrl ?? defaultSiteData.photos[i]),
      audioUrl: defaultSiteData.audioUrl,
      lyrics: defaultSiteData.lyrics,
    }),
    [cover.objectUrl, photos]
  );

  async function handleGenerate() {
    // Duplicate-submission guard — a second click while one is in flight, or
    // while inputs are incomplete/slug unavailable, is a no-op.
    if (!canGenerate || !cover.file || photos.some((p) => !p.file)) return;

    setGenerationStatus('submitting');
    setErrorMessage(null);
    setProgress({ phase: 'validating', label: 'Validating…', percent: 0 });

    try {
      const result = await generateSite(
        {
          siteName,
          cover: cover.file,
          photos: photos.map((p) => p.file as File),
        },
        (p) => setProgress(p)
      );

      setGenerationResult(result);
      setGenerationStatus('success');
    } catch (err) {
      // All uploaded slots (cover, photos, siteName) are left completely
      // untouched here — nothing in this catch block clears any state, so
      // the person can fix the issue and click Generate again without
      // re-uploading anything.
      const message = err instanceof AppError ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(message);
      setGenerationStatus('error');
    }
  }

  function handleGenerateAnother() {
    revokeSlot(cover);
    photos.forEach(revokeSlot);
    setSiteName('');
    setCover(emptySlot);
    setPhotos(Array.from({ length: 10 }, () => emptySlot));
    setGenerationStatus('idle');
    setProgress(null);
    setGenerationResult(null);
    setErrorMessage(null);
  }

  if (generationStatus === 'success' && generationResult) {
    return <SuccessScreen result={generationResult} onGenerateAnother={handleGenerateAnother} />;
  }

  return (
    <div className="min-h-screen bg-db-bg px-4 py-6 text-white sm:px-6 lg:px-10 lg:py-10">
      <header className="mb-6 lg:mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-white/40">Website builder</p>
        <h1 className="font-display text-2xl text-white/95 sm:text-3xl">Build your website</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Edit column */}
        <div className="space-y-6">
          <div className="db-glass rounded-xl p-4">
            <SlugInput siteName={siteName} onChangeSiteName={setSiteName} />
          </div>

          <div className="db-glass rounded-xl p-4">
            <CoverUploader slot={cover} onChange={setCover} fallbackPreviewUrl={defaultSiteData.cover} />
          </div>

          <div className="db-glass rounded-xl p-4">
            <GalleryUploader slots={photos} onChangeAt={updatePhotoAt} fallbackPreviewUrls={defaultSiteData.photos} />
          </div>

          <div className="db-glass rounded-xl p-4">
            <GenerateButton
              isComplete={isComplete}
              canGenerate={canGenerate}
              status={generationStatus}
              progress={progress}
              errorMessage={errorMessage}
              onGenerate={handleGenerate}
            />
          </div>
        </div>

        {/* Preview column — stacks below the edit column on mobile */}
        <div className="lg:sticky lg:top-10 lg:self-start">
          <PreviewPanel data={previewData} isComplete={isComplete} />
        </div>
      </div>
    </div>
  );
}

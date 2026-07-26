'use client';

import { useMemo, useRef } from 'react';
import { SiteData } from '@/types/site';
import { useExperienceEngine, ExperienceRefs } from '@/hooks/useExperienceEngine';
import '@/styles/experience.css';

export interface ExperiencePlayerProps {
  data: SiteData;
}

/**
 * The ported "About You" cinematic experience. Structure, ids, and classes
 * are kept identical to the original index.html so that experience.css
 * (copied verbatim from style.css) applies unchanged.
 *
 * This component ONLY receives `data: SiteData` as a prop. It has no
 * knowledge of Firestore/Storage — the same component is used for production
 * (/[slug], fed by Firestore) and for Live Preview (fed by local object
 * URLs), per the approved architecture.
 */
export default function ExperiencePlayer({ data }: ExperiencePlayerProps) {
  const root = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const startOverlay = useRef<HTMLDivElement>(null);
  const startBtn = useRef<HTMLButtonElement>(null);
  const pauseIndicator = useRef<HTMLDivElement>(null);
  const filmTrackSlantedUp = useRef<HTMLDivElement>(null);
  const filmTrackSlantedDown = useRef<HTMLDivElement>(null);
  const filmTrackHorizontal = useRef<HTMLDivElement>(null);
  const infiniteCamera = useRef<HTMLDivElement>(null);
  const infiniteCanvas = useRef<HTMLDivElement>(null);
  const cardProgressFill = useRef<HTMLDivElement>(null);
  const cardTimeCurrent = useRef<HTMLSpanElement>(null);
  const cardTimeTotal = useRef<HTMLSpanElement>(null);
  const cardProgressTrack = useRef<HTMLDivElement>(null);

  // Memoized so this object's identity is stable across renders — every
  // value inside comes from useRef (already stable), but without this the
  // *bundle* itself would be a new object every render, which would make
  // useExperienceEngine's effect dependency array change on every unrelated
  // re-render and tear down/rebuild the entire engine unnecessarily.
  const refs: ExperienceRefs = useMemo(
    () => ({
      root,
      audio,
      startOverlay,
      startBtn,
      pauseIndicator,
      filmTrackSlantedUp,
      filmTrackSlantedDown,
      filmTrackHorizontal,
      infiniteCamera,
      infiniteCanvas,
      cardProgressFill,
      cardTimeCurrent,
      cardTimeTotal,
      cardProgressTrack,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useExperienceEngine(refs, data);

  return (
    <div ref={root}>
      {/* Film Strip Background */}
      <div className="film-strip-scene" id="film-strip-scene">
        <div className="film-strip-container slanted-up">
          <div className="film-track" ref={filmTrackSlantedUp} id="film-track-slanted-up" />
        </div>
        <div className="film-strip-container slanted-down">
          <div className="film-track" ref={filmTrackSlantedDown} id="film-track-slanted-down" />
        </div>
        <div className="film-strip-container horizontal">
          <div className="film-track" ref={filmTrackHorizontal} id="film-track-horizontal" />
        </div>
      </div>
      <div className="cinematic-vignette" />
      <div className="cinematic-grain" />

      {/* Infinite Canvas: virtual camera pans over all scenes */}
      <div id="infinite-viewport">
        <div id="infinite-camera" ref={infiniteCamera}>
          <div id="infinite-canvas" ref={infiniteCanvas} />
        </div>
      </div>

      {/* Start Overlay */}
      <div className="start-overlay" id="start-overlay" ref={startOverlay}>
        <div className="player-card">
          <div className="album-art-wrapper">
            <img className="album-art" src={data.cover} alt="About You — The 1975 Album Art" />
          </div>
          <div className="track-info">
            <h1 className="track-title">About You</h1>
            <p className="track-artist">The 1975</p>
          </div>

          {/* Progress Section */}
          <div className="card-progress-section">
            <div className="card-time-row">
              <span className="card-time" ref={cardTimeCurrent}>
                0:00
              </span>
              <span className="card-time" ref={cardTimeTotal}>
                -5:15
              </span>
            </div>
            <div className="card-progress-track" id="card-progress-track" ref={cardProgressTrack}>
              <div className="card-progress-fill" id="card-progress-fill" ref={cardProgressFill} style={{ width: '0%' }} />
            </div>
          </div>

          {/* Controls Section */}
          <div className="card-controls-row">
            <button className="card-control-btn" disabled>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="19 20 9 12 19 4 19 20" />
                <polygon points="9 20 1 12 9 4 9 20" />
              </svg>
            </button>
            <button className="card-play-btn" id="start-btn" ref={startBtn}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="8 5 19 12 8 19 8 5" />
              </svg>
            </button>
            <button className="card-control-btn" disabled>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4" />
                <polygon points="15 4 25 12 15 20 15 4" />
              </svg>
            </button>
            <button className="card-control-btn" disabled>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>
          </div>

          {/* Volume Section */}
          <div className="card-volume-section">
            <svg
              className="volume-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            </svg>
            <div className="card-volume-track">
              <div className="card-volume-fill" style={{ width: '70%' }} />
            </div>
            <svg
              className="volume-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </div>
        </div>
      </div>

      {/* Pause Indicator */}
      <div className="pause-indicator" id="pause-indicator" ref={pauseIndicator}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <polygon points="8 5 19 12 8 19 8 5" />
        </svg>
      </div>

      <audio id="audio-player" ref={audio} preload="auto" src={data.audioUrl} />
    </div>
  );
}

'use client';

import { useEffect, RefObject } from 'react';
import { SiteData, LyricWord } from '@/types/site';
import { fallbackInterpolatedLyrics } from '@/lib/lyrics';

export interface ExperienceRefs {
  root: RefObject<HTMLDivElement | null>;
  audio: RefObject<HTMLAudioElement | null>;
  startOverlay: RefObject<HTMLDivElement | null>;
  startBtn: RefObject<HTMLButtonElement | null>;
  pauseIndicator: RefObject<HTMLDivElement | null>;
  filmTrackSlantedUp: RefObject<HTMLDivElement | null>;
  filmTrackSlantedDown: RefObject<HTMLDivElement | null>;
  filmTrackHorizontal: RefObject<HTMLDivElement | null>;
  infiniteCamera: RefObject<HTMLDivElement | null>;
  infiniteCanvas: RefObject<HTMLDivElement | null>;
  cardProgressFill: RefObject<HTMLDivElement | null>;
  cardTimeCurrent: RefObject<HTMLSpanElement | null>;
  cardTimeTotal: RefObject<HTMLSpanElement | null>;
  cardProgressTrack: RefObject<HTMLDivElement | null>;
}

/**
 * Ported from js/app.js. This hook owns every piece of behavior the original
 * global script had: cinematic camera, film-strip build, lyric-synced scenes,
 * ambient color sampling, and the audio/progress/seek system. It is purely
 * data-driven — it receives `data: SiteData` and DOM refs, and never imports
 * or references Firebase in any way.
 */
export function useExperienceEngine(refs: ExperienceRefs, data: SiteData) {
  useEffect(() => {
    const audioRef = refs.audio.current;
    const startOverlayRef = refs.startOverlay.current;
    const startBtnRef = refs.startBtn.current;
    const pauseIndicatorRef = refs.pauseIndicator.current;
    const filmTrackSlantedUp = refs.filmTrackSlantedUp.current;
    const filmTrackSlantedDown = refs.filmTrackSlantedDown.current;
    const filmTrackHorizontal = refs.filmTrackHorizontal.current;
    const infiniteCameraRef = refs.infiniteCamera.current;
    const infiniteCanvasRef = refs.infiniteCanvas.current;
    const cardProgressFill = refs.cardProgressFill.current;
    const cardTimeCurrent = refs.cardTimeCurrent.current;
    const cardTimeTotal = refs.cardTimeTotal.current;
    const cardProgressTrack = refs.cardProgressTrack.current;
    const rootElRef = refs.root.current;

    if (
      !audioRef ||
      !startOverlayRef ||
      !startBtnRef ||
      !pauseIndicatorRef ||
      !infiniteCameraRef ||
      !infiniteCanvasRef ||
      !rootElRef
    ) {
      // Refs not ready yet (shouldn't happen post-mount, but keep this a no-op
      // rather than throwing, matching the original script's defensive style).
      return;
    }

    // Rebind to concrete, non-nullable types right after the guard above.
    // This is real static type-safety (each variable's declared type is
    // simply `HTMLxElement`, never a union with `null`) rather than a `!`
    // assertion — so every nested function/closure declared below can
    // reference these directly, with no per-closure re-checking and no
    // possibility of a "possibly null" error anywhere in this file.
    const audio: HTMLAudioElement = audioRef;
    const startOverlay: HTMLDivElement = startOverlayRef;
    const startBtn: HTMLButtonElement = startBtnRef;
    const pauseIndicator: HTMLDivElement = pauseIndicatorRef;
    const infiniteCamera: HTMLDivElement = infiniteCameraRef;
    const infiniteCanvas: HTMLDivElement = infiniteCanvasRef;
    const rootEl: HTMLDivElement = rootElRef;

    // ─── Scroll lock, scoped to this component's actual mount lifecycle ────
    // Previously this was `overflow: hidden` on the bare `html, body`
    // selector in experience.css — a global stylesheet also pulled in by
    // the Dashboard's Live Preview panel, so it locked scroll on /dashboard
    // even when no preview was open. Applying it here means it's only ever
    // in effect while ExperiencePlayer is actually mounted (production
    // /[slug], /demo, and the fullscreen live-preview portal), and it's
    // restored to whatever it was before on cleanup.
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyCursor = document.body.style.cursor;
    const previousBodyUserSelect = document.body.style.userSelect;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'none';

    // ─── Subtitle bar (created + appended, exactly as the original did to
    // document.body — here appended to the component's own root instead, so
    // multiple mounted instances / unmounts stay clean. #subtitle-bar is
    // positioned via fixed/absolute CSS, identical either way.) ────────────
    const subtitleBar = document.createElement('div');
    subtitleBar.id = 'subtitle-bar';
    const subtitleLine = document.createElement('div');
    subtitleLine.id = 'subtitle-line';
    subtitleBar.appendChild(subtitleLine);
    rootEl.appendChild(subtitleBar);
    let subtitleSpans: (HTMLSpanElement | undefined)[] = [];

    // ─── Data-driven photo list (was CINEMATIC_PHOTOS derived from
    // `images/${i+1}.jpg` in the original; now comes straight from props) ──
    const CINEMATIC_PHOTOS = data.photos;

    function sampleAmbientColor(url: string) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, 32, 32);
          const d = ctx.getImageData(0, 0, 32, 32).data;
          let r = 0,
            g = 0,
            b = 0,
            n = 0;
          for (let i = 0; i < d.length; i += 16) {
            r += d[i];
            g += d[i + 1];
            b += d[i + 2];
            n++;
          }
          r = Math.round(r / n);
          g = Math.round(g / n);
          b = Math.round(b / n);
          const avg = (r + g + b) / 3;
          r = Math.min(255, Math.round(avg + (r - avg) * 1.7));
          g = Math.min(255, Math.round(avg + (g - avg) * 1.7));
          b = Math.min(255, Math.round(avg + (b - avg) * 1.7));
          const br = (r + g + b) / 3;
          if (br < 80) {
            const f = 80 / br;
            r = Math.min(255, Math.round(r * f));
            g = Math.min(255, Math.round(g * f));
            b = Math.min(255, Math.round(b * f));
          }
          document.documentElement.style.setProperty('--ambient-r', String(r));
          document.documentElement.style.setProperty('--ambient-g', String(g));
          document.documentElement.style.setProperty('--ambient-b', String(b));
        } catch (e) {
          /* CORS or taint — keep previous color */
        }
      };
      img.src = url;
    }

    function buildTrack(track: HTMLDivElement | null) {
      if (!track) return;
      track.innerHTML = '';
      const sets = window.innerWidth <= 600 ? 2 : 3;
      for (let set = 0; set < sets; set++) {
        CINEMATIC_PHOTOS.forEach((url, index) => {
          const frame = document.createElement('div');
          frame.className = 'film-frame';
          frame.dataset.index = String(index);

          const sprocketsTop = document.createElement('div');
          sprocketsTop.className = 'sprockets top';

          const photoContainer = document.createElement('div');
          photoContainer.className = 'film-photo-container';

          const img = document.createElement('img');
          img.src = url;
          img.className = 'film-photo';
          img.loading = 'lazy';
          photoContainer.appendChild(img);

          const sprocketsBottom = document.createElement('div');
          sprocketsBottom.className = 'sprockets bottom';

          frame.appendChild(sprocketsTop);
          frame.appendChild(photoContainer);
          frame.appendChild(sprocketsBottom);

          track.appendChild(frame);
        });
      }
    }

    function buildFilmStrip() {
      buildTrack(filmTrackSlantedUp);
      buildTrack(filmTrackSlantedDown);
      buildTrack(filmTrackHorizontal);
    }

    // ─── Camera + Infinite Canvas ──────────────────────────────────────────
    interface Scene {
      idx: number;
      lineIdx: number;
      el: HTMLDivElement;
      photoEl: HTMLImageElement | HTMLVideoElement;
      lyricEl: HTMLDivElement;
      wordSpans: { span: HTMLSpanElement; globalIndex: number }[];
      x: number;
      y: number;
      centerX: number;
      centerY: number;
      startTime: number;
      endTime: number;
      startIndex: number;
      endIndex: number;
      readonly photoUrl: string;
    }

    let scenes: Scene[] = [];
    let currentActiveScene: Scene | null = null;
    let camX = 0,
      camY = 0,
      camRot = 0;
    let targetX = 0,
      targetY = 0,
      targetRot = 0;
    let SCENE_W = 0,
      SCENE_H = 0,
      SCENE_GAP_Y = 0;

    const CAM_LERP = 0.04;
    const CAM_ROT_LERP = 0.03;

    function updateCamera() {
      camX += (targetX - camX) * CAM_LERP;
      camY += (targetY - camY) * CAM_LERP;
      camRot += (targetRot - camRot) * CAM_ROT_LERP;

      const t = performance.now() * 0.001;
      const driftX = Math.sin(t * 0.18) * 1.0;
      const driftY = Math.sin(t * 0.13) * 0.7;

      infiniteCamera.style.transform =
        `translate3d(${(camX + driftX).toFixed(2)}px,${(camY + driftY).toFixed(2)}px,0) ` +
        `rotate(${camRot.toFixed(3)}deg)`;
    }

    function updateFilmFrameActive(sceneIdx: number) {
      const frameIdx = sceneIdx % CINEMATIC_PHOTOS.length;
      [filmTrackSlantedUp, filmTrackSlantedDown, filmTrackHorizontal].forEach((track) => {
        if (!track) return;
        track.querySelectorAll('.film-frame').forEach((frame) => {
          frame.classList.toggle('active', parseInt((frame as HTMLElement).dataset.index || '-1') === frameIdx);
        });
      });
    }

    let lyrics: LyricWord[] = [];

    function buildScenes() {
      infiniteCanvas.innerHTML = '';
      scenes = [];
      subtitleSpans = [];

      const vW = window.innerWidth,
        vH = window.innerHeight;
      const isMobile = vW <= 600;
      SCENE_W = isMobile ? Math.min(vW * 0.82, 340) : Math.min(vW * 0.68, 560);
      SCENE_H = isMobile ? vH * 0.52 : vH * 0.72;
      SCENE_GAP_Y = isMobile ? vH * 0.78 : vH * 0.88;
      const ZIGZAG_X = isMobile ? vW * 0.08 : vW * 0.28;

      const lineGroups: Record<number, (LyricWord & { globalIndex: number })[]> = {};
      lyrics.forEach((w, i) => {
        if (!lineGroups[w.lineIndex]) lineGroups[w.lineIndex] = [];
        lineGroups[w.lineIndex].push({ ...w, globalIndex: i });
      });

      const lineKeys = Object.keys(lineGroups)
        .map(Number)
        .sort((a, b) => a - b);

      lineKeys.forEach((lineIdx, sceneIdx) => {
        const group = lineGroups[lineIdx];
        const fallbackPhoto = CINEMATIC_PHOTOS[sceneIdx % CINEMATIC_PHOTOS.length];
        const xDir = sceneIdx % 2 === 0 ? -1 : 1;
        const sceneX = vW / 2 + xDir * ZIGZAG_X - SCENE_W / 2;
        const sceneY = sceneIdx * SCENE_GAP_Y;
        const startTime = group[0].time;
        const nextKey = lineKeys[sceneIdx + 1];
        const endTime = nextKey !== undefined ? lineGroups[nextKey][0].time : startTime + 8;
        const lyricPos = sceneIdx % 2 === 0 ? 'bottom' : 'top';

        const sceneEl = document.createElement('div');
        sceneEl.className = 'scene';
        sceneEl.style.cssText = `left:${sceneX}px;top:${sceneY}px;width:${SCENE_W}px;`;

        const photoWrap = document.createElement('div');
        photoWrap.className = 'scene-photo-wrap';

        // NOTE (compatibility change from original app.js): the original
        // tried a sequence of file extensions (jpeg/jpg/png/webp) and then an
        // mp4, because it only knew the photo's *index*, not its exact URL.
        // Here SiteData already supplies the exact resolved URL per slot
        // (from Storage in production, or an object URL in preview), so that
        // extension-guessing loop is unnecessary and has been removed. The
        // rendered result is identical for the demo assets, which are the
        // same jpgs the original guessed its way to on the first try.
        const photoEl = document.createElement('img');
        photoEl.className = 'scene-photo';
        photoEl.src = fallbackPhoto;
        photoWrap.appendChild(photoEl);

        const lyricEl = document.createElement('div');
        lyricEl.className = `scene-lyric scene-lyric--${lyricPos}`;
        const wordSpans: { span: HTMLSpanElement; globalIndex: number }[] = [];
        group.forEach((wd) => {
          const span = document.createElement('span');
          span.className = 'scene-word';
          span.textContent = wd.word;
          lyricEl.appendChild(span);
          wordSpans.push({ span, globalIndex: wd.globalIndex });
        });

        if (lyricPos === 'top') {
          sceneEl.appendChild(lyricEl);
          sceneEl.appendChild(photoWrap);
        } else {
          sceneEl.appendChild(photoWrap);
          sceneEl.appendChild(lyricEl);
        }
        infiniteCanvas.appendChild(sceneEl);

        scenes.push({
          idx: sceneIdx,
          lineIdx,
          el: sceneEl,
          photoEl,
          lyricEl,
          wordSpans,
          x: sceneX,
          y: sceneY,
          centerX: sceneX + SCENE_W / 2,
          centerY: sceneY + SCENE_H / 2,
          startTime,
          endTime,
          get photoUrl() {
            return photoEl.src || fallbackPhoto;
          },
          startIndex: group[0].globalIndex,
          endIndex: group[group.length - 1].globalIndex,
        });
      });

      const totalH = scenes.length * SCENE_GAP_Y + vH;
      infiniteCanvas.style.height = `${totalH}px`;
      infiniteCanvas.style.width = `${vW * 1.8}px`;
    }

    function setFilmTracksPlayState(state: 'running' | 'paused') {
      const tracks = document.querySelectorAll<HTMLElement>('.film-track');
      tracks.forEach((track) => {
        track.style.animationPlayState = state;
      });
    }

    // ─── Subtitle ───────────────────────────────────────────────────────────
    function buildSubtitleForLine(lineData: { startIndex: number; endIndex: number }) {
      subtitleLine.innerHTML = '';
      subtitleSpans = [];
      for (let i = lineData.startIndex; i <= lineData.endIndex; i++) {
        const span = document.createElement('span');
        span.className = 'subtitle-word';
        span.textContent = lyrics[i].word;
        subtitleLine.appendChild(span);
        subtitleSpans[i] = span;
      }
    }

    function clearSubtitleLine() {
      subtitleLine.innerHTML = '';
      subtitleSpans = [];
    }

    // ─── Sync Loop ──────────────────────────────────────────────────────────
    let animFrameId: number | null = null;

    function syncLoop() {
      const t = audio.currentTime;

      let newActiveScene: Scene | null = null;
      for (let i = scenes.length - 1; i >= 0; i--) {
        if (t >= scenes[i].startTime) {
          newActiveScene = scenes[i];
          break;
        }
      }

      if (newActiveScene !== currentActiveScene) {
        if (currentActiveScene) currentActiveScene.el.classList.remove('scene-active');
        if (newActiveScene) {
          newActiveScene.el.classList.add('scene-active');
          sampleAmbientColor(newActiveScene.photoUrl);
          updateFilmFrameActive(newActiveScene.idx);
          buildSubtitleForLine({ startIndex: newActiveScene.startIndex, endIndex: newActiveScene.endIndex });
        } else {
          clearSubtitleLine();
        }
        currentActiveScene = newActiveScene;
      }

      {
        const vW = window.innerWidth,
          vH = window.innerHeight;
        let camTarget = newActiveScene;
        if (newActiveScene) {
          const nextIdx = newActiveScene.idx + 1;
          if (nextIdx < scenes.length) {
            const next = scenes[nextIdx];
            if (t >= next.startTime - 1.8) camTarget = next;
          }
        }
        if (camTarget) {
          const mobileOffset = vW <= 600 ? -50 : 0;
          targetX = vW / 2 - camTarget.centerX;
          targetY = vH / 2 - camTarget.centerY + mobileOffset;
          targetRot = camTarget.idx % 2 === 0 ? -0.35 : 0.35;
        }
      }

      if (newActiveScene) {
        let activeWordIdx = -1;
        for (let i = newActiveScene.endIndex; i >= newActiveScene.startIndex; i--) {
          if (t >= lyrics[i].time) {
            activeWordIdx = i;
            break;
          }
        }

        subtitleSpans.forEach((span, i) => {
          if (!span) return;
          if (i < activeWordIdx) span.className = 'subtitle-word spoken';
          else if (i === activeWordIdx) span.className = 'subtitle-word active';
          else span.className = 'subtitle-word';
        });

        newActiveScene.wordSpans.forEach(({ span, globalIndex }) => {
          if (globalIndex < activeWordIdx) span.className = 'scene-word spoken';
          else if (globalIndex === activeWordIdx) span.className = 'scene-word active';
          else span.className = 'scene-word';
        });
      }

      updateCamera();
      updateProgress();
      animFrameId = requestAnimationFrame(syncLoop);
    }

    // ─── Progress System ────────────────────────────────────────────────────
    let isSeekingProgress = false;
    // Original app.js used this as an implicit (undeclared) global, which is
    // only legal in non-strict/script-tag execution. ES modules are always
    // strict mode, so this needed an explicit declaration to run at all —
    // flagged in the Milestone 1 report as a required compatibility fix.
    let lastSeekPct = 0;

    function formatTime(s: number) {
      if (isNaN(s) || s < 0) return '0:00';
      return `${Math.floor(s / 60)}:${Math.floor(s % 60)
        .toString()
        .padStart(2, '0')}`;
    }

    function updateProgress() {
      if (isSeekingProgress) return;
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      if (cardProgressFill) cardProgressFill.style.width = pct + '%';
      if (cardTimeCurrent) cardTimeCurrent.textContent = formatTime(audio.currentTime);
      if (cardTimeTotal && audio.duration) {
        const remaining = audio.duration - audio.currentTime;
        cardTimeTotal.textContent = '-' + formatTime(remaining);
      }
    }

    // ─── Playback Control ───────────────────────────────────────────────────
    function updatePlayButtonUI() {
      const isPlaying = !audio.paused && !audio.ended;
      if (isPlaying) {
        startBtn.innerHTML = `
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        `;
      } else {
        startBtn.innerHTML = `
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8 5 19 12 8 19 8 5"/>
          </svg>
        `;
      }
    }

    function startPlay() {
      startOverlay.classList.add('playing');
      audio.play().catch((err) => {
        console.error('Playback failed:', err);
      });
    }

    function togglePlay() {
      if (!startOverlay.classList.contains('playing')) {
        startPlay();
        return;
      }
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }

    function onStartBtnClick(e: MouseEvent) {
      e.stopPropagation();
      togglePlay();
    }

    function onDocumentClick(e: MouseEvent) {
      if ((e.target as HTMLElement).closest('.player-card')) return;
      togglePlay();
    }

    function seekCard(e: MouseEvent | TouchEvent): number | undefined {
      if (!cardProgressTrack) return;
      const rect = cardProgressTrack.getBoundingClientRect();
      let clientX: number | undefined;
      if ('clientX' in e && e.clientX !== undefined) {
        clientX = e.clientX;
      } else if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
      }
      if (clientX === undefined) return;

      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      if (cardProgressFill) cardProgressFill.style.width = pct * 100 + '%';
      if (cardTimeCurrent) cardTimeCurrent.textContent = formatTime(audio.duration ? pct * audio.duration : 0);
      if (cardTimeTotal && audio.duration) {
        const remaining = audio.duration - (audio.duration ? pct * audio.duration : 0);
        cardTimeTotal.textContent = '-' + formatTime(remaining);
      }
      return pct;
    }

    function commitSeek(pct: number | undefined) {
      if (pct !== undefined && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        audio.currentTime = pct * audio.duration;
      }
      isSeekingProgress = false;
    }

    const cardMouseDown = (e: MouseEvent) => {
      if (!audio.src && !audio.currentSrc) return;
      e.preventDefault();
      isSeekingProgress = true;
      lastSeekPct = seekCard(e) ?? 0;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (isSeekingProgress) lastSeekPct = seekCard(moveEvent) ?? lastSeekPct;
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (isSeekingProgress) {
          isSeekingProgress = false;
          commitSeek(lastSeekPct);
        }
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const cardTouchStart = (e: TouchEvent) => {
      if (!audio.src && !audio.currentSrc) return;
      isSeekingProgress = true;
      lastSeekPct = seekCard(e) ?? 0;

      const onTouchMove = (moveEvent: TouchEvent) => {
        if (isSeekingProgress) lastSeekPct = seekCard(moveEvent) ?? lastSeekPct;
      };
      const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        if (isSeekingProgress) {
          isSeekingProgress = false;
          commitSeek(lastSeekPct);
        }
      };
      document.addEventListener('touchmove', onTouchMove, { passive: true });
      document.addEventListener('touchend', onTouchEnd);
    };

    const cardClick = (e: MouseEvent) => {
      if (!audio.src && !audio.currentSrc) return;
      const pct = seekCard(e);
      commitSeek(pct);
    };

    if (cardProgressTrack) {
      cardProgressTrack.addEventListener('mousedown', cardMouseDown);
      cardProgressTrack.addEventListener('touchstart', cardTouchStart, { passive: true });
      cardProgressTrack.addEventListener('click', cardClick);
    }

    // ─── Audio Listeners ────────────────────────────────────────────────────
    const onLoadedMetadata = () => {
      if (cardTimeTotal) cardTimeTotal.textContent = '-' + formatTime(audio.duration);
    };

    const onPlay = () => {
      pauseIndicator.classList.remove('show');
      setFilmTracksPlayState('running');
      updatePlayButtonUI();
      document.body.classList.add('playing');
      if (!startOverlay.classList.contains('playing')) {
        startOverlay.classList.add('playing');
      }
      startOverlay.classList.remove('paused');
      if (!animFrameId) syncLoop();
    };

    const onPause = () => {
      if (startOverlay.classList.contains('playing')) {
        pauseIndicator.classList.add('show');
      }
      setFilmTracksPlayState('paused');
      updatePlayButtonUI();
      document.body.classList.remove('playing');
      startOverlay.classList.add('paused');
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    };

    const onEnded = () => {
      pauseIndicator.classList.remove('show');
      startOverlay.classList.remove('playing');
      startOverlay.classList.remove('paused');
      setFilmTracksPlayState('paused');
      updatePlayButtonUI();
      document.body.classList.remove('playing');
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      scenes.forEach((s) => {
        s.el.classList.remove('scene-active');
        s.wordSpans.forEach(({ span }) => {
          span.className = 'scene-word';
        });
      });
      currentActiveScene = null;
      clearSubtitleLine();
      document.querySelectorAll('.film-frame').forEach((f) => f.classList.remove('active'));
    };

    const onSeeked = () => {
      currentActiveScene = null;
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('seeked', onSeeked);

    startBtn.addEventListener('click', onStartBtnClick);
    document.addEventListener('click', onDocumentClick);

    // ─── Keyboard Events ────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        audio.currentTime = Math.max(0, audio.currentTime - 5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        audio.volume = Math.min(1, audio.volume + 0.1);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        audio.volume = Math.max(0, audio.volume - 0.1);
      }
    };
    document.addEventListener('keydown', onKeyDown);

    // ─── Animated Favicon (Cute Retro Vinyl with Blushing Heart) ───────────
    let faviconTimeoutId: ReturnType<typeof setTimeout> | null = null;
    function initFaviconAnimation() {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctxRef = canvas.getContext('2d');
      if (!ctxRef) return;
      const ctx: CanvasRenderingContext2D = ctxRef;

      let faviconLinkRef = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!faviconLinkRef) {
        faviconLinkRef = document.createElement('link');
        faviconLinkRef.rel = 'icon';
        document.head.appendChild(faviconLinkRef);
      }
      const faviconLink: HTMLLinkElement = faviconLinkRef;

      let rotation = 0;
      let heartScale = 1;
      let pulseDirection = 1;
      let noteOffset = 0;

      function drawVinyl() {
        ctx.clearRect(0, 0, 32, 32);

        ctx.fillStyle = '#18181c';
        ctx.beginPath();
        ctx.arc(16, 16, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2d2d35';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(16, 16, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(16, 16, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.translate(16, 16);
        ctx.rotate(rotation);

        ctx.fillStyle = '#ff8da1';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(3, 0, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        ctx.save();
        ctx.translate(16, 16);
        ctx.scale(heartScale * 0.46, heartScale * 0.46);

        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.bezierCurveTo(-6, -12, -14, -6, -14, 2);
        ctx.bezierCurveTo(-14, 9, -6, 15, 0, 20);
        ctx.bezierCurveTo(6, 15, 14, 9, 14, 2);
        ctx.bezierCurveTo(14, -6, 6, -12, 0, -6);

        ctx.fillStyle = '#ff4b81';
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-3, 0, 1, 0, Math.PI * 2);
        ctx.arc(3, 0, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff8da1';
        ctx.beginPath();
        ctx.arc(-6, 2, 1.5, 0, Math.PI * 2);
        ctx.arc(6, 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 9px "Courier New", monospace';
        const noteX = 22 + Math.sin(noteOffset) * 2;
        const noteY = 13 - noteOffset;
        ctx.fillText('♪', noteX, noteY);

        faviconLink.href = canvas.toDataURL('image/png');
      }

      function animate() {
        rotation += 0.15;
        heartScale += 0.04 * pulseDirection;
        if (heartScale >= 1.15) pulseDirection = -1;
        else if (heartScale <= 0.85) pulseDirection = 1;

        noteOffset += 0.35;
        if (noteOffset > 10) noteOffset = 0;

        drawVinyl();
        faviconTimeoutId = setTimeout(animate, 120);
      }

      animate();
    }

    // ─── Initialization ─────────────────────────────────────────────────────
    initFaviconAnimation();

    lyrics = data.lyrics && data.lyrics.length > 0 ? [...data.lyrics] : [...fallbackInterpolatedLyrics];
    // Dynamic splitting: if the gap between two words is > 2.2s, split into a
    // new line (identical rule to the original init()).
    let lineIdx = 0;
    const splitLyrics: LyricWord[] = [];
    lyrics.forEach((w, i, arr) => {
      if (i > 0) {
        const prevW = arr[i - 1];
        const timeGap = w.time - prevW.time;
        if (timeGap > 2.2) lineIdx++;
        else if (w.lineIndex !== prevW.lineIndex) lineIdx++;
      }
      splitLyrics.push({ ...w, lineIndex: lineIdx });
    });
    lyrics = splitLyrics;

    buildScenes();
    buildFilmStrip();

    // Pre-load audio as Blob URL for reliable seeking across browsers —
    // ported as-is. In production this fetches a Firebase Storage download
    // URL; that bucket needs CORS configured for GET (flagged for the
    // Firebase milestone), or this falls back to the direct URL, same as
    // the original's catch branch.
    let objectUrlToRevoke: string | null = null;
    const defaultSrc = data.audioUrl;
    if (defaultSrc && defaultSrc.trim() !== '') {
      fetch(defaultSrc)
        .then((response) => response.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          objectUrlToRevoke = url;
          audio.src = url;
          audio.load();
        })
        .catch(() => {
          audio.src = defaultSrc;
        });
    }

    // ─── Cleanup (new — required for React mount/unmount; the original
    // script assumed a single, never-unmounted page load) ────────────────
    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (faviconTimeoutId) clearTimeout(faviconTimeoutId);
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);

      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.cursor = previousBodyCursor;
      document.body.style.userSelect = previousBodyUserSelect;

      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('seeked', onSeeked);
      startBtn.removeEventListener('click', onStartBtnClick);
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onKeyDown);

      if (cardProgressTrack) {
        cardProgressTrack.removeEventListener('mousedown', cardMouseDown);
        cardProgressTrack.removeEventListener('touchstart', cardTouchStart);
        cardProgressTrack.removeEventListener('click', cardClick);
      }

      subtitleBar.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refs, data]);
}

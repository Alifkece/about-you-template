import { LyricWord } from '@/types/site';

/**
 * Ported verbatim from js/lyrics_data.js (window.whisperLyrics).
 * Word-synced lyrics data for "About You" by The 1975.
 */
export const defaultWhisperLyrics: LyricWord[] = [
  { word: 'I', time: 0.26, lineIndex: 0 },
  { word: 'know', time: 4.56, lineIndex: 0 },
  { word: 'a', time: 5.0, lineIndex: 0 },
  { word: 'place', time: 5.16, lineIndex: 0 },

  { word: "It's", time: 9.9, lineIndex: 1 },
  { word: 'somewhere', time: 10.22, lineIndex: 1 },
  { word: 'I', time: 11.32, lineIndex: 1 },
  { word: 'go', time: 11.52, lineIndex: 1 },
  { word: 'when', time: 12.14, lineIndex: 1 },
  { word: 'I', time: 12.56, lineIndex: 1 },
  { word: 'need', time: 12.76, lineIndex: 1 },
  { word: 'to', time: 13.36, lineIndex: 1 },
  { word: 'remember', time: 13.84, lineIndex: 1 },
  { word: 'your', time: 15.02, lineIndex: 1 },
  { word: 'face', time: 15.9, lineIndex: 1 },

  { word: 'We', time: 19.6, lineIndex: 2 },
  { word: 'get', time: 20.02, lineIndex: 2 },
  { word: 'married', time: 20.3, lineIndex: 2 },
  { word: 'in', time: 24.64, lineIndex: 2 },
  { word: 'our', time: 25.08, lineIndex: 2 },
  { word: 'heads', time: 25.88, lineIndex: 2 },

  { word: 'Something', time: 30.24, lineIndex: 3 },
  { word: 'to', time: 31.28, lineIndex: 3 },
  { word: 'do', time: 31.54, lineIndex: 3 },
  { word: 'while', time: 32.14, lineIndex: 3 },
  { word: 'we', time: 32.46, lineIndex: 3 },
  { word: 'try', time: 32.7, lineIndex: 3 },
  { word: 'to', time: 33.42, lineIndex: 3 },
  { word: 'recall', time: 33.72, lineIndex: 3 },
  { word: 'how', time: 34.62, lineIndex: 3 },
  { word: 'we', time: 35.0, lineIndex: 3 },
  { word: 'met', time: 35.94, lineIndex: 3 },

  { word: 'Do', time: 39.66, lineIndex: 4 },
  { word: 'you', time: 39.94, lineIndex: 4 },
  { word: 'think', time: 40.28, lineIndex: 4 },
  { word: 'I', time: 41.4, lineIndex: 4 },
  { word: 'have', time: 41.56, lineIndex: 4 },
  { word: 'forgotten?', time: 42.44, lineIndex: 4 },

  { word: 'Do', time: 44.66, lineIndex: 5 },
  { word: 'you', time: 44.92, lineIndex: 5 },
  { word: 'think', time: 45.24, lineIndex: 5 },
  { word: 'I', time: 46.42, lineIndex: 5 },
  { word: 'have', time: 46.74, lineIndex: 5 },
  { word: 'forgotten?', time: 47.44, lineIndex: 5 },

  { word: 'Do', time: 49.64, lineIndex: 6 },
  { word: 'you', time: 49.86, lineIndex: 6 },
  { word: 'think', time: 50.22, lineIndex: 6 },
  { word: 'I', time: 51.38, lineIndex: 6 },
  { word: 'have', time: 51.66, lineIndex: 6 },
  { word: 'forgotten', time: 52.52, lineIndex: 6 },

  { word: 'About', time: 54.7, lineIndex: 7 },
  { word: 'you?', time: 56.24, lineIndex: 7 },
];

/** Ported verbatim from app.js FALLBACK_LINE_DATA. Used only if no word-synced
 *  lyrics are supplied at all (neither whisperLyrics nor a custom SiteData.lyrics). */
const FALLBACK_LINE_DATA = [
  { time: 0.26, text: 'I know a place' },
  { time: 9.9, text: "It's somewhere I go when I need to remember your face" },
  { time: 19.6, text: 'We get married in our heads' },
  { time: 30.24, text: 'Something to do while we try to recall how we met' },
  { time: 39.66, text: 'Do you think I have forgotten?' },
  { time: 44.66, text: 'Do you think I have forgotten?' },
  { time: 49.64, text: 'Do you think I have forgotten' },
  { time: 54.7, text: 'About you?' },
];

/** Ported verbatim from app.js interpolateLines(). */
export function interpolateLines(lines: typeof FALLBACK_LINE_DATA): LyricWord[] {
  const words: LyricWord[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineWords = line.text.split(/\s+/);
    const lineStart = line.time;
    const lineEnd = i + 1 < lines.length ? lines[i + 1].time : lineStart + lineWords.length * 0.45;
    const singDuration = (lineEnd - lineStart) * 0.85;
    const interval = lineWords.length > 1 ? singDuration / lineWords.length : 0;

    lineWords.forEach((word, wi) => {
      words.push({ word, time: lineStart + wi * interval, lineIndex: i });
    });
  }
  return words;
}

export const fallbackInterpolatedLyrics: LyricWord[] = interpolateLines(FALLBACK_LINE_DATA);

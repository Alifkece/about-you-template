// Shared data contract for the Experience engine.
// ExperiencePlayer NEVER talks to Firebase directly — it only ever receives
// this shape as props, whether that data comes from Firestore (production),
// local object URLs (live preview), or the static demo defaults (this milestone).

export interface LyricWord {
  word: string;
  time: number;
  lineIndex: number;
}

export interface SiteData {
  /** Download URL (or local object URL) for the cover / album art image */
  cover: string;
  /** Exactly 10 download URLs (or local object URLs), index 0-9 */
  photos: string[];
  /** Download URL (or local object URL) for the audio track */
  audioUrl: string;
  /**
   * Optional word-synced lyrics. If omitted, the engine falls back to
   * interpolating line-level timings (same behavior as the original app.js
   * when window.whisperLyrics was unavailable).
   */
  lyrics?: LyricWord[];
}

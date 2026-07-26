import { SiteData } from '@/types/site';
import { defaultWhisperLyrics } from './lyrics';

/**
 * The original 11 static assets (1 cover + 10 photos + 1 track), served from
 * /public exactly as they were in the current live site. Used only by the
 * /demo page for a like-for-like comparison against the original — production
 * routes (/[slug]) will supply this same shape from Firestore instead.
 */
export const defaultSiteData: SiteData = {
  cover: '/images/about.jpg',
  photos: Array.from({ length: 10 }, (_, i) => `/images/${i + 1}.jpg`),
  audioUrl: '/media/about-you.mp3',
  lyrics: defaultWhisperLyrics,
};

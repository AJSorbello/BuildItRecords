import { z } from 'zod';
import { validateSpotifyId } from '../../utils/validation';
import { validateLabelId } from '../../types/label';

// Base schemas
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  offset: z.number().int().min(0).optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  data => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
  { message: 'Start date must be before or equal to end date' }
);

// Track schemas
export const trackSchema = z.object({
  id: z.string().refine(validateSpotifyId, {
    message: 'Invalid Spotify track ID',
  }),
  name: z.string().min(1).max(200),
  duration_ms: z.number().int().positive(),
  track_number: z.number().int().positive(),
  disc_number: z.number().int().positive(),
  explicit: z.boolean(),
  preview_url: z.string().url().nullable(),
  popularity: z.number().int().min(0).max(100),
  external_urls: z.object({
    spotify: z.string().url(),
  }),
  external_ids: z.object({
    isrc: z.string(),
  }).optional(),
});

// Album schemas
export const albumSchema = z.object({
  id: z.string().refine(validateSpotifyId, {
    message: 'Invalid Spotify album ID',
  }),
  name: z.string().min(1).max(200),
  album_type: z.enum(['album', 'single', 'compilation']),
  total_tracks: z.number().int().positive(),
  release_date: z.string(),
  release_date_precision: z.enum(['year', 'month', 'day']),
  images: z.array(z.object({
    url: z.string().url(),
    height: z.number().nullable(),
    width: z.number().nullable(),
  })),
});

// Artist schemas
export const artistSchema = z.object({
  id: z.string().refine(validateSpotifyId, {
    message: 'Invalid Spotify artist ID',
  }),
  name: z.string().min(1).max(200),
  genres: z.array(z.string()).optional(),
  popularity: z.number().int().min(0).max(100).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    height: z.number().nullable(),
    width: z.number().nullable(),
  })).optional(),
});

// Label schemas
export const labelSchema = z.object({
  id: z.string().refine(validateLabelId, {
    message: 'Invalid label ID',
  }),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
  social_media: z.object({
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    instagram: z.string().url().optional(),
  }).optional(),
});

// Import schemas
export const importRequestSchema = z.object({
  labelId: z.string().refine(validateLabelId, {
    message: 'Invalid label ID',
  }),
  options: z.object({
    includeArtists: z.boolean().optional(),
    includeAlbums: z.boolean().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
});

// Search schemas
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(['track', 'album', 'artist', 'label']).optional(),
  filters: z.object({
    genre: z.string().optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
    label: z.string().optional(),
  }).optional(),
}).merge(paginationSchema);

// Playlist schemas
export const playlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  tracks: z.array(z.string().refine(validateSpotifyId, {
    message: 'Invalid Spotify track ID',
  })),
  isPublic: z.boolean().optional(),
});

// Export combined schemas for common use cases
export const trackSearchRequestSchema = searchSchema.merge(paginationSchema);
export const albumSearchRequestSchema = searchSchema.merge(paginationSchema);
export const importTrackRequestSchema = trackSchema.merge(importRequestSchema);
export const createPlaylistRequestSchema = playlistSchema.merge(z.object({
  labelId: z.string().refine(validateLabelId, {
    message: 'Invalid label ID',
  }).optional(),
}));

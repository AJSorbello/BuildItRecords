import { RECORD_LABELS, RecordLabel } from '../constants/labels';
import type { Artist } from './Artist';
import type { Album } from './Album';

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface Track {
  id: string;
  name: string;
  trackTitle: string;
  artist: string;
  artists: Artist[];
  album: Album;
  albumCover: string;
  recordLabel: RecordLabel;
  label: RecordLabel;
  releaseDate: string;
  previewUrl: string | null;
  beatportUrl: string;
  soundcloudUrl: string;
  spotifyUrl: string;
  popularity?: number;
  featured?: boolean;
  genres: string[];
}

// Helper function to convert legacy track format to full Track
export function createTrack(legacyTrack: Partial<Track>): Track {
  // Ensure we have a valid record label
  const validLabel = Object.values(RECORD_LABELS).find(
    label => label === legacyTrack.recordLabel || 
            label.toLowerCase() === legacyTrack.recordLabel?.toLowerCase()
  ) || RECORD_LABELS['Build It Records'];

  return {
    id: legacyTrack.id || '',
    name: legacyTrack.name || '',
    trackTitle: legacyTrack.trackTitle || legacyTrack.name || '',
    artist: legacyTrack.artist || '',
    artists: legacyTrack.artists || [],
    album: legacyTrack.album || {
      id: '',
      name: '',
      releaseDate: new Date().toISOString(),
      totalTracks: 1,
      images: []
    },
    albumCover: legacyTrack.albumCover || '',
    recordLabel: validLabel,
    label: validLabel,
    releaseDate: legacyTrack.releaseDate || new Date().toISOString(),
    previewUrl: legacyTrack.previewUrl || null,
    beatportUrl: legacyTrack.beatportUrl || '',
    soundcloudUrl: legacyTrack.soundcloudUrl || '',
    spotifyUrl: legacyTrack.spotifyUrl || '',
    popularity: legacyTrack.popularity || 0,
    featured: legacyTrack.featured || false,
    genres: legacyTrack.genres || []
  };
}

export interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }[];
  album: {
    id: string;
    name: string;
    release_date: string;
    images: SpotifyImage[];
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  tracks: {
    items: {
      track: SpotifyApiTrack;
      added_at: string;
    }[];
  };
  external_urls: {
    spotify: string;
  };
  owner: {
    display_name: string;
  };
}

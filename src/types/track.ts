import type { Artist } from './artist';
import type { SpotifyImage } from './spotify';

export interface Album {
  id: string;
  name: string;
  artwork_url?: string;
  images?: SpotifyImage[];
  release_date?: string;
}

export interface Track {
  id: string;
  name: string;
  uri?: string;
  type?: 'track' | 'single' | 'album';
  artists: Artist[] | string[];
  album?: Album;
  albumCover?: string;
  artwork_url?: string;
  duration_ms?: number;
  preview_url?: string | null;
  external_urls?: {
    spotify: string;
  };
  external_ids?: {
    [key: string]: string;
  };
  popularity?: number;
  spotifyUrl?: string;
  recordLabel?: string;
  releaseDate?: string;
  release_date?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  label_id?: string;
  total_tracks?: number;
  tracks?: Track[];
}

export interface TrackResponse {
  tracks: {
    items: Track[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface TrackSearchParams {
  artistId?: string;
  albumId?: string;
  labelId?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

export interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
    release_date: string;
  };
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
}

import type { SpotifyImage } from './spotify';
import type { SpotifyArtist } from './artist';

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
  uri: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
    release_date: string;
    external_urls: {
      spotify: string;
    };
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  popularity: number;
  explicit: boolean;
  track_number: number;
  disc_number: number;
  is_local: boolean;
  cached_at?: number;
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

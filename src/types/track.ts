import type { SpotifyImage } from './spotify';
import type { SpotifyArtist } from './artist';

export interface Album {
  id?: string;
  name: string;
  artwork_url?: string;
  images?: SpotifyImage[];
  release_date?: string;
  external_urls?: {
    spotify: string;
  };
  artists?: SpotifyArtist[];
}

export interface Track {
  id: string;
  name: string;
  uri?: string;
  type?: string;
  duration_ms?: number;
  duration?: number;
  artists: SpotifyArtist[];
  album?: Album;
  preview_url?: string | null;
  external_urls?: {
    spotify: string;
  };
  external_ids?: {
    [key: string]: string;
  };
  spotify_url?: string;
  spotifyUrl?: string;
  artwork_url?: string;
  artistImage?: string;
  popularity?: number;
  explicit?: boolean;
  track_number?: number;
  disc_number?: number;
  is_local?: boolean;
  label_id?: string;
  spotify_uri?: string;
  cached_at?: number;
  releaseDate?: string;
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
  search?: string;
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

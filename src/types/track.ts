import type { Artist } from './artist';
import type { Album } from './release';
import type { Track as SpotifyApiTrack } from '@spotify/web-api-ts-sdk';

export type { SpotifyApiTrack as SpotifyTrack };

export interface Track {
  id: string;
  title: string;
  name: string;
  artists: {
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }[];
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  uri: string;
  label?: string;
  releaseDate?: string;
  artworkUrl?: string;
  featured?: boolean;
  popularity: number;
  album: Album;
  spotifyUrl?: string;
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
  query?: string;
  limit?: number;
  offset?: number;
}

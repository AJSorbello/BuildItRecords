import type { Artist } from './artist';
import type { Album } from './release';
import type { Track as SpotifyApiTrack } from '@spotify/web-api-ts-sdk';
import type { RecordLabel } from '.';

export type { SpotifyApiTrack as SpotifyTrack };

export interface Track {
  id: string;
  name: string;
  title: string;
  type: string;
  artists: {
    id: string;
    name: string;
    uri: string;
    external_urls: { spotify: string };
    spotifyUrl: string;
    type: string;
    spotify_url: string;
  }[];
  duration_ms: number;
  preview_url: string | null;
  external_urls: { spotify: string };
  external_ids: {
    isrc?: string;
    [key: string]: string | undefined;
  };
  uri: string;
  album: Album;
  popularity: number;
  recordLabel?: string;
  label?: RecordLabel;
  featured: boolean;
  releaseDate: string;
  artworkUrl?: string;
  spotifyUrl: string;
  images?: { url: string; height: number | null; width: number | null }[];
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

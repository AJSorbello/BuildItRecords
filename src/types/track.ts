import type { Artist } from './artist';
import type { Album } from './release';
import type { Track as SpotifyApiTrack } from '@spotify/web-api-ts-sdk';
import { RecordLabel } from '../constants/labels';

export type { SpotifyApiTrack as SpotifyTrack };

export interface Track {
  id: string;
  name: string;
  title: string;
  artists: {
    id: string;
    name: string;
    uri: string;
  }[];
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  external_ids: {
    isrc: string;
  };
  uri: string;
  album: Album;
  popularity: number;
  recordLabel?: string;
  label?: RecordLabel;
  featured?: boolean;
  releaseDate: string;
  artworkUrl?: string;
  spotifyUrl: string;
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

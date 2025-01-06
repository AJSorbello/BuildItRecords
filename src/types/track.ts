import type { Artist } from './artist';
import type { Album } from './release';
import type { RecordLabel } from './label';
import type { SpotifyImage } from './spotify';

export interface Track {
  id: string;
  name: string;
  uri: string;
  type: 'track';
  artists: Artist[];
  album?: Album;
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  external_ids?: {
    [key: string]: string;
  };
  popularity?: number;
  spotifyUrl: string;
  label?: RecordLabel;
  images?: SpotifyImage[];
  recordLabel?: string;
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

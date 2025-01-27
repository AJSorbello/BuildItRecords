import type { Artist } from './models';
import type { Track } from './models';
import type { Album, Release } from './models';
import type { RecordLabel } from './label';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchResponse {
  artists?: PaginatedResponse<Artist>;
  tracks?: PaginatedResponse<Track>;
  albums?: PaginatedResponse<Album>;
  labels?: PaginatedResponse<RecordLabel>;
}

export interface SearchParams {
  query: string;
  types?: ('artist' | 'track' | 'album' | 'label')[];
  limit?: number;
  offset?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ReleasesResponse {
  label: string;
  totalReleases: number;
  releases: Release[];
  error?: ApiError;
}

export interface ArtistResponse {
  artist: Artist;
  topTracks?: Track[];
  albums?: Album[];
  relatedArtists?: Artist[];
  error?: ApiError;
}

export interface SpotifyTrack {
  name: string;
  artists: Artist[];
  album: Album;
  external_urls: {
    spotify: string;
  };
}

export interface BeatportTrack {
  name: string;
  artists: Artist[];
  release: Release;
  publish_date: string;
  url: string;
  isrc: string;
}

export interface SoundCloudTrack {
  title: string;
  user: {
    username: string;
  };
  artwork_url: string | null;
  created_at: string;
  permalink_url: string;
}

export interface PlatformTrackData {
  title: string;
  artist: string;
  imageUrl: string;
  releaseDate: string;
  spotifyUrl?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  isrc?: string;
}

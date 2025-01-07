import type { Artist } from './artist';
import type { Track } from './track';
import type { RecordLabel } from './label';
import type { SpotifyImage } from './spotify';

export interface Release {
  id: string;
  name: string;
  type?: 'album' | 'single' | 'compilation';
  artists?: Artist[];
  release_date?: string;
  total_tracks?: number;
  images?: SpotifyImage[];
  external_urls?: {
    spotify?: string;
  };
  label?: RecordLabel;
  featured?: boolean;
  description?: string;
  artwork_url?: string;
  albumCover?: string;
  album?: {
    name: string;
    artwork_url?: string;
    images?: SpotifyImage[];
  };
  tracks?: Track[];
}

export interface PaginatedResponse<T> {
  releases: T[];
  totalReleases: number;
  currentPage: number;
  totalPages: number;
}

export type RecordLabelId = 'buildit-deep' | 'buildit-tech' | 'buildit-house';

export interface AlbumResponse {
  albums: {
    items: Release[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ReleaseSearchParams {
  artistId?: string;
  query?: string;
  limit?: number;
  offset?: number;
  include_groups?: ('album' | 'single' | 'compilation')[];
}

export interface ReleaseFormData {
  title: string;
  artist: string;
  artworkUrl: string;
  releaseDate: string;
  label: string;
  featured: boolean;
}

export function getArtistName(artist: string | { id: string; name: string; uri: string }): string {
  return typeof artist === 'string' ? artist : artist.name;
}

export function getArtistId(artist: string | { id: string; name: string; uri: string }): string | undefined {
  return typeof artist === 'string' ? undefined : artist.id;
}

export function createRelease(data: Partial<Release>): Release {
  return {
    id: data.id || '',
    name: data.name || '',
    type: data.type,
    artists: data.artists || [],
    release_date: data.release_date,
    total_tracks: data.total_tracks,
    images: data.images || [],
    external_urls: data.external_urls || {},
    label: data.label,
    featured: data.featured || false,
    description: data.description || '',
    artwork_url: data.artwork_url || '',
    albumCover: data.albumCover || '',
    album: data.album || {},
    tracks: data.tracks || []
  };
}

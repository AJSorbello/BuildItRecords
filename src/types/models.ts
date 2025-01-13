// Base shared types
export interface Image {
  url: string;
  height: number;
  width: number;
}

export interface ExternalUrls {
  spotify: string;
  [key: string]: string;
}

export interface ExternalIds {
  isrc?: string;
}

// Core models
export interface Artist {
  id: string;
  name: string;
  external_urls: ExternalUrls;
  images?: Image[];
  followers?: {
    total: number;
    href: string | null;
  };
  uri?: string;
}

export interface Album {
  id: string;
  name: string;
  type?: 'album' | 'single' | 'compilation';
  external_urls: ExternalUrls;
  images: Image[];
  release_date?: string;
  artists: Artist[];
  tracks?: Track[];
  uri?: string;
  total_tracks?: number;
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  duration_ms: number;
  preview_url?: string;
  external_urls: ExternalUrls;
  external_ids?: ExternalIds;
  album: Album;
  release?: Release[];
  type?: 'track';
  spotify_id?: string;
  label_id?: string;
  uri?: string;
  isrc?: string;
}

export interface Release {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  tracks: Track[];
  external_urls: ExternalUrls;
  release_date?: string;
  artwork_url?: string;
  uri?: string;
}

// Database models
export interface BaseModel {
  createdAt: string;
  updatedAt: string;
}

export interface ArtistModel extends Artist, BaseModel {
  labelId?: string;
}

export interface TrackModel extends Track, BaseModel {
  labelId?: string;
  artistIds: string[];
  albumId?: string;
}

export interface AlbumModel extends Album, BaseModel {
  labelId?: string;
  artistIds: string[];
  trackIds: string[];
}

export interface ReleaseModel extends Release, BaseModel {
  labelId?: string;
  artistIds: string[];
  trackIds: string[];
  release_date: string;
}

export interface LabelModel extends BaseModel {
  artistIds: string[];
  trackIds: string[];
  releaseIds: string[];
}

export interface TokenModel extends BaseModel {
  id: string;
  userId: string;
  token: string;
  type: 'refresh' | 'access';
  expiresAt: string;
}

// Type Guards
export function isArtist(obj: any): obj is Artist {
  return obj && typeof obj === 'object'
    && typeof obj.id === 'string'
    && typeof obj.name === 'string';
}

export function isTrack(obj: any): obj is Track {
  return obj && typeof obj === 'object'
    && typeof obj.id === 'string'
    && typeof obj.name === 'string'
    && Array.isArray(obj.artists);
}

export function isRelease(obj: any): obj is Release {
  return obj && typeof obj === 'object'
    && typeof obj.id === 'string'
    && typeof obj.name === 'string'
    && Array.isArray(obj.artists)
    && Array.isArray(obj.tracks);
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

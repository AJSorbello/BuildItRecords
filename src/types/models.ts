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
  tracks?: any[];
  uri?: string;
  total_tracks?: number;
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  duration_ms: number;
  preview_url?: string | null;
  external_urls: ExternalUrls;
  external_ids?: ExternalIds;
  album: Album;
  release?: any[];
  type?: 'track';
  spotify_id?: string;
  label_id?: string;
  uri?: string;
  isrc?: string;
  spotifyUrl?: string;
  albumCover?: string;
  label?: {
    id: string;
    name: string;
  };
  releaseDate?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
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
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistModel extends BaseModel {
  labelId?: string;
  name: string;
  spotifyId: string;
  spotifyUrl: string;
  imageUrl?: string;
  genres?: string[];
  followers?: number;
}

export interface TrackModel extends BaseModel {
  labelId?: string;
  artistIds: string[];
  albumId?: string;
  name: string;
  spotifyId: string;
  spotifyUrl: string;
  previewUrl?: string;
  durationMs: number;
  popularity?: number;
  explicit: boolean;
  isrc?: string;
}

export interface AlbumModel extends BaseModel {
  labelId?: string;
  artistIds: string[];
  trackIds: string[];
  name: string;
  spotifyId: string;
  spotifyUrl: string;
  imageUrl?: string;
  releaseDate: string;
  albumType: 'album' | 'single' | 'compilation';
  totalTracks: number;
}

export interface ReleaseModel extends BaseModel {
  labelId?: string;
  artistIds: string[];
  trackIds: string[];
  name: string;
  releaseDate: string;
  imageUrl?: string;
  spotifyUrl?: string;
}

export interface LabelModel extends BaseModel {
  name: string;
  artistIds: string[];
  trackIds: string[];
  releaseIds: string[];
  imageUrl?: string;
  description?: string;
  website?: string;
}

export interface TokenModel extends BaseModel {
  userId: string;
  token: string;
  type: 'refresh' | 'access';
  expiresAt: string;
}

export interface UserModel extends BaseModel {
  username: string;
  email: string;
  role: 'admin' | 'user';
  hashedPassword: string;
  lastLoginAt?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

// Type Guards
export function isArtistModel(obj: any): obj is ArtistModel {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.spotifyId === 'string'
  );
}

export function isTrackModel(obj: any): obj is TrackModel {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.spotifyId === 'string' &&
    Array.isArray(obj.artistIds)
  );
}

export function isReleaseModel(obj: any): obj is ReleaseModel {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.releaseDate === 'string' &&
    Array.isArray(obj.artistIds) &&
    Array.isArray(obj.trackIds)
  );
}

export function isLabelModel(obj: any): obj is LabelModel {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.artistIds) &&
    Array.isArray(obj.trackIds) &&
    Array.isArray(obj.releaseIds)
  );
}

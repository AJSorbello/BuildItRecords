// Base Types
export interface Image {
  url: string;
  height: number | null;
  width: number | null;
}

export interface ExternalUrls {
  spotify: string;
}

export interface ExternalIds {
  isrc?: string;
  ean?: string;
  upc?: string;
}

export interface Followers {
  href: string | null;
  total: number;
}

export interface Copyright {
  text: string;
  type: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

// Spotify API Types
export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: ExternalUrls;
  images?: Image[];
  uri: string;
  type: 'artist';
  followers?: Followers;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  external_urls: ExternalUrls;
  external_ids?: ExternalIds;
  uri: string;
  type: 'track';
  artists: SpotifyArtist[];
  album?: SpotifyAlbum;
  preview_url: string | null;
  popularity?: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  release_date_precision: string;
  images: Image[];
  external_urls: ExternalUrls;
  uri: string;
  type: 'album';
  artists: SpotifyArtist[];
  total_tracks: number;
  tracks?: {
    items: SpotifyTrack[];
    total: number;
  };
  copyrights?: Copyright[];
}

// App Types
export interface Artist {
  id: string;
  name: string;
  uri: string;
  type: 'artist';
  external_urls: ExternalUrls;
  spotify_url: string;
  image_url?: string;
}

export interface Album {
  id: string;
  name: string;
  artists: Artist[];
  images: Image[];
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  external_urls: ExternalUrls;
  uri: string;
  type: 'album';
  spotifyUrl: string;
}

export interface Track {
  id: string;
  title: string;
  duration_ms: number;
  preview_url: string | null;
  external_urls: ExternalUrls;
  external_ids?: ExternalIds;
  uri: string;
  album?: Album;
  popularity?: number;
  releaseDate?: string;
  spotifyUrl: string;
  artworkUrl?: string;
  recordLabel?: string;
  type: 'track';
  artists: Artist[];
}

export interface Release {
  id: string;
  name: string;
  artists: Artist[];
  album?: Album;
  tracks: Track[];
  external_urls: ExternalUrls;
  artworkUrl?: string;
  spotifyUrl: string;
  preview_url?: string | null;
  uri: string;
  type: 'release';
  recordLabel?: string;
}

export interface RecordLabel {
  id: string;
  name: string;
  displayName: string;
  slug?: string;
  description?: string;
  spotify_playlist_id?: string;
}

// API Response Types
export interface ReleasesResponse {
  label: string;
  totalReleases: number;
  releases: Release[];
  error?: string;
}

// Type Guards
export const isSpotifyArtist = (obj: any): obj is SpotifyArtist => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.uri === 'string' &&
    obj.type === 'artist';
};

export const isSpotifyTrack = (obj: any): obj is SpotifyTrack => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.duration_ms === 'number' &&
    obj.type === 'track' &&
    Array.isArray(obj.artists) &&
    obj.artists.every(isSpotifyArtist);
};

export const isSpotifyAlbum = (obj: any): obj is SpotifyAlbum => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.release_date === 'string' &&
    obj.type === 'album' &&
    Array.isArray(obj.artists) &&
    obj.artists.every(isSpotifyArtist);
};

export const isArtist = (obj: any): obj is Artist => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.uri === 'string' &&
    typeof obj.external_urls?.spotify === 'string' &&
    typeof obj.spotify_url === 'string' &&
    obj.type === 'artist';
};

export const isTrack = (obj: any): obj is Track => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    Array.isArray(obj.artists) &&
    obj.artists.every(isArtist) &&
    obj.type === 'track';
};

export const isRelease = (obj: any): obj is Release => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.artists) &&
    obj.artists.every(isArtist) &&
    Array.isArray(obj.tracks) &&
    obj.tracks.every(isTrack) &&
    obj.type === 'release';
};

// Type conversion utilities
export const convertSpotifyArtist = (artist: SpotifyArtist): Artist => ({
  id: artist.id,
  name: artist.name,
  uri: artist.uri,
  external_urls: artist.external_urls,
  spotify_url: artist.external_urls.spotify,
  image_url: artist.images?.[0]?.url,
  type: 'artist'
});

export const convertSpotifyAlbum = (album: SpotifyAlbum): Album => ({
  id: album.id,
  name: album.name,
  artists: album.artists.map(convertSpotifyArtist),
  images: album.images,
  release_date: album.release_date,
  release_date_precision: album.release_date_precision,
  total_tracks: album.total_tracks,
  external_urls: album.external_urls,
  uri: album.uri,
  type: 'album',
  spotifyUrl: album.external_urls.spotify
});

export const convertSpotifyTrack = (track: SpotifyTrack): Track => ({
  id: track.id,
  title: track.name,
  artists: track.artists.map(convertSpotifyArtist),
  duration_ms: track.duration_ms,
  preview_url: track.preview_url,
  external_urls: track.external_urls,
  external_ids: track.external_ids,
  uri: track.uri,
  album: track.album ? convertSpotifyAlbum(track.album) : undefined,
  popularity: track.popularity,
  spotifyUrl: track.external_urls.spotify,
  type: 'track'
});

// Re-export all types for better module resolution
export * from '../types/artist';
export * from '../types/release';
export * from '../types/track';
export * from './spotify';
import { RecordLabelId as LabelId } from './labels';
export type { LabelId };

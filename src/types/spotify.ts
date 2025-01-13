import type { 
  Track as SpotifyApiTrack,
  Artist as SpotifyApiArtist,
  Album as SpotifyApiAlbum,
  Image as SpotifyImage
} from '@spotify/web-api-ts-sdk';

import type { Image, ExternalUrls, ExternalIds } from './models';

export type {
  SpotifyApiTrack,
  SpotifyApiArtist,
  SpotifyApiAlbum,
  SpotifyImage
};

// Spotify API Types
export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: ExternalUrls;
  images?: SpotifyImage[];
  followers?: {
    total: number;
    href: string | null;
  };
  type: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  type: 'album' | 'single' | 'compilation';
  external_urls: ExternalUrls;
  images: SpotifyImage[];
  release_date?: string;
  artists: SpotifyArtist[];
  uri: string;
  total_tracks: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  duration_ms: number;
  preview_url?: string;
  external_urls: ExternalUrls;
  external_ids?: ExternalIds;
  album: SpotifyAlbum;
  uri: string;
  type: string;
}

export interface SpotifyRelease {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  release_date?: string;
  album: SpotifyAlbum;
  tracks: SpotifyTrack[];
  external_urls: ExternalUrls;
  uri: string;
}

import type { 
  Track as SpotifyApiTrack,
  Artist as SpotifyApiArtist,
  Album as SpotifyApiAlbum,
  Image as SpotifyImage
} from '@spotify/web-api-ts-sdk';

export type {
  SpotifyApiTrack,
  SpotifyApiArtist,
  SpotifyApiAlbum,
  SpotifyImage
};

// Base Types
export interface ExternalUrls {
  spotify: string;
}

// Spotify API Types
export interface SpotifyArtist extends SpotifyApiArtist {
  external_urls: ExternalUrls;
  images?: SpotifyImage[];
  type: 'artist';
}

export interface SpotifyTrack extends SpotifyApiTrack {
  external_urls: ExternalUrls;
  type: 'track';
  artists: SpotifyArtist[];
  album?: SpotifyAlbum;
  preview_url: string | null;
}

export interface SpotifyAlbum extends SpotifyApiAlbum {
  id: string;
  name: string;
  release_date: string;
  release_date_precision: string;
  images: SpotifyImage[];
  external_urls: ExternalUrls;
  uri: string;
  type: 'album';
  artists: SpotifyArtist[];
  total_tracks: number;
  tracks?: {
    items: SpotifyTrack[];
    total: number;
  };
}

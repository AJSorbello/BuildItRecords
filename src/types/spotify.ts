/**
 * @fileoverview Spotify API types
 * @module types/spotify
 */

import type { Track } from './track';
import type { Artist } from './artist';
import type { Album } from './album';

export interface SpotifyError {
  status: number;
  message: string;
  reason?: string;
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyExternalUrls {
  spotify: string;
}

export interface SpotifyExternalIds {
  isrc?: string;
  ean?: string;
  upc?: string;
}

export interface SpotifyFollowers {
  href: string | null;
  total: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  external_urls: SpotifyExternalUrls;
  external_ids: SpotifyExternalIds;
  uri: string;
  type: 'track';
  track_number: number;
  disc_number: number;
  explicit: boolean;
  popularity: number;
  available_markets: string[];
  is_local: boolean;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: SpotifyExternalUrls;
  uri: string;
  type: 'artist';
  followers: SpotifyFollowers;
  genres: string[];
  popularity: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  total_tracks: number;
  type: 'album' | 'single' | 'compilation';
  external_urls: SpotifyExternalUrls;
  external_ids: SpotifyExternalIds;
  uri: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  external_urls: SpotifyExternalUrls;
  uri: string;
  tracks: {
    total: number;
    items: SpotifyTrack[];
  };
  owner: {
    id: string;
    display_name: string;
  };
}

export interface SpotifyPaging<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface SpotifyCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

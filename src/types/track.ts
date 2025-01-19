/**
 * @fileoverview Track type definitions
 * @module types/Track
 */

import type { SpotifyExternalUrls, SpotifyExternalIds } from './spotify';
import { Artist } from './artist';

export type Artist = {
  id: string;
  name: string;
  spotify_url: string;
  spotify_uri: string;
  image_url: string;
  images?: Array<{ url: string; height: number; width: number }>;
  label_id?: string;
  created_at?: Date;
  updated_at?: Date;
};

export type Album = {
  id: string;
  name: string;
  release_date: string;
  artwork_url?: string;
  images?: Array<{ url: string; height: number; width: number }>;
  spotify_url: string;
  spotify_uri: string;
  label_id: string;
  total_tracks: number;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
  artists?: Artist[];
  tracks?: Track[];
};

export type Track = {
  id: string;
  title: string;
  duration: number;
  track_number?: number;
  disc_number?: number;
  preview_url?: string;
  spotify_url?: string;
  spotify_uri?: string;
  release_id?: string;
  label_id?: string;
  remixer_id?: string;
  created_at?: Date;
  updated_at?: Date;
  artists?: Artist[];
  release?: Album;
  isrc?: string;
  external_urls?: SpotifyExternalUrls;
  type?: 'track';
  explicit?: boolean;
  popularity?: number;
  available_markets?: string[];
  is_local?: boolean;
  remixer?: Artist;
  remixers?: Artist[];  // Array of remixers for tracks with multiple remixers
};

export type RecordLabelId = string;

export type TrackDetails = {
  id: string;
  title: string;
  duration: number;
  track_number: number;
  disc_number: number;
  preview_url: string | null;
  spotify_url: string;
  spotify_uri: string;
  artists: Artist[];
  remixer?: Artist;
  release?: Album;
  isrc?: string;
};

export type LocalTrack = Track & {
  localId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type LocalAlbum = Album & {
  type?: 'album' | 'single' | 'compilation';
};

export type BaseTrack = {
  id: string;
  title: string;
  artists: Artist[];
  album: Album;
  duration: number;
  preview_url: string | null;
  external_urls: SpotifyExternalUrls;
  external_ids: SpotifyExternalIds;
  uri: string;
  type: 'track';
  track_number: number;
  disc_number: number;
  isrc: string;
  images?: Array<{ url: string; height: number; width: number }>;
  artwork_url?: string;
};

export type TrackSearchResult = {
  id: string;
  title: string;
  artists: Artist[];
  album: Album;
  duration_ms: number;
  preview_url: string | null;
  external_urls: SpotifyExternalUrls;
  uri: string;
  type: 'track';
  popularity: number;
};

export function formatSpotifyTrack(track: any): TrackDetails {
  return {
    id: track.id,
    title: track.name,
    duration: track.duration_ms,
    track_number: track.track_number,
    disc_number: track.disc_number || 1,
    preview_url: track.preview_url,
    spotify_url: track.external_urls?.spotify || '',
    spotify_uri: track.uri,
    artists: track.artists.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      spotify_url: artist.external_urls?.spotify || '',
      spotify_uri: artist.uri
    })),
    isrc: track.external_ids?.isrc
  };
}

export function getTrackAlbumImage(track: Track): string {
  return track.release?.artwork_url || '';
}

export function getTrackSpotifyUrl(track: Track): string {
  return track.external_urls?.spotify || '';
}

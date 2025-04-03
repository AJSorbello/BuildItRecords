/**
 * @fileoverview Track type definitions
 * @module types/Track
 */

import type { SpotifyExternalUrls, SpotifyExternalIds, Artist } from '.';

export type Album = {
  id: string;
  name: string;
  title: string;
  type: 'album';
  release_date: string;
  artwork_url?: string;
  images?: Array<{ url: string; height: number; width: number }>;
  spotify_url: string;
  spotify_uri: string;
  label_id: string;
  total_tracks: number;
  artists?: Artist[];
  tracks?: Track[];
  label?: { id: string, name?: string };
};

export type Track = {
  id: string;
  title?: string;
  name?: string;
  duration_ms?: number;
  duration?: number;
  track_number?: number;
  disc_number?: number;
  preview_url?: string | null;
  spotifyUrl?: string;
  spotify_url?: string;
  external_urls?: SpotifyExternalUrls;
  spotify_uri: string;
  release?: Album;
  album?: Album;
  artists: Artist[];
  explicit?: boolean;
  isrc: string;
  type: 'track';
  isRemix?: boolean;
  remixer?: Artist;
  // Additional fields that might be present in the API response
  [key: string]: any;
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

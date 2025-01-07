import type { Artist as SpotifyApiArtist } from '@spotify/web-api-ts-sdk';
import type { Track } from './track';
import type { Album } from './release';
import type { RecordLabel } from './labels';
import type { SpotifyImage } from './spotify';

export type { SpotifyApiArtist as SpotifyArtist };

export interface Artist {
  id: string;
  name: string;
  profile_image?: string;
  spotify_url?: string;
  spotify_uri?: string | null;
  external_urls?: {
    spotify?: string;
    [key: string]: string | undefined;
  };
  followers?: {
    total: number;
    href: string | null;
  };
  genres?: string[];
  href?: string;
  images?: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  popularity?: number;
  type?: string;
  uri?: string;
  cached_at?: number;
}

export interface ArtistResponse {
  artists: {
    items: Artist[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ArtistSearchParams {
  labelId?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

export interface SimpleArtist {
  id: string;
  name: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
  spotifyUrl: string;
}

export interface SpotifyArtistData {
  id: string;
  name: string;
  images?: {
    url: string;
    height: number | null;
    width: number | null;
  }[];
  genres?: string[];
  followers?: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
  uri: string;
  popularity?: number;
}

export function getArtistImage(artist: Artist): string {
  return artist.images?.[0]?.url || '';
}

export function getArtistGenres(artist: Artist): string {
  return artist.genres?.join(', ') || '';
}

export function getArtistFollowers(artist: Artist): number {
  return artist.followers?.total || 0;
}

export function createArtist(data: Partial<Artist>): Artist {
  return {
    id: data.id || '',
    name: data.name || '',
    uri: data.uri || '',
    type: 'artist',
    external_urls: data.external_urls || { spotify: '' },
    spotifyUrl: data.spotifyUrl || '',
    images: data.images || [],
    genres: data.genres || [],
    popularity: data.popularity || 0,
    followers: data.followers || { href: null, total: 0 },
    topTracks: data.topTracks || [],
    albums: data.albums || [],
    releases: data.releases || [],
    relatedArtists: data.relatedArtists || [],
    label: data.label,
    profile_image: data.profile_image || '',
    spotify_url: data.spotify_url || '',
    spotify_uri: data.spotify_uri || null
  };
}

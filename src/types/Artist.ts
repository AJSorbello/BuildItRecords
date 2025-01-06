import type { Artist as SpotifyApiArtist } from '@spotify/web-api-ts-sdk';
import { RecordLabel } from '../constants/labels';
import { Album } from './release';

export interface Artist {
  id: string;
  name: string;
  uri: string;
  images?: {
    url: string;
    height: number | null;
    width: number | null;
  }[];
  spotifyUrl: string;
  genres?: string[];
  followers?: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
  popularity?: number;
  artworkUrl?: string;
  bio?: string;
  label?: RecordLabel;
  albums?: Album[];
  topTracks?: Album[];
}

export interface ArtistResponse {
  artists: {
    items: Artist[];
    total: number;
    limit: number;
    offset: number;
  };
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
  return artist.images?.[0]?.url || artist.artworkUrl || '/placeholder-artist.png';
}

export function getArtistGenres(artist: Artist): string {
  return artist.genres?.join(', ') || 'No genres available';
}

export function getArtistFollowers(artist: Artist): number {
  return artist.followers?.total || 0;
}

export const createArtist = (data: Partial<Artist>): Artist => {
  return {
    id: data.id || '',
    name: data.name || '',
    uri: data.uri || '',
    external_urls: data.external_urls || { spotify: '' },
    spotifyUrl: data.spotifyUrl || '',
    images: data.images || [],
    genres: data.genres || [],
    followers: data.followers || { total: 0 },
    popularity: data.popularity,
    artworkUrl: data.artworkUrl,
    bio: data.bio,
    label: data.label,
    albums: data.albums || [],
    topTracks: data.topTracks || []
  };
};

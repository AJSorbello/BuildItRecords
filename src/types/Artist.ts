import type { Artist as SpotifyApiArtist } from '@spotify/web-api-ts-sdk';
import { RecordLabel } from '../constants/labels';
import { Album } from './release';

export interface Artist {
  id: string;
  name: string;
  genres: string[];
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  followers: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
  uri: string;
  popularity: number;
  artworkUrl?: string;
  bio?: string;
  label?: string;
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
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyArtistData {
  id: string;
  name: string;
  images?: {
    url: string;
    height: number;
    width: number;
  }[];
  genres?: string[];
  external_urls: {
    spotify: string;
  };
  followers: {
    total: number;
  };
  popularity?: number;
}

export function getArtistImage(artist: Artist): string {
  return artist.artworkUrl || artist.images[0].url;
}

export function getArtistGenres(artist: Artist): string {
  return artist.genres.join(', ');
}

export function getArtistFollowers(artist: Artist): number {
  return artist.followers.total;
}

export const createArtist = (data: Partial<Artist>): Artist => {
  return {
    id: data.id || '',
    name: data.name || '',
    genres: data.genres || [],
    images: data.images || [],
    followers: data.followers || { total: 0 },
    external_urls: {
      spotify: data.external_urls?.spotify || '',
    },
    uri: data.uri || '',
    popularity: data.popularity || 0,
    artworkUrl: data.artworkUrl,
    bio: data.bio,
    label: data.label,
  };
};

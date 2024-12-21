import { SpotifyApi, Artist as SpotifyArtist } from '@spotify/web-api-ts-sdk';
import { RecordLabel } from '../constants/labels';
import { Track } from './track';
import { Release } from './release';

export interface ArtistFormData {
  name: string;
  spotifyUrl?: string;
  imageUrl?: string;
  label: RecordLabel;
  bio?: string;
}

export interface SimpleArtist {
  id: string;
  name: string;
  spotifyUrl: string;
  recordLabel: RecordLabel;
}

export interface Artist extends SimpleArtist {
  bio: string;
  genres: string[];
  followers: {
    total: number;
  };
  labels: RecordLabel[];
  releases: Release[];
  tracks?: Track[];
  featured?: boolean;
  images?: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  imageUrl?: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
  genres: string[];
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

export function convertSpotifyArtistToArtist(spotifyArtist: any, recordLabel: RecordLabel): SimpleArtist {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    spotifyUrl: spotifyArtist.external_urls.spotify,
    recordLabel: recordLabel,
    imageUrl: spotifyArtist.images && spotifyArtist.images.length > 0 ? spotifyArtist.images[0].url : ''
  };
}

export const createArtist = (data: Partial<Artist>): Artist => {
  return {
    id: data.id || '',
    name: data.name || '',
    recordLabel: data.recordLabel || RecordLabel.RECORDS,
    spotifyUrl: data.spotifyUrl || '',
    imageUrl: data.imageUrl || data.images?.[0]?.url || '',
    bio: data.bio || '',
    genres: data.genres || [],
    followers: data.followers || { total: 0 },
    labels: data.labels || [data.recordLabel || RecordLabel.RECORDS],
    releases: data.releases || [],
    images: data.images || [],
    tracks: data.tracks || [],
    featured: data.featured || false,
    socialLinks: data.socialLinks || {}
  };
};

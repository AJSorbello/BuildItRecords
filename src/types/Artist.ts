import { SpotifyApi, Artist as SpotifyArtist } from '@spotify/web-api-ts-sdk';
import { RecordLabel } from '../constants/labels';
import { Track } from './track';

export interface ArtistFormData {
  name: string;
  spotifyUrl?: string;
  imageUrl?: string;
  label: RecordLabel;
  bio?: string;
}

export interface SimpleArtist {
  id?: string;
  name: string;
  spotifyUrl: string;
  recordLabel: string;
  imageUrl?: string;
}

export interface Artist extends SimpleArtist {
  bio?: string;
  tracks?: Track[];
  featured?: boolean;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  genres?: string[];
  images?: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  followers?: {
    total: number;
  };
}

export function convertSpotifyArtistToArtist(
  spotifyArtist: SpotifyArtist, 
  recordLabel: RecordLabel = RecordLabel.RECORDS
): Artist {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    spotifyUrl: spotifyArtist.external_urls.spotify,
    recordLabel: recordLabel.toString(),
    imageUrl: spotifyArtist.images && spotifyArtist.images.length > 0 ? spotifyArtist.images[0].url : '',
    bio: ''
  };
}

export const createArtist = (data: Partial<Artist>): Artist => {
  return {
    id: data.id || '',
    name: data.name || '',
    spotifyUrl: data.spotifyUrl || '',
    recordLabel: data.recordLabel || '',
    imageUrl: data.imageUrl || data.images?.[0]?.url || '',
    bio: data.bio || '',
    tracks: data.tracks || [],
    featured: data.featured || false,
    socialLinks: data.socialLinks || {},
    genres: data.genres || [],
    images: data.images || [],
    followers: data.followers || { total: 0 }
  };
};

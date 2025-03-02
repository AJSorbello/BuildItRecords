import type { SpotifyImage, SpotifyExternalUrls, SpotifyFollowers } from './spotify';
import type { Track } from './track';
import type { Album } from './album';
import type { RecordLabelId, Label } from './labels';

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  spotify_url?: string;
  spotify_uri?: string;
  // Image fields - any or all might be present depending on migration state
  profile_image_url?: string;    // Main image URL
  profile_image_small_url?: string; // Small image version
  profile_image_large_url?: string; // Large image version, might be missing in Supabase
  images?: Array<{
    url: string;
    height?: number;
    width?: number;
  }>;
  external_urls?: {
    spotify?: string;
    [key: string]: string | undefined;
  };
  genres?: string[];
  followers?: {
    total: number;
  };
  tracks?: any[]; // Will be properly typed when we implement track types
  releases?: any[]; // Will be properly typed when we implement release types
  uri: string;
  type: 'artist';
  popularity: number;
  label_id?: string;
  label?: Label;
}

export interface ArtistDetails extends Artist {
  followers: SpotifyFollowers;
  genres: string[];
  popularity: number;
  topTracks?: {
    items: Track[];
    total: number;
  };
  albums?: {
    items: Album[];
    total: number;
  };
  relatedArtists?: Artist[];
  biography?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

export interface LocalArtist extends Artist {
  localId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isApproved: boolean;
  submittedBy?: string;
  approvedBy?: string;
  notes?: string;
}

export interface ArtistUpdate {
  name?: string;
  images?: SpotifyImage[];
  external_urls?: SpotifyExternalUrls;
  uri?: string;
  followers?: SpotifyFollowers;
  genres?: string[];
  popularity?: number;
  label?: RecordLabelId;
  biography?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  isActive?: boolean;
  isApproved?: boolean;
  notes?: string;
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
  href?: string;
}

export function formatSpotifyArtist(artist: any): Artist {
  return {
    id: artist.id,
    name: artist.name,
    images: artist.images,
    external_urls: artist.external_urls,
    uri: artist.uri,
    type: 'artist',
    followers: artist.followers,
    genres: artist.genres,
    popularity: artist.popularity,
    label: artist.label,
  };
}

export function getArtistImage(artist: Artist | null | undefined): string | null {
  if (!artist) return null;
  
  // First try the Supabase fields with fallback logic
  if (artist.profile_image_url || artist.profile_image_large_url || artist.profile_image_small_url) {
    return artist.profile_image_url || artist.profile_image_large_url || artist.profile_image_small_url || '';
  }
  
  // Then try the Spotify image format if available
  return artist.images?.[0]?.url || '/images/placeholder-artist.jpg';
}

export function getArtistSmallImage(artist: Artist | null | undefined): string | null {
  if (!artist) return null;
  
  // Prefer small image if available, otherwise fall back to other options
  return artist.profile_image_small_url || 
         artist.profile_image_url || 
         artist.profile_image_large_url || 
         artist.images?.[0]?.url || '/images/placeholder-artist.jpg';
}

export function getArtistLargeImage(artist: Artist | null | undefined): string | null {
  if (!artist) return null;
  
  // Prefer large image if available, otherwise fall back to other options
  return artist.profile_image_large_url || 
         artist.profile_image_url || 
         artist.profile_image_small_url || 
         artist.images?.[0]?.url || '/images/placeholder-artist.jpg';
}

export function getArtistGenres(artist: Artist): string[] {
  return artist.genres || [];
}

export function getArtistFollowers(artist: Artist): number {
  return artist.followers.total;
}

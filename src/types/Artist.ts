import type { SpotifyImage, SpotifyExternalUrls, SpotifyFollowers } from './spotify';
import type { Track } from './track';
import type { Album } from './album';
import type { RecordLabelId } from './labels';

export interface Artist {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: SpotifyExternalUrls;
  uri: string;
  type: 'artist';
  followers: SpotifyFollowers;
  genres: string[];
  popularity: number;
  label?: RecordLabelId;
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

export function getArtistImage(artist: Artist): string {
  return artist.images?.[0]?.url || '';
}

export function getArtistGenres(artist: Artist): string[] {
  return artist.genres || [];
}

export function getArtistFollowers(artist: Artist): number {
  return artist.followers.total;
}

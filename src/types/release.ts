import type { Artist } from './artist';
import type { Track } from './track';
import type { SpotifyImage, SpotifyExternalUrls } from './spotify';
import type { RecordLabelId } from './labels';

export interface Release {
  id: string;
  title: string;
  type: 'album' | 'single' | 'compilation';
  artists: Artist[];
  tracks: Track[];
  images: SpotifyImage[];
  artwork_url?: string;
  release_date: string;
  release_date_precision?: string;
  external_urls: SpotifyExternalUrls;
  uri: string;
  label?: RecordLabelId;
  labelId?: RecordLabelId;
  total_tracks: number;
  spotifyUrl?: string;
  spotify_url?: string;
  spotify_uri?: string;
  status?: 'active' | 'draft' | 'archived';
  name?: string; // For backward compatibility
}

export interface ReleaseDetails extends Release {
  popularity: number;
  genres: string[];
  copyrights: Array<{
    text: string;
    type: string;
  }>;
  available_markets: string[];
}

export interface LocalRelease extends Release {
  localId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isApproved: boolean;
  submittedBy?: string;
  approvedBy?: string;
  notes?: string;
}

export interface ReleaseUpdate {
  title?: string;
  type?: 'album' | 'single' | 'compilation';
  artists?: Artist[];
  tracks?: Track[];
  images?: SpotifyImage[];
  artwork_url?: string;
  release_date?: string;
  release_date_precision?: string;
  external_urls?: SpotifyExternalUrls;
  uri?: string;
  label?: RecordLabelId;
  total_tracks?: number;
  spotifyUrl?: string;
}

export interface ReleaseResponse {
  id: string;
  title: string;
  release_date: string;
  artwork_url?: string;
  images?: SpotifyImage[];
  spotify_url?: string;
  spotify_uri?: string;
  label_id?: string;
  total_tracks?: number;
  status?: string;
  artists?: Artist[];
  tracks?: Track[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset?: number;
  limit?: number;
}

export interface ReleaseSearchParams {
  artistId?: string;
  query?: string;
  limit?: number;
  offset?: number;
  include_groups?: Array<'album' | 'single' | 'compilation'>;
}

export interface ReleaseFormData {
  title: string;
  artist: string;
  artworkUrl: string;
  releaseDate: string;
  label: string;
  featured: boolean;
}

export const getArtistName = (artist: string | { id: string; name: string; uri: string }): string => {
  return typeof artist === 'string' ? artist : artist.name;
};

export const getArtistId = (artist: string | { id: string; name: string; uri: string }): string | undefined => {
  return typeof artist === 'string' ? undefined : artist.id;
};

export const getReleaseImage = (release: Release): string => {
  return release.images[0]?.url || release.artwork_url || '';
};

export const getReleaseSpotifyUrl = (release: Release): string => {
  return release.external_urls.spotify || release.spotifyUrl || '';
};

export const getReleaseArtists = (release: Release): string => {
  return release.artists.map(artist => artist.name).join(', ');
};

export const getReleaseDate = (release: Release): string => {
  return release.release_date || '';
};

export const getReleaseLabel = (release: Release): string => {
  return release.label || '';
};

export const getReleaseType = (release: Release): string => {
  return release.type || 'album';
};

export const getReleaseTotalTracks = (release: Release): number => {
  return release.total_tracks || release.tracks.length;
};

import type { Artist, Track, SpotifyImage, SpotifyExternalUrls, RecordLabelId } from '.';

export interface Release {
  label_id?: string;
  id: string;
  title: string;
  type?: string;
  release_date?: string;
  artwork_url?: string;
  artists?: Artist[];
  tracks?: Track[];
  images?: SpotifyImage[];
  external_urls?: SpotifyExternalUrls;
  spotify_url?: string;
  uri?: string;
  album_type?: string;
  total_tracks?: number;
  available_markets?: string[];
  href?: string;
  name?: string;
  release_date_precision?: string;
  restrictions?: any;
  artist_name?: string; 
  catalog_number?: string; 
  cover_url?: string;
  popularity?: number;
  popularity_rank?: number;
  purchase_url?: string;
  label?: any; // Can be a string, object with name/id, or null
  [key: string]: any;
}

export interface ReleaseDetails extends Release {
  description?: string;
  genres?: string[];
  popularity?: number;
  tracks_count?: number;
  tracks?: Track[];
  copyrights?: Array<{
    text: string;
    type: string;
  }>;
  available_markets?: string[];
}

export interface ReleasesResponse {
  releases: Release[];
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
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

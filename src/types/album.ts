import type { Artist } from './artist';
import type { Image, ExternalUrls, Copyright } from './types';
import type { Track } from './track';
import type { RecordLabelId } from './labels';

export type Album = {
  id: string;
  name: string;
  artists: Artist[];
  images: Image[];
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  external_urls: ExternalUrls;
  uri: string;
  copyrights?: Copyright[];
  label?: string;
  popularity?: number;
  available_markets?: string[];
  album_type: 'album' | 'single' | 'compilation';
};

export interface AlbumDetails extends Album {
  genres: string[];
  tracks: {
    items: Track[];
    total: number;
  };
}

export interface LocalAlbum extends Album {
  localId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isApproved: boolean;
  approvedBy: string;
  submittedBy?: string;
  notes?: string;
}

export interface AlbumUpdate {
  name?: string;
  artists?: Artist[];
  images?: Image[];
  release_date?: string;
  release_date_precision?: string;
  total_tracks?: number;
  album_type?: 'album' | 'single' | 'compilation';
  external_urls?: ExternalUrls;
  uri?: string;
  label?: string;
  isActive?: boolean;
  isApproved?: boolean;
  notes?: string;
}

export interface AlbumResponse {
  albums: {
    items: Album[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface AlbumSearchParams {
  artistId?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

export function formatSpotifyAlbum(album: any): Album {
  return {
    id: album.id,
    name: album.name,
    artists: album.artists,
    images: album.images,
    release_date: album.release_date,
    release_date_precision: album.release_date_precision,
    total_tracks: album.total_tracks,
    external_urls: album.external_urls,
    uri: album.uri,
    label: album.label,
  };
}

export function getAlbumImage(album: Album): string {
  return album.images?.[0]?.url || '';
}

export function getAlbumYear(album: Album): string {
  return album.release_date?.split('-')[0] || '';
}

export function getAlbumArtists(album: Album): string {
  return album.artists.map(artist => artist.name).join(', ');
}

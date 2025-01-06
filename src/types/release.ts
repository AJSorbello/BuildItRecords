import type { Artist } from './artist';
import type { Track } from './track';
import type { RecordLabel } from './label';
import type { SpotifyImage } from './spotify';

export interface Album {
  id: string;
  name: string;
  type: 'album' | 'single' | 'compilation';
  artists: Artist[];
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  total_tracks: number;
  uri: string;
  external_urls: {
    spotify: string;
  };
  images: SpotifyImage[];
  spotifyUrl: string;
  tracks?: Track[];
}

export interface Release extends Album {
  label?: RecordLabel;
  featured?: boolean;
  description?: string;
  artwork?: string;
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
  include_groups?: ('album' | 'single' | 'compilation')[];
}

export interface ReleaseFormData {
  title: string;
  artist: string;
  artworkUrl: string;
  releaseDate: string;
  label: string;
  spotifyUrl: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
    uri: string;
    external_urls: { spotify: string };
  }[];
  images: {
    url: string;
    height: number | null;
    width: number | null;
  }[];
  release_date: string;
  total_tracks: number;
  tracks?: {
    items: Track[];
  };
  external_urls: {
    spotify: string;
  };
  uri: string;
  popularity: number;
  album_group?: string;
  external_ids?: {
    upc?: string;
    isrc?: string;
    ean?: string;
  };
}

export function getArtistName(artist: string | { id: string; name: string; uri: string }): string {
  return typeof artist === 'string' ? artist : artist.name;
}

export function getArtistId(artist: string | { id: string; name: string; uri: string }): string | undefined {
  return typeof artist === 'string' ? undefined : artist.id;
}

export function createAlbum(data: Partial<Album>): Album {
  return {
    id: data.id || '',
    name: data.name || '',
    type: data.type || 'album',
    artists: data.artists || [],
    release_date: data.release_date || new Date().toISOString().split('T')[0],
    release_date_precision: data.release_date_precision || 'day',
    total_tracks: data.total_tracks || 0,
    uri: data.uri || '',
    external_urls: data.external_urls || { spotify: '' },
    images: data.images || [],
    spotifyUrl: data.spotifyUrl || '',
    tracks: data.tracks || []
  };
}

export function createRelease(data: Partial<Release>): Release {
  return {
    ...createAlbum(data),
    label: data.label,
    featured: data.featured || false,
    description: data.description || '',
    artwork: data.artwork || ''
  };
}

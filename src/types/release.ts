import { Artist } from './artist';
import { Track } from './track';
import { RecordLabel } from '../constants/labels';

export interface Album {
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
    uri: string;
    external_urls: { spotify: string };
    spotifyUrl: string;
  }[];
  images: {
    url: string;
    height: number | null;
    width: number | null;
  }[];
  release_date: string;
  release_date_precision: 'day' | 'month' | 'year';
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
  uri: string;
  type: string;
  spotifyUrl: string;
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

export interface Release {
  id: string;
  title: string;
  artist: Artist;
  artists: Artist[];
  artworkUrl?: string;
  releaseDate: string;
  label?: RecordLabel;
  spotifyUrl: string;
  tracks: Track[];
  featured?: boolean;
  images?: {
    url: string;
    height: number | null;
    width: number | null;
  }[];
  external_urls?: {
    spotify: string;
  };
  uri?: string;
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

export const getArtistName = (artist: string | { id: string; name: string; uri: string }): string => {
  return typeof artist === 'string' ? artist : artist.name;
};

export const getArtistId = (artist: string | { id: string; name: string; uri: string }): string | undefined => {
  return typeof artist === 'string' ? undefined : artist.id;
};

export const createAlbum = (data: Partial<Album>): Album => {
  return {
    id: data.id || '',
    name: data.name || '',
    artists: data.artists || [],
    images: data.images || [],
    release_date: data.release_date || '',
    release_date_precision: data.release_date_precision || 'day',
    total_tracks: data.total_tracks || 0,
    external_urls: data.external_urls || { spotify: '' },
    uri: data.uri || '',
    type: data.type || 'album',
    spotifyUrl: data.spotifyUrl || ''
  };
};

export const createRelease = (data: Partial<Release>): Release => {
  return {
    id: data.id || '',
    title: data.title || '',
    artist: data.artist || { 
      id: '', 
      name: '', 
      uri: '',
      external_urls: { spotify: '' },
      spotifyUrl: ''
    },
    artists: data.artists || [],
    artworkUrl: data.artworkUrl,
    releaseDate: data.releaseDate || '',
    label: data.label,
    spotifyUrl: data.spotifyUrl || '',
    tracks: data.tracks || [],
    featured: data.featured,
    images: data.images || [],
    external_urls: data.external_urls || { spotify: '' },
    uri: data.uri || ''
  };
};

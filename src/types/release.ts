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
  }[];
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  release_date: string;
  release_date_precision: 'day' | 'month' | 'year';
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
  uri: string;
  type: 'album';
  album_type: 'album' | 'single' | 'compilation';
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
  artists: {
    id: string;
    name: string;
    uri: string;
  }[];
  releaseDate: string;
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  external_urls: {
    spotify: string;
  };
  total_tracks: number;
  uri: string;
  tracks: Track[];
  recordLabel: string;
  label: RecordLabel;
  popularity: number;
  artworkUrl: string;
  spotifyUrl: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  artwork?: string;
  genre?: string;
  labelName?: string;
  stores?: {
    spotify: string;
    beatport?: string;
    soundcloud?: string;
  };
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
  }[];
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  release_date: string;
  total_tracks: number;
  tracks?: {
    items: any[];
  };
  external_urls: {
    spotify: string;
  };
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
    type: 'album',
    album_type: data.album_type || 'album',
  };
};

export const createRelease = (data: Partial<Release>): Release => {
  return {
    id: data.id || '',
    title: data.title || '',
    artist: data.artist || { id: '', name: '', uri: '' },
    artists: data.artists || [],
    releaseDate: data.releaseDate || '',
    images: data.images || [],
    external_urls: data.external_urls || { spotify: '' },
    total_tracks: data.total_tracks || 0,
    uri: data.uri || '',
    tracks: data.tracks || [],
    recordLabel: data.recordLabel || '',
    label: data.label || 'buildit-records',
    popularity: data.popularity || 0,
    artworkUrl: data.artworkUrl || '',
    spotifyUrl: data.spotifyUrl || '',
    beatportUrl: data.beatportUrl,
    soundcloudUrl: data.soundcloudUrl,
    artwork: data.artwork,
    genre: data.genre,
    labelName: data.labelName,
    stores: data.stores || { spotify: '' },
  };
};

import { Artist } from './artist';

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

export interface Release extends Album {
  artist: string;
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
    release_date: data.release_date || new Date().toISOString(),
    release_date_precision: data.release_date_precision || 'day',
    total_tracks: data.total_tracks || 0,
    external_urls: {
      spotify: data.external_urls?.spotify || ''
    },
    uri: data.uri || '',
    type: data.type || 'album',
    album_type: data.album_type || 'album'
  };
};

export const createRelease = (data: Partial<Release>): Release => {
  return {
    ...createAlbum(data),
    artist: data.artist || data.artists?.[0]?.name || ''
  };
};

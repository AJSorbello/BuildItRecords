import type { Image as SpotifyImage } from '@spotify/web-api-ts-sdk';

export interface RecordLabel {
  id: string;
  name: string;
  displayName: string;
  playlistId?: string;
}

export interface Artist {
  id: string;
  name: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
  spotify_url: string;
  image_url?: string;
  label_id?: string;
}

export interface Album {
  id: string;
  name: string;
  artists: Artist[];
  images: SpotifyImage[];
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
  uri: string;
  type: string;
  spotifyUrl: string;
}

export interface Release {
  id: string;
  title: string;
  artist: Artist;
  artists: Artist[];
  releaseDate: string;
  artworkUrl?: string;
  spotifyUrl: string;
  tracks: Track[];
  label?: RecordLabel;
  images?: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
  uri: string;
}

export interface Track {
  id: string;
  name: string;
  title?: string;
  artists: Artist[];
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  external_ids: {
    [key: string]: string;
  };
  uri: string;
  album?: Album;
  popularity?: number;
  releaseDate?: string;
  spotifyUrl?: string;
  label?: RecordLabel;
  artworkUrl?: string;
  images?: SpotifyImage[];
  recordLabel?: string;
}

// Type guards
export const isArtist = (obj: any): obj is Artist => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.uri === 'string' &&
    typeof obj.external_urls?.spotify === 'string' &&
    typeof obj.spotify_url === 'string';
};

export const isTrack = (obj: any): obj is Track => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.artists) &&
    obj.artists.every(isArtist);
};

export const isRelease = (obj: any): obj is Release => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    isArtist(obj.artist) &&
    Array.isArray(obj.artists) &&
    obj.artists.every(isArtist) &&
    Array.isArray(obj.tracks) &&
    obj.tracks.every(isTrack);
};

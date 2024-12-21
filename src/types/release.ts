import { Track } from './track';
import { RecordLabel } from '../constants/labels';
import { SimplifiedAlbum } from '@spotify/web-api-ts-sdk';
import { SimpleArtist } from './artist';

export interface Release {
  id: string;
  title: string;
  name: string;
  artist: SimpleArtist;
  imageUrl: string;
  releaseDate: string;
  recordLabel: RecordLabel;
  tracks?: Track[];
  spotifyUrl?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  artwork?: string;
  artworkUrl?: string;
  genre?: string;
  stores?: {
    spotify?: string;
    beatport?: string;
    soundcloud?: string;
  };
}

export interface ReleaseFormData {
  title: string;
  artist: string;
  imageUrl: string;
  releaseDate: string;
  genre: string;
  labelName: RecordLabel;
  spotifyUrl: string;
  beatportUrl: string;
  soundcloudUrl: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyRelease {
  id: string;
  name: string;
  release_date: string;
  external_urls: {
    spotify: string;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
}

export function convertSpotifyAlbumToRelease(album: SimplifiedAlbum, label: RecordLabel): Release {
  return {
    id: album.id,
    title: album.name,
    name: album.name,
    artist: {
      id: album.artists[0]?.id,
      name: album.artists[0]?.name || '',
      spotifyUrl: album.artists[0]?.external_urls?.spotify,
      imageUrl: album.images?.[0]?.url,
    },
    imageUrl: album.images?.[0]?.url || '',
    releaseDate: album.release_date,
    recordLabel: label,
    tracks: [],
    spotifyUrl: album.external_urls?.spotify || '',
  };
}

export const createRelease = (data: Partial<Release>): Release => {
  const defaultArtist: SimpleArtist = {
    id: '',
    name: '',
    recordLabel: data.recordLabel || RecordLabel.RECORDS,
    spotifyUrl: ''
  };

  return {
    id: data.id || '',
    title: data.title || '',
    name: data.name || '',
    artist: data.artist || defaultArtist,
    imageUrl: data.imageUrl || '',
    releaseDate: data.releaseDate || new Date().toISOString(),
    recordLabel: data.recordLabel || RecordLabel.RECORDS,
    tracks: data.tracks || [],
    spotifyUrl: data.spotifyUrl || '',
    beatportUrl: data.beatportUrl || '',
    soundcloudUrl: data.soundcloudUrl || ''
  };
};

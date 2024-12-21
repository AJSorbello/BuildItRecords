import { RECORD_LABELS, RecordLabel } from '../constants/labels';
import { SimpleArtist } from './artist';
import { Track as SpotifyTrack, Image } from '@spotify/web-api-ts-sdk';

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface Track {
  id: string;
  name: string;
  trackTitle: string;
  artist: SimpleArtist;
  album?: {
    id: string;
    name: string;
    images: SpotifyImage[];
    release_date: string;
    external_urls: {
      spotify: string;
    };
  };
  albumCover?: string;
  imageUrl?: string;
  duration_ms?: number;
  releaseDate: string;
  preview_url?: string | null;
  external_urls?: {
    spotify: string;
  };
  spotifyUrl: string;
  recordLabel: RecordLabel;
  genre?: string;
  genres?: string[];
  popularity?: number;
  label?: RecordLabel;
  stores?: {
    spotify?: string;
    beatport?: string;
    soundcloud?: string;
  };
}

export interface SpotifyTrackModel {
  id: string;
  name: string;
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
  album: {
    images: Array<{
      url: string;
    }>;
    release_date: string;
  };
  preview_url: string | null;
}

export function createTrack(legacyTrack: Partial<Track>): Track {
  const validLabel = Object.values(RECORD_LABELS).find(
    label => label === legacyTrack.recordLabel || 
            label.toLowerCase() === legacyTrack.recordLabel?.toLowerCase()
  ) || RECORD_LABELS['Build It Records'];

  return {
    id: legacyTrack.id || '',
    name: legacyTrack.name || '',
    trackTitle: legacyTrack.name || '',
    artist: legacyTrack.artist || { name: '', spotifyUrl: '' },
    albumCover: legacyTrack.albumCover || legacyTrack.imageUrl || '',
    releaseDate: legacyTrack.releaseDate || new Date().toISOString(),
    preview_url: legacyTrack.preview_url || null,
    spotifyUrl: legacyTrack.spotifyUrl || '',
    recordLabel: validLabel,
    popularity: legacyTrack.popularity,
    genre: legacyTrack.genre,
    genres: legacyTrack.genres,
    label: validLabel,
    stores: legacyTrack.stores || {
      spotify: legacyTrack.spotifyUrl
    }
  };
}

export function convertSpotifyTrackToTrack(spotifyTrack: SpotifyTrackModel, label: RecordLabel): Track {
  return {
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    trackTitle: spotifyTrack.name,
    artist: {
      name: spotifyTrack.artists[0]?.name || '',
      spotifyUrl: spotifyTrack.artists[0]?.external_urls?.spotify || '',
    },
    albumCover: spotifyTrack.album.images[0]?.url || '',
    releaseDate: spotifyTrack.album.release_date,
    preview_url: spotifyTrack.preview_url,
    spotifyUrl: spotifyTrack.external_urls.spotify,
    recordLabel: label,
    popularity: undefined,
    imageUrl: undefined,
  };
}

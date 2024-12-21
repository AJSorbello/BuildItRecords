import { SimpleArtist } from './artist';
import { RecordLabel } from '../constants/labels';

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  images: SpotifyImage[];
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

export interface Track {
  id: string;
  title: string;
  artist: SimpleArtist;
  recordLabel: RecordLabel;
  artwork?: string;
  spotifyUrl?: string;
  beatportUrl?: string;
  releaseDate?: string;
  albumCover?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  album: {
    id: string;
    name: string;
    release_date: string;
    total_tracks: number;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
}

export const createTrack = (data: Partial<Track>): Track => {
  return {
    id: data.id || '',
    title: data.title || '',
    artist: data.artist || {
      id: '',
      name: '',
      spotifyUrl: '',
      recordLabel: RecordLabel.RECORDS
    },
    recordLabel: data.recordLabel || RecordLabel.RECORDS,
    artwork: data.artwork,
    spotifyUrl: data.spotifyUrl,
    beatportUrl: data.beatportUrl,
    releaseDate: data.releaseDate,
    albumCover: data.albumCover
  };
};

export function convertSpotifyTrackToTrack(spotifyTrack: SpotifyAlbum & { artists: Array<{ id: string; name: string; external_urls: { spotify: string; }; }> }, label: RecordLabel): Track {
  return {
    id: spotifyTrack.id,
    title: spotifyTrack.name,
    artist: spotifyTrack.artists[0]?.name || '',
    recordLabel: label,
    artwork: spotifyTrack.images[0]?.url,
    spotifyUrl: spotifyTrack.external_urls.spotify,
    beatportUrl: undefined,
    releaseDate: spotifyTrack.release_date,
    albumCover: spotifyTrack.images[0]?.url
  };
}

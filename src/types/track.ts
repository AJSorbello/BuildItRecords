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
  name: string;
  trackTitle: string;
  artist: SimpleArtist;
  artists: SimpleArtist[];
  album: {
    id: string;
    name: string;
    releaseDate: string;
    totalTracks: number;
    images: Array<{
      url: string;
      height?: number;
      width?: number;
    }>;
  };
  releaseDate: string;
  imageUrl: string;
  spotifyUrl: string;
  previewUrl: string;
  recordLabel: RecordLabel;
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
  const defaultArtist: SimpleArtist = {
    id: '',
    name: '',
    recordLabel: RecordLabel.RECORDS,
    spotifyUrl: ''
  };

  const defaultAlbum = {
    id: '',
    name: '',
    releaseDate: new Date().toISOString(),
    totalTracks: 0,
    images: []
  };

  return {
    id: data.id || '',
    name: data.name || '',
    trackTitle: data.trackTitle || data.name || '',
    artists: data.artists || [defaultArtist],
    artist: data.artist || defaultArtist,
    album: data.album || defaultAlbum,
    albumCover: data.albumCover,
    imageUrl: data.imageUrl || data.albumCover || '',
    releaseDate: data.releaseDate || new Date().toISOString(),
    recordLabel: data.recordLabel || RecordLabel.RECORDS,
    previewUrl: data.previewUrl || '',
    spotifyUrl: data.spotifyUrl || ''
  };
};

export function convertSpotifyTrackToTrack(spotifyTrack: SpotifyAlbum & { artists: Array<{ id: string; name: string; external_urls: { spotify: string; }; }> }, label: RecordLabel): Track {
  return {
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    trackTitle: spotifyTrack.name,
    artist: {
      id: spotifyTrack.artists[0]?.id || '',
      name: spotifyTrack.artists[0]?.name || '',
      spotifyUrl: spotifyTrack.artists[0]?.external_urls?.spotify || '',
      recordLabel: label
    },
    artists: spotifyTrack.artists.map(artist => ({
      name: artist.name,
      spotifyUrl: artist.external_urls?.spotify || '',
      recordLabel: label,
      id: artist.id
    })),
    album: {
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      releaseDate: spotifyTrack.release_date,
      totalTracks: spotifyTrack.total_tracks,
      images: spotifyTrack.images.map(image => ({
        url: image.url,
        height: image.height,
        width: image.width
      }))
    },
    previewUrl: null,
    albumCover: spotifyTrack.images[0]?.url,
    spotifyUrl: spotifyTrack.external_urls.spotify,
    releaseDate: spotifyTrack.release_date,
    recordLabel: label,
    imageUrl: spotifyTrack.images[0]?.url
  };
}

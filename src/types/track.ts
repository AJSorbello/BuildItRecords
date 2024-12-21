import { SimpleArtist } from './artist';
import { RecordLabel } from '../constants/labels';

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  album: SpotifyAlbum;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
  popularity?: number;
}

export interface Track {
  id: string;
  name: string;
  trackTitle: string;
  artist: SimpleArtist;
  artists: SimpleArtist[];
  album: SpotifyAlbum;
  preview_url?: string | null;
  previewUrl?: string | null;  // alias for preview_url
  albumCover?: string;  // alias for album cover image
  spotifyUrl: string;
  releaseDate: string;
  recordLabel: string;
  label?: string;  // alias for recordLabel
  imageUrl?: string;
  duration_ms?: number;
  popularity?: number;
  featured?: boolean;
}

export const createTrack = (data: Partial<Track>): Track => {
  return {
    id: data.id || '',
    name: data.name || '',
    trackTitle: data.trackTitle || data.name || '',
    artist: data.artist || { 
      id: '', 
      name: 'Unknown Artist',
      spotifyUrl: '',
      recordLabel: data.recordLabel || ''
    },
    artists: data.artists || [data.artist || { 
      id: '', 
      name: 'Unknown Artist',
      spotifyUrl: '',
      recordLabel: data.recordLabel || ''
    }],
    album: data.album || {
      id: '',
      name: '',
      images: [],
      release_date: data.releaseDate || new Date().toISOString(),
      external_urls: { spotify: '' }
    },
    preview_url: data.preview_url || data.previewUrl || null,
    previewUrl: data.preview_url || data.previewUrl || null,
    albumCover: data.albumCover || data.imageUrl || data.album?.images[0]?.url || '',
    spotifyUrl: data.spotifyUrl || '',
    releaseDate: data.releaseDate || new Date().toISOString(),
    recordLabel: data.recordLabel || data.label || '',
    label: data.recordLabel || data.label || '',
    imageUrl: data.imageUrl || data.albumCover || data.album?.images[0]?.url || '',
    duration_ms: data.duration_ms || 0,
    popularity: data.popularity || 0,
    featured: data.featured || false
  };
};

export function convertSpotifyTrackToTrack(spotifyTrack: SpotifyTrack, label: RecordLabel): Track {
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
      id: spotifyTrack.album.id,
      name: spotifyTrack.album.name,
      images: spotifyTrack.album.images.map(image => ({
        url: image.url,
        height: image.height,
        width: image.width
      })),
      release_date: spotifyTrack.album.release_date,
      external_urls: {
        spotify: spotifyTrack.album.external_urls.spotify
      }
    },
    preview_url: spotifyTrack.preview_url,
    previewUrl: spotifyTrack.preview_url,
    albumCover: spotifyTrack.album.images[0]?.url,
    spotifyUrl: spotifyTrack.external_urls.spotify,
    releaseDate: spotifyTrack.album.release_date,
    recordLabel: label,
    label: label,
    imageUrl: spotifyTrack.album.images[0]?.url,
    duration_ms: spotifyTrack.duration_ms,
    popularity: spotifyTrack.popularity
  };
}

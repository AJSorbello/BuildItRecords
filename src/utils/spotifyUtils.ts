import { Artist as SpotifyArtist, Track as SpotifyTrack } from '@spotify/web-api-ts-sdk';
import { Artist } from '../types/artist';
import { Track, SpotifyImage } from '../types/track';
import { Release } from '../types/release';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  images: SpotifyImage[];
}

export const isValidSpotifyUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'open.spotify.com';
  } catch (error) {
    return false;
  }
};

export const normalizeSpotifyUrl = (url: string): string => {
  if (!url) return '';
  try {
    // Add https:// if missing
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    const urlObj = new URL(url);
    return urlObj.href.split('?')[0];
  } catch (error) {
    console.error('Error normalizing Spotify URL:', error);
    return url;
  }
};

export const extractSpotifyId = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch (error) {
    console.error('Error extracting Spotify ID:', error);
    return null;
  }
};

export const determineLabelFromUrl = (url: string): RecordLabel => {
  if (url.includes('records')) return RECORD_LABELS['Build It Records'];
  if (url.includes('tech')) return RECORD_LABELS['Build It Tech'];
  if (url.includes('deep')) return RECORD_LABELS['Build It Deep'];
  return RECORD_LABELS['Build It Records']; // Default to Records
};

export const convertSpotifyArtistToArtist = (spotifyArtist: SpotifyArtist): Artist => {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    spotifyUrl: spotifyArtist.external_urls.spotify,
    imageUrl: spotifyArtist.images[0]?.url || '',
    genres: spotifyArtist.genres,
    followers: spotifyArtist.followers.total,
    monthlyListeners: spotifyArtist.followers.total,
    primaryLabel: determineLabelFromUrl(spotifyArtist.external_urls.spotify),
    label: determineLabelFromUrl(spotifyArtist.external_urls.spotify),
  };
};

export const convertSpotifyTrackToTrack = (spotifyTrack: SpotifyTrack, label: RecordLabel): Track => {
  return {
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    artist: {
      name: spotifyTrack.artists[0].name,
      spotifyUrl: spotifyTrack.artists[0].external_urls.spotify,
    },
    album: {
      id: spotifyTrack.album.id,
      name: spotifyTrack.album.name,
      images: spotifyTrack.album.images,
      release_date: spotifyTrack.album.release_date,
      external_urls: spotifyTrack.album.external_urls,
    },
    duration_ms: spotifyTrack.duration_ms,
    preview_url: spotifyTrack.preview_url || undefined,
    external_urls: spotifyTrack.external_urls,
    genre: spotifyTrack.album.genres?.[0] || '',
    releaseDate: spotifyTrack.album.release_date,
    label,
  };
};

export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const convertSpotifyReleaseToRelease = (spotifyRelease: any, label: RecordLabel): Release => {
  return {
    id: spotifyRelease.id,
    title: spotifyRelease.name,
    artist: spotifyRelease.artists?.[0]?.name || '',
    imageUrl: spotifyRelease.images?.[0]?.url || '',
    spotifyUrl: spotifyRelease.external_urls?.spotify || '',
    releaseDate: spotifyRelease.release_date || '',
    label,
  };
};

import { Artist as SpotifyArtist } from '@spotify/web-api-ts-sdk';
import { RecordLabel } from '../constants/labels';
import { Artist, SimpleArtist, SpotifyArtistData } from '../types/artist';
import { Track } from '../types/track';
import { Release, SpotifyRelease } from '../types/release';

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
  if (url.includes('records')) return RecordLabel.RECORDS;
  if (url.includes('tech')) return RecordLabel.TECH;
  if (url.includes('deep')) return RecordLabel.DEEP;
  return RecordLabel.RECORDS; // Default to Records
};

export const convertSpotifyArtistToArtist = (spotifyArtist: SpotifyArtistData, label: RecordLabel): Artist => {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    bio: '',
    images: spotifyArtist.images || [],
    recordLabel: label,
    spotifyUrl: spotifyArtist.external_urls?.spotify || '',
    beatportUrl: '',
    soundcloudUrl: '',
    bandcampUrl: ''
  };
};

export const convertSpotifyReleaseToRelease = (spotifyRelease: SpotifyRelease, label: RecordLabel): Release => {
  return {
    id: spotifyRelease.id,
    title: spotifyRelease.name,
    artist: spotifyRelease.artists[0]?.name || '',
    recordLabel: label,
    releaseDate: spotifyRelease.release_date,
    spotifyUrl: spotifyRelease.external_urls.spotify,
    artwork: spotifyRelease.images[0]?.url
  };
};

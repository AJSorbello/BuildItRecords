import { spotifyService } from '../services/SpotifyService';
import { Track, SpotifyPlaylist, SpotifyApiTrack, SpotifyImage, createTrack } from '../types/track';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';
import { Release } from '../types/release';

interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  images: SpotifyImage[];
}

export const fetchTrackDetails = async (trackUrl: string): Promise<Track> => {
  try {
    const trackDetails = await spotifyService.getTrackDetailsByUrl(trackUrl);
    if (!trackDetails) {
      throw new Error('Track not found');
    }
    return trackDetails;
  } catch (error) {
    console.error('Error fetching track details:', error);
    throw error;
  }
};

export const searchTracks = async (query: string): Promise<Track[]> => {
  try {
    const tracks = await spotifyService.searchTracks(query);
    console.log('Search Results:', tracks);
    return tracks;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
};

export const getLabelReleases = async (playlistId: string): Promise<Track[]> => {
  try {
    const releases = await spotifyService.getLabelReleases(playlistId);
    console.log('Label Releases:', releases);
    return releases;
  } catch (error) {
    console.error('Error fetching label releases:', error);
    throw error;
  }
};

const extractSpotifyId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch (error) {
    console.error('Error parsing Spotify URL:', error);
    return null;
  }
};

const normalizeSpotifyUrl = (url: string): string => {
  if (!url) return '';
  
  // Add https:// if missing
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.href;
  } catch (error) {
    console.error('Error normalizing Spotify URL:', error);
    return url;
  }
};

const isValidSpotifyUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'open.spotify.com';
  } catch (error) {
    return false;
  }
};

const determineLabelFromUrl = (spotifyUrl: string): RecordLabel => {
  if (spotifyUrl.includes('records')) return RECORD_LABELS['Build It Records'];
  if (spotifyUrl.includes('tech')) return RECORD_LABELS['Build It Tech'];
  if (spotifyUrl.includes('deep')) return RECORD_LABELS['Build It Deep'];
  return RECORD_LABELS['Build It Records']; // Default to Records
};

const convertToDisplayTrack = (track: Track) => {
  return {
    id: track.id,
    title: track.name,
    artist: track.artist,
    artworkUrl: track.albumCover,
    releaseDate: track.releaseDate,
    genre: track.genres?.[0] || '',
    labelName: track.recordLabel,
    stores: {
      spotify: track.spotifyUrl || ''
    }
  };
};

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const convertSpotifyReleaseToRelease = (spotifyRelease: SpotifyPlaylist, label: RecordLabel): Release => {
  return {
    id: spotifyRelease.id,
    title: spotifyRelease.name,
    artist: spotifyRelease.owner.display_name,
    artworkUrl: spotifyRelease.images[0]?.url || '',
    releaseDate: new Date().toISOString(),
    genre: '',
    labelName: label,
    stores: {
      spotify: spotifyRelease.external_urls?.spotify || ''
    }
  };
};

const getTrackDetails = async (trackUrl: string) => {
  try {
    const details = await spotifyService.getTrackDetailsByUrl(trackUrl);
    console.log('Track Details:', details);
    return details;
  } catch (error) {
    console.error('Error getting track details:', error);
    return null;
  }
};

const getSimplifiedTrackDetails = async (trackUrl: string) => {
  try {
    const details = await getTrackDetails(trackUrl);
    if (!details) return null;

    return {
      id: details.id,
      title: details.name,
      artist: details.artists[0]?.name || 'Unknown Artist',
      albumArt: details.album.images[0]?.url || ''
    };
  } catch (error) {
    console.error('Error getting simplified track details:', error);
    return null;
  }
};

export {
  extractSpotifyId,
  normalizeSpotifyUrl,
  isValidSpotifyUrl,
  createTrack,
  determineLabelFromUrl,
  convertToDisplayTrack,
  formatDuration,
  convertSpotifyReleaseToRelease,
  getTrackDetails,
  getSimplifiedTrackDetails
};

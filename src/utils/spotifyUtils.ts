import { spotifyService } from '../services/SpotifyService';
import { Track, SpotifyPlaylist, SpotifyApiTrack } from '../types/track';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';
import { Release } from '../types/release';

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

export const extractSpotifyId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const match = url.match(/track\/([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting Spotify ID:', error);
    return null;
  }
};

export const normalizeSpotifyUrl = (url: string): string => {
  if (!url) return '';
  
  // Add https:// if missing
  if (url.startsWith('ttps://')) {
    url = 'h' + url;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove any leading/trailing whitespace
  url = url.trim();
  
  return url;
};

export const isValidSpotifyUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // Normalize the URL first
    url = normalizeSpotifyUrl(url);
    
    // Verify it's a proper Spotify URL
    if (!url.startsWith('https://open.spotify.com/track/')) {
      return false;
    }
    
    // Try to extract the track ID
    const trackId = extractSpotifyId(url);
    return trackId !== null;
  } catch (error) {
    console.error('Error validating Spotify URL:', error);
    return false;
  }
};

export const determineLabelFromUrl = (spotifyUrl: string): RecordLabel => {
  if (spotifyUrl.includes('records')) return RECORD_LABELS.RECORDS;
  if (spotifyUrl.includes('tech')) return RECORD_LABELS.TECH;
  if (spotifyUrl.includes('deep')) return RECORD_LABELS.DEEP;
  return RECORD_LABELS.RECORDS;
};

export const convertToDisplayTrack = (track: Track) => {
  return {
    id: track.id,
    title: track.trackTitle,
    artist: track.artist,
    label: track.recordLabel,
    artwork: track.albumCover || '',
    albumName: track.album?.name || '',
    releaseDate: track.album?.releaseDate || track.releaseDate,
    spotifyUrl: track.spotifyUrl
  };
};

export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const convertSpotifyReleaseToRelease = (spotifyRelease: SpotifyPlaylist): Release => {
  const label = determineLabelFromUrl(spotifyRelease.external_urls.spotify);

  return {
    id: spotifyRelease.id,
    title: spotifyRelease.name,
    artist: spotifyRelease.owner.display_name || 'Various Artists',
    artwork: spotifyRelease.images[0]?.url || '',
    releaseDate: new Date().toISOString(),
    tracks: spotifyRelease.tracks.items.map((item) => ({
      id: item.track.id,
      trackTitle: item.track.name,
      artist: item.track.artists[0]?.name || 'Unknown Artist',
      recordLabel: label,
      previewUrl: item.track.preview_url || null,
      spotifyUrl: item.track.external_urls.spotify,
      releaseDate: item.track.album?.release_date || new Date().toISOString(),
      albumCover: item.track.album.images[0]?.url || '',
      album: {
        name: item.track.album.name,
        releaseDate: item.track.album.release_date,
        images: item.track.album.images
      },
      beatportUrl: '',
      soundcloudUrl: ''
    })),
    label: label as RecordLabel,
    spotifyUrl: spotifyRelease.external_urls.spotify,
    beatportUrl: '',
    soundcloudUrl: ''
  };
};

export const getSimplifiedTrackDetails = async (trackUrl: string) => {
  try {
    const details = await spotifyService.getSimplifiedTrackDetails(trackUrl);
    console.log('Simplified Track Details:', details);
    return details;
  } catch (error) {
    console.error('Error fetching simplified track details:', error);
    throw error;
  }
};

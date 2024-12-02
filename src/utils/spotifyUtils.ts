import { SpotifyRelease, SpotifyTrack } from '../types/spotify';
import { Release } from '../types/release';
import { SpotifyService } from '../services/SpotifyService';

const spotifyService = SpotifyService.getInstance();

export const fetchTrackDetails = async (trackUrl: string): Promise<SpotifyTrack> => {
  try {
    const trackDetails = await spotifyService.getTrackDetailsByUrl(trackUrl);
    if (!trackDetails) {
      throw new Error('Track not found');
    }
    
    console.log('Track Details:', trackDetails);
    return trackDetails;
  } catch (error) {
    console.error('Error fetching track details:', error);
    throw error;
  }
};

export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  try {
    const tracks = await spotifyService.searchTracks(query);
    console.log('Search Results:', tracks);
    return tracks;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
};

export const getLabelReleases = async (playlistId: string): Promise<SpotifyTrack[]> => {
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

// Utility to format track details for display
export const formatTrackDetails = (track: SpotifyTrack) => {
  return {
    title: track.trackTitle,
    artist: track.artist,
    label: track.recordLabel,
    artwork: track.albumCover,
    albumName: track.album.name,
    releaseDate: track.album.releaseDate,
    spotifyUrl: track.spotifyUrl
  };
};

export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const determineLabelFromPlaylist = (spotifyUrl: string): string => {
  // Add your label determination logic here
  if (spotifyUrl.includes('records')) return 'records';
  if (spotifyUrl.includes('tech')) return 'tech';
  if (spotifyUrl.includes('deep')) return 'deep';
  return 'unknown';
};

export const convertSpotifyToRelease = (spotifyRelease: SpotifyRelease): Release => {
  return {
    id: spotifyRelease.id,
    title: spotifyRelease.name,
    artist: spotifyRelease.artists[0]?.name || 'Unknown Artist',
    releaseDate: spotifyRelease.release_date,
    artwork: spotifyRelease.images[0]?.url || '',
    spotifyUrl: spotifyRelease.external_urls.spotify,
    beatportUrl: '', // Required by Release interface
    soundcloudUrl: '', // Will be populated later if available
    label: determineLabelFromPlaylist(spotifyRelease.external_urls.spotify),
    tracks: spotifyRelease.tracks.items.map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      duration: formatDuration(track.duration_ms),
      previewUrl: track.preview_url,
      spotifyId: track.id
    }))
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

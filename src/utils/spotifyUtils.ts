import { SpotifyRelease, SpotifyTrack } from '../types/spotify';
import { Release, Track } from '../types/release';

export const extractSpotifyId = (url: string): string | null => {
  if (!url) return null;

  // Handle both track URLs and URIs
  const trackIdMatch = url.match(/track[:/]([a-zA-Z0-9]+)/);
  return trackIdMatch ? trackIdMatch[1] : null;
};

export const isValidSpotifyUrl = (url: string): boolean => {
  const trackUrlPattern = /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+/;
  const trackUriPattern = /^spotify:track:[a-zA-Z0-9]+$/;
  
  return trackUrlPattern.test(url) || trackUriPattern.test(url);
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

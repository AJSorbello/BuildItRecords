import { SpotifyRelease } from '../services/SpotifyService';
import { Release } from '../types/release';

export const convertSpotifyToRelease = (spotifyRelease: SpotifyRelease): Release => {
  return {
    id: spotifyRelease.id,
    title: spotifyRelease.name,
    artist: spotifyRelease.artists[0]?.name || 'Unknown Artist',
    artwork: spotifyRelease.images[0]?.url || '',
    releaseDate: spotifyRelease.release_date,
    spotifyUrl: spotifyRelease.external_urls.spotify,
    beatportUrl: '', // Will be populated later if available
    soundcloudUrl: '', // Will be populated later if available
    label: determineLabelFromPlaylist(spotifyRelease.external_urls.spotify),
    tracks: spotifyRelease.tracks.items.map((track: { id: string; name: string; artists: Array<{ name: string }>; duration_ms: number; preview_url: string | null; }) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      duration: formatDuration(track.duration_ms),
      spotifyId: track.id,
      previewUrl: track.preview_url !== undefined ? track.preview_url : null,
    })),
  };
};

const determineLabelFromPlaylist = (spotifyUrl: string): string => {
  if (spotifyUrl.includes('build-it-tech')) {
    return 'Build It Tech';
  } else if (spotifyUrl.includes('build-it-deep')) {
    return 'Build It Deep';
  } else {
    return 'Build It Records';
  }
};

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
